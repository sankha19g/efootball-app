import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppContext } from '../../App';
import PlayerCard from '../components/PlayerCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = 110;
const rowHeight = 22; 
const rowMargin = 2;   

const CompareScreen = () => {
  const { players, settings, compareQueue, setCompareQueue } = useAppContext();
  const [selectedToCompare, setSelectedToCompare] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedBase, setCollapsedBase] = useState(true);
  const [collapsedAdd, setCollapsedAdd] = useState(true);

  // Sync with global compare queue
  React.useEffect(() => {
    if (compareQueue && compareQueue.length > 0) {
      // Add unique players to existing selection
      setSelectedToCompare(prev => {
        const existingIds = new Set(prev.map(p => p._id || p.id || p.playerId));
        const newPlayers = compareQueue.filter(p => !existingIds.has(p._id || p.id || p.playerId));
        return [...prev, ...newPlayers];
      });
      // Clear the queue after consuming
      setCompareQueue([]);
    }
  }, [compareQueue]);

  const statsToCompare = [
    { label: 'OVR', key: 'rating' },
    { label: 'MATCHES', key: 'matches' },
    { label: 'GOALS', key: 'goals' },
    { label: 'ASSISTS', key: 'assists' },
    { label: 'GOALS/GM', key: 'gpg', isCalc: true },
    { label: 'ASSTS/GM', key: 'apg', isCalc: true },
    { label: 'G+A/GM', key: 'gapg', isCalc: true },
    { label: 'HEIGHT', key: 'height', suffix: 'cm' },
    { label: 'WF USAGE', key: 'weakFootUsage', isType: 'rank' },
    { label: 'WF ACCU', key: 'weakFootAccuracy', isType: 'rank' },
    { label: 'INJURY RES', key: 'injuryResistance', isType: 'rank' },
    { label: 'FORM', key: 'form', isType: 'rank' },
  ];

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return players;
    return players.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  // Unified stat retrieval including calculations
  const getStatValue = (player, statKey) => {
    if (!player) return 'NA';
    
    // Check main key first
    let val = player[statKey];
    
    // Fallback logic for new attributes (data migration support)
    if (val === undefined || val === null || val === '') {
      if (statKey === 'weakFootUsage') val = player['Weak Foot Usage'] || player.weak_foot_usage;
      else if (statKey === 'weakFootAccuracy') val = player['Weak Foot Accuracy'] || player.weak_foot_accuracy;
      else if (statKey === 'injuryResistance') val = player['Injury Resistance'] || player.injury_resistance;
      else if (statKey === 'form') val = player.Form;
    }

    if (statKey === 'gpg') {
      const matches = parseInt(player.matches) || 1;
      return ((parseInt(player.goals) || 0) / matches).toFixed(2);
    }
    if (statKey === 'apg') {
      const matches = parseInt(player.matches) || 1;
      return ((parseInt(player.assists) || 0) / matches).toFixed(2);
    }
    if (statKey === 'gapg') {
      const matches = parseInt(player.matches) || 1;
      return (((parseInt(player.goals) || 0) + (parseInt(player.assists) || 0)) / matches).toFixed(2);
    }
    
    return (val === undefined || val === null || val === '') ? 'NA' : val;
  };

  const getStatRank = (value, key) => {
    const ranks = {
      weakFootUsage: ['almost never', 'rarely', 'occasionally', 'regularly'],
      weakFootAccuracy: ['low', 'medium', 'high', 'very high'],
      injuryResistance: ['low', 'medium', 'high'],
      form: ['inconsistent', 'standard', 'unwavering']
    };
    if (!ranks[key]) return 0;
    return ranks[key].indexOf(String(value).toLowerCase());
  };

  const getBaseSkills = (player) => {
    const skills = player.skills || [];
    const slots = Array(10).fill(null);
    skills.slice(0, 10).forEach((s, i) => slots[i] = s);
    return slots;
  };

  const getAddSkills = (player) => {
    const addSkills = player.additionalSkills || [];
    const slots = Array(5).fill(null);
    addSkills.slice(0, 5).forEach((s, i) => slots[i] = s);
    return slots;
  };

  const toggleBase = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedBase(!collapsedBase);
  };

  const toggleAdd = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedAdd(!collapsedAdd);
  };

  const handleAddPlayer = (player) => {
    if (selectedToCompare.length >= 3) return;
    if (selectedToCompare.find(p => p._id === player._id)) return;
    setSelectedToCompare([...selectedToCompare, player]);
    setShowPicker(false);
    setSearchQuery('');
  };

  const removePlayer = (id) => {
    setSelectedToCompare(selectedToCompare.filter(p => p._id !== id));
  };

  const isSkillUnique = (skill, ownerId) => {
    if (!skill || selectedToCompare.length < 2) return false;
    const others = selectedToCompare.filter(p => p._id !== ownerId);
    return others.every(p => {
      const pSkills = [...(p.skills || []), ...(p.additionalSkills || [])].map(s => s?.toLowerCase());
      return !pSkills.includes(skill?.toLowerCase());
    });
  };

  const getWinner = (statKey) => {
    if (selectedToCompare.length < 2) return null;
    let max = -Infinity;
    let winnerId = null;
    let isTie = false;

    selectedToCompare.forEach(p => {
      const pVal = getStatValue(p, statKey);
      const isRank = statsToCompare.find(s => s.key === statKey)?.isType === 'rank';
      const val = isRank ? getStatRank(pVal, statKey) : parseFloat(pVal);
      
      if (val > max) {
        max = val;
        winnerId = p._id;
        isTie = false;
      } else if (val === max) {
        if (max !== -Infinity) isTie = true;
      }
    });

    return isTie ? null : winnerId;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>TACTICAL COMPARISON</Text>
            <Text style={styles.headerSub}>ADVANCED PERFORMANCE METRICS</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {selectedToCompare.length > 0 && (
              <TouchableOpacity 
                style={styles.resetBtn} 
                onPress={() => setSelectedToCompare([])}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowPicker(true)}>
              <MaterialCommunityIcons name="plus" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {selectedToCompare.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calculator-variant-outline" size={80} color="rgba(255,255,255,0.05)" />
          <Text style={styles.emptyTitle}>KPI ANALYSIS</Text>
          <Text style={styles.emptyText}>Add players to calculate Goals and Assists ratios</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.emptyAddText}>ADD PLAYER</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.mainLayout}>
            {/* Labels Column */}
            <View style={styles.labelsColumn}>
               <View style={styles.cardSpacer} />
               {statsToCompare.map((s, i) => (
                 <View key={`stat-l-${i}`} style={styles.rowItemLabel}>
                    <Text style={[styles.labelText, s.isCalc && { color: COLORS.accent, opacity: 0.6 }]}>{s.label}</Text>
                 </View>
               ))}
               
               <TouchableOpacity style={styles.dividerBox} onPress={toggleBase}>
                  <Text style={styles.dividerText}>BASE SKILLS</Text>
                  <MaterialCommunityIcons name={collapsedBase ? "chevron-right" : "chevron-down"} size={14} color={COLORS.accent} />
               </TouchableOpacity>
               {!collapsedBase && [...Array(10)].map((_, i) => (
                 <View key={`skill-l-${i}`} style={styles.rowItemLabel}>
                    <Text style={styles.labelText}>SKILL {i + 1}</Text>
                 </View>
               ))}

               <TouchableOpacity style={styles.dividerBox} onPress={toggleAdd}>
                  <Text style={styles.dividerText}>LEGACY</Text>
                  <MaterialCommunityIcons name={collapsedAdd ? "chevron-right" : "chevron-down"} size={14} color={COLORS.accent} />
               </TouchableOpacity>
               {!collapsedAdd && [...Array(5)].map((_, i) => (
                 <View key={`add-skill-l-${i}`} style={styles.rowItemLabel}>
                    <Text style={styles.labelText}>ADD {i + 1}</Text>
                 </View>
               ))}
            </View>

            {/* Player Columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.columnsWrapper}>
              {selectedToCompare.map(player => {
                const baseSkills = getBaseSkills(player);
                const addSkills = getAddSkills(player);
                return (
                  <View key={player._id} style={styles.playerColumn}>
                    <View style={styles.cardSection}>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removePlayer(player._id)}>
                        <MaterialCommunityIcons name="close" size={10} color="#fff" />
                      </TouchableOpacity>
                      
                      <LinearGradient
                        colors={[COLORS.accent, 'rgba(255,255,255,0.1)', COLORS.accent]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.cardFrame}
                      >
                        <View style={styles.cardContainer}>
                          <PlayerCard 
                            player={player} 
                            settings={{...settings, cardSize: 'mini', showOverlay: true, overlayHeight: 40, cardRounded: false}} 
                            showName={false}
                          />
                        </View>
                      </LinearGradient>
                      
                      <Text style={styles.colName} numberOfLines={1}>{player.name?.split(' ').pop().toUpperCase()}</Text>
                    </View>

                    {/* Stats */}
                    {statsToCompare.map((stat, idx) => {
                      const winnerId = getWinner(stat.key);
                      const isWinner = player._id === winnerId;
                      const val = getStatValue(player, stat.key);
                      return (
                        <View key={`v-${idx}`} style={[styles.statValueCell, isWinner && styles.winnerCell]}>
                          <Text style={[styles.statValueText, isWinner && styles.winnerValue]}>{val}</Text>
                        </View>
                      );
                    })}

                    <View style={styles.dividerBox} />

                    {/* Base Skills */}
                    {!collapsedBase && baseSkills.map((skill, idx) => {
                      const unique = isSkillUnique(skill, player._id);
                      return (
                        <View key={`bs-${idx}`} style={[styles.skillValueCell, skill && styles.activeSkill, unique && styles.uniqueSkill]}>
                          {skill ? (
                            <Text style={[styles.skillText, unique && styles.uniqueText]} numberOfLines={1}>{skill.toUpperCase()}</Text>
                          ) : (
                            <View style={styles.emptyDot} />
                          )}
                        </View>
                      );
                    })}

                    <View style={styles.dividerBox} />

                    {/* Additional Skills */}
                    {!collapsedAdd && addSkills.map((skill, idx) => {
                      const unique = isSkillUnique(skill, player._id);
                      return (
                        <View key={`as-${idx}`} style={[styles.skillValueCell, skill && styles.activeAddSkill, unique && styles.uniqueSkill]}>
                          {skill ? (
                            <Text style={[styles.skillText, unique && styles.uniqueText]} numberOfLines={1}>{skill.toUpperCase()}</Text>
                          ) : (
                            <View style={styles.emptyDot} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Picker Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>CHOOSE PLAYER</Text>
                <Text style={styles.searchHint}>Filter by name or position</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearchQuery(''); }}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchBarWrapper}>
              <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search player..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredPlayers}
              keyExtractor={item => item._id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => handleAddPlayer(item)}>
                  <Image source={{ uri: item.image }} style={styles.pickerImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{item.name}</Text>
                    <Text style={styles.pickerSub}>{item.position} • {item.rating}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)' }}>No players found matching "{searchQuery}"</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { paddingBottom: 15, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  headerSub: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  resetBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  mainLayout: { flexDirection: 'row', paddingVertical: 20 },
  labelsColumn: { width: 80, paddingLeft: 10 },
  cardSpacer: { height: 170 },
  
  rowItemLabel: { height: rowHeight, justifyContent: 'center', marginBottom: rowMargin },
  labelText: { color: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: '900', letterSpacing: 1 },

  dividerBox: { height: 35, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingRight: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 5 },
  dividerText: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 2 },

  columnsWrapper: { paddingHorizontal: 10, gap: 8 },
  playerColumn: { width: COLUMN_WIDTH, alignItems: 'center' },
  cardSection: { width: COLUMN_WIDTH, height: 170, alignItems: 'center', paddingTop: 10 },
  
  cardFrame: { 
    padding: 2, 
    borderRadius: 0, 
    width: 104, 
    height: 134, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5
  },
  cardContainer: { width: 100, height: 130, borderRadius: 0, overflow: 'hidden', backgroundColor: '#000' },
  
  colName: { color: '#fff', fontSize: 9, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  removeBtn: { position: 'absolute', top: 2, right: 0, zIndex: 10, backgroundColor: '#ff4444', borderRadius: 8, padding: 3, elevation: 10 },

  statValueCell: { width: '100%', height: rowHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 3, marginBottom: rowMargin },
  winnerCell: { backgroundColor: 'rgba(0, 212, 255, 0.05)' },
  statValueText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  winnerValue: { color: COLORS.accent },

  skillValueCell: { width: '100%', height: rowHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 3, marginBottom: rowMargin, borderWidth: 1, borderColor: 'transparent' },
  activeSkill: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' },
  activeAddSkill: { backgroundColor: 'rgba(255, 170, 0, 0.05)', borderColor: 'rgba(255, 170, 0, 0.1)' },
  uniqueSkill: { backgroundColor: 'rgba(0, 255, 170, 0.08)', borderColor: 'rgba(0, 255, 170, 0.3)' },
  skillText: { color: 'rgba(255,255,255,0.4)', fontSize: 7, fontWeight: '700' },
  uniqueText: { color: '#00ffaa' },
  emptyDot: { width: 3, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60 },
  emptyTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 20, letterSpacing: 2 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 18 },
  emptyAddBtn: { marginTop: 25, backgroundColor: COLORS.accent, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  emptyAddText: { color: '#000', fontWeight: '900', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  searchHint: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  
  searchBarWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    margin: 20, 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, marginLeft: 10 },
  
  pickerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pickerImg: { width: 44, height: 44, borderRadius: 22, marginRight: 15 },
  pickerName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pickerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11 }
});

export default CompareScreen;
