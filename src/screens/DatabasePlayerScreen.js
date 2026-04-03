import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { searchGlobalFirestore, getRecentGlobalPlayers, addPlayersBulk } from '../services/playerService';
import { COLORS } from '../constants';
import { getPlayerBadge } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

const DatabasePlayerScreen = ({ userId, ownersPlayers = [], onBack, onAddComplete, showAlert }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [resultsCount, setResultsCount] = useState(0);

  const existingIds = new Set(ownersPlayers.map(p => p.pesdb_id || p.playerId).filter(id => id));

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecentGlobalPlayers(60);
      setPlayers(data || []);
      setResultsCount(data?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (text) => {
    setSearch(text);
    if (text.length < 2) {
      if (text.length === 0) fetchInitial();
      return;
    }

    setLoading(true);
    try {
      const data = await searchGlobalFirestore(text);
      setPlayers(data || []);
      setResultsCount(data?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchInitial]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

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
      cardType: p.card_type || 'Normal',
      pesdb_id: p.id,
      playerId: p.id,
      rating: 90,
      goals: 0,
      assists: 0,
      matches: 0,
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
            {isSelected && <View style={styles.checkCircle}><Text style={styles.checkText}>✓</Text></View>}
            {isOwned && <View style={styles.ownedBadge}><Text style={styles.ownedText}>OWNED</Text></View>}
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>EXPLORER</Text>
          <Text style={styles.headerSub}>{resultsCount} PLAYERS FOUND</Text>
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
        <TextInput
          style={styles.searchBar}
          placeholder="Search global database..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={handleSearch}
        />
        {loading && <ActivityIndicator style={styles.loader} color={COLORS.accent} />}
      </View>

      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  confirmBtn: { paddingHorizontal: 16, height: 40, backgroundColor: COLORS.accent, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },

  searchBarWrap: { padding: 16, position: 'relative' },
  searchBar: { 
    height: 50, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 15, 
    paddingHorizontal: 16, 
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  loader: { position: 'absolute', right: 26, top: 31 },

  list: { padding: 12 },
  playerCard: { 
    width: CARD_WIDTH, 
    aspectRatio: 0.7, 
    margin: 4, 
    borderRadius: 15, 
    overflow: 'hidden',
    backgroundColor: '#1a1d24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  playerCardSelected: { borderColor: COLORS.accent, borderWidth: 2 },
  playerCardOwned: { opacity: 0.6 },
  playerImage: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { flex: 1, padding: 8, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  posBadge: { paddingHorizontal: 6, py: 2, backgroundColor: COLORS.accent, borderRadius: 4 },
  posText: { color: '#000', fontSize: 10, fontWeight: '900' },
  checkCircle: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  checkText: { color: '#000', fontSize: 10, fontWeight: '900' },
  ownedBadge: { paddingHorizontal: 4, py: 1, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ownedText: { color: COLORS.accent, fontSize: 8, fontWeight: '900' },
  cardBottom: { gap: 2 },
  playerName: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  playerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '600' },
});

export default DatabasePlayerScreen;
