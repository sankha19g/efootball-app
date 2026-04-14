import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchGlobalFirestore, getRecentGlobalPlayers, addPlayersBulk } from '../services/playerService';
import { COLORS } from '../constants';
import { getPlayerBadge } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;
const BATCH_SIZE = 240;

const DatabasePlayerScreen = ({ userId, ownersPlayers = [], onBack, onAddComplete, showAlert }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const existingIds = new Set(ownersPlayers.map(p => p.pesdb_id || p.playerId).filter(id => id));

  const fetchPlayers = useCallback(async (isInitial = true) => {
    if (loadingMore || (isInitial && loading)) return;

    if (isInitial) {
      setLoading(true);
      setLastDoc(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = searchQuery.length >= 2
        ? await searchGlobalFirestore(searchQuery, isInitial ? null : lastDoc)
        : await getRecentGlobalPlayers(BATCH_SIZE, isInitial ? null : lastDoc);

      const newPlayers = result.players || [];
      const nextDoc = result.lastDoc;

      if (isInitial) {
        setPlayers(newPlayers);
      } else {
        setPlayers(prev => [...prev, ...newPlayers]);
      }
      setLastDoc(nextDoc);
      setHasMore(newPlayers.length === BATCH_SIZE);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, lastDoc, loading, loadingMore]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchPlayers(false);
    }
  };

  useEffect(() => {
    fetchPlayers(true);
  }, [searchQuery]);

  const toggleSelect = (player) => {
    const id = player.id;
    if (existingIds.has(id)) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;

    const playersToMap = players.filter(p => selectedIds.has(p.id));
    const playersToAdd = playersToMap.map(p => ({
      name: p.name,
      image: getPlayerBadge(p, 'player'),
      nationality: p.nationality,
      club: p.club_original || p.club,
      league: p.league,
      position: p.position,
      playstyle: p.playstyle || 'None',
      cardType: p.card_type || 'Standard',
      pesdb_id: p.id,
      playerId: p.id,
      rating: 90,
      goals: 0,
      assists: 0,
      matches: 0,
      age: p.age,
      height: p.height,
      weight: p.weight,
      strongFoot: p.strong_foot || p.foot || p.strongFoot,
      foot: p.foot || p.strong_foot || p.strongFoot,
      weakFootUsage: p.weak_foot_usage || p['Weak Foot Usage'],
      weakFootAccuracy: p.weak_foot_accuracy || p['Weak Foot Accuracy'],
      injuryResistance: p.injury_resistance || p['Injury Resistance'],
      form: p.form || p.Form,
      logos: {
        club: getPlayerBadge(p, 'club'),
        country: getPlayerBadge(p, 'national'),
        league: getPlayerBadge(p, 'league')
      }
    }));

    try {
      setLoading(true);
      await addPlayersBulk(userId, playersToAdd);
      onAddComplete(playersToAdd);
      showAlert('Success', `Added ${playersToAdd.length} players to your squad!`, 'success');
      onBack();
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to add players.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isOwned = existingIds.has(item.id);
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item)}
        activeOpacity={0.7}
        style={[
          styles.playerCard,
          isSelected && styles.playerCardSelected,
          isOwned && styles.playerCardOwned
        ]}
      >
        <Image source={{ uri: item.image }} style={styles.playerImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardOverlay}>
          <View style={styles.cardTop}>
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{item.position}</Text>
            </View>
            {isSelected && <View style={styles.checkCircle}><MaterialCommunityIcons name="check" size={14} color="white" /></View>}
            {isOwned && <View style={styles.ownedBadge}><Text style={styles.ownedText}>SQUAD</Text></View>}
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.playerSub} numberOfLines={1}>{item.club_original || item.club}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>SCOUTING</Text>
          <Text style={styles.headerSub}>GLOBAL DATABASE</Text>
        </View>
        <TouchableOpacity
          disabled={selectedIds.size === 0}
          onPress={handleConfirm}
          style={[styles.confirmBtn, selectedIds.size === 0 && styles.confirmBtnDisabled]}
        >
          <Text style={styles.confirmBtnText}>ADD ({selectedIds.size})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarWrap}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search 11,000+ players..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <MaterialCommunityIcons name="close-circle" size={18} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color="#00ffcc" />
          <Text style={styles.loadingText}>Fetching database...</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => (item.id || item.pesdb_id).toString()}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={() => fetchPlayers(true)}
          refreshing={refreshing}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00ffcc" />
              </View>
            ) : null
          )}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-search-outline" size={64} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No players found</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#00ffcc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
  },
  confirmBtn: {
    backgroundColor: '#00ffcc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#00ffcc',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBarWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    padding: 12,
  },
  playerCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  playerCardSelected: {
    borderColor: '#00ffcc',
    borderWidth: 2,
  },
  playerCardOwned: {
    opacity: 0.8,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'space-between',
    padding: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  posText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  checkCircle: {
    backgroundColor: '#00ffcc',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownedText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  cardBottom: {
    marginTop: 'auto',
  },
  playerName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
  },
  loadingFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    fontSize: 16,
  },
});

export default DatabasePlayerScreen;
