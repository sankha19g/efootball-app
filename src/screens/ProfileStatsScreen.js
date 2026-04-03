import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const ProfileStatsScreen = ({ players = [], onClose }) => {
  const [activeTab, setActiveTab] = useState('cardType');

  const stats = useMemo(() => {
    if (!players || players.length === 0) return null;

    const total = players.length;
    const cardTypes = {};
    const positions = {};
    const playstyles = {};

    players.forEach(p => {
      const type = p.cardType || 'Normal';
      cardTypes[type] = (cardTypes[type] || 0) + 1;

      const pos = p.position || 'Unknown';
      positions[pos] = (positions[pos] || 0) + 1;

      const style = p.playstyle || 'None';
      playstyles[style] = (playstyles[style] || 0) + 1;
    });

    const formatStats = (obj) => 
      Object.entries(obj).map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100)
      })).sort((a, b) => b.count - a.count);

    return {
      total,
      cardTypeStats: formatStats(cardTypes),
      positionStats: formatStats(positions),
      playstyleStats: formatStats(playstyles)
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
        <TouchableOpacity onPress={() => setActiveTab('cardType')} style={[styles.tab, activeTab === 'cardType' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'cardType' && styles.tabTextActive]}>CARD TYPE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('position')} style={[styles.tab, activeTab === 'position' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'position' && styles.tabTextActive]}>POSITION</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('playstyle')} style={[styles.tab, activeTab === 'playstyle' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'playstyle' && styles.tabTextActive]}>PLAYSTYLE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'cardType' && stats.cardTypeStats.map(it => renderProgressBar(it, COLORS.accent))}
        {activeTab === 'position' && stats.positionStats.map(it => renderProgressBar(it, '#00ddeb'))}
        {activeTab === 'playstyle' && stats.playstyleStats.map(it => renderProgressBar(it, '#fffd00'))}
      </ScrollView>
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

  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  tab: { flex: 1, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
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
  closeBtn: { paddingHorizontal: 30, py: 15, backgroundColor: COLORS.accent, borderRadius: 12 },
  closeBtnText: { color: '#000', fontWeight: '900' },
});

export default ProfileStatsScreen;
