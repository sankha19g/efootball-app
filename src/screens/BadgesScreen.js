import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, TextInput, Dimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants';
import { uploadBase64Image } from '../services/playerService';
import { getPlayerBadge } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 3;

const BadgeItem = ({ item, type, isEditMode, isMergeMode, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[
      styles.badgeCard, 
      isEditMode && styles.badgeCardEdit,
      isMergeMode && isSelected && styles.badgeCardSelected
    ]} 
    onPress={() => (isEditMode || isMergeMode) ? onPress(item) : null}
    disabled={!isEditMode && !isMergeMode}
  >
    <View style={styles.badgeLogoContainer}>
      {isEditMode && !isMergeMode && (
        <View style={styles.editOverlay}>
          <Text style={styles.editIcon}>✏️</Text>
        </View>
      )}
      {isMergeMode && (
        <View style={[styles.mergeCheckbox, isSelected && styles.mergeCheckboxActive]}>
          {isSelected && <Text style={styles.checkIcon}>✓</Text>}
        </View>
      )}
      {item.logo ? (
        <Image 
          source={{ uri: item.logo }} 
          style={styles.badgeLogo} 
          resizeMode="contain" 
          onError={(e) => {
            // Optional: log or handle broken imgbb link
          }}
        />
      ) : (
        <Text style={styles.badgeEmoji}>{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</Text>
      )}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{item.count}</Text>
      </View>
    </View>
    <Text style={styles.badgeName} numberOfLines={1}>{item.name}</Text>
    <Text style={styles.badgeSub} numberOfLines={1}>{item.subtext}</Text>
  </TouchableOpacity>
);

const BadgesScreen = ({ players = [], user, onClose, onUpdateBadge, onAddBadge, onDeleteBadge, onMergeBadges }) => {
  const [mode, setMode] = useState('club'); // 'club', 'national', 'league'
  const [search, setSearch] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('ALL LEAGUES');
  const [showMissing, setShowMissing] = useState(true); // true = SHOW ALL, false = HIDE EMPTY
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState(new Set());
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo: '', subtext: '', type: 'club' });

  // Helper moved to utils/imageUtils.js
  const getPlayerLogo = (p, type) => getPlayerBadge(p, type);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const url = await uploadBase64Image(user?.uid, result.assets[0].base64);
        setFormData(prev => ({ ...prev, logo: url }));
      }
    } catch (err) {
      console.error('Image picking error:', err);
      Alert.alert('Upload Failed', err.message || 'Make sure your ImgBB API Key is configured in the .env file.');
    } finally {
      setLoading(false);
    }
  };

  const clubBadges = useMemo(() => {
    const clubs = new Map();
    players.forEach(p => {
      const clubName = p.club;
      if (!clubName) return;
      
      const logo = getPlayerBadge(p, 'club');
      const existing = clubs.get(clubName);
      
      if (!existing) {
        clubs.set(clubName, {
          name: clubName,
          logo: logo,
          subtext: p.league || 'Other League',
          count: 1,
          type: 'club'
        });
      } else {
        existing.count += 1;
        // Logic: Replace if current logo is empty OR if new logo is a high-priority imgbb link
        if (!existing.logo && logo) {
          existing.logo = logo;
        } else if (logo && logo.includes('ibb.co') && !existing.logo.includes('ibb.co')) {
          existing.logo = logo;
        }
      }
    });
    return Array.from(clubs.values()).sort((a, b) => b.count - a.count);
  }, [players]);

  const nationalBadges = useMemo(() => {
    const nations = new Map();
    players.forEach(p => {
      const nationName = p.nationality;
      if (!nationName) return;
      
      const logo = getPlayerBadge(p, 'national');
      const existing = nations.get(nationName);
      
      if (!existing) {
        nations.set(nationName, {
          name: nationName,
          logo: logo,
          subtext: 'National Team',
          count: 1,
          type: 'national'
        });
      } else {
        existing.count += 1;
        if (!existing.logo && logo) {
          existing.logo = logo;
        } else if (logo && logo.includes('ibb.co') && !existing.logo.includes('ibb.co')) {
          existing.logo = logo;
        }
      }
    });
    return Array.from(nations.values()).sort((a, b) => b.count - a.count);
  }, [players]);

  const leagueBadges = useMemo(() => {
    const leagues = new Map();
    players.forEach(p => {
      const leagueName = p.league;
      if (!leagueName || leagueName === 'Free Agent') return;
      
      const logo = getPlayerBadge(p, 'league');
      const existing = leagues.get(leagueName);
      
      if (!existing) {
        leagues.set(leagueName, {
          name: leagueName,
          logo: logo,
          subtext: 'Official League',
          count: 1,
          type: 'league'
        });
      } else {
        existing.count += 1;
        if (!existing.logo && logo) {
          existing.logo = logo;
        } else if (logo && logo.includes('ibb.co') && !existing.logo.includes('ibb.co')) {
          existing.logo = logo;
        }
      }
    });
    return Array.from(leagues.values()).sort((a, b) => b.count - a.count);
  }, [players]);

  const leaguesList = useMemo(() => {
    const s = new Set(['ALL LEAGUES']);
    clubBadges.forEach(b => {
      if (b.subtext) s.add(b.subtext);
    });
    return Array.from(s);
  }, [clubBadges]);

  const filteredData = useMemo(() => {
    let data = [];
    if (mode === 'club') data = clubBadges;
    else if (mode === 'national') data = nationalBadges;
    else data = leagueBadges;

    // Filter by Logo presence
    if (!showMissing) {
      data = data.filter(item => item.logo && item.logo.length > 5);
    }

    // Filter by League (if club mode)
    if (mode === 'club' && selectedLeague !== 'ALL LEAGUES') {
      data = data.filter(item => item.subtext === selectedLeague);
    }

    // Filter by Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.subtext.toLowerCase().includes(q)
      );
    }

    return data;
  }, [mode, clubBadges, nationalBadges, leagueBadges, search, showMissing, selectedLeague]);

  const toggleMergeSelect = (item) => {
    const next = new Set(selectedForMerge);
    if (next.has(item.name)) next.delete(item.name);
    else next.add(item.name);
    setSelectedForMerge(next);
  };

  const handleEditClick = (item) => {
    setEditingBadge(item);
    setFormData({ ...item, type: mode });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingBadge) onUpdateBadge?.(editingBadge, formData);
    else onAddBadge?.(formData);
    setShowModal(false);
  };

  const executeMerge = () => {
    if (selectedForMerge.size < 2) return;
    onMergeBadges?.(Array.from(selectedForMerge), mode);
    setSelectedForMerge(new Set());
    setIsMergeMode(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1a1d24', '#0d0f14']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBadge ? 'EDIT BADGE' : 'ADD NEW BADGE'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>DISPLAY NAME</Text><TextInput style={styles.input} value={formData.name} onChangeText={(val) => setFormData({...formData, name: val})} placeholder="e.g. Manchester United" placeholderTextColor="rgba(255,255,255,0.2)" /></View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LOGO CONFIGURATION</Text>
                <View style={styles.uploadRow}>
                  <TextInput 
                    style={[styles.input, { flex: 1 }]} 
                    value={formData.logo} 
                    onChangeText={(val) => setFormData({...formData, logo: val})} 
                    placeholder="Logo URL or Upload..." 
                    placeholderTextColor="rgba(255,255,255,0.2)" 
                  />
                  <TouchableOpacity onPress={handlePickImage} style={styles.miniUploadBtn} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.uploadIcon}>📷</Text>}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>SUBTEXT / LEAGUE</Text><TextInput style={styles.input} value={formData.subtext} onChangeText={(val) => setFormData({...formData, subtext: val})} placeholder="e.g. English League" placeholderTextColor="rgba(255,255,255,0.2)" /></View>
              <View style={styles.typeSelector}>{['club', 'national', 'league'].map(t => (<TouchableOpacity key={t} onPress={() => setFormData({...formData, type: t})} style={[styles.typeBtn, formData.type === t && styles.activeTypeBtn]}><Text style={[styles.typeText, formData.type === t && styles.activeTypeText]}>{t.toUpperCase()}</Text></TouchableOpacity>))}</View>
            </ScrollView>
            <View style={styles.modalFooter}>
              {editingBadge && (<TouchableOpacity onPress={() => { onDeleteBadge?.(editingBadge); setShowModal(false); }} style={styles.deleteBtn}><Text style={styles.deleteText}>DELETE</Text></TouchableOpacity>)}
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveText}>SAVE CHANGES</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LinearGradient colors={['#161c24', '#0a0a0c']} style={styles.header}>
        {/* Top Header Row */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.brandContainer}>
             <View style={styles.brandLogoWrap}>
               <Text style={styles.brandLogo}>🛡️</Text>
             </View>
             <View>
               <Text style={styles.brandTitle}>BADGES</Text>
               <Text style={styles.brandSubtitle}>COLLECTION GALLERY — {filteredData.length} ITEMS FOUND</Text>
             </View>
          </View>
        </View>

        {/* Toolbar Row */}
        <View style={styles.toolbar}>
          <TouchableOpacity 
            onPress={() => { setIsMergeMode(!isMergeMode); setIsEditMode(false); }}
            style={[styles.toolBtn, isMergeMode && styles.activeToolBtn]}
          >
            <Text style={[styles.toolBtnText, isMergeMode && styles.activeToolBtnText]}>🔗 MERGE BADGES</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { setIsEditMode(!isEditMode); setIsMergeMode(false); }}
            style={[styles.toolBtn, isEditMode && styles.activeToolBtn]}
          >
            <Text style={[styles.toolBtnText, isEditMode && styles.activeToolBtnText]}>✏️ EDIT BADGES</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.plusBtn}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolBtn}
            onPress={() => {
              const data = JSON.stringify(players);
              // Simple copy to clipboard or alert for now
              Alert.alert('Export JSON', 'Data exported to clipboard (Simulated)');
            }}
          >
            <Text style={styles.toolBtnText}>📤 EXPORT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn}>
            <Text style={styles.toolBtnText}>📥 IMPORT</Text>
          </TouchableOpacity>

          <View style={styles.leagueSelector}>
            <Text style={styles.leagueIcon}>🏆</Text>
            <Text style={styles.leagueText}>{selectedLeague}</Text>
            <Text style={styles.chevron}>▾</Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchBoxIcon}>🔍</Text>
            <TextInput 
              style={styles.searchBoxInput} 
              placeholder="Search club..." 
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Categories & Toggle Row */}
        <View style={styles.filterBar}>
          <View style={styles.categoryTabs}>
            {['club', 'national', 'league'].map(t => (
              <TouchableOpacity 
                key={t}
                onPress={() => setMode(t)}
                style={[styles.catTab, mode === t && styles.activeCatTab]}
              >
                <Text style={[styles.catTabText, mode === t && styles.activeCatTabText]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.missingToggles}>
             <Text style={styles.toggleLabel}>MISSING LOGOS:</Text>
             <TouchableOpacity style={styles.toggleItem} onPress={() => setShowMissing(true)}>
                <View style={[styles.radio, showMissing && styles.radioActive]}>
                  {showMissing && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.toggleText, showMissing && styles.toggleTextActive]}>SHOW ALL</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.toggleItem} onPress={() => setShowMissing(false)}>
                <View style={[styles.radio, !showMissing && styles.radioActive]}>
                  {!showMissing && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.toggleText, !showMissing && styles.toggleTextActive]}>HIDE EMPTY</Text>
             </TouchableOpacity>
          </View>
        </View>

        {isMergeMode && selectedForMerge.size > 0 && (
          <TouchableOpacity style={styles.mergeConfirmBar} onPress={executeMerge}>
             <Text style={styles.mergeConfirmText}>MERGE {selectedForMerge.size} SELECTED ITEMS</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {filteredData.length > 0 ? (
            filteredData.map((item, idx) => (
              <BadgeItem 
                key={idx} 
                item={item} 
                type={mode} 
                isEditMode={isEditMode}
                isMergeMode={isMergeMode}
                isSelected={selectedForMerge.has(item.name)}
                onPress={isMergeMode ? toggleMergeSelect : handleEditClick}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NO RESULTS FOUND</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { paddingBottom: 15 },
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10, gap: 15 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 32, fontWeight: '300' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogoWrap: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  brandLogo: { fontSize: 24 },
  brandTitle: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  brandSubtitle: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  toolBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  activeToolBtn: { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent },
  toolBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  activeToolBtnText: { color: COLORS.accent },
  plusBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  plusIcon: { color: COLORS.accent, fontSize: 20, fontWeight: 'bold' },
  
  leagueSelector: { flex: 1, minWidth: 120, height: 40, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  leagueIcon: { fontSize: 14 },
  leagueText: { flex: 1, color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },

  searchBox: { width: '100%', height: 46, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchBoxIcon: { fontSize: 14, marginRight: 10, opacity: 0.4 },
  searchBoxInput: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },

  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  categoryTabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, padding: 5, gap: 5 },
  catTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  activeCatTab: { backgroundColor: COLORS.accent },
  catTabText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },
  activeCatTabText: { color: '#000' },

  missingToggles: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900' },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: COLORS.accent },
  radioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  toggleText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },
  toggleTextActive: { color: '#fff' },

  scrollContent: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: COLUMN_WIDTH, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badgeCardEdit: { borderColor: COLORS.accent, backgroundColor: 'rgba(57, 255, 20, 0.05)' },
  badgeCardSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(57, 255, 20, 0.15)' },
  badgeLogoContainer: { width: 60, height: 60, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10, position: 'relative' },
  badgeLogo: { width: 44, height: 44 },
  badgeEmoji: { fontSize: 32, opacity: 0.2 },
  editOverlay: { position: 'absolute', top: -5, left: -5, backgroundColor: COLORS.accent, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  editIcon: { fontSize: 10, color: '#000' },
  mergeCheckbox: { position: 'absolute', top: -5, left: -5, width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  mergeCheckboxActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  checkIcon: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  countBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  countText: { color: '#000', fontSize: 9, fontWeight: '900' },
  badgeName: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  badgeSub: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '700', textAlign: 'center' },

  mergeConfirmBar: { backgroundColor: COLORS.accent, padding: 15, marginHorizontal: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  mergeConfirmText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 },

  // Modal Styles (Shortened for brevity)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0d0f14', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  modalClose: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
  modalBody: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, height: 50, paddingHorizontal: 15, color: '#fff', fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  uploadRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  miniUploadBtn: { width: 50, height: 50, backgroundColor: COLORS.accent, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  uploadIcon: { fontSize: 20 },
  typeSelector: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 30 },
  typeBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeTypeBtn: { backgroundColor: 'rgba(57, 255, 20, 0.1)', borderColor: COLORS.accent },
  typeText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },
  activeTypeText: { color: COLORS.accent },
  modalFooter: { padding: 25, flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  saveBtn: { flex: 2, height: 55, backgroundColor: COLORS.accent, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  deleteBtn: { flex: 1, height: 55, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
  deleteText: { color: '#ff3b30', fontWeight: '900', fontSize: 13 },

  emptyContainer: { flex: 1, paddingVertical: 100, alignItems: 'center', justifyContent: 'center', width: '100%' },
  emptyText: { color: 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: 12, letterSpacing: 2 }
});

export default BadgesScreen;
