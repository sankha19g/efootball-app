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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const SquadScreen = ({ players, onClose }) => {
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Filter players for "active squad" (e.g. at least 1 match played or favorited if such field exists)
  // For now, let's show all players but allow searching
  const filteredPlayers = useMemo(() => {
    return players.filter(p => 
      !search || p.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [players, search]);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) setSearch('');
  };

  const renderCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <PlayerCard 
        player={item} 
        players={players} 
        onPress={() => {}} // Could navigate to details
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
              <TouchableOpacity onPress={toggleSearch} style={styles.searchLogoBtn}>
                <Text style={styles.searchEmoji}>🔍</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

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
            renderItem={renderCard}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.row}
          />
        )}
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
  
  searchLogoBtn: {
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
});

export default SquadScreen;
