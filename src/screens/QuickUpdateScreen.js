import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PLAYSTYLES } from '../constants';

// ─── StatControl Component ───────────────────────────────────────────────────
const StatControl = ({ label, value, onUp, onDown, onManual, isManual, isDisabled, color }) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => { setLocalValue(String(value)); }, [value]);

  const handleCommit = () => {
    const num = Math.max(0, parseInt(localValue) || 0);
    if (num !== value) onManual(num);
    setLocalValue(String(num));
  };

  const accentColor = color === 'ef-accent' ? COLORS.accent : color === 'ef-blue' ? COLORS.blue : '#fff';

  return (
    <View style={[styles.statControl, isDisabled && styles.statControlDisabled]}>
      <Text style={styles.statControlLabel}>{label}</Text>
      <View style={styles.statControlRow}>
        {isManual ? (
          <TextInput
            style={[styles.statInput, { color: accentColor }]}
            value={localValue}
            onChangeText={setLocalValue}
            onBlur={handleCommit}
            keyboardType="numeric"
            editable={!isDisabled}
          />
        ) : (
          <>
            <TouchableOpacity
              onPress={onDown}
              disabled={isDisabled}
              style={styles.statBtn}>
              <Text style={styles.statBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
            <TouchableOpacity
              onPress={onUp}
              disabled={isDisabled}
              style={styles.statBtn}>
              <Text style={styles.statBtnText}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

// ─── QuickUpdateScreen Component ─────────────────────────────────────────────
const QuickUpdateScreen = ({ players, onUpdate, onClose, activeSquad }) => {
  const [search, setSearch] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [isRatingsUnlocked, setIsRatingsUnlocked] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [posFilter, setPosFilter] = useState('');

  const positions = useMemo(
    () => [...new Set(players.map((p) => p.position))].filter(Boolean).sort(),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.club?.toLowerCase().includes(q)
      );
    }

    if (posFilter) result = result.filter((p) => p.position === posFilter);

    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });

    return result;
  }, [players, search, posFilter, sortBy]);

  const handleStep = (player, field, delta) => {
    const newValue = Math.max(0, (player[field] || 0) + delta);
    if (newValue !== player[field]) onUpdate(player._id, { [field]: newValue });
  };

  const renderPlayer = ({ item: player }) => {
    const isEditing = editingPlayerId === player._id;
    return (
      <View style={[styles.playerRow, isEditing && styles.playerRowEditing]}>
        {/* Player info */}
        <View style={styles.playerInfo}>
          <View style={styles.playerThumb}>
            {player.image ? (
              <Image
                source={{ uri: player.image }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.thumbEmoji}>👤</Text>
            )}
          </View>
          <View style={styles.playerMeta}>
            <Text style={styles.playerNameText} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.playerDetailText}>
              {player.position} {player.club ? `• ${player.club}` : ''}
            </Text>
          </View>
        </View>

        {/* Stats / Edit */}
        {isEditing ? (
          <View style={styles.editControls}>
            <StatControl
              label="OVR"
              value={player.rating || 0}
              isManual={isManualMode}
              isDisabled={!isRatingsUnlocked}
              onUp={() => handleStep(player, 'rating', 1)}
              onDown={() => handleStep(player, 'rating', -1)}
              onManual={(val) => onUpdate(player._id, { rating: val })}
              color="ef-accent"
            />
            <StatControl
              label="MT"
              value={player.matches || 0}
              isManual={isManualMode}
              onUp={() => handleStep(player, 'matches', 1)}
              onDown={() => handleStep(player, 'matches', -1)}
              onManual={(val) => onUpdate(player._id, { matches: val })}
              color="white"
            />
            <StatControl
              label="GL"
              value={player.goals || 0}
              isManual={isManualMode}
              onUp={() => handleStep(player, 'goals', 1)}
              onDown={() => handleStep(player, 'goals', -1)}
              onManual={(val) => onUpdate(player._id, { goals: val })}
              color="ef-accent"
            />
            <StatControl
              label="AS"
              value={player.assists || 0}
              isManual={isManualMode}
              onUp={() => handleStep(player, 'assists', 1)}
              onDown={() => handleStep(player, 'assists', -1)}
              onManual={(val) => onUpdate(player._id, { assists: val })}
              color="ef-blue"
            />
            <TouchableOpacity
              onPress={() => setEditingPlayerId(null)}
              style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsDisplay}>
            {[['OVR', player.rating || 0, COLORS.accent], ['MT', player.matches || 0, '#fff'], ['GL', player.goals || 0, COLORS.accent], ['AS', player.assists || 0, COLORS.blue]].map(([lbl, val, clr], i) => (
              <View key={i} style={styles.statDisplayItem}>
                <Text style={styles.statDisplayLabel}>{lbl}</Text>
                <Text style={[styles.statDisplayValue, { color: clr }]}>{val}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setEditingPlayerId(player._id)}
              style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#111114', '#0a0a0c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Quick Stats</Text>
            <Text style={styles.subtitle}>Update match details instantly</Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍  Filter your squad..."
          placeholderTextColor="rgba(255,255,255,0.2)"
        />

        {/* Filters Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSortBy(sortBy === 'rating' ? 'date' : sortBy === 'date' ? 'name' : 'rating')}
            style={styles.filterChip}>
            <Text style={styles.filterChipText}>
              {sortBy === 'rating' ? '🔽 Rating' : sortBy === 'date' ? '🕐 Date' : '🅰️ Name'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsManualMode(!isManualMode)}
            style={[styles.filterChip, isManualMode && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, isManualMode && { color: COLORS.blue }]}>
              {isManualMode ? '⌨️ Manual' : '🖱️ Arrows'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRatingsUnlocked(!isRatingsUnlocked)}
            style={[styles.filterChip, isRatingsUnlocked && styles.filterChipWarning]}>
            <Text style={[styles.filterChipText, isRatingsUnlocked && { color: '#FFB800' }]}>
              {isRatingsUnlocked ? '🔓 OVR' : '🔒 OVR'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Position filters */}
      <FlatList
        data={['All', ...positions]}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.posFilterList}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setPosFilter(item === 'All' ? '' : item)}
            style={[
              styles.posChip,
              (item === 'All' ? !posFilter : posFilter === item) && styles.posChipActive,
            ]}>
            <Text style={[
              styles.posChipText,
              (item === 'All' ? !posFilter : posFilter === item) && styles.posChipTextActive,
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Player List */}
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item._id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Changes are saved automatically</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: '#fff', fontSize: 20 },
  headerTitle: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  searchInput: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    borderColor: COLORS.blue,
    backgroundColor: 'rgba(0,195,255,0.1)',
  },
  filterChipWarning: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255,184,0,0.1)',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  posFilterList: { maxHeight: 48, paddingVertical: 8 },
  posChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 32,
    justifyContent: 'center',
  },
  posChipActive: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderColor: COLORS.accent,
  },
  posChipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  posChipTextActive: { color: COLORS.accent },
  list: { padding: 12, gap: 8 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  playerRowEditing: {
    borderColor: 'rgba(0,255,136,0.2)',
    backgroundColor: 'rgba(0,255,136,0.03)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  playerThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 20, opacity: 0.3 },
  playerMeta: { flex: 1, minWidth: 0 },
  playerNameText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerDetailText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  statControl: { alignItems: 'center', minWidth: 50 },
  statControlDisabled: { opacity: 0.3 },
  statControlLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 30,
    overflow: 'hidden',
  },
  statBtn: {
    width: 20,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '900' },
  statValue: { fontWeight: '900', fontSize: 13, paddingHorizontal: 4, minWidth: 24, textAlign: 'center' },
  statInput: {
    width: 44,
    height: 30,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 13,
  },
  doneBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0,255,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  doneBtnText: { color: COLORS.accent, fontWeight: '900', fontSize: 14 },
  statsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDisplayItem: { alignItems: 'center', minWidth: 28 },
  statDisplayLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDisplayValue: { fontSize: 12, fontWeight: '900' },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, opacity: 0.3 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  footer: { padding: 12, alignItems: 'center' },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default QuickUpdateScreen;
