import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  TextInput,
  Image,
  ScrollView,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PLAYSTYLES,
  CARD_TYPES,
  POSITIONS,
  COLORS,
  ALL_SKILLS,
  SPECIAL_SKILLS,
} from '../constants';
import Dropdown from '../components/Dropdown';
import PlayerCard from '../components/PlayerCard';
import CustomDialog from '../components/CustomDialog';
import {
  addPlayer,
  updatePlayer,
  deletePlayer,
  uploadBase64Image,
} from '../services/playerService';
import { getSquads } from '../services/squadService';
import { logout, subscribeToAuthChanges } from '../services/authService';
import LoginScreen from './LoginScreen';
import QuickUpdateScreen from './QuickUpdateScreen';
import AddPlayerScreen from './AddPlayerScreen';
import DatabasePlayerScreen from './DatabasePlayerScreen';
import ProfileStatsScreen from './ProfileStatsScreen';
import LinksScreen from './LinksScreen';
import SettingsScreen from './SettingsScreen';
import SquadScreen from './SquadScreen';
import BrochureScreen from './BrochureScreen';
import ScreenshotsScreen from './ScreenshotsScreen';
import BadgesScreen from './BadgesScreen';
import RanksScreen from './RanksScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 4;

const HomeScreen = ({ navigation, user: initialUser, settings, setSettings, players, setPlayers }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Sync user prop
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const numColumns = useMemo(() => {
    switch (settings.cardSize) {
      case 'mini': return 5;
      case 'xs': return 4;
      case 'sm': return 3;
      case 'md': return 2;
      case 'lg': return 1;
      default: return 3;
    }
  }, [settings.cardSize]);

  const cardWidth = useMemo(() => {
    const totalGap = 16 * 2 + (numColumns - 1) * 10;
    return (width - totalGap) / numColumns;
  }, [numColumns, width]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('All');
  const [filterCardType, setFilterCardType] = useState('All');
  const [filterClub, setFilterClub] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterLeague, setFilterLeague] = useState('');
  const [filterPlaystyle, setFilterPlaystyle] = useState('All');
  const [filterExactRating, setFilterExactRating] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const [missingDetailsFilter, setMissingDetailsFilter] = useState('All Players');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Selection
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Dialog
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: 'Cancel' });

  const showAlert = useCallback((title, message, type = 'info') => {
    setDialog({ isOpen: true, title, message, type, confirmText: 'OK', onConfirm: () => setDialog((p) => ({ ...p, isOpen: false })), onCancel: null });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, type = 'confirm', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setDialog({ isOpen: true, title, message, type, confirmText, cancelText, onConfirm: () => { onConfirm(); setDialog((p) => ({ ...p, isOpen: false })); }, onCancel: () => setDialog((p) => ({ ...p, isOpen: false })) });
  }, []);



  const handleUpdatePlayer = useCallback(async (playerId, updates) => {
    if (!user) return;
    try {
      await updatePlayer(user.uid, playerId, updates);
      setPlayers((prev) => prev.map((p) => p._id === playerId ? { ...p, ...updates } : p));
    } catch (err) {
      console.error('Update error:', err);
    }
  }, [user]);

  const handleDeletePlayer = useCallback(async (playerId) => {
    if (!user) return;
    showConfirm('Delete Player', 'Are you sure you want to remove this player?', async () => {
      try {
        await deletePlayer(user.uid, playerId);
        setPlayers((prev) => prev.filter((p) => p._id !== playerId));
        showAlert('Deleted', 'Player removed from squad.', 'success');
      } catch (err) {
        showAlert('Error', 'Failed to delete player.', 'danger');
      }
    }, 'danger', 'Delete');
  }, [user, showAlert, showConfirm, setPlayers]);

  const handleUpdateBadge = useCallback(async (oldData, newData) => {
    if (!user) return;
    try {
      const field = newData.type === 'national' ? 'nationality_flag_url' : 'club_badge_url';
      const nameField = newData.type === 'national' ? 'nationality' : (newData.type === 'league' ? 'league' : 'club');
      
      const batch = players.filter(p => p[nameField] === oldData.name);
      const promises = batch.map(p => updatePlayer(user.uid, p._id, {
        [field]: newData.logo,
        [nameField]: newData.name
      }));
      
      await Promise.all(promises);
      setPlayers(prev => prev.map(p => {
        if (p[nameField] === oldData.name) {
          return { ...p, [field]: newData.logo, [nameField]: newData.name };
        }
        return p;
      }));
      showAlert('Success', 'Badge updated for all matching players.', 'success');
    } catch (err) {
      console.error('Update error:', err);
      showAlert('Error', 'Failed to update badge.', 'danger');
    }
  }, [user, players, setPlayers, showAlert]);

  const handleAddBadge = useCallback((data) => {
    console.log('Add badge:', data);
    showAlert('System', 'Manual badge entry is managed via Player stats editing.', 'info');
  }, [showAlert]);

  const handleDeleteBadge = useCallback((item) => {
    if (!user) return;
    showConfirm('Delete Badge', `Remove ${item.name} from all matching players?`, async () => {
      try {
        const batch = players.filter(p => {
          if (item.type === 'club' && p.club === item.name) return true;
          if (item.type === 'national' && p.nationality === item.name) return true;
          if (item.type === 'league' && p.league === item.name) return true;
          return false;
        });

        const playerIds = batch.map(p => p._id);
        const update = {};
        if (item.type === 'club') { update.club = ''; update.club_badge_url = ''; }
        else if (item.type === 'national') { update.nationality = ''; update.nationality_flag_url = ''; }
        else if (item.type === 'league') { update.league = ''; update.league_logo = ''; }

        await updatePlayersBulk(user.uid, playerIds, update);

        const updatedPlayers = players.map(p => {
          if (item.type === 'club' && p.club === item.name) return { ...p, ...update };
          if (item.type === 'national' && p.nationality === item.name) return { ...p, ...update };
          if (item.type === 'league' && p.league === item.name) return { ...p, ...update };
          return p;
        });
        setPlayers(updatedPlayers);
        showAlert('Badge Removed', `Removed ${item.name} from all matching players.`, 'success');
      } catch (err) {
        console.error("Delete badge error:", err);
        showAlert('Error', 'Failed to remove badge.', 'danger');
      }
    });
  }, [user, players, showConfirm, showAlert, setPlayers]);

  const handleMergeBadges = useCallback((selectedNames, type) => {
    if (selectedNames.length < 2 || !user) return;
    
    const targetName = selectedNames[0];
    showConfirm('Merge Badges', `Merge ${selectedNames.length} items into "${targetName}"?`, async () => {
      try {
        const targetPlayer = players.find(pl => (type === 'club' ? pl.club : pl.nationality) === targetName);
        const targetLogo = (type === 'club' ? targetPlayer?.club_badge_url : targetPlayer?.nationality_flag_url) || '';

        const batch = players.filter(p => {
          if (type === 'club') return selectedNames.includes(p.club);
          if (type === 'national') return selectedNames.includes(p.nationality);
          return false;
        });

        const playerIds = batch.map(p => p._id);
        const update = {};
        if (type === 'club') { update.club = targetName; update.club_badge_url = targetLogo; }
        else { update.nationality = targetName; update.nationality_flag_url = targetLogo; }

        await updatePlayersBulk(user.uid, playerIds, update);

        const updatedPlayers = players.map(p => {
          let match = false;
          if (type === 'club' && selectedNames.includes(p.club)) match = true;
          else if (type === 'national' && selectedNames.includes(p.nationality)) match = true;
          
          if (match) return { ...p, ...update };
          return p;
        });
        setPlayers(updatedPlayers);
        showAlert('Badges Merged', `Merged ${selectedNames.length} items into ${targetName}.`, 'success');
      } catch (err) {
        console.error("Merge badges error:", err);
        showAlert('Error', 'Failed to merge badges.', 'danger');
      }
    });
  }, [user, players, showConfirm, showAlert, setPlayers]);
  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0 || !user) return;
    showConfirm(`Delete ${selectedIds.size} Players`, 'This cannot be undone. Continue?', async () => {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => deletePlayer(user.uid, id)));
        setPlayers((prev) => prev.filter((p) => !selectedIds.has(p._id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        showAlert('Deleted', 'Players removed.', 'success');
      } catch (err) {
        showAlert('Error', 'Failed to delete players.', 'danger');
      }
    }, 'danger', 'Delete All');
  }, [selectedIds, user]);


  // Filter & Sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => 
          p.name?.toLowerCase().includes(q) || 
          p.club?.toLowerCase().includes(q) ||
          p.position?.toLowerCase().includes(q) ||
          p.nationality?.toLowerCase().includes(q)
      );
    }
    
    // Position
    if (filterPos !== 'All') {
      result = result.filter((p) => p.position === filterPos);
    }
    
    // Card Type
    if (filterCardType !== 'All') {
      const target = filterCardType.toLowerCase().replace(/\s/g, '');
      result = result.filter((p) => (p.cardType || '').toLowerCase().replace(/\s/g, '') === target);
    }

    // Club
    if (filterClub) {
      result = result.filter((p) => p.club?.toLowerCase().includes(filterClub.toLowerCase()));
    }

    // Nationality
    if (filterNationality) {
      result = result.filter((p) => p.nationality?.toLowerCase().includes(filterNationality.toLowerCase()));
    }

    // League
    if (filterLeague) {
      result = result.filter((p) => p.league?.toLowerCase().includes(filterLeague.toLowerCase()));
    }

    // Playstyle
    if (filterPlaystyle !== 'All') {
      const target = filterPlaystyle.toLowerCase().replace(/\s/g, '');
      result = result.filter((p) => (p.playstyle || '').toLowerCase().replace(/\s/g, '') === target);
    }

    // Exact Rating
    if (filterExactRating) {
      result = result.filter((p) => p.rating && p.rating.toString() === filterExactRating.toString());
    }

    // Skill Filter
    if (filterSkill !== 'All') {
      const target = filterSkill.toLowerCase().replace(/\s/g, '');
      result = result.filter(p => {
        const check = (arr) => {
          if (!arr) return false;
          const skillsArray = Array.isArray(arr) ? arr : [arr];
          if (filterSkill === 'Any Special Skill') {
            return skillsArray.some(s => SPECIAL_SKILLS.includes(s));
          }
          return skillsArray.some(s => s?.toString().toLowerCase().replace(/\s/g, '') === target);
        };
        return check(p.skills) || check(p.additionalSkills);
      });
    }

    // Participation
    if (showInactive) {
      result = result.filter((p) => (p.matches || 0) === 0);
    }

    // Missing Details Filter
    if (missingDetailsFilter !== 'All Players' && missingDetailsFilter !== 'All') {
      if (missingDetailsFilter === 'Missing Picture') {
        result = result.filter(p => !p.image || p.image === '');
      } else if (missingDetailsFilter === 'Missing Player ID') {
        result = result.filter(p => !p.pesdb_id && !p.playerId);
      } else if (missingDetailsFilter === 'Missing Playstyle') {
        result = result.filter(p => !p.playstyle || p.playstyle === 'None');
      } else if (missingDetailsFilter === 'Missing Card Type') {
        result = result.filter(p => !p.cardType || p.cardType === 'Normal');
      } else if (missingDetailsFilter === 'Missing Club') {
        result = result.filter(p => !p.club);
      } else if (missingDetailsFilter === 'Missing League') {
        result = result.filter(p => !p.league);
      } else if (missingDetailsFilter === 'Missing Club Badge') {
        result = result.filter(p => !p.logos?.club && !p.club_badge_url);
      } else if (missingDetailsFilter === 'Missing Country Badge') {
        result = result.filter(p => !p.logos?.country && !p.nationality_flag_url);
      } else if (missingDetailsFilter === 'Missing Age') {
        result = result.filter(p => !p.age || p.age === '');
      } else if (missingDetailsFilter === 'Missing Height') {
        result = result.filter(p => !p.height || p.height === '');
      } else if (missingDetailsFilter === 'Missing Tags') {
        result = result.filter(p => !p.tags || p.tags.length === 0);
      } else if (missingDetailsFilter === 'Missing Foot') {
        result = result.filter(p => !p.strongFoot || p.strongFoot === '');
      } else if (missingDetailsFilter === 'No Skills Found') {
        result = result.filter(p => {
          const hasSkills = p.skills && p.skills.filter(s => s && s.trim() !== '').length > 0;
          return !hasSkills;
        });
      } else if (missingDetailsFilter === 'No Additional Skills') {
        result = result.filter(p => {
          if (!p.additionalSkills) return true;
          const realAdditional = p.additionalSkills.filter(s => s && s.trim() !== '');
          return realAdditional.length === 0;
        });
      } else if (missingDetailsFilter === 'Incomplete Additional Skills') {
        result = result.filter(p => {
          const filled = (p.additionalSkills || []).filter(s => s && s.trim() !== '').length;
          return filled > 0 && filled < 5;
        });
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'goals') return (b.goals || 0) - (a.goals || 0);
      if (sortBy === 'assists') return (b.assists || 0) - (a.assists || 0);
      if (sortBy === 'dateAdded') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });
    
    return result;
  }, [
    players, 
    search, 
    filterPos, 
    filterCardType, 
    filterClub, 
    filterNationality, 
    filterLeague, 
    filterPlaystyle, 
    filterExactRating, 
    filterSkill, 
    showInactive,
    missingDetailsFilter,
    sortBy
  ]);

  if (!user && !loading) {
    return <LoginScreen />;
  }

  // The sub-views are now handled via full-screen Modals at the bottom of the render
  // to ensure they cover the Tab Bar as requested.

  const renderCard = ({ item, index }) => (
    <View style={[styles.cardContainer, { width: cardWidth }]}>
      <PlayerCard
        player={item}
        players={players}
        settings={settings}
        isSelectionMode={isSelectionMode}
        isSelected={selectedIds.has(item._id)}
        onToggleSelect={handleToggleSelect}
        onPress={() => {
          if (isSelectionMode) {
            handleToggleSelect(item._id);
          } else {
            setEditingPlayer(item);
          }
        }}
      />
    </View>
  );

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <View style={{ flex: 1 }}>
      {isSearchExpanded && (
        <View style={styles.expandSearchContainer}>
          <TextInput
            style={styles.expandSearchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="TYPE PLAYER NAME..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoFocus
          />
          <TouchableOpacity onPress={toggleSearch} style={styles.expandSearchClose}>
            <Text style={styles.expandSearchCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <SafeAreaView style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.menuIconBox} onPress={() => setShowDrawer(true)}>
            <Text style={styles.menuIcon}>≡</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.appTitle}>EFOOTBALL <Text style={styles.appTitleHighlight}>STATS</Text></Text>
          </View>

          <TouchableOpacity 
            style={styles.menuIconBox} 
            onPress={() => navigation.navigate('User')}
          >
            <Text style={styles.userIconSmall}>👤</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.controlsScrollWrapper}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlsScrollLayout}>
          <TouchableOpacity 
            style={styles.actionSquareBtnActiveSmall} 
            onPress={toggleSearch}
          >
            <Text style={styles.actionBtnEmojiDarkLarge}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSquareBtnActive}
            onPress={() => setView('quick-stats')}>
            <Text style={styles.actionBtnEmojiDark}>⚡</Text>
            <Text style={styles.actionBtnTextDark}>STATS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSquareBtn}>
            <Text style={styles.actionBtnEmoji}>🔔</Text>
            <Text style={styles.actionBtnText}>REMAINDER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSquareBtnSmall} onPress={() => setShowFilterModal(true)}>
            <Text style={styles.actionBtnEmojiLarge}>≏</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (isSelectionMode) { setSelectedIds(new Set()); }
              setIsSelectionMode(!isSelectionMode);
            }}
            style={[styles.actionSquareBtnSmall, isSelectionMode && { borderColor: COLORS.accent }]}>
            <Text style={[styles.actionBtnEmojiLarge, isSelectionMode && { color: COLORS.accent }]}>
              {isSelectionMode ? '✓' : '✓'}
            </Text>
          </TouchableOpacity>
          {isSelectionMode && selectedIds.size > 0 && (
            <TouchableOpacity onPress={handleBulkDelete} style={[styles.actionSquareBtnSmall, { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,68,68,0.1)' }]}>
              <Text style={[styles.actionBtnEmojiLarge, { color: '#FF6B6B' }]}>🗑</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Empty State */}
      {filteredPlayers.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚽</Text>
          <Text style={styles.emptyTitle}>No Players Found</Text>
          <Text style={styles.emptySubtitle}>
            {players.length === 0 ? 'Your squad is empty. Add players to get started.' : 'No players match your filters.'}
          </Text>
        </View>
      ) : (
        <FlatList
          key={numColumns} // Force re-render when numColumns changes
          data={filteredPlayers}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
        />
      )}

      <CustomDialog {...dialog} />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent={true} animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleFull}>ACTIVE FILTERS</Text>
              <TouchableOpacity onPress={() => {
                setFilterPos('All'); 
                setFilterCardType('All'); 
                setFilterClub(''); 
                setFilterNationality('');
                setFilterLeague(''); 
                setFilterPlaystyle('All'); 
                setFilterExactRating(''); 
                setFilterSkill('All');
                setMissingDetailsFilter('All Players');
                setShowInactive(false); 
                setSortBy('rating');
              }}>
                <Text style={styles.clearAllText}>CLEAR ALL</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyScroll}>
              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Dropdown
                    label="POSITION"
                    options={['All', ...POSITIONS]}
                    value={filterPos}
                    onSelect={setFilterPos}
                  />
                </View>
                <View style={styles.modalCol}>
                  <Dropdown
                    label="CARD TYPE"
                    options={['All', ...CARD_TYPES]}
                    value={filterCardType}
                    onSelect={setFilterCardType}
                    placeholder="All Types"
                  />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalSectionLabelSmall}>CLUB NAME</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="SEARCH CLUB..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={filterClub}
                    onChangeText={setFilterClub}
                  />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.modalSectionLabelSmall}>NATIONALITY</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="SEARCH COUNTRY..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={filterNationality}
                    onChangeText={setFilterNationality}
                  />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalSectionLabelSmall}>LEAGUE</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="SEARCH LEAGUE..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={filterLeague}
                    onChangeText={setFilterLeague}
                  />
                </View>
                <View style={styles.modalCol}>
                  <Dropdown
                    label="PLAYSTYLE"
                    options={['All', ...PLAYSTYLES]}
                    value={filterPlaystyle}
                    onSelect={setFilterPlaystyle}
                    placeholder="All Styles"
                  />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalSectionLabelSmall}>RATING</Text>
                  <TextInput
                    keyboardType="numeric"
                    style={styles.filterInput}
                    placeholder="Exact rating..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={filterExactRating}
                    onChangeText={setFilterExactRating}
                  />
                </View>
                <View style={styles.modalCol}>
                  <Dropdown
                    label="SKILL FILTER"
                    options={['All', 'Any Special Skill', ...ALL_SKILLS]}
                    value={filterSkill}
                    onSelect={setFilterSkill}
                    placeholder="Select skill"
                    searchable
                  />
                </View>
              </View>

              <View style={styles.dividerLine} />

              <Dropdown
                label="SORT BY"
                options={['Overall Rating', 'Goals Scored', 'Assists', 'Date Added']}
                value={
                  sortBy === 'rating' ? 'Overall Rating' : 
                  sortBy === 'goals' ? 'Goals Scored' : 
                  sortBy === 'assists' ? 'Assists' : 'Date Added'
                }
                onSelect={(val) => {
                  if (val === 'Overall Rating') setSortBy('rating');
                  else if (val === 'Goals Scored') setSortBy('goals');
                  else if (val === 'Assists') setSortBy('assists');
                  else setSortBy('dateAdded');
                }}
              />

              <Text style={styles.modalSectionLabelSmall}>PARTICIPATION</Text>
              <TouchableOpacity
                onPress={() => setShowInactive(!showInactive)}
                style={[styles.toggleBtn, showInactive && styles.toggleBtnActive]}>
                <Text style={styles.toggleIcon}>👻</Text>
                <Text style={styles.toggleText}>SHOW INACTIVE</Text>
              </TouchableOpacity>

              <Text style={styles.modalSectionLabelSmall}>PERFORMANCE</Text>
              <TouchableOpacity
                onPress={() => setInfiniteScroll(!infiniteScroll)}
                style={[styles.toggleBtn, infiniteScroll && styles.toggleBtnActive]}>
                <Text style={styles.toggleIcon}>📜</Text>
                <Text style={styles.toggleText}>INFINITE SCROLL MODE</Text>
              </TouchableOpacity>

              <Dropdown
                label="MISSING DETAILS"
                options={[
                  'All Players', 
                  'Missing Picture', 
                  'Missing Player ID', 
                  'Missing Playstyle', 
                  'Missing Card Type', 
                  'Missing Club', 
                  'Missing League', 
                  'Missing Club Badge', 
                  'Missing Country Badge', 
                  'Missing Age', 
                  'Missing Height', 
                  'Missing Tags', 
                  'Missing Foot',
                  'No Skills Found',
                  'No Additional Skills',
                  'Incomplete Additional Skills'
                ]}
                value={missingDetailsFilter}
                onSelect={setMissingDetailsFilter}
              />
            </ScrollView>

            <TouchableOpacity style={styles.applyBtnFull} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <Modal visible={showDrawer} transparent={true} animationType="fade" onRequestClose={() => setShowDrawer(false)}>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDrawer(false)} />
          <View style={styles.drawerContent}>
            
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerHeaderTitle}>NAVIGATION</Text>
                <Text style={styles.drawerHeaderSubtitle}>MANAGEMENT HUB</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDrawer(false)} style={styles.drawerCloseBtn}>
                <Text style={styles.drawerCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Drawer User Card Removed - Moved to profile screen */}

            <ScrollView style={styles.drawerMenu} showsVerticalScrollIndicator={false}>
              {[
                { icon: '📁', color: '#4488ff', bg: 'rgba(68,136,255,0.2)', title: 'ADD PLAYER FROM DB', subtitle: 'Mass recruitment', target: 'database' },
                { icon: '✍️', color: '#ffaa00', bg: 'rgba(255,170,0,0.15)', title: 'MANUAL ENTRY', subtitle: 'Input stats manually', target: 'add' },
                { icon: '⚔️', color: '#FFF', bg: 'rgba(255,255,255,0.05)', title: 'SQUADS', subtitle: 'Tactical builds', target: 'squad' },
                { icon: '🏆', color: COLORS.accent, bg: 'rgba(0,255,136,0.15)', title: 'RANKINGS', subtitle: 'Global leaderboards', target: 'ranks' },
                { icon: '📸', color: '#aaaaaa', bg: 'rgba(170,170,170,0.15)', title: 'SCREENSHOTS', subtitle: 'View gallery', target: 'screenshots' },
                { icon: '🔗', color: '#aaaaaa', bg: 'rgba(170,170,170,0.15)', title: 'QUICK LINKS', subtitle: 'External resources', target: 'links' },
                { icon: '🛡️', color: COLORS.accent, bg: 'rgba(0,255,136,0.15)', title: 'BADGES', subtitle: 'Global Logos', target: 'badges' },
              ].map((item, index) => (
                <TouchableOpacity 
                   key={index} 
                   style={styles.drawerMenuItem} 
                   onPress={() => {
                     setShowDrawer(false);
                     if (item.target === 'add') {
                       setShowAddPlayer(true);
                     } else {
                       setView(item.target);
                     }
                   }}
                >
                  <View style={[styles.drawerMenuIconBox, { backgroundColor: item.bg }]}>
                    <Text style={styles.drawerMenuIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.drawerMenuTextWrap}>
                    <Text style={styles.drawerMenuTitle}>{item.title}</Text>
                    <Text style={styles.drawerMenuSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterText}>VERSION 1.0.4</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB - Add Player */}
      {!isSelectionMode && (
        <TouchableOpacity
          onPress={() => setShowAddPlayer(true)}
          style={styles.fab}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGrad}>
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>

      {/* Full-Screen Utility Screens (Modals to hide bottom nav) */}
      <Modal visible={view === 'quick-stats'} animationType="slide">
        <QuickUpdateScreen
          players={players}
          onUpdate={handleUpdatePlayer}
          onClose={() => setView('list')}
        />
      </Modal>

      <Modal visible={showAddPlayer || !!editingPlayer} animationType="slide">
        <AddPlayerScreen
          userId={user?.uid}
          initialData={editingPlayer}
          onSave={async (playerData) => {
            if (editingPlayer) {
              await handleUpdatePlayer(editingPlayer._id, playerData);
            } else {
              const newPlayer = await addPlayer(user.uid, playerData);
              setPlayers((prev) => [newPlayer, ...prev]);
            }
          }}
          onClose={() => { setShowAddPlayer(false); setEditingPlayer(null); }}
        />
      </Modal>

      <Modal visible={view === 'database'} animationType="slide">
        <DatabasePlayerScreen
          userId={user?.uid}
          ownersPlayers={players}
          onBack={() => setView('list')}
          onAddComplete={(newPlayers) => setPlayers(prev => [...newPlayers, ...prev])}
          showAlert={showAlert}
        />
      </Modal>

      <Modal visible={view === 'profile-stats'} animationType="slide">
        <ProfileStatsScreen
          players={players}
          onClose={() => setView('list')}
        />
      </Modal>

      <Modal visible={view === 'links'} animationType="slide">
        <LinksScreen
          onClose={() => setView('list')}
        />
      </Modal>

      <Modal visible={view === 'settings'} animationType="slide">
        <SettingsScreen
          onClose={() => setView('list')}
          settings={settings}
          setSettings={setSettings}
          players={players}
          setPlayers={setPlayers}
          user={user}
        />
      </Modal>

      <Modal visible={view === 'brochure'} animationType="slide">
        <BrochureScreen onClose={() => setView('list')} />
      </Modal>

      <Modal visible={view === 'screenshots'} animationType="slide">
        <ScreenshotsScreen onClose={() => setView('list')} />
      </Modal>

      <Modal visible={view === 'badges'} animationType="slide">
        <BadgesScreen 
          players={players} 
          user={user}
          onClose={() => setView('list')} 
          onUpdateBadge={handleUpdateBadge}
          onAddBadge={handleAddBadge}
          onDeleteBadge={handleDeleteBadge}
          onMergeBadges={handleMergeBadges}
        />
      </Modal>

      <Modal visible={view === 'ranks'} animationType="slide" transparent={false} onRequestClose={() => setView('list')}>
        <RanksScreen 
          players={players} 
          onClose={() => setView('list')} 
        />
      </Modal>

      <Modal visible={view === 'squad'} animationType="slide" transparent={false} onRequestClose={() => setView('list')}>
        <SquadScreen 
          players={players} 
          onClose={() => setView('list')} 
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  menuIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 24, lineHeight: 26 },
  appTitle: { fontSize: 18, fontWeight: '900', color: '#fff', fontStyle: 'italic', letterSpacing: 1 },
  appTitleHighlight: { color: COLORS.accent },
  userIconSmall: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
  
  controlsScrollWrapper: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  controlsScrollLayout: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  searchInputCustom: { width: 140, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: '#fff', fontSize: 13, fontWeight: '600' },
  actionSquareBtn: { height: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  actionSquareBtnActive: { height: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  actionSquareBtnActiveSmall: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  actionSquareBtnSmall: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  actionBtnEmoji: { fontSize: 13, marginBottom: 2, color: '#aaa' },
  actionBtnEmojiDark: { fontSize: 13, marginBottom: 2, color: '#000' },
  actionBtnEmojiDarkLarge: { fontSize: 18, color: '#000' },
  actionBtnEmojiLarge: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },

  expandSearchContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 9999, 
    height: 80, 
    backgroundColor: '#111116', 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingBottom: 15, 
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent + '33'
  },
  expandSearchInput: { 
    flex: 1, 
    height: 50, 
    color: COLORS.accent, 
    fontSize: 18, 
    fontWeight: '900', 
    fontStyle: 'italic', 
    letterSpacing: 1 
  },
  expandSearchClose: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10 
  },
  expandSearchCloseText: { color: '#fff', fontSize: 20, fontWeight: '300' },
  actionBtnText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  actionBtnTextDark: { fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContentFull: { width: width * 0.9, backgroundColor: '#1a1d24', borderRadius: 20, padding: 20, height: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleFull: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  clearAllText: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  modalBodyScroll: { flex: 1 },
  modalTwoCol: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modalCol: { flex: 1 },
  modalSectionLabelSmall: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  filterDropdownFake: { height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  filterDropdownFakeFull: { height: 44, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 16 },
  filterDropdownText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterDropdownArrow: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  filterInput: { height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  dividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
  toggleBtn: { height: 44, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, marginBottom: 4 },
  toggleBtnActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(0,255,136,0.05)' },
  toggleIcon: { fontSize: 14 },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  applyBtnFull: { marginTop: 20, backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  
  grid: { padding: 12, paddingTop: 8 },
  row: { gap: 8, marginBottom: 8, justifyContent: 'flex-start' },
  cardContainer: { },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16, opacity: 0.3 },
  emptyTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.4,
    marginBottom: 8,
  },
  emptySubtitle: { color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  fabGrad: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '900', lineHeight: 32 },

  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
  drawerContent: { width: width * 0.82, maxWidth: 320, backgroundColor: '#0a0a0c', height: '100%', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)', elevation: 20 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 30 },
  drawerHeaderTitle: { color: COLORS.accent, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  drawerHeaderSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
  drawerCloseBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  drawerCloseIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 'bold' },
  drawerUserCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  drawerUserAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  drawerUserAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  drawerUserInfo: { flex: 1, marginLeft: 12 },
  drawerUserName: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 2 },
  drawerUserEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },
  drawerLogoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
  drawerLogoutIcon: { color: '#FF4444', fontSize: 14, fontWeight: 'bold' },
  drawerMenu: { flex: 1, paddingHorizontal: 10 },
  drawerMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  drawerMenuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  drawerMenuIcon: { fontSize: 16 },
  drawerMenuTextWrap: { flex: 1, marginLeft: 16 },
  drawerMenuTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  drawerMenuSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },
  drawerFooter: { padding: 24, paddingBottom: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  drawerFooterText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '900', letterSpacing: 3 },
});

export default HomeScreen;
