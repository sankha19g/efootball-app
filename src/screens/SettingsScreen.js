import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { COLORS, STAT_OPTIONS } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { lookupPlaystyles, updatePlayerPlaystyle, uploadBase64Image } from '../services/playerService';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ onClose, settings, setSettings, players = [], setPlayers, user }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const sizeMap = ['mini', 'xs', 'sm', 'md', 'lg'];

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSliderChange = (size) => {
    setSettings(prev => ({ ...prev, cardSize: size }));
  };

  const tabs = [
    { id: 'card', label: 'Card Aesthetics', icon: '🖼️' },
    { id: 'general', label: 'General / Perf', icon: '⚙️' },
    { id: 'branding', label: 'Branding', icon: '🏷️' },
    { id: 'maintenance', label: 'Maintenance', icon: '🛠️' }
  ];

  const handleFixPlaystyles = async () => {
    // ... same as before
    if (!user || isFixing) return;

    const playersToFix = players.filter(p => !p.playstyle || p.playstyle === 'None');
    if (playersToFix.length === 0) {
      alert('Your squad is already up to date!');
      return;
    }

    setIsFixing(true);
    setFixProgress(0);

    try {
      const results = await lookupPlaystyles(playersToFix.map(p => ({
        id: p._id,
        name: p.name,
        position: p.position
      })));

      const validResults = results.filter(r => r.playstyle);

      if (validResults.length === 0) {
        alert('Could not find matches for missing playstyles.');
        setIsFixing(false);
        return;
      }

      let updatedCount = 0;
      const updatedPlayers = [...players];

      for (const res of validResults) {
        await updatePlayerPlaystyle(user.uid, res.id, res.playstyle);
        const idx = updatedPlayers.findIndex(p => p._id === res.id);
        if (idx !== -1) {
          updatedPlayers[idx] = { ...updatedPlayers[idx], playstyle: res.playstyle };
        }
        updatedCount++;
        setFixProgress(Math.round((updatedCount / validResults.length) * 100));
      }

      setPlayers(updatedPlayers);
      alert(`Successfully updated ${updatedCount} player playstyles!`);
    } catch (err) {
      console.error(err);
      alert('An error occurred during the fix process.');
    } finally {
      setIsFixing(false);
      setFixProgress(0);
    }
  };

  const handleEditLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && user?.uid) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        const firebaseUrl = await uploadBase64Image(user.uid, base64, 'project-logo');
        setSettings(prev => ({ ...prev, appLogo: firebaseUrl }));
      } catch (error) {
          console.error(error);
          // Fallback if upload fails
          setSettings(prev => ({ ...prev, appLogo: base64 }));
      }
    }
  };

  const renderCardSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabSubheader}>TOGGLE VISUAL ELEMENTS ON CARD FRONT</Text>
      
      {[
        { id: 'showLabels', label: 'Player Name' },
        { id: 'showClub', label: 'Club Name' },
        { id: 'showClubBadge', label: 'Club Badge' },
        { id: 'showNationBadge', label: 'Country Badge' },
        { id: 'showPlaystyle', label: 'Player Playstyle' },
        { id: 'showRatings', label: 'Player Rating' }
      ].map(item => (
        <TouchableOpacity 
          key={item.id} 
          style={styles.settingItem}
          onPress={() => toggleSetting(item.id)}
        >
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Switch 
            value={settings[item.id]} 
            onValueChange={() => toggleSetting(item.id)}
            trackColor={{ false: '#333', true: COLORS.accent }}
            thumbColor={settings[item.id] ? '#fff' : '#f4f3f4'}
          />
        </TouchableOpacity>
      ))}

      <View style={styles.sectionDivider} />
      
      <Text style={styles.tabSubheader}>GRID DISPLAY CONFIG</Text>
      <View style={styles.gridBox}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => toggleSetting('showStats')}
        >
          <View>
            <Text style={styles.settingLabel}>Enable Player Stats</Text>
            <Text style={styles.settingHint}>Shows dynamic grid at bottom</Text>
          </View>
          <Switch 
            value={settings.showStats} 
            onValueChange={() => toggleSetting('showStats')}
            trackColor={{ false: '#333', true: COLORS.accent }}
            thumbColor={settings.showStats ? '#fff' : '#f4f3f4'}
          />
        </TouchableOpacity>

        {settings.showStats && (
          <View style={styles.slotContainer}>
            <Text style={styles.slotTip}>Choose up to 3 fields to show in the player card grid.</Text>
            {[0, 1, 2].map(index => (
              <ScrollView 
                key={index} 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statChipScroll}
              >
                <Text style={styles.slotLabel}>SLOT {index + 1}</Text>
                {STAT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => {
                        const newSlots = [...(settings.customStatSlots || ['matches', 'goals', 'assists'])];
                        newSlots[index] = opt.id;
                        setSettings(prev => ({ ...prev, customStatSlots: newSlots }));
                    }}
                    style={[
                        styles.statChip,
                        settings.customStatSlots[index] === opt.id && styles.statChipActive
                    ]}
                  >
                    <Text style={[
                        styles.statChipText,
                        settings.customStatSlots[index] === opt.id && { color: '#000' }
                    ]}>
                        {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderGeneralSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabSubheader}>GALLERY DENSITY</Text>
      <View style={styles.gridBox}>
        <View style={styles.rangeHeader}>
          <Text style={styles.settingLabel}>Card Scale</Text>
          <View style={styles.scaleBadge}>
            <Text style={styles.scaleBadgeText}>{settings.cardSize.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.scaleTrack}>
             {['mini', 'xs', 'sm', 'md', 'lg'].map((sz, i) => (
                <TouchableOpacity 
                  key={sz} 
                  onPress={() => handleSliderChange(sz)}
                  style={[styles.scalePoint, settings.cardSize === sz && styles.scalePointActive]}
                >
                    <Text style={[styles.scalePointText, settings.cardSize === sz && { color: COLORS.accent }]}>
                      {sz.toUpperCase()}
                    </Text>
                </TouchableOpacity>
             ))}
        </View>
      </View>

      <Text style={[styles.tabSubheader, { marginTop: 30 }]}>OPTIMIZATION</Text>
      <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => toggleSetting('highPerf')}
        >
          <View>
            <Text style={styles.settingLabel}>Eco Mode</Text>
            <Text style={styles.settingHint}>Disables Blur & Bloom for performance</Text>
          </View>
          <Switch 
            value={settings.highPerf} 
            onValueChange={() => toggleSetting('highPerf')}
            trackColor={{ false: '#333', true: COLORS.accent }}
            thumbColor={settings.highPerf ? '#fff' : '#f4f3f4'}
          />
      </TouchableOpacity>
    </View>
  );

  const renderBrandingSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabSubheader}>PERSONALIZATION</Text>
      <View style={styles.brandingCard}>
          <View style={styles.logoPreview}>
            {settings.appLogo ? (
                <Image source={{ uri: settings.appLogo }} style={{ width: '100%', height: '100%', borderRadius: 25 }} />
            ) : (
                <Text style={{ fontSize: 40 }}>🖼️</Text>
            )}
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleEditLogo}>
            <Text style={styles.uploadBtnText}>UPLOAD NEW LOGO</Text>
          </TouchableOpacity>
          <Text style={styles.settingHint}>SVG, PNG OR JPEG SUPPORTED</Text>

          {settings.appLogo && (
              <TouchableOpacity onPress={() => setSettings(prev => ({ ...prev, appLogo: null }))} style={{ marginTop: 20 }}>
                  <Text style={{ color: '#ff4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>RESET TO DEFAULT</Text>
              </TouchableOpacity>
          )}
      </View>
    </View>
  );

  const renderMaintenanceSettings = () => {
    const pendingCount = players.filter(p => !p.playstyle || p.playstyle === 'None').length;
    return (
        <View style={styles.tabContent}>
        <Text style={styles.tabSubheader}>DATABASE REPAIR</Text>
        <View style={styles.maintenanceCard}>
            <Text style={styles.maintenanceTitle}>Playstyle Auto-Fix</Text>
            <Text style={styles.maintenanceDesc}>
                Scans 11,000+ players in the master database to fill missing "None" playstyles in your squad.
            </Text>
            <TouchableOpacity 
                style={[styles.repairBtn, (isFixing || pendingCount === 0) && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={handleFixPlaystyles}
                disabled={isFixing || pendingCount === 0}
            >
                <Text style={[styles.repairBtnText, (isFixing || pendingCount === 0) && { color: 'rgba(255,255,255,0.2)' }]}>
                {isFixing ? `FIXING... ${fixProgress}%` : pendingCount === 0 ? 'ALREADY FIXED' : 'START REPAIR'}
                </Text>
            </TouchableOpacity>
            <View style={styles.pendingRow}>
                <Text style={styles.pendingLabel}>PENDING:</Text>
                <Text style={styles.pendingVal}>{pendingCount} PLAYERS</Text>
            </View>
        </View>
        </View>
    );
  };

  const renderMainMenu = () => (
    <View style={styles.menuGrid}>
      {tabs.map(tab => (
        <TouchableOpacity 
          key={tab.id} 
          style={styles.menuButton}
          onPress={() => setActiveTab(tab.id)}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={styles.menuButtonGradient}
          >
            <View style={styles.menuIconContainer}>
               <Text style={styles.menuIconText}>{tab.icon}</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>{tab.label}</Text>
              <Text style={styles.menuSublabel}>{tab.id === 'card' ? 'UI & Aesthetics' : tab.id === 'general' ? 'App Performance' : tab.id === 'branding' ? 'User Logo' : 'Database Repair'}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={activeTab ? () => setActiveTab(null) : onClose} 
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{activeTab ? tabs.find(t => t.id === activeTab).label.toUpperCase() : 'SETTINGS'}</Text>
          <Text style={styles.headerSub}>{activeTab ? 'CONFIGURE PREFERENCES' : 'PREFERENCES & CONFIG'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === null && renderMainMenu()}
        {activeTab === 'card' && renderCardSettings()}
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'branding' && renderBrandingSettings()}
        {activeTab === 'maintenance' && renderMaintenanceSettings()}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SETTINGS ARE SYNCED TO CLOUD</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  headerSub: { color: COLORS.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 2 },

  tabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  menuGrid: { gap: 12, marginTop: 10 },
  menuButton: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  menuButtonGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  menuIconContainer: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  menuIconText: { fontSize: 20 },
  menuTextContainer: { flex: 1 },
  menuLabel: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  menuSublabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  menuArrow: { color: 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '300' },

  scroll: { padding: 20, paddingBottom: 100 },
  tabContent: { animation: 'fade-in' },
  tabSubheader: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
  
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  settingLabel: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  settingHint: { color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  sectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 25 },

  gridBox: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 25, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  slotContainer: { marginTop: 15, gap: 15 },
  slotTip: { color: 'rgba(255,255,255,0.15)', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5, letterSpacing: 1 },
  statChipScroll: { alignItems: 'center', gap: 8, paddingVertical: 5 },
  statChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  statChipText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  slotLabel: { color: COLORS.accent, fontSize: 9, fontWeight: '900', marginRight: 10, width: 50 },
  pickerPlaceholder: { flex: 1, alignItems: 'flex-end' },
  pickerText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  rangeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  scaleBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  scaleBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  scaleTrack: { flexDirection: 'row', justifyContent: 'space-between' },
  scalePoint: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  scalePointActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
  scalePointText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900' },

  brandingCard: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.05)' },
  logoPreview: { width: 100, height: 100, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  uploadBtn: { backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', marginBottom: 15 },
  uploadBtnText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  maintenanceCard: { padding: 25, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  maintenanceTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  maintenanceDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 16, marginBottom: 30 },
  repairBtn: { width: '100%', paddingVertical: 18, backgroundColor: COLORS.accent, borderRadius: 20, alignItems: 'center' },
  repairBtnText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  pendingRow: { flexDirection: 'row', gap: 10, marginTop: 20, opacity: 0.5 },
  pendingLabel: { color: '#fff', fontSize: 9, fontWeight: '900' },
  pendingVal: { color: COLORS.accent, fontSize: 9, fontWeight: '900' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0a0a0c', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '900', letterSpacing: 3 }
});

export default SettingsScreen;
