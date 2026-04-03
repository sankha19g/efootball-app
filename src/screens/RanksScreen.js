import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, Modal, TextInput, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, POSITIONS, CARD_TYPES, PLAYSTYLES, ALL_SKILLS } from '../constants';
import Dropdown from '../components/Dropdown';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const RankCard = ({ title, players, valueKey, color, suffix = '', isRatio = false }) => {
  const topPlayers = players.slice(0, 5);
  const brandColor = color || COLORS.accent;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: brandColor }]}>{title}</Text>
        <View style={[styles.titleLine, { backgroundColor: brandColor + '44' }]} />
      </View>

      <View style={styles.list}>
        {topPlayers.map((player, idx) => {
          const rawValue = valueKey === 'totalGA' 
            ? (player.goals || 0) + (player.assists || 0) 
            : (player[valueKey] || 0);
          
          const displayValue = isRatio 
            ? (player.matches > 0 ? (rawValue / player.matches).toFixed(2) : '0.00')
            : rawValue;

          return (
            <View key={player._id || idx} style={styles.listItem}>
              <Text style={styles.rankNum}>#{idx + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.playerSub}>{player.position} • {player.club}</Text>
              </View>
              <View style={styles.valueBox}>
                <Text style={[styles.valueText, { color }]}>{displayValue}</Text>
                <Text style={styles.unitText}>{suffix}</Text>
              </View>
            </View>
          );
        })}
        {topPlayers.length === 0 && (
          <Text style={styles.emptyText}>No data available</Text>
        )}
      </View>
    </View>
  );
};

const RanksScreen = ({ players = [], user = null, onClose }) => {
  const [activeTab, setActiveTab] = useState('TOTALS');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [rankFilterPos, setRankFilterPos] = useState('All');
  const [rankFilterCardType, setRankFilterCardType] = useState('All');
  const [rankFilterClub, setRankFilterClub] = useState('');
  const [rankFilterNationality, setRankFilterNationality] = useState('');
  const [rankFilterPlaystyle, setRankFilterPlaystyle] = useState('All');
  const [rankFilterSkill, setRankFilterSkill] = useState('All');

  // Logic Ported from Web version Leaderboard.jsx
  const categories = useMemo(() => {
    let filtered = [...players];

    // Apply Filters
    if (rankFilterPos !== 'All') {
      filtered = filtered.filter(p => p.position === rankFilterPos);
    }
    if (rankFilterCardType !== 'All') {
      filtered = filtered.filter(p => p.cardType === rankFilterCardType);
    }
    if (rankFilterClub) {
      filtered = filtered.filter(p => p.club?.toLowerCase().includes(rankFilterClub.toLowerCase()));
    }
    if (rankFilterNationality) {
      filtered = filtered.filter(p => p.nationality?.toLowerCase().includes(rankFilterNationality.toLowerCase()));
    }
    if (rankFilterPlaystyle !== 'All') {
      filtered = filtered.filter(p => p.playstyle === rankFilterPlaystyle);
    }
    // Skill Filter - Robust check
    if (rankFilterSkill !== 'All') {
      const targetSkill = rankFilterSkill.toLowerCase().replace(/\s/g, '');
      filtered = filtered.filter(p => {
        const check = (arr) => {
          if (!arr) return false;
          const skillsArray = Array.isArray(arr) ? arr : [arr];
          if (rankFilterSkill === 'Any Special Skill') {
             // Basic check: if it has any non-empty skill
             return skillsArray.some(s => s && s.trim() !== '');
          }
          return skillsArray.some(s => s?.toString().toLowerCase().replace(/\s/g, '') === targetSkill);
        };
        return check(p.skills) || check(p.additionalSkills);
      });
    }

    const activePlayers = filtered.filter(p => (p.matches || 0) > 0);
    const getSorted = (fn) => [...filtered].sort((a, b) => (fn(b) || 0) - (fn(a) || 0));
    const getSortedRatio = (fn) => [...activePlayers].sort((a, b) => (fn(b) || 0) - (fn(a) || 0));

    return {
      totals: [
        { id: 'goals', title: 'TOP SCORERS', players: getSorted(p => p.goals || 0), valueKey: 'goals', color: COLORS.accent, suffix: 'G' },
        { id: 'assists', title: 'MASTER CREATORS', players: getSorted(p => p.assists || 0), valueKey: 'assists', color: COLORS.blue, suffix: 'A' },
        { id: 'ga', title: 'MOST G+A', players: getSorted(p => (p.goals || 0) + (p.assists || 0)), valueKey: 'totalGA', color: '#FF4499', suffix: 'P' },
        { id: 'matches', title: 'LOYAL SERVANTS', players: getSorted(p => p.matches || 0), valueKey: 'matches', color: '#AAAAAA', suffix: 'M' },
      ],
      ratios: [
        { id: 'gpg', title: 'GOALS / GAME', players: getSortedRatio(p => (p.goals || 0) / p.matches), valueKey: 'goals', color: COLORS.accent, isRatio: true, suffix: 'AVG' },
        { id: 'apg', title: 'ASSISTS / GAME', players: getSortedRatio(p => (p.assists || 0) / p.matches), valueKey: 'assists', color: COLORS.blue, isRatio: true, suffix: 'AVG' },
        { id: 'gapg', title: 'CONTRIBUTION / GM', players: getSortedRatio(p => ((p.goals || 0) + (p.assists || 0)) / p.matches), valueKey: 'totalGA', color: '#FF4499', isRatio: true, suffix: 'AVG' },
      ]
    };
  }, [players, rankFilterPos, rankFilterCardType, rankFilterClub, rankFilterNationality, rankFilterPlaystyle, rankFilterSkill]);

  const currentList = activeTab === 'TOTALS' ? categories.totals : categories.ratios;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#161c24', '#0a0a0c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>RANKINGS</Text>
            <Text style={styles.headerSubtitle}>{players.length} PLAYERS SCANNED</Text>
          </View>
          <TouchableOpacity 
            style={[styles.filterToggle, (rankFilterPos !== 'All' || rankFilterCardType !== 'All' || rankFilterClub || rankFilterNationality || rankFilterPlaystyle !== 'All' || rankFilterSkill !== 'All') && styles.filterToggleActive]} 
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterToggleText}>FILTER</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {['TOTALS', 'RATIOS'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {currentList.map(cat => (
          <RankCard key={cat.id} {...cat} />
        ))}
        {players.length === 0 && (
          <View style={styles.noPlayers}>
            <Text style={styles.noPlayersEmoji}>🛡️</Text>
            <Text style={styles.noPlayersTitle}>YOUR SQUAD IS EMPTY</Text>
            <Text style={styles.noPlayersSub}>Add players to see rankings</Text>
          </View>
        )}
      </ScrollView>

      {/* Ranks Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFilters(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>FILTERS</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Text style={styles.modalSubtitle}>CLICK TO COLLAPSE</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => {
                setRankFilterPos('All');
                setRankFilterCardType('All');
                setRankFilterClub('');
                setRankFilterNationality('');
                setRankFilterPlaystyle('All');
                setRankFilterSkill('All');
              }}>
                <Text style={styles.clearText}>RESET</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.filterRow}>
                <View style={styles.filterCol}>
                  <Dropdown
                    label="POSITION"
                    options={['All', ...POSITIONS]}
                    value={rankFilterPos}
                    onSelect={setRankFilterPos}
                  />
                </View>
                <View style={styles.filterCol}>
                  <Dropdown
                    label="CARD TYPE"
                    options={['All', ...CARD_TYPES]}
                    value={rankFilterCardType}
                    onSelect={setRankFilterCardType}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterCol}>
                  <Text style={styles.inputLabel}>CLUB NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Search Club..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={rankFilterClub}
                    onChangeText={setRankFilterClub}
                  />
                </View>
                <View style={styles.filterCol}>
                  <Text style={styles.inputLabel}>NATIONALITY</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Search Country..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={rankFilterNationality}
                    onChangeText={setRankFilterNationality}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterCol}>
                  <Dropdown
                    label="PLAYSTYLE"
                    options={['All', ...PLAYSTYLES]}
                    value={rankFilterPlaystyle}
                    onSelect={setRankFilterPlaystyle}
                  />
                </View>
                <View style={styles.filterCol}>
                  <Dropdown
                    label="SKILL"
                    options={['All', 'Any Special Skill', ...ALL_SKILLS]}
                    value={rankFilterSkill}
                    onSelect={setRankFilterSkill}
                    searchable
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backIcon: { color: COLORS.accent, fontSize: 24, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  headerSubtitle: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: -2 },
  filterToggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterToggleActive: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderColor: COLORS.accent,
  },
  filterToggleText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.08)' },
  tabText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  activeTabText: { color: COLORS.accent },

  scroll: { padding: 20, gap: 20 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { marginBottom: 15 },
  cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  titleLine: { height: 2, borderRadius: 1, width: 40 },

  list: { gap: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  rankNum: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '900', width: 30, fontStyle: 'italic' },
  playerInfo: { flex: 1 },
  playerName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', marginTop: 1 },
  
  valueBox: { alignItems: 'flex-end' },
  valueText: { fontSize: 18, fontWeight: '900' },
  unitText: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 },
  
  noPlayers: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  noPlayersEmoji: { fontSize: 64, opacity: 0.05, marginBottom: 20 },
  noPlayersTitle: { color: '#fff', fontSize: 18, fontWeight: '900', opacity: 0.2, letterSpacing: 2 },
  noPlayersSub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161c24',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  modalSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '900',
    letterSpacing: 1,
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: -10,
    marginBottom: 20,
  },
  filterCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  textInput: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  applyBtn: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
  }
});

export default RanksScreen;
