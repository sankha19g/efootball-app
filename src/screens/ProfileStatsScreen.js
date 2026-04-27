import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const LeaderboardSection = ({ title, data, unit, onViewMore }) => (
  <View style={styles.lbSection}>
    <View style={styles.lbHeader}>
      <Text style={styles.lbTitle}>{title}</Text>
      {data.length > 5 && (
        <TouchableOpacity onPress={onViewMore}>
          <Text style={styles.viewMoreText}>VIEW ALL</Text>
        </TouchableOpacity>
      )}
    </View>
    {data.length === 0 ? (
      <Text style={lbEmpty}>No data</Text>
    ) : (
      data.slice(0, 5).map((item, i) => (
        <View key={item.name} style={styles.lbRow}>
          <Text style={styles.lbRank}>{i + 1}</Text>
          <Text style={styles.lbName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.lbScore}>{item.score}</Text>
        </View>
      ))
    )}
  </View>
);

const ProfileStatsScreen = ({ players = [], onClose }) => {
  const [activeTab, setActiveTab] = useState('cardType');
  const [perfSubTab, setPerfSubTab] = useState('goals');
  const [expandedList, setExpandedList] = useState(null); // { title, data, unit }

  const stats = useMemo(() => {
    if (!players || players.length === 0) return null;

    const total = players.length;
    const cardTypes = {};
    const positions = {};
    const playstyles = {};
    
    let totalGoals = 0;
    let totalAssists = 0;
    let totalMatches = 0;

    const normalizeType = (t) => {
      const type = (t || '').toLowerCase().replace(/\s/g, '');
      if (type === 'normal' || type === 'base' || type === 'standard' || type === 'standardplayer') return 'Standard';
      if (type === 'highlights' || type === 'highlight') return 'Highlight';
      if (type === 'trendstars' || type === 'trend' || type === 'trending') return 'Trending';
      if (type === 'legend' || type === 'legendary') return 'Legendary';
      return t || 'Standard';
    };

    players.forEach(p => {
      const type = normalizeType(p.cardType);
      cardTypes[type] = (cardTypes[type] || 0) + 1;

      const pos = p.position || 'Unknown';
      positions[pos] = (positions[pos] || 0) + 1;

      const style = p.playstyle || 'None';
      playstyles[style] = (playstyles[style] || 0) + 1;
      
      totalGoals += Number(p.goals || 0);
      totalAssists += Number(p.assists || 0);
      totalMatches += Number(p.matches || 0);
    });

    const formatStats = (obj) => 
      Object.entries(obj).map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100)
      })).sort((a, b) => b.count - a.count);

    const topGoals = [...players].sort((a, b) => Number(b.goals || 0) - Number(a.goals || 0)).slice(0, 5);
    const topAssists = [...players].sort((a, b) => Number(b.assists || 0) - Number(a.assists || 0)).slice(0, 5);

    // Grouped Stats
    const group = (metric) => {
      const countries = {};
      const clubs = {};
      const leagues = {};
      const positions = {};
      const playstyles = {};
      const cardTypes = {};

      const countriesMatches = {};
      const clubsMatches = {};
      const leaguesMatches = {};
      const positionsMatches = {};
      const playstylesMatches = {};
      const cardTypesMatches = {};

      players.forEach(p => {
        let val = 0;
        if (metric === 'ga') val = Number(p.goals || 0) + Number(p.assists || 0);
        else if (metric === 'goalsPerGm') val = Number(p.goals || 0);
        else if (metric === 'assistsPerGm') val = Number(p.assists || 0);
        else if (metric === 'gaPerGm') val = Number(p.goals || 0) + Number(p.assists || 0);
        else if (metric === 'count') val = 1;
        else val = Number(p[metric] || 0);

        if (val === 0 && metric !== 'matches' && metric !== 'count') return;

        const matches = Number(p.matches || 0);

        const c = p.nationality || 'Unknown';
        const cl = p.club || 'Unknown';
        const l = p.league || 'Unknown';
        const po = p.position || 'Unknown';
        const ps = p.playstyle || 'None';
        const ct = normalizeType(p.cardType);

        countries[c] = (countries[c] || 0) + val;
        clubs[cl] = (clubs[cl] || 0) + val;
        leagues[l] = (leagues[l] || 0) + val;
        positions[po] = (positions[po] || 0) + val;
        playstyles[ps] = (playstyles[ps] || 0) + val;
        cardTypes[ct] = (cardTypes[ct] || 0) + val;

        if (metric.includes('PerGm')) {
          countriesMatches[c] = (countriesMatches[c] || 0) + matches;
          clubsMatches[cl] = (clubsMatches[cl] || 0) + matches;
          leaguesMatches[l] = (leaguesMatches[l] || 0) + matches;
          positionsMatches[po] = (positionsMatches[po] || 0) + matches;
          playstylesMatches[ps] = (playstylesMatches[ps] || 0) + matches;
          cardTypesMatches[ct] = (cardTypesMatches[ct] || 0) + matches;
        }
      });

      const sort = (obj, matchesObj) => Object.entries(obj)
        .map(([name, score]) => {
          let finalScore = score;
          if (metric.includes('PerGm')) {
            const totalM = matchesObj[name] || 0;
            finalScore = totalM > 0 ? (score / totalM).toFixed(2) : '0.00';
          }
          return { name, score: finalScore };
        })
        .sort((a, b) => Number(b.score) - Number(a.score));

      return {
        countries: sort(countries, countriesMatches),
        clubs: sort(clubs, clubsMatches),
        leagues: sort(leagues, leaguesMatches),
        positions: sort(positions, positionsMatches),
        playstyles: sort(playstyles, playstylesMatches),
        cardTypes: sort(cardTypes, cardTypesMatches)
      };
    };

    return {
      total,
      totalGoals,
      totalAssists,
      totalMatches,
      avgGoals: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00',
      avgAssists: totalMatches > 0 ? (totalAssists / totalMatches).toFixed(2) : '0.00',
      avgGA: totalMatches > 0 ? ((totalGoals + totalAssists) / totalMatches).toFixed(2) : '0.00',
      cardTypeStats: formatStats(cardTypes),
      positionStats: formatStats(positions),
      playstyleStats: formatStats(playstyles),
      leaderboards: {
        goals: group('goals'),
        assists: group('assists'),
        matches: group('matches'),
        ga: group('ga'),
        goalsPerGm: group('goalsPerGm'),
        assistsPerGm: group('assistsPerGm'),
        gaPerGm: group('gaPerGm')
      },
      duplicateStats: Object.entries(
        players.reduce((acc, p) => {
          const name = p.name || 'Unknown';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {})
      )
        .filter(([_, count]) => count > 1)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      quantityStats: {
        countries: group('count').countries,
        clubs: group('count').clubs,
        leagues: group('count').leagues,
        positions: formatStats(positions),
        playstyles: formatStats(playstyles),
        cardTypes: formatStats(cardTypes)
      }
    };
  }, [players]);

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available yet.</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderProgressBar = (item, color) => (
    <View key={item.name} style={styles.statRow}>
      <View style={styles.statInfo}>
        <Text style={styles.statName}>{item.name}</Text>
        <Text style={styles.statCount}>{item.count} players ({item.percent}%)</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${item.percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE STATISTICS</Text>
      </View>

      <View style={styles.summaryBar}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL SQUAD SIZE</Text>
          <Text style={styles.summaryValue}>{stats.total}</Text>
        </LinearGradient>
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollInner}>
          <TouchableOpacity onPress={() => setActiveTab('performance')} style={[styles.tab, activeTab === 'performance' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>PERFORMANCE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('quantity')} style={[styles.tab, activeTab === 'quantity' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'quantity' && styles.tabTextActive]}>QUANTITY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('duplicates')} style={[styles.tab, activeTab === 'duplicates' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'duplicates' && styles.tabTextActive]}>DUPLICATES</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('cardType')} style={[styles.tab, activeTab === 'cardType' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'cardType' && styles.tabTextActive]}>CARD TYPE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('position')} style={[styles.tab, activeTab === 'position' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'position' && styles.tabTextActive]}>POSITION</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('playstyle')} style={[styles.tab, activeTab === 'playstyle' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'playstyle' && styles.tabTextActive]}>PLAYSTYLE</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'cardType' && stats.cardTypeStats.map(it => renderProgressBar(it, COLORS.accent))}
        {activeTab === 'position' && stats.positionStats.map(it => renderProgressBar(it, '#00ddeb'))}
        {activeTab === 'playstyle' && stats.playstyleStats.map(it => renderProgressBar(it, '#fffd00'))}
        
        {activeTab === 'performance' && (
          <View>
            <View style={styles.perfGrid}>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.totalGoals}</Text>
                <Text style={styles.perfLabel}>SQUAD GOALS</Text>
              </View>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.totalAssists}</Text>
                <Text style={styles.perfLabel}>SQUAD ASSISTS</Text>
              </View>
            </View>

            <View style={[styles.perfGrid, { marginTop: 12 }]}>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.totalMatches}</Text>
                <Text style={styles.perfLabel}>SQUAD GAMES</Text>
              </View>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.avgGoals}</Text>
                <Text style={styles.perfLabel}>GOALS / GM</Text>
              </View>
            </View>

            <View style={[styles.perfGrid, { marginTop: 12 }]}>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.avgAssists}</Text>
                <Text style={styles.perfLabel}>ASSISTS / GM</Text>
              </View>
              <View style={styles.perfBox}>
                <Text style={styles.perfVal}>{stats.avgGA}</Text>
                <Text style={styles.perfLabel}>G+A / GM</Text>
              </View>
            </View>

            <View style={styles.subTabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
                {[
                  { id: 'matches', label: 'GAMES' },
                  { id: 'assists', label: 'ASSISTS' },
                  { id: 'goals', label: 'GOALS' },
                  { id: 'ga', label: 'G+A' },
                  { id: 'assistsPerGm', label: 'A/GM' },
                  { id: 'goalsPerGm', label: 'G/GM' },
                  { id: 'gaPerGm', label: 'GA/GM' },
                ].map(sub => (
                  <TouchableOpacity 
                    key={sub.id} 
                    onPress={() => setPerfSubTab(sub.id)}
                    style={[styles.subTab, perfSubTab === sub.id && styles.subTabActive]}
                  >
                    <Text style={[styles.subTabText, perfSubTab === sub.id && styles.subTabTextActive]}>{sub.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.leaderboards}>
              <LeaderboardSection 
                title="BY COUNTRY" 
                data={stats.leaderboards[perfSubTab].countries} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP COUNTRIES (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].countries, unit: perfSubTab })}
              />
              <LeaderboardSection 
                title="BY CLUB" 
                data={stats.leaderboards[perfSubTab].clubs} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP CLUBS (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].clubs, unit: perfSubTab })}
              />
              <LeaderboardSection 
                title="BY LEAGUE" 
                data={stats.leaderboards[perfSubTab].leagues} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP LEAGUES (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].leagues, unit: perfSubTab })}
              />
              <LeaderboardSection 
                title="BY POSITION" 
                data={stats.leaderboards[perfSubTab].positions} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP POSITIONS (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].positions, unit: perfSubTab })}
              />
              <LeaderboardSection 
                title="BY PLAYSTYLE" 
                data={stats.leaderboards[perfSubTab].playstyles} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP PLAYSTYLES (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].playstyles, unit: perfSubTab })}
              />
              <LeaderboardSection 
                title="BY CARD TYPE" 
                data={stats.leaderboards[perfSubTab].cardTypes} 
                unit={perfSubTab} 
                onViewMore={() => setExpandedList({ title: `TOP CARD TYPES (${perfSubTab.toUpperCase()})`, data: stats.leaderboards[perfSubTab].cardTypes, unit: perfSubTab })}
              />
            </View>
          </View>
        )}

        {activeTab === 'duplicates' && (
          <View>
            <View style={styles.perfBox}>
              <Text style={styles.perfVal}>{stats.duplicateStats.length}</Text>
              <Text style={styles.perfLabel}>PLAYERS WITH DUPLICATES</Text>
            </View>
            
            <View style={{ marginTop: 25 }}>
              <Text style={styles.lbTitle}>MOST DUPLICATED PLAYERS</Text>
              {stats.duplicateStats.length === 0 ? (
                <Text style={styles.lbEmpty}>No duplicate players found in squad.</Text>
              ) : (
                stats.duplicateStats.map((item, i) => (
                  <View key={item.name} style={styles.lbRow}>
                    <Text style={styles.lbRank}>{i + 1}</Text>
                    <Text style={styles.lbName}>{item.name}</Text>
                    <Text style={styles.lbScore}>{item.count} Cards</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'quantity' && (
          <View style={styles.leaderboards}>
            <LeaderboardSection 
              title="BY COUNTRY" 
              data={stats.quantityStats.countries} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY COUNTRY', data: stats.quantityStats.countries })}
            />
            <LeaderboardSection 
              title="BY CLUB" 
              data={stats.quantityStats.clubs} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY CLUB', data: stats.quantityStats.clubs })}
            />
            <LeaderboardSection 
              title="BY LEAGUE" 
              data={stats.quantityStats.leagues} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY LEAGUE', data: stats.quantityStats.leagues })}
            />
            <LeaderboardSection 
              title="BY POSITION" 
              data={stats.quantityStats.positions.map(s => ({ name: s.name, score: s.count }))} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY POSITION', data: stats.quantityStats.positions.map(s => ({ name: s.name, score: s.count })) })}
            />
            <LeaderboardSection 
              title="BY PLAYSTYLE" 
              data={stats.quantityStats.playstyles.map(s => ({ name: s.name, score: s.count }))} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY PLAYSTYLE', data: stats.quantityStats.playstyles.map(s => ({ name: s.name, score: s.count })) })}
            />
            <LeaderboardSection 
              title="BY CARD TYPE" 
              data={stats.quantityStats.cardTypes.map(s => ({ name: s.name, score: s.count }))} 
              onViewMore={() => setExpandedList({ title: 'QUANTITY BY CARD TYPE', data: stats.quantityStats.cardTypes.map(s => ({ name: s.name, score: s.count })) })}
            />
          </View>
        )}
      </ScrollView>

      {/* Expanded List Modal */}
      <Modal visible={!!expandedList} transparent={true} animationType="fade" onRequestClose={() => setExpandedList(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{expandedList?.title}</Text>
              <TouchableOpacity onPress={() => setExpandedList(null)}>
                <Text style={styles.closeModalIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {expandedList?.data.map((item, i) => (
                <View key={item.name} style={styles.lbRowLarge}>
                  <Text style={styles.lbRankLarge}>{i + 1}</Text>
                  <Text style={styles.lbNameLarge}>{item.name}</Text>
                  <Text style={styles.lbScoreLarge}>{item.score}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  
  summaryBar: { paddingHorizontal: 20, marginBottom: 20 },
  summaryCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  summaryValue: { color: COLORS.accent, fontSize: 48, fontWeight: '900', fontStyle: 'italic' },

  tabs: { marginBottom: 20 },
  tabsScrollInner: { paddingHorizontal: 20, gap: 8 },
  tab: { paddingHorizontal: 20, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tabActive: { backgroundColor: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)' },
  tabText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: COLORS.accent },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  statRow: { marginBottom: 24 },
  statInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  statName: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', fontStyle: 'italic' },
  statCount: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyContainer: { flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  closeBtn: { paddingHorizontal: 30, paddingVertical: 15, backgroundColor: COLORS.accent, borderRadius: 12 },
  closeBtnText: { color: '#000', fontWeight: '900' },

  perfGrid: { flexDirection: 'row', gap: 12 },
  perfBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, alignItems: 'center' },
  perfVal: { color: COLORS.accent, fontSize: 24, fontWeight: '900' },
  perfLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', marginTop: 4 },

  subTabsContainer: { marginTop: 25, marginBottom: 15 },
  subTabsScroll: { gap: 8, paddingRight: 20 },
  subTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  subTabActive: { backgroundColor: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.2)' },
  subTabText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },
  subTabTextActive: { color: COLORS.accent },

  leaderboards: { gap: 20 },
  lbSection: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  lbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lbTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.8 },
  viewMoreText: { color: COLORS.accent, fontSize: 9, fontWeight: '800', opacity: 0.6 },
  lbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  lbRank: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '900', width: 22 },
  lbName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  lbScore: { color: '#fff', fontSize: 13, fontWeight: '900', opacity: 0.9 },
  lbEmpty: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic', paddingVertical: 5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.9, maxHeight: '80%', backgroundColor: '#1a1d24', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.accent, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  closeModalIcon: { color: '#fff', fontSize: 20, opacity: 0.5 },
  modalScroll: { paddingBottom: 10 },
  lbRowLarge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  lbRankLarge: { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: '900', width: 35 },
  lbNameLarge: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  lbScoreLarge: { color: COLORS.accent, fontSize: 16, fontWeight: '900' },
});

export default ProfileStatsScreen;
