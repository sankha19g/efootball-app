import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, POSITIONS, PLAYSTYLES, CARD_TYPES } from '../constants';
import Dropdown from '../components/Dropdown';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSecondaryPositionsFromPlayer } from '../utils/playerUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEMS_PER_PAGE = 20;

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={onDown} disabled={isDisabled} style={styles.statBtn}><Text style={styles.statBtnText}>−</Text></TouchableOpacity>
            <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
            <TouchableOpacity onPress={onUp} disabled={isDisabled} style={styles.statBtn}><Text style={styles.statBtnText}>+</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── QuickUpdateScreen Component ─────────────────────────────────────────────
const QuickUpdateScreen = ({ players, onUpdate, onClose, initialSelectedIds = null }) => {
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [posFilter, setPosFilter] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('All');
  const [playstyleFilter, setPlaystyleFilter] = useState('All');
  const [ratingSearch, setRatingSearch] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [isRatingsUnlocked, setIsRatingsUnlocked] = useState(false);
  const [nameFilter, setNameFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [page, setPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(initialSelectedIds ? true : false);
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds || []));

  const handleUpdateLocal = (playerId, updates) => {
    if (isSelectionMode && selectedIds.size > 0 && selectedIds.has(playerId)) {
      Alert.alert(
        "Bulk Update",
        `Do you want to copy this to all ${selectedIds.size} selected players?`,
        [
          { text: "No", onPress: () => onUpdate(playerId, updates) },
          {
            text: "Yes",
            onPress: () => {
              const ids = Array.from(selectedIds);
              ids.forEach(id => onUpdate(id, updates));
            }
          }
        ]
      );
    } else {
      onUpdate(playerId, updates);
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const positionsList = useMemo(() => [...new Set(players.map((p) => p.position))].filter(Boolean).sort(), [players]);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) setSearch('');
  };

  useEffect(() => { setPage(1); }, [search, posFilter, clubFilter, countryFilter, leagueFilter, cardTypeFilter, playstyleFilter, ratingSearch, nameFilter, sortBy]);

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const clubMatch = p.club?.toLowerCase().includes(q);
        const tagsMatch = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q));
        return nameMatch || clubMatch || tagsMatch;
      });
    }
    if (posFilter) result = result.filter(p => p.position === posFilter);
    if (clubFilter) result = result.filter(p => p.club?.toLowerCase().includes(clubFilter.toLowerCase()));
    if (countryFilter) result = result.filter(p => p.nationality?.toLowerCase().includes(countryFilter.toLowerCase()));
    if (leagueFilter) result = result.filter(p => p.league?.toLowerCase().includes(leagueFilter.toLowerCase()));
    if (cardTypeFilter !== 'All') result = result.filter(p => p.cardType === cardTypeFilter);
    if (playstyleFilter !== 'All') {
      const target = playstyleFilter.toLowerCase().replace(/\s/g, '');
      result = result.filter((p) => (p.playstyle || '').toLowerCase().replace(/\s/g, '') === target);
    }
    if (ratingSearch) result = result.filter(p => (p.rating || 0).toString().includes(ratingSearch));
    if (nameFilter === 'Special Chars Only') {
      result = result.filter(p => /[^\u0000-\u007F]/.test(p.name));
    } else if (nameFilter === '0 Games') {
      result = result.filter(p => (p.matches || 0) === 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'Oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'Rating (High-Low)': return (b.rating || 0) - (a.rating || 0);
        case 'Rating (Low-High)': return (a.rating || 0) - (b.rating || 0);
        case 'Name (A-Z)': return a.name.localeCompare(b.name);
        default: return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return result;
  }, [players, search, posFilter, clubFilter, countryFilter, leagueFilter, cardTypeFilter, playstyleFilter, ratingSearch, nameFilter, sortBy]);

  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, page]);

  const handleStepLocal = (player, field, delta) => {
    const newValue = Math.max(0, (player[field] || 0) + delta);
    if (newValue !== player[field]) handleUpdateLocal(player._id, { [field]: newValue });
  };

  const renderPlayer = ({ item: player }) => {
    const isEditing = editingPlayerId === player._id;
    const isStatsTab = activeTab === 0;

    return (
      <View style={[
        styles.playerRow,
        (isSelectionMode && selectedIds.has(player._id)) && styles.playerRowSelected,
        isEditing && styles.playerRowEditing,
        (isEditing && isStatsTab) && { flexDirection: 'column', alignItems: 'stretch' }
      ]}>

        {/* TOP SECTION: Edit Controls (Only in Stats Tab when Editing) */}
        {isEditing && isStatsTab && (
          <View style={styles.topEditControls}>
            <StatControl label="OVR" value={player.rating || 0} isManual={isManualMode} isDisabled={!isRatingsUnlocked} onUp={() => handleStepLocal(player, 'rating', 1)} onDown={() => handleStepLocal(player, 'rating', -1)} onManual={(v) => handleUpdateLocal(player._id, { rating: v })} color="ef-accent" />
            <StatControl label="MT" value={player.matches || 0} isManual={isManualMode} onUp={() => handleStepLocal(player, 'matches', 1)} onDown={() => handleStepLocal(player, 'matches', -1)} onManual={(v) => handleUpdateLocal(player._id, { matches: v })} color="white" />
            <StatControl label="GL" value={player.goals || 0} isManual={isManualMode} onUp={() => handleStepLocal(player, 'goals', 1)} onDown={() => handleStepLocal(player, 'goals', -1)} onManual={(v) => handleUpdateLocal(player._id, { goals: v })} color="ef-accent" />
            <StatControl label="AS" value={player.assists || 0} isManual={isManualMode} onUp={() => handleStepLocal(player, 'assists', 1)} onDown={() => handleStepLocal(player, 'assists', -1)} onManual={(v) => handleUpdateLocal(player._id, { assists: v })} color="ef-blue" />
            <TouchableOpacity onPress={() => setEditingPlayerId(null)} style={styles.doneBtn}>
              <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.playerMainRow}>
          <TouchableOpacity
            style={styles.playerInfoRow}
            activeOpacity={isSelectionMode ? 0.7 : 1}
            onPress={() => isSelectionMode ? handleToggleSelect(player._id) : null}
          >
            <View style={styles.imgWrap}>
              {player.image ? <Image source={{ uri: player.image }} style={styles.playerImage} /> : <Text style={styles.thumbEmoji}>👤</Text>}
              {isSelectionMode && selectedIds.has(player._id) && (
                <View style={styles.selectionOverlay}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#00ffaa" />
                </View>
              )}
            </View>
            <View style={styles.playerMeta}>
              <Text style={styles.playerNameText} numberOfLines={1}>
                <HighlightText 
                  text={player.name} 
                  query={search} 
                  highlightStyle={{ 
                    color: COLORS.accent, 
                    fontWeight: '900',
                    backgroundColor: 'rgba(0, 255, 136, 0.15)' 
                  }} 
                />
              </Text>
              <View style={styles.posRow}>
                <Text style={styles.playerDetailText}>
                  <HighlightText 
                    text={`${player.position} ${player.club ? `• ${player.club}` : ''}`} 
                    query={search} 
                    highlightStyle={{ 
                      color: COLORS.accent,
                      backgroundColor: 'rgba(0, 255, 136, 0.15)'
                    }} 
                  />
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.tabContentArea}>
            {isStatsTab ? (
              !isEditing && (
                <View style={styles.statsDisplay}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[['OVR', player.rating || 0, COLORS.accent], ['MT', player.matches || 0, '#fff'], ['GL', player.goals || 0, COLORS.accent], ['AS', player.assists || 0, COLORS.blue]].map(([lbl, val, clr], i) => (
                      <View key={i} style={styles.statDisplayItem}><Text style={styles.statDisplayLabel}>{lbl}</Text><Text style={[styles.statDisplayValue, { color: clr }]}>{val}</Text></View>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => setEditingPlayerId(player._id)} style={styles.editBtn}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.fullWidthInputWrap}>
                {activeTab === 1 && (
                  <>
                    <Text style={styles.statControlLabel}>PLAYER IMAGE URL</Text>
                    <TextInput
                      style={styles.imageInput}
                      defaultValue={player.image}
                      onEndEditing={(e) => handleUpdateLocal(player._id, { image: e.nativeEvent.text })}
                      placeholder="IMAGE URL..."
                      placeholderTextColor="rgba(255,255,255,0.1)"
                    />
                  </>
                )}

                {activeTab === 2 && (
                  <>
                    <Text style={styles.statControlLabel}>SECONDARY POSITIONS</Text>
                    <TextInput
                      style={styles.imageInput}
                      defaultValue={(() => {
                        const existingAdditions = player.additionalPositions || [];
                        if (Array.isArray(existingAdditions) && existingAdditions.length > 0) return existingAdditions.join(' ');
                        const fromUtils = getSecondaryPositionsFromPlayer(player).filter(p => p !== player.position);
                        return fromUtils.join(' ');
                      })()}
                      onEndEditing={(e) => {
                        const v = e.nativeEvent.text.toUpperCase();
                        const positions = v.split(/[\s,]+/).filter(Boolean);
                        if (positions.join('') === (player.additionalPositions || []).join('')) return;
                        handleUpdateLocal(player._id, {
                          additionalPositions: positions,
                          secondaryPositions: positions,
                        });
                      }}
                      placeholder="SS AMF LWF..."
                      placeholderTextColor="rgba(255,255,255,0.1)"
                      autoCapitalize="characters"
                    />
                  </>
                )}

                {activeTab === 3 && (
                  <>
                    <Text style={styles.statControlLabel}>PLAYER NAME</Text>
                    <TextInput
                      style={styles.imageInput}
                      defaultValue={player.name}
                      onEndEditing={(e) => handleUpdateLocal(player._id, { name: e.nativeEvent.text })}
                      placeholder="NAME..."
                      placeholderTextColor="rgba(255,255,255,0.1)"
                    />
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={paginatedPlayers}
        keyExtractor={(item) => item._id}
        extraData={[isSelectionMode, selectedIds, editingPlayerId, isManualMode, isRatingsUnlocked, activeTab]}
        renderItem={renderPlayer}
        ListHeaderComponent={
          <View>
              <View style={styles.toolbar}>
                <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                {isSearchExpanded ? (
                  <View style={styles.expandedSearch}>
                    <TextInput 
                      autoFocus 
                      style={styles.searchField} 
                      value={search} 
                      onChangeText={setSearch} 
                      placeholder="Search players..." 
                      placeholderTextColor="rgba(255,255,255,0.2)" 
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={toggleSearch} style={styles.searchClose}>
                      <MaterialCommunityIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.toolbarTitle}><Text style={styles.titleSmall}>QUICK UPDATES</Text></View>
                    <View style={styles.toolbarActions}>
                      <TouchableOpacity onPress={toggleSearch} style={styles.iconBtn}><MaterialCommunityIcons name="magnify" size={20} color="#fff" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsManualMode(!isManualMode); }} style={[styles.iconBtn, isManualMode && styles.iconBtnActive]}>
                        <MaterialCommunityIcons name={isManualMode ? "keyboard" : "mouse"} size={18} color={isManualMode ? "#00ffaa" : "#fff"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsRatingsUnlocked(!isRatingsUnlocked); }} style={[styles.iconBtn, isRatingsUnlocked && styles.iconBtnWarning]}>
                        <MaterialCommunityIcons name={isRatingsUnlocked ? "lock-open" : "lock"} size={18} color={isRatingsUnlocked ? "#ff9500" : "#fff"} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          const next = !isSelectionMode;
                          setIsSelectionMode(next);
                          if (!next) setSelectedIds(new Set());
                        }}
                        style={[styles.iconBtn, isSelectionMode && styles.iconBtnActive]}
                      >
                        <MaterialCommunityIcons name={isSelectionMode ? "check-circle" : "check-circle-outline"} size={18} color={isSelectionMode ? "#00ffaa" : "#fff"} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

            <View style={styles.filterBarButtonWrapper}>
              <TouchableOpacity style={styles.sortFilterBtn} onPress={() => setShowFilterModal(true)}>
                <MaterialCommunityIcons name="filter-variant" size={18} color="#00ffaa" />
                <Text style={styles.sortFilterText}>SORT & FILTER</Text>
                {(posFilter || clubFilter || countryFilter || leagueFilter || cardTypeFilter !== 'All' || playstyleFilter !== 'All' || ratingSearch || nameFilter !== 'All' || sortBy !== 'Newest') && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.navRow}>
              {[
                { id: 0, icon: 'chart-bar-stacked', label: 'STATS' },
                { id: 1, icon: 'camera', label: 'PIC' },
                { id: 2, icon: 'shield-star', label: 'POS TRAINING' },
                { id: 3, icon: 'pencil', label: 'NAME' },
              ].map((tab) => (
                <TouchableOpacity key={tab.id} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab.id); setEditingPlayerId(null); }} style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}>
                  <MaterialCommunityIcons name={tab.icon} size={16} color={activeTab === tab.id ? '#00ffaa' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[styles.navTabText, activeTab === tab.id && styles.navTabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationFooter}>
              <TouchableOpacity disabled={page === 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
                <MaterialCommunityIcons name="chevron-left" size={24} color={page === 1 ? 'rgba(255,255,255,0.1)' : '#00ffaa'} />
              </TouchableOpacity>
              <View style={styles.pageInfo}>
                <Text style={styles.pageLabel}>PAGE</Text>
                <Text style={styles.pageValue}>{page} <Text style={{ color: 'rgba(255,255,255,0.2)' }}>/ {totalPages}</Text></Text>
              </View>
              <TouchableOpacity disabled={page === totalPages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}>
                <MaterialCommunityIcons name="chevron-right" size={24} color={page === totalPages ? 'rgba(255,255,255,0.1)' : '#00ffaa'} />
              </TouchableOpacity>
            </View>
          ) : <View style={{ height: 40 }} />
        }
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No players matching filters</Text></View>}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalContentFull}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleFull}>SORT & FILTER</Text>
              <TouchableOpacity onPress={() => {
                setPosFilter(''); setClubFilter(''); setCountryFilter(''); setLeagueFilter('');
                setCardTypeFilter('All'); setPlaystyleFilter('All'); setRatingSearch('');
                setNameFilter('All'); setSortBy('Newest');
              }}>
                <Text style={styles.clearAllText}>RESET</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyScroll}>
              <View style={styles.modalSection}>
                <Dropdown label="SORT BY" options={['Newest', 'Oldest', 'Rating (High-Low)', 'Rating (Low-High)', 'Name (A-Z)']} value={sortBy} onSelect={setSortBy} />
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Dropdown label="POSITION" options={['All', ...positionsList]} value={posFilter || 'All'} onSelect={(v) => setPosFilter(v === 'All' ? '' : v)} />
                </View>
                <View style={styles.modalCol}>
                  <Dropdown label="OTHERS" options={['All', 'Special Chars Only', '0 Games']} value={nameFilter} onSelect={setNameFilter} />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Dropdown label="CARD TYPE" options={['All', ...CARD_TYPES]} value={cardTypeFilter} onSelect={setCardTypeFilter} />
                </View>
                <View style={styles.modalCol}>
                  <Dropdown label="PLAYSTYLE" options={['All', ...PLAYSTYLES]} value={playstyleFilter} onSelect={setPlaystyleFilter} />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.dropdownLabel}>LEAGUE</Text>
                  <TextInput style={styles.filterInput} value={leagueFilter} onChangeText={setLeagueFilter} placeholder="Filter league..." placeholderTextColor="rgba(255,255,255,0.2)" />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.dropdownLabel}>COUNTRY</Text>
                  <TextInput style={styles.filterInput} value={countryFilter} onChangeText={setCountryFilter} placeholder="Filter country..." placeholderTextColor="rgba(255,255,255,0.2)" />
                </View>
              </View>

              <View style={styles.modalTwoCol}>
                <View style={styles.modalCol}>
                  <Text style={styles.dropdownLabel}>CLUB NAME</Text>
                  <TextInput style={styles.filterInput} value={clubFilter} onChangeText={setClubFilter} placeholder="Filter..." placeholderTextColor="rgba(255,255,255,0.2)" />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.dropdownLabel}>RATING (RTG)</Text>
                  <TextInput style={styles.filterInput} value={ratingSearch} onChangeText={setRatingSearch} placeholder="RTG..." placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="numeric" />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 12, height: 60, gap: 10 },
  toolbarTitle: { flex: 1 },
  titleSmall: { fontSize: 13, fontWeight: '900', color: '#00ffaa', letterSpacing: 0.5 },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  iconBtnActive: { borderColor: '#00ffaa', backgroundColor: 'rgba(0,255,170,0.05)' },
  iconBtnWarning: { borderColor: '#ff9500', backgroundColor: 'rgba(255,149,0,0.05)' },
  expandedSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1e', borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchField: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  searchClear: { paddingHorizontal: 4 },
  searchClose: { marginLeft: 4 },
  filterBarButtonWrapper: { paddingHorizontal: 12, marginBottom: 12 },
  sortFilterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,255,170,0.05)', borderWidth: 1, borderColor: 'rgba(0,255,170,0.1)', borderRadius: 12, paddingVertical: 10 },
  sortFilterText: { color: '#00ffaa', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  filterBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffaa', position: 'absolute', top: 12, right: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContentFull: { backgroundColor: '#0a0a0a', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '75%', padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,255,170,0.1)' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleFull: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  clearAllText: { color: '#ff4444', fontSize: 13, fontWeight: '700' },
  modalBodyScroll: { flex: 1 },
  modalSection: { marginBottom: 15 },
  modalTwoCol: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  modalCol: { flex: 1 },
  filterInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, padding: 12 },
  applyBtn: { backgroundColor: '#00ffaa', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  applyBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  dropdownLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  navRow: { flexDirection: 'row', marginHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 12, marginBottom: 10 },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  navTabActive: { backgroundColor: 'rgba(0,255,170,0.1)' },
  navTabText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900' },
  navTabTextActive: { color: '#00ffaa' },
  playerRow: { backgroundColor: '#111114', borderRadius: 16, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', marginHorizontal: 12 },
  playerRowSelected: { borderColor: '#00ffaa66', backgroundColor: '#00ffaa0a' },
  playerRowEditing: { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
  playerMainRow: { flexDirection: 'row', alignItems: 'center' },
  topEditControls: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  playerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  imgWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#000', overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  selectionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  thumbEmoji: { fontSize: 20 },
  playerImage: { width: '100%', height: '100%' },
  playerMeta: { flex: 1 },
  playerNameText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  playerDetailText: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '700' },

  tabContentArea: { flex: 1.2, alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 10 },
  statsDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDisplayItem: { alignItems: 'center', minWidth: 26 },
  statDisplayLabel: { fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: '900' },
  statDisplayValue: { fontSize: 11, fontWeight: '900' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  editBtnText: { color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' },
  editControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  fullWidthInputWrap: { width: '100%', height: 46, justifyContent: 'center' },
  imageInput: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,255,170,0.1)',
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  doneBtn: { width: 34, height: 34, backgroundColor: 'rgba(0,255,170,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00ffaa' },

  secPosInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 40
  },
  secPosInput: {
    flex: 1,
    color: '#00ffaa',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    letterSpacing: 0.5
  },

  statControl: { alignItems: 'center', minWidth: 44, height: 48 },
  statControlDisabled: { opacity: 0.3 },
  statControlLabel: { fontSize: 7, fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  statControlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151518', borderRadius: 8, height: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statBtn: { width: 18, height: 36, justifyContent: 'center', alignItems: 'center' },
  statBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  statValue: { fontSize: 11, fontWeight: '900', textAlign: 'center', minWidth: 20 },
  statInput: { fontSize: 11, fontWeight: '900', width: 28, textAlign: 'center', padding: 0, color: '#fff' },

  paginationFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 20, paddingHorizontal: 20 },
  pageBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pageBtnDisabled: { opacity: 0.5 },
  pageInfo: { alignItems: 'center' },
  pageLabel: { fontSize: 7, fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: 1 },
  pageValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: 60, paddingHorizontal: 12 },
});

export default QuickUpdateScreen;
