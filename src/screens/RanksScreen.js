import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, Modal, TextInput, Platform, UIManager, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, POSITIONS, CARD_TYPES, PLAYSTYLES, ALL_SKILLS } from '../constants';
import Dropdown from '../components/Dropdown';
import PlayerCard from '../components/PlayerCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const RankCard = ({ title, players, valueKey, color, suffix = '', isRatio = false, onViewAll, onPlayerPress }) => {
  const topPlayers = players.slice(0, 5);
  const brandColor = color || COLORS.accent;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: brandColor }]}>{title}</Text>
          <View style={[styles.titleLine, { backgroundColor: brandColor + '44' }]} />
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => onViewAll && onViewAll({ title, players, valueKey, color, suffix, isRatio })}
        >
          <Text style={[styles.viewAllText, { color: brandColor }]}>VIEW ALL</Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              key={player._id || idx}
              style={styles.listItem}
              onPress={() => onPlayerPress && onPlayerPress(player)}
            >
              <Text style={styles.rankNum}>#{idx + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.playerSub}>
                  {player.position} {player.isSecondaryInRanking && <Text style={{ color: COLORS.accent, fontWeight: '900' }}>(SEC)</Text>} • {player.club}
                </Text>
              </View>
              <View style={styles.valueBox}>
                <Text style={[styles.valueText, { color }]}>{displayValue}</Text>
                <Text style={styles.unitText}>{suffix}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {topPlayers.length === 0 && (
          <Text style={styles.emptyText}>No data available</Text>
        )}
      </View>
    </View>
  );
};

import { useAppContext } from '../../App';

const HighlightText = ({ text, query, highlightStyle }) => {
  if (!query || !query.trim()) return <Text>{text}</Text>;
  
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <Text>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        return (
          <Text key={i} style={isMatch ? highlightStyle : null}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

const RanksScreen = ({ navigation, onClose }) => {
  const { players, user, settings, setSettings } = useAppContext();
  const [activeTab, setActiveTab] = useState('TOTALS');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFullRank, setShowFullRank] = useState(false);
  const [rankSearchQuery, setRankSearchQuery] = useState('');
  const [previewPlayer, setPreviewPlayer] = useState(null);

  // Auto-close preview after 1 second
  React.useEffect(() => {
    let timer;
    if (previewPlayer) {
      timer = setTimeout(() => {
        setPreviewPlayer(null);
      }, 500);
    }
    return () => timer && clearTimeout(timer);
  }, [previewPlayer]);

  // Filter States
  const [rankFilterPos, setRankFilterPos] = useState(['All']);
  const [rankFilterCardType, setRankFilterCardType] = useState(['All']);
  const [rankFilterClub, setRankFilterClub] = useState('');
  const [rankFilterNationality, setRankFilterNationality] = useState('');
  const [rankFilterPlaystyle, setRankFilterPlaystyle] = useState(['All']);
  const [rankFilterSkill, setRankFilterSkill] = useState('All');
  const [rankIncludeSecondary, setRankIncludeSecondary] = useState(false);

  // Logic Ported from Web version Leaderboard.jsx
  const categories = useMemo(() => {
    let filtered = [...players];

    // Apply Filters
    if (rankFilterPos.length > 0 && !rankFilterPos.includes('All')) {
      const targetPositions = rankFilterPos.map(p => p.toUpperCase());
      filtered = filtered.map(p => {
        const primaryPosMatch = targetPositions.some(tp => p.position?.toUpperCase().includes(tp));
        
        // Handle additionalPositions
        let secondaryPosMatch = false;
        if (p.additionalPositions) {
          const sec = Array.isArray(p.additionalPositions) 
            ? p.additionalPositions 
            : String(p.additionalPositions).split(',').map(s => s.trim());
          secondaryPosMatch = sec.some(s => targetPositions.includes(s.toUpperCase()));
        }

        if (primaryPosMatch) {
          return { ...p, isSecondaryInRanking: false };
        } else if (rankIncludeSecondary && secondaryPosMatch) {
          return { ...p, isSecondaryInRanking: true };
        }
        return null;
      }).filter(p => p !== null);
    }
    if (rankFilterCardType.length > 0 && !rankFilterCardType.includes('All')) {
      const targets = rankFilterCardType.map(t => t.toLowerCase().replace(/\s/g, ''));
      filtered = filtered.filter(p => {
        const type = (p.cardType || '').toLowerCase().replace(/\s/g, '');
        return targets.some(target => {
          if (target === 'standard' && (type === 'normal' || type === 'base' || type === 'standard' || type === 'standardplayer')) return true;
          if (target === 'highlight' && (type === 'highlights' || type === 'highlight')) return true;
          if (target === 'trend' && (type === 'trendstars' || type === 'trend' || type === 'trending')) return true;
          if (target === 'legendary' && (type === 'legend' || type === 'legendary')) return true;
          return type.includes(target);
        });
      });
    }
    if (rankFilterClub) {
      filtered = filtered.filter(p => p.club?.toLowerCase().includes(rankFilterClub.toLowerCase()));
    }
    if (rankFilterNationality) {
      filtered = filtered.filter(p => p.nationality?.toLowerCase().includes(rankFilterNationality.toLowerCase()));
    }
    if (rankFilterPlaystyle.length > 0 && !rankFilterPlaystyle.includes('All')) {
      filtered = filtered.filter(p => rankFilterPlaystyle.includes(p.playstyle));
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

    // Minimum Games Filter
    const minGamesVal = parseInt(settings.rankMinGames || 0);
    if (!isNaN(minGamesVal) && minGamesVal > 0) {
      filtered = filtered.filter(p => (p.matches || 0) >= minGamesVal);
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
  }, [players, rankFilterPos, rankFilterCardType, rankFilterClub, rankFilterNationality, rankFilterPlaystyle, rankFilterSkill, rankIncludeSecondary, settings.rankMinGames]);

  const currentList = activeTab === 'TOTALS' ? categories.totals : categories.ratios;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#161c24', '#0a0a0c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => onClose ? onClose() : (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('HOME'))}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>RANKINGS</Text>
            <Text style={styles.headerSubtitle}>{players.length} PLAYERS SCANNED</Text>
          </View>
          <TouchableOpacity
            style={[styles.filterToggle, (rankFilterPos.length > 0 && !rankFilterPos.includes('All') || rankFilterCardType.length > 0 && !rankFilterCardType.includes('All') || rankFilterClub || rankFilterNationality || rankFilterPlaystyle.length > 0 && !rankFilterPlaystyle.includes('All') || rankFilterSkill !== 'All') && styles.filterToggleActive]}
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
          <RankCard
            key={cat.id}
            {...cat}
            onViewAll={(data) => {
              setSelectedCategory(data);
              setShowFullRank(true);
            }}
            onPlayerPress={setPreviewPlayer}
          />
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
                setRankFilterPos(['All']);
                setRankFilterCardType(['All']);
                setRankFilterClub('');
                setRankFilterNationality('');
                setRankFilterPlaystyle(['All']);
                setRankFilterSkill('All');
                setRankIncludeSecondary(false);
                setSettings({ ...settings, rankMinGames: '0' });
              }}>
                <Text style={styles.clearText}>RESET</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.filterRow}>
                <View style={styles.filterCol}>
                  <View style={styles.posToggleRow}>
                    <View style={{ flex: 1 }}>
                      <Dropdown
                        label="POSITION"
                        options={['All', ...POSITIONS]}
                        value={rankFilterPos}
                        onSelect={setRankFilterPos}
                        containerStyle={{ marginBottom: 0 }}
                        multiSelect
                      />
                    </View>
                    <TouchableOpacity 
                      style={[styles.secToggle, rankIncludeSecondary && styles.secToggleActive, (rankFilterPos.length === 0 || rankFilterPos.includes('All')) && styles.secToggleDisabled]}
                      onPress={() => (!rankFilterPos.includes('All')) && setRankIncludeSecondary(!rankIncludeSecondary)}
                      disabled={rankFilterPos.includes('All')}
                    >
                      <MaterialCommunityIcons 
                        name={rankIncludeSecondary ? "layers-plus" : "layers-outline"} 
                        size={16} 
                        color={rankIncludeSecondary ? "#000" : COLORS.accent} 
                      />
                      <Text style={[styles.secToggleText, rankIncludeSecondary && styles.secToggleTextActive]}>+SEC</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterCol}>
                  <Dropdown
                    label="CARD TYPE"
                    options={['All', ...CARD_TYPES]}
                    value={rankFilterCardType}
                    onSelect={setRankFilterCardType}
                    multiSelect
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
                    multiSelect
                  />
                </View>
                <View style={styles.filterCol}>
                  <Text style={styles.inputLabel}>MINIMUM GAMES</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 10"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={settings.rankMinGames}
                    onChangeText={(val) => setSettings({ ...settings, rankMinGames: val })}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={[styles.filterCol, { flex: 0, width: '50%' }]}>
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

      {/* FULL RANK LIST MODAL */}
      <Modal visible={showFullRank} transparent animationType="slide">
        <View style={styles.fullRankOverlay}>
          <View style={styles.fullRankHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullRankTitle, { color: selectedCategory?.color || COLORS.accent }]}>{selectedCategory?.title}</Text>
              <Text style={styles.fullRankSubtitle}>MASTER RANKING LIST</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowFullRank(false); setSelectedCategory(null); setRankSearchQuery(''); }}>
              <Text style={styles.modalCloseIconSmall}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rankSearchWrapper}>
            <MaterialCommunityIcons name="magnify" size={18} color="rgba(255,255,255,0.2)" style={styles.rankSearchIcon} />
            <TextInput
              style={styles.rankSearchInput}
              placeholder="FIND PLAYER IN RANKINGS..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={rankSearchQuery}
              onChangeText={setRankSearchQuery}
              autoFocus={false}
            />
            {rankSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setRankSearchQuery('')} style={styles.rankSearchClear}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900' }}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={selectedCategory?.players?.map((p, i) => ({ ...p, globalRank: i + 1 })).filter(p => {
              const q = rankSearchQuery.toLowerCase();
              const nameMatch = p.name.toLowerCase().includes(q);
              const posMatch = p.position.toLowerCase().includes(q);
              const tagsMatch = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q));
              return nameMatch || posMatch || tagsMatch;
            })}
            keyExtractor={(item, index) => item._id || `rank-${index}`}
            contentContainerStyle={styles.fullRankList}
            renderItem={({ item, index }) => {
              const rawValue = selectedCategory?.valueKey === 'totalGA'
                ? (item.goals || 0) + (item.assists || 0)
                : (item[selectedCategory?.valueKey] || 0);

              const displayValue = selectedCategory?.isRatio
                ? (item.matches > 0 ? (rawValue / item.matches).toFixed(2) : '0.00')
                : rawValue;

              return (
                <TouchableOpacity
                  style={styles.fullRankItem}
                  onPress={() => setPreviewPlayer(item)}
                >
                  <View style={styles.fullRankLeader}>
                    <Text style={styles.rankNumFull}>#{item.globalRank}</Text>
                    <View style={styles.playerAvatarContainer}>
                      <Image source={{ uri: item.image }} style={styles.playerAvatarRank} />
                      <View style={styles.avatarGlowRank} />
                    </View>
                  </View>

                  <View style={styles.playerDetailsFull}>
                    <Text style={styles.playerNameFull} numberOfLines={1}>
                      <HighlightText 
                        text={item.name.toUpperCase()} 
                        query={rankSearchQuery} 
                        highlightStyle={{ 
                          color: COLORS.accent, 
                          fontWeight: '900',
                          backgroundColor: 'rgba(0, 255, 136, 0.15)' 
                        }} 
                      />
                    </Text>
                    <Text style={styles.playerMetaFull}>
                      <HighlightText 
                        text={`${item.position}${item.isSecondaryInRanking ? ' (SEC)' : ''} • ${item.club || 'FREE AGENT'}`} 
                        query={rankSearchQuery} 
                        highlightStyle={{ 
                          color: COLORS.accent,
                          backgroundColor: 'rgba(0, 255, 136, 0.15)'
                        }} 
                      />
                    </Text>
                  </View>

                  <View style={styles.valueBoxFull}>
                    <Text style={[styles.valueTextFull, { color: selectedCategory?.color }]}>{displayValue}</Text>
                    <Text style={styles.unitTextFull}>{selectedCategory?.suffix}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* PLAYER PREVIEW MODAL */}
      <Modal visible={!!previewPlayer} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPreviewPlayer(null)} />
          <View style={styles.previewContainer}>
            {previewPlayer && (
              <View style={styles.tinyCardScale}>
                <PlayerCard
                  player={previewPlayer}
                  settings={{ cardSize: 'sm', showStats: true }}
                  onPress={() => setPreviewPlayer(null)}
                />
              </View>
            )}
            <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewPlayer(null)}>
              <Text style={styles.previewCloseText}>✕ CLOSE</Text>
            </TouchableOpacity>
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

  scroll: { padding: 20 },

  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, color: '#fff' },
  titleLine: { height: 2, borderRadius: 1, width: 30, marginTop: 4 },

  list: { gap: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  rankNum: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '900', width: 30, fontStyle: 'italic' },
  playerInfo: { flex: 1 },
  playerName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  playerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '700', marginTop: 1 },

  valueBox: { alignItems: 'flex-end' },
  valueText: { fontSize: 16, fontWeight: '900' },
  unitText: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },

  viewAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  viewAllText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 },

  noPlayers: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  noPlayersEmoji: { fontSize: 64, opacity: 0.05, marginBottom: 20 },
  noPlayersTitle: { color: '#fff', fontSize: 18, fontWeight: '900', opacity: 0.2, letterSpacing: 2 },
  noPlayersSub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#161c24', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '85%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  modalSubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  clearText: { fontSize: 12, color: COLORS.accent, fontWeight: '900', letterSpacing: 1, padding: 5 },
  modalBody: { padding: 20 },
  filterRow: { flexDirection: 'row', marginHorizontal: -10, marginBottom: 20 },
  filterCol: { flex: 1, paddingHorizontal: 10 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: 1 },
  textInput: { height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 15, color: '#FFF', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  applyBtn: { backgroundColor: COLORS.accent, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  applyBtnText: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1.5 },

  fullRankOverlay: { flex: 1, backgroundColor: '#0a0a0c', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  fullRankHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  fullRankTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  fullRankSubtitle: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  modalCloseIconSmall: { color: '#fff', fontSize: 20 },

  fullRankList: { padding: 15, paddingBottom: 50 },
  fullRankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  fullRankLeader: { flexDirection: 'row', alignItems: 'center', gap: 15, width: 85 },
  rankNumFull: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '900', width: 25 },
  playerAvatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playerAvatarRank: { width: '100%', height: '170%', top: 0 },
  avatarGlowRank: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },

  playerDetailsFull: { flex: 1, paddingLeft: 10 },
  playerNameFull: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  playerMetaFull: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

  valueBoxFull: { alignItems: 'flex-end', width: 60 },
  valueTextFull: { fontSize: 16, fontWeight: '900' },
  unitTextFull: { color: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: '900' },

  rankSearchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 20, marginBottom: 10, borderRadius: 12, paddingHorizontal: 15, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rankSearchIcon: { marginRight: 10 },
  rankSearchInput: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  rankSearchClear: { paddingLeft: 10 },

  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  previewContainer: { alignItems: 'center' },
  tinyCardScale: { transform: [{ scale: 0.65 }] },
  previewCloseBtn: { marginTop: -10, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  previewCloseText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  posToggleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  secToggle: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secToggleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  secToggleDisabled: {
    opacity: 0.3,
  },
  secToggleText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.accent,
  },
  secToggleTextActive: {
    color: '#000',
  },
});

export default RanksScreen;
