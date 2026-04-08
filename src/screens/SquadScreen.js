import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import PlayerCard from '../components/PlayerCard';
import QuickUpdateScreen from './QuickUpdateScreen';
import { updatePlayer, updatePlayersBulk } from '../services/playerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Alert } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

import { useAppContext } from '../../App';

const SquadScreen = ({ onClose }) => {
  const { players, setPlayers, user } = useAppContext();
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);

  // Filter players for "active squad" (e.g. at least 1 match played or favorited if such field exists)
  // For now, let's show all players but allow searching
  const filteredPlayers = useMemo(() => {
    const searchLower = (search || '').toLowerCase();
    return players.filter(p => {
      if (!search) return true;
      const nameMatch = (p.name || '').toLowerCase().includes(searchLower);
      const tagsMatch = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(searchLower));
      return nameMatch || tagsMatch;
    });
  }, [players, search]);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) setSearch('');
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const onBulkUpdateDone = (id, updates) => {
    // This is called for single updates within QuickUpdateScreen
    setPlayers(prev => prev.map(p => p._id === id ? { ...p, ...updates } : p));
  };

  const renderCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <PlayerCard
        player={item}
        players={players}
        isSelectionMode={isSelectionMode}
        isSelected={selectedIds.has(item._id)}
        onToggleSelect={handleToggleSelect}
        onPress={() => {
          if (isSelectionMode) {
            handleToggleSelect(item._id);
          }
          // navigation logic could go here if not in selection mode
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0c' }}>
      {/* Expanding Search Bar at the Top */}
      {isSearchExpanded && (
        <View style={styles.expandedSearch}>
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH SQUAD..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <TouchableOpacity onPress={toggleSearch} style={styles.closeSearch}>
            <Text style={styles.closeSearchText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#161c24', '#0a0a0c']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>MY SQUAD</Text>
              <Text style={styles.headerSubtitle}>{filteredPlayers.length} TACTICAL UNITS</Text>
            </View>

            {!isSearchExpanded && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedIds(new Set());
                  }}
                  style={[styles.headerBtn, isSelectionMode && { borderColor: COLORS.accent, backgroundColor: 'rgba(0,255,170,0.1)' }]}
                >
                  <MaterialCommunityIcons
                    name={isSelectionMode ? "check-circle" : "check-circle-outline"}
                    size={20}
                    color={isSelectionMode ? COLORS.accent : "rgba(255,255,255,0.4)"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleSearch} style={styles.headerBtn}>
                  <Text style={styles.searchEmoji}>🔍</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          {filteredPlayers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛡️</Text>
              <Text style={styles.emptyTitle}>SQUAD EMPTY</Text>
              <Text style={styles.emptySub}>Search for players to add or check filters.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPlayers}
              keyExtractor={item => item._id}
              extraData={[isSelectionMode, selectedIds]}
              renderItem={renderCard}
              numColumns={2}
              contentContainerStyle={styles.list}
              columnWrapperStyle={styles.row}
            />
          )}

          {isSelectionMode && selectedIds.size > 0 && (
            <TouchableOpacity
              style={styles.bulkEditFloatBtn}
              onPress={() => setShowQuickUpdate(true)}
            >
              <LinearGradient colors={[COLORS.accent, '#00cc88']} style={styles.bulkEditGradient}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#000" />
                <Text style={styles.bulkEditFloatText}>BULK EDIT {selectedIds.size}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <Modal visible={showQuickUpdate} animationType="slide" transparent={false}>
          <QuickUpdateScreen
            players={players}
            initialSelectedIds={Array.from(selectedIds)}
            onClose={() => setShowQuickUpdate(false)}
            onUpdate={async (id, updates) => {
              try {
                await updatePlayer(user.uid, id, updates);
                onBulkUpdateDone(id, updates);
              } catch (e) {
                console.error(e);
              }
            }}
          />
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  headerSubtitle: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: -2 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchEmoji: { fontSize: 18 },

  expandedSearch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 70,
    backgroundColor: '#161c24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeSearch: {
    padding: 10,
  },
  closeSearchText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: 'bold',
  },

  list: { padding: 15 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  cardContainer: { width: (width - 45) / 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, opacity: 0.1, marginBottom: 20 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '900', opacity: 0.2, letterSpacing: 3 },
  emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 10, textAlign: 'center' },
  bulkEditFloatBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8
  },
  bulkEditGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20
  },
  bulkEditFloatText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1
  },
});

export default SquadScreen;
