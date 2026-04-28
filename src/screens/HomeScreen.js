import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import PlayerDetailsModal from '../components/PlayerDetailsModal';
import BulkEditModal from '../components/BulkEditModal';
import {
  addPlayer,
  updatePlayer,
  updatePlayersBulk,
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
import FormationsScreen from './FormationsScreen';
import AppsScreen from './AppsScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../../App';
import { PanResponder, Animated } from 'react-native';

const RangeSlider = ({ label, range, onRangeChange, minBound = 150, maxBound = 220 }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const totalSpan = maxBound - minBound;

  // Track the current range in a ref to keep PanResponder callbacks fresh
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const startValue = useRef(0);

  const getPosFromValue = (val) => {
    if (trackWidth === 0) return 0;
    return ((val - minBound) / totalSpan) * trackWidth;
  };

  const getValueFromPos = (pos) => {
    const clampedPos = Math.max(0, Math.min(pos, trackWidth));
    return Math.round((clampedPos / trackWidth) * totalSpan + minBound);
  };

  const pan1 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValue.current = rangeRef.current[0];
      },
      onPanResponderMove: (evt, gestureState) => {
        const startPos = getPosFromValue(startValue.current);
        const newVal = getValueFromPos(startPos + gestureState.dx);
        if (newVal < rangeRef.current[1]) {
          onRangeChange([newVal, rangeRef.current[1]]);
        }
      },
    })
  ).current;

  const pan2 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startValue.current = rangeRef.current[1];
      },
      onPanResponderMove: (evt, gestureState) => {
        const startPos = getPosFromValue(startValue.current);
        const newVal = getValueFromPos(startPos + gestureState.dx);
        if (newVal > rangeRef.current[0]) {
          onRangeChange([rangeRef.current[0], newVal]);
        }
      },
    })
  ).current;

  return (
    <View style={sliderStyles.container}>
      <Text style={sliderStyles.title}>{label}</Text>
      <View style={sliderStyles.row}>
        
        {/* Min Controls */}
        <View style={sliderStyles.controlGroup}>
          <TouchableOpacity 
            style={sliderStyles.tinyBtn} 
            onPress={() => onRangeChange([Math.max(minBound, range[0]-1), range[1]])}
          >
            <Text style={sliderStyles.tinyBtnText}>-</Text>
          </TouchableOpacity>
          <View style={sliderStyles.valueBox}>
            <Text style={sliderStyles.valueText}>{range[0]}</Text>
          </View>
          <TouchableOpacity 
            style={sliderStyles.tinyBtn} 
            onPress={() => onRangeChange([Math.min(range[1], range[0]+1), range[1]])}
          >
            <Text style={sliderStyles.tinyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <View 
          style={sliderStyles.trackWrapper}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View style={sliderStyles.trackBase} />
          {trackWidth > 0 && (
            <>
              <View 
                style={[
                  sliderStyles.trackActive, 
                  { 
                    left: getPosFromValue(range[0]), 
                    width: getPosFromValue(range[1]) - getPosFromValue(range[0]) 
                  }
                ]} 
              />
              <View 
                {...pan1.panHandlers}
                style={[sliderStyles.knob, { left: getPosFromValue(range[0]) - 12 }]} 
              />
              <View 
                {...pan2.panHandlers}
                style={[sliderStyles.knob, { left: getPosFromValue(range[1]) - 12 }]} 
              />
            </>
          )}
        </View>

        {/* Max Controls */}
        <View style={sliderStyles.controlGroup}>
          <TouchableOpacity 
            style={sliderStyles.tinyBtn} 
            onPress={() => onRangeChange([range[0], Math.max(range[0], range[1]-1)])}
          >
            <Text style={sliderStyles.tinyBtnText}>-</Text>
          </TouchableOpacity>
          <View style={sliderStyles.valueBox}>
            <Text style={sliderStyles.valueText}>{range[1]}</Text>
          </View>
          <TouchableOpacity 
            style={sliderStyles.tinyBtn} 
            onPress={() => onRangeChange([range[0], Math.min(maxBound, range[1]+1)])}
          >
            <Text style={sliderStyles.tinyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: { paddingVertical: 10, width: '100%' },
  title: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  controlGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tinyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tinyBtnText: { color: COLORS.accent, fontSize: 16, fontWeight: '700' },
  valueBox: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, minWidth: 45, alignItems: 'center' },
  valueText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  trackWrapper: { flex: 1, height: 30, justifyContent: 'center', marginHorizontal: 5 },
  trackBase: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  trackActive: { height: 4, backgroundColor: '#3b82f6', position: 'absolute', borderRadius: 2 },
  knob: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#3b82f6', 
    borderWidth: 2, 
    borderColor: '#fff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10
  }
});

const HomeScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { user, settings, setSettings, players, setPlayers } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

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
    // Sync with styles: grid padding (12) and row gap (8)
    const horizontalPadding = 12 * 2;
    const totalGap = (numColumns - 1) * 8;
    return (width - horizontalPadding - totalGap) / numColumns;
  }, [numColumns, width]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState(['All']);
  const [filterCardType, setFilterCardType] = useState(['All']);
  const [filterClub, setFilterClub] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterLeague, setFilterLeague] = useState('');
  const [filterPlaystyle, setFilterPlaystyle] = useState(['All']);
  const [filterExactRating, setFilterExactRating] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterFoot, setFilterFoot] = useState('All');
  const [filterMinHeight, setFilterMinHeight] = useState('');
  const [filterWeakFootUsage, setFilterWeakFootUsage] = useState('All');
  const [filterWeakFootAccuracy, setFilterWeakFootAccuracy] = useState('All');
  const [filterInjuryResistance, setFilterInjuryResistance] = useState('All');
  const [filterForm, setFilterForm] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const [missingDetailsFilter, setMissingDetailsFilter] = useState('All Players');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showSliderPopup, setShowSliderPopup] = useState(false);
  const [heightFilterActive, setHeightFilterActive] = useState(false);
  const [heightRange, setHeightRange] = useState([150, 210]);
  const [filterMinAge, setFilterMinAge] = useState('');
  const [filterMaxAge, setFilterMaxAge] = useState('');
  const [ageRange, setAgeRange] = useState([15, 45]);
  const [ageFilterActive, setAgeFilterActive] = useState(false);

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
    if (playerId === 'switch_player' && updates) {
      // Create a fresh object to force re-render
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setSelectedPlayer({ ...updates });
      return;
    }
    if (!user) return;
    try {
      await updatePlayer(user.uid, playerId, updates);
      setPlayers((prev) => prev.map((p) => p._id === playerId ? { ...p, ...updates } : p));
      
      // If updating the currently selected player, sync details modal
      if (selectedPlayer?._id === playerId) {
        setSelectedPlayer(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  }, [user, selectedPlayer, players]);

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
    if (!user || selectedIds.size === 0) return;
    showConfirm('Delete Players', `Are you sure you want to remove ${selectedIds.size} players?`, async () => {
      try {
        setLoading(true);
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map(id => deletePlayer(user.uid, id)));
        setPlayers(prev => prev.filter(p => !selectedIds.has(p._id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        showAlert('Deleted', 'Players removed from squad.', 'success');
      } catch (err) {
        showAlert('Error', 'Failed to delete some players.', 'danger');
      } finally {
        setLoading(false);
      }
    }, 'danger', 'Delete');
  }, [user, selectedIds, showConfirm, setPlayers, showAlert]);

  const handleBulkUpdateAction = useCallback(async (updates) => {
    if (!user || selectedIds.size === 0) return;
    try {
      setLoading(true);
      const ids = Array.from(selectedIds);
      await updatePlayersBulk(user.uid, ids, updates);

      // Update local state
      setPlayers(prev => prev.map(p => {
        if (selectedIds.has(p._id)) return { ...p, ...updates };
        return p;
      }));

      setShowBulkEdit(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      showAlert('Updated', 'Selected players updated successfully.', 'success');
    } catch (err) {
      console.error('Bulk update error:', err);
      showAlert('Error', 'Failed to update selected players.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [user, selectedIds, showAlert, setPlayers]);


  // Filter & Sort players
  const filteredPlayers = useMemo(() => {
    if (!isFocused) return [];
    let result = [...players];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.club?.toLowerCase().includes(q) ||
          p.position?.toLowerCase().includes(q) ||
          p.nationality?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Position
    if (filterPos.length > 0 && !filterPos.includes('All')) {
      result = result.filter((p) => filterPos.includes(p.position));
    }

    // Card Type
    if (filterCardType.length > 0 && !filterCardType.includes('All')) {
      const targets = filterCardType.map(t => t.toLowerCase().replace(/\s/g, ''));
      result = result.filter((p) => {
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
    if (filterPlaystyle.length > 0 && !filterPlaystyle.includes('All')) {
      result = result.filter((p) => filterPlaystyle.includes(p.playstyle));
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

    // Foot
    if (filterFoot !== 'All') {
      result = result.filter((p) => {
        const pFoot = (p.strongFoot || p.foot || p.strong_foot || p.strongfoot || '').toLowerCase().trim();
        const target = filterFoot.toLowerCase().trim();
        if (target === 'right') {
          return pFoot === 'right' || pFoot === 'r' || pFoot.includes('right');
        }
        if (target === 'left') {
          return pFoot === 'left' || pFoot === 'l' || pFoot.includes('left');
        }
        return pFoot === target;
      });
    }

    // Weak Foot Usage
    if (filterWeakFootUsage !== 'All') {
      result = result.filter((p) => {
        const val = (p['Weak Foot Usage'] || p.weakFootUsage || p.weak_foot_usage || '').toString().toLowerCase();
        const target = filterWeakFootUsage.toLowerCase();
        if (target === 'almost never' && (val === '1' || val === 'almost never')) return true;
        if (target === 'rarely' && (val === '2' || val === 'rarely')) return true;
        if (target === 'occasionally' && (val === '3' || val === 'occasionally')) return true;
        if (target === 'regularly' && (val === '4' || val === 'regularly')) return true;
        return val.includes(target);
      });
    }

    // Weak Foot Accuracy
    if (filterWeakFootAccuracy !== 'All') {
      result = result.filter((p) => {
        const val = (p['Weak Foot Accuracy'] || p.weakFootAccuracy || p.weak_foot_accuracy || '').toString().toLowerCase();
        const target = filterWeakFootAccuracy.toLowerCase();
        if (target === 'low' && (val === '1' || val === 'low' || val === 'slightly low')) return true;
        if (target === 'medium' && (val === '2' || val === 'medium' || val === 'normal')) return true;
        if (target === 'high' && (val === '3' || val === 'high')) return true;
        if (target === 'very high' && (val === '4' || val === 'very high')) return true;
        return val.includes(target);
      });
    }

    // Injury Resistance
    if (filterInjuryResistance !== 'All') {
      result = result.filter((p) => {
        const val = (p['Injury Resistance'] || p.injuryResistance || p.injury_resistance || '').toString().toLowerCase();
        const target = filterInjuryResistance.toLowerCase();
        if (target === 'low' && (val === '1' || val === 'low')) return true;
        if (target === 'medium' && (val === '2' || val === 'medium')) return true;
        if (target === 'high' && (val === '3' || val === 'high')) return true;
        if (target === 'very high' && (val === '4' || val === 'very high')) return true;
        return val.includes(target);
      });
    }

    // Form
    if (filterForm !== 'All') {
      result = result.filter((p) => {
        const val = (p.form || p.Form || '').toString().toLowerCase();
        const target = filterForm.toLowerCase();
        if (target === 'unwavering' && (val === 'unwavering' || val === 'consistent')) return true;
        return val === target || val.includes(target);
      });
    }

    // Min Height
    if (filterMinHeight) {
      result = result.filter((p) => {
        if (!p.height) return false;
        const h = parseInt(p.height);
        const minH = parseInt(filterMinHeight);
        return !isNaN(h) && !isNaN(minH) && h >= minH;
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
        result = result.filter(p => !p.cardType || p.cardType === 'Standard');
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
        result = result.filter(p => !p.strongFoot && !p.foot && !p.strong_foot && !p.strongfoot);
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

    // Height Range Filter
    if (heightFilterActive) {
      result = result.filter(p => {
        if (!p.height) return false;
        const h = parseInt(p.height);
        return !isNaN(h) && h >= heightRange[0] && h <= heightRange[1];
      });
    }

    // Age Range Filter
    if (ageFilterActive) {
      result = result.filter(p => {
        if (!p.age) return false;
        const a = parseInt(p.age);
        return !isNaN(a) && a >= ageRange[0] && a <= ageRange[1];
      });
    }

    // Min/Max Age Input Filters
    if (filterMinAge) {
      result = result.filter(p => {
        if (!p.age) return false;
        const a = parseInt(p.age);
        const minA = parseInt(filterMinAge);
        return !isNaN(a) && !isNaN(minA) && a >= minA;
      });
    }
    if (filterMaxAge) {
      result = result.filter(p => {
        if (!p.age) return false;
        const a = parseInt(p.age);
        const maxA = parseInt(filterMaxAge);
        return !isNaN(a) && !isNaN(maxA) && a <= maxA;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (settings.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (settings.sortBy === 'goals') return (b.goals || 0) - (a.goals || 0);
      if (settings.sortBy === 'assists') return (b.assists || 0) - (a.assists || 0);
      if (settings.sortBy === 'dateAdded') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
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
    settings.sortBy,
    isFocused,
    heightFilterActive,
    heightRange,
    filterFoot,
    filterMinHeight,
    filterWeakFootUsage,
    filterWeakFootAccuracy,
    filterInjuryResistance,
    filterForm,
    ageFilterActive,
    ageRange,
    filterMinAge,
    filterMaxAge,
  ]);

  if (!user && !loading) {
    return <LoginScreen />;
  }

  // The sub-views are now handled via full-screen Modals at the bottom of the render
  // to ensure they cover the Tab Bar as requested.

  const renderCard = useCallback(({ item, index }) => (
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
            setSelectedPlayer(item);
            setShowPlayerDetails(true);
          }
        }}
      />
    </View>
  ), [cardWidth, players, settings, isSelectionMode, selectedIds, handleToggleSelect]);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(!isSearchExpanded);
  };

  if (view === 'screenshots') return <ScreenshotsScreen onClose={() => setView('list')} />;
  if (view === 'badges') return <BadgesScreen players={players} onClose={() => setView('list')} onUpdateBadge={handleUpdateBadge} onAddBadge={handleAddBadge} onDeleteBadge={handleDeleteBadge} onMergeBadges={handleMergeBadges} />;
  if (view === 'ranks') return <RanksScreen onClose={() => setView('list')} players={players} />;
  if (view === 'squad') return <FormationsScreen user={user} players={players} squads={[]} onSaveSquad={() => setView('list')} />;

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
              <Text style={styles.playerCountLabel}>
                Showing <Text style={styles.accentTextCount}>{filteredPlayers.length}</Text> Elite Players
              </Text>
              {isSelectionMode && (
                <Text style={styles.selectedCountLabel}>
                  <Text style={styles.accentTextCount}>{selectedIds.size}</Text> Selected
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.menuIconBox}
              onPress={() => Linking.openURL('https://efootball-8c9c5.web.app/')}
            >
              <Text style={styles.userIconSmall}>🌍</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.controlsScrollWrapper}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlsScrollLayout}>
            <TouchableOpacity
              style={isSearchExpanded ? styles.actionSquareBtnActiveSmall : styles.actionSquareBtnSmall}
              onPress={toggleSearch}
            >
              <MaterialCommunityIcons 
                name="magnify" 
                size={22} 
                color={isSearchExpanded ? COLORS.accent : 'rgba(255,255,255,0.4)'} 
                style={isSearchExpanded ? styles.neonIconGlow : {}}
              />
              {isSearchExpanded && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={view === 'quick-stats' ? styles.actionSquareBtnActive : styles.actionSquareBtn}
              onPress={() => setView('quick-stats')}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={20} 
                color={view === 'quick-stats' ? COLORS.accent : 'rgba(255,255,255,0.4)'}
                style={view === 'quick-stats' ? styles.neonIconGlow : {}}
              />
              {view === 'quick-stats' && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={showSliderPopup ? styles.actionSquareBtnActiveSmall : styles.actionSquareBtnSmall}
              onPress={() => setShowSliderPopup(true)}
            >
              <MaterialCommunityIcons 
                name="arrow-expand-horizontal" 
                size={22} 
                color={heightFilterActive ? COLORS.accent : 'rgba(255,255,255,0.4)'} 
                style={heightFilterActive ? styles.neonIconGlow : {}}
              />
              {heightFilterActive && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionSquareBtn}>
              <MaterialCommunityIcons 
                name="bell-outline" 
                size={20} 
                color="rgba(255,255,255,0.4)" 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={showFilterModal ? styles.actionSquareBtnActiveSmall : styles.actionSquareBtnSmall} 
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialCommunityIcons 
                name="filter-variant" 
                size={22} 
                color={showFilterModal ? COLORS.accent : 'rgba(255,255,255,0.4)'}
                style={showFilterModal ? styles.neonIconGlow : {}}
              />
              {showFilterModal && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (isSelectionMode) { setSelectedIds(new Set()); }
                setIsSelectionMode(!isSelectionMode);
              }}
              style={isSelectionMode ? styles.actionSquareBtnActiveSmall : styles.actionSquareBtnSmall}>
              <MaterialCommunityIcons 
                name={isSelectionMode ? "check-circle" : "check-circle-outline"} 
                size={22} 
                color={isSelectionMode ? COLORS.accent : 'rgba(255,255,255,0.4)'}
                style={isSelectionMode ? styles.neonIconGlow : {}}
              />
              {isSelectionMode && <View style={styles.activeDot} />}
            </TouchableOpacity>

            {isSelectionMode && selectedIds.size > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowBulkEdit(true)}
                  style={[styles.actionSquareBtnSmall, { borderColor: COLORS.blue, backgroundColor: 'rgba(0,195,255,0.08)' }]}>
                  <MaterialCommunityIcons name="flash" size={22} color={COLORS.blue} style={{ textShadowColor: COLORS.blue, textShadowRadius: 8 }} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleBulkDelete} 
                  style={[styles.actionSquareBtnSmall, { borderColor: COLORS.danger, backgroundColor: 'rgba(255,68,68,0.08)' }]}
                >
                  <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.danger} style={{ textShadowColor: COLORS.danger, textShadowRadius: 8 }} />
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {heightFilterActive && (
          <View style={styles.heightOverlay}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -10, zIndex: 11 }}>
              <TouchableOpacity onPress={() => setHeightFilterActive(false)} style={{ padding: 5 }}>
                <Text style={styles.closeOverlayText}>✕</Text>
              </TouchableOpacity>
            </View>
            <RangeSlider 
              label="Height (cm)"
              range={heightRange} 
              onRangeChange={setHeightRange} 
              minBound={150} 
              maxBound={220} 
            />
          </View>
        )}

        {ageFilterActive && (
          <View style={styles.heightOverlay}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -10, zIndex: 11 }}>
              <TouchableOpacity onPress={() => setAgeFilterActive(false)} style={{ padding: 5 }}>
                <Text style={styles.closeOverlayText}>✕</Text>
              </TouchableOpacity>
            </View>
            <RangeSlider 
              label="Age (Years)"
              range={ageRange} 
              onRangeChange={setAgeRange} 
              minBound={15} 
              maxBound={45} 
            />
          </View>
        )}

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
            keyExtractor={(item, index) => item._id || `player-${index}`}
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
                  setFilterPos(['All']);
                  setFilterCardType(['All']);
                  setFilterClub('');
                  setFilterNationality('');
                  setFilterLeague('');
                  setFilterPlaystyle(['All']);
                  setFilterExactRating('');
                  setFilterSkill('All');
                  setFilterFoot('All');
                  setFilterMinHeight('');
                  setFilterWeakFootUsage('All');
                  setFilterWeakFootAccuracy('All');
                  setFilterForm('All');
                  setMissingDetailsFilter('All Players');
                  setShowInactive(false);
                  setSettings({ ...settings, sortBy: 'rating' });
                  setFilterMinAge('');
                  setFilterMaxAge('');
                  setAgeRange([15, 45]);
                  setAgeFilterActive(false);
                  setHeightFilterActive(false);
                  setHeightRange([150, 210]);
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
                      multiSelect
                    />
                  </View>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="CARD TYPE"
                      options={['All', ...CARD_TYPES]}
                      value={filterCardType}
                      onSelect={setFilterCardType}
                      placeholder="All Types"
                      multiSelect
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
                      multiSelect
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

                <View style={styles.modalTwoCol}>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="FOOT"
                      options={['All', 'Right', 'Left']}
                      value={filterFoot}
                      onSelect={setFilterFoot}
                    />
                  </View>
                  <View style={styles.modalCol}>
                    <Text style={styles.modalSectionLabelSmall}>MIN HEIGHT</Text>
                    <TextInput
                      keyboardType="numeric"
                      style={styles.filterInput}
                      placeholder="e.g. 185"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={filterMinHeight}
                      onChangeText={setFilterMinHeight}
                    />
                  </View>
                </View>

                <View style={styles.modalTwoCol}>
                  <View style={styles.modalCol}>
                    <Text style={styles.modalSectionLabelSmall}>MIN AGE</Text>
                    <TextInput
                      keyboardType="numeric"
                      style={styles.filterInput}
                      placeholder="e.g. 18"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={filterMinAge}
                      onChangeText={setFilterMinAge}
                    />
                  </View>
                  <View style={styles.modalCol}>
                    <Text style={styles.modalSectionLabelSmall}>MAX AGE</Text>
                    <TextInput
                      keyboardType="numeric"
                      style={styles.filterInput}
                      placeholder="e.g. 35"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={filterMaxAge}
                      onChangeText={setFilterMaxAge}
                    />
                  </View>
                </View>

                <View style={styles.modalTwoCol}>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="WF USAGE"
                      options={['All', 'Almost Never', 'Rarely', 'Occasionally', 'Regularly']}
                      value={filterWeakFootUsage}
                      onSelect={setFilterWeakFootUsage}
                    />
                  </View>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="WF ACCURACY"
                      options={['All', 'Low', 'Medium', 'High', 'Very High']}
                      value={filterWeakFootAccuracy}
                      onSelect={setFilterWeakFootAccuracy}
                    />
                  </View>
                </View>

                <View style={styles.modalTwoCol}>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="INJURY RES"
                      options={['All', 'Low', 'Medium', 'High', 'Very High']}
                      value={filterInjuryResistance}
                      onSelect={setFilterInjuryResistance}
                    />
                  </View>
                  <View style={styles.modalCol}>
                    <Dropdown
                      label="FORM"
                      options={['All', 'Unwavering', 'Standard', 'Inconsistent']}
                      value={filterForm}
                      onSelect={setFilterForm}
                    />
                  </View>
                </View>

                <View style={styles.dividerLine} />

                <Dropdown
                  label="SORT BY"
                  options={['Overall Rating', 'Goals Scored', 'Assists', 'Date Added']}
                  value={
                    settings.sortBy === 'rating' ? 'Overall Rating' :
                      settings.sortBy === 'goals' ? 'Goals Scored' :
                        settings.sortBy === 'assists' ? 'Assists' : 'Date Added'
                  }
                  onSelect={(val) => {
                    const newSortBy = val === 'Overall Rating' ? 'rating' :
                                    val === 'Goals Scored' ? 'goals' :
                                    val === 'Assists' ? 'assists' : 'dateAdded';
                    setSettings({ ...settings, sortBy: newSortBy });
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
                  { icon: '🚀', color: '#00D4FF', bg: 'rgba(0,212,255,0.15)', title: 'MY APPS', subtitle: 'Tools & Resources', target: 'apps' },
                  { icon: '📖', color: '#00FF88', bg: 'rgba(0,255,136,0.15)', title: 'EFOOTBALL ARTICLES', subtitle: 'Tactical Encyclopedia', target: 'brochure' },
                  { icon: '📸', color: '#aaaaaa', bg: 'rgba(170,170,170,0.15)', title: 'SCREENSHOTS', subtitle: 'View gallery', target: 'screenshots' },
                  { icon: '🔗', color: '#aaaaaa', bg: 'rgba(170,170,170,0.15)', title: 'QUICK LINKS', subtitle: 'External resources', target: 'links' },
                  { icon: '⚡', color: COLORS.accent, bg: 'rgba(0,255,136,0.15)', title: 'QUICK STATS', subtitle: 'Update match details', target: 'quick-stats' },
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
          user={user}
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
        <FormationsScreen
          user={user}
          players={players}
          onSaveSquad={() => setView('list')}
        />
      </Modal>

      <Modal visible={view === 'apps'} animationType="slide">
        <AppsScreen
          onClose={() => setView('list')}
        />
      </Modal>

      <PlayerDetailsModal
        visible={showPlayerDetails}
        player={selectedPlayer}
        players={players}
        onClose={() => {
          setShowPlayerDetails(false);
          setSelectedPlayer(null);
        }}
        onEditDetailed={(player) => {
          setShowPlayerDetails(false);
          setSelectedPlayer(null);
          setEditingPlayer(player);
        }}
        onUpdate={handleUpdatePlayer}
      />

      <BulkEditModal
        visible={showBulkEdit}
        selectedCount={selectedIds.size}
        onClose={() => setShowBulkEdit(false)}
        onApply={handleBulkUpdateAction}
      />

      <Modal visible={showSliderPopup} transparent animationType="fade" onRequestClose={() => setShowSliderPopup(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSliderPopup(false)} />
          <View style={[styles.modalContentFull, { height: 'auto', paddingBottom: 30 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleFull}>SLIDER HUB</Text>
              <TouchableOpacity onPress={() => setShowSliderPopup(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.sliderHubGrid}>
              <TouchableOpacity 
                style={styles.hubBtn}
                onPress={() => {
                  setShowSliderPopup(false);
                  setHeightFilterActive(true);
                }}
              >
                <View style={styles.hubIconBox}>
                  <MaterialCommunityIcons name="human-male-height" size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.hubBtnText}>HEIGHT SLIDER</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubBtnDisabled}>
                <View style={styles.hubIconBox}>
                  <MaterialCommunityIcons name="weight-lifter" size={24} color="rgba(255,255,255,0.2)" />
                </View>
                <Text style={[styles.hubBtnText, { color: 'rgba(255,255,255,0.2)' }]}>WEIGHT SLIDER</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.hubBtn}
                onPress={() => {
                  setShowSliderPopup(false);
                  setAgeFilterActive(true);
                }}
              >
                <View style={styles.hubIconBox}>
                  <MaterialCommunityIcons name="cake-variant" size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.hubBtnText}>AGE SLIDER</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubBtnDisabled}>
                <View style={styles.hubIconBox}>
                  <MaterialCommunityIcons name="speedometer" size={24} color="rgba(255,255,255,0.2)" />
                </View>
                <Text style={[styles.hubBtnText, { color: 'rgba(255,255,255,0.2)' }]}>RATING SLIDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  playerCountLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  accentTextCount: {
    color: COLORS.accent,
  },
  selectedCountLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 0,
  },

  controlsScrollWrapper: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  controlsScrollLayout: { paddingHorizontal: 16, paddingVertical: 14, gap: 12, alignItems: 'center' },
  searchInputCustom: { width: 140, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: '#fff', fontSize: 13, fontWeight: '600' },
  actionSquareBtn: { 
    height: 48, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  actionSquareBtnActive: { 
    height: 48, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    backgroundColor: 'rgba(0, 255, 136, 0.08)', 
    borderWidth: 1.5, 
    borderColor: COLORS.accent, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  },
  actionSquareBtnActiveSmall: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(0, 255, 136, 0.08)', 
    borderWidth: 1.5, 
    borderColor: COLORS.accent, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  },
  actionSquareBtnSmall: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  neonIconGlow: {
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  neonImageGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  activeDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowRadius: 4,
    shadowOpacity: 1,
  },
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

  grid: { padding: 12, paddingTop: 8, alignItems: 'center' },
  row: { gap: 8, marginBottom: 8, justifyContent: 'center' },
  cardContainer: {},
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

  heightOverlay: {
    backgroundColor: '#0f1014',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  accentText: { color: COLORS.accent },
  closeOverlayText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '300' },

  sliderHubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  hubBtn: { width: (width * 0.9 - 52) / 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  hubBtnDisabled: { width: (width * 0.9 - 52) / 2, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  hubIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  hubBtnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
});

export default HomeScreen;
