import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, POSITIONS, PLAYSTYLES, CARD_TYPES, SPECIAL_SKILLS, ALL_SKILLS } from '../constants';
import PlayerCard from '../components/PlayerCard';

const { width } = Dimensions.get('window');

// Reusable Dropdown Picker Modal
const PickerModal = ({ visible, title, options, selected, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerCloseBtn}>
              <Text style={styles.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {options.length > 8 && (
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                placeholder="Search option..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  color: '#fff',
                  fontSize: 14,
                  width: '100%',
                  padding: 0,
                }}
              />
            </View>
          )}

          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {filteredOptions.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.pickerItem,
                  selected === opt && styles.pickerItemActive
                ]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selected === opt && styles.pickerItemTextActive
                ]}>
                  {opt.toUpperCase()}
                </Text>
                {selected === opt && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const RandomChooserScreen = ({ onClose, players, settings, onPlayerPress }) => {
  // Collapsible toggle
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Advanced Filters states
  const [selectedPos, setSelectedPos] = useState('All');
  const [clubSearch, setClubSearch] = useState('');
  const [leagueSearch, setLeagueSearch] = useState('');
  const [natSearch, setNatSearch] = useState('');
  const [matchesMin, setMatchesMin] = useState('0');
  const [matchesMax, setMatchesMax] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('All');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');

  // Chooser settings
  const [outputCount, setOutputCount] = useState(1);
  const [generatedPlayers, setGeneratedPlayers] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Modal pickers state
  const [pickerConfig, setPickerConfig] = useState({ visible: false, title: '', options: [], selected: '', onSelect: null });

  // Options memo lists
  const positionOptions = useMemo(() => ['All Positions', ...POSITIONS], []);
  const playstyleOptions = useMemo(() => ['All Playstyles', ...PLAYSTYLES], []);
  const preferredFootOptions = useMemo(() => ['All Feet', 'Right', 'Left'], []);
  const skillOptions = useMemo(() => ['All Skills', 'Any Special Skill', ...ALL_SKILLS], []);

  // Matches filter matching logic
  const matchedPlayers = useMemo(() => {
    return players.filter(p => {
      // Position
      if (selectedPos !== 'All' && selectedPos !== 'All Positions' && p.position !== selectedPos) {
        return false;
      }
      // Club
      if (clubSearch.trim() && !p.club?.toLowerCase().includes(clubSearch.toLowerCase().trim())) {
        return false;
      }
      // League
      if (leagueSearch.trim() && !p.league?.toLowerCase().includes(leagueSearch.toLowerCase().trim())) {
        return false;
      }
      // Nationality
      if (natSearch.trim() && !p.nationality?.toLowerCase().includes(natSearch.toLowerCase().trim())) {
        return false;
      }
      // Matches Min
      const minVal = parseInt(matchesMin, 10);
      if (!isNaN(minVal) && (p.matches || 0) < minVal) {
        return false;
      }
      // Matches Max
      if (matchesMax.trim() !== '') {
        const maxVal = parseInt(matchesMax, 10);
        if (!isNaN(maxVal) && (p.matches || 0) > maxVal) {
          return false;
        }
      }
      // Preferred Foot
      if (preferredFoot !== 'All' && preferredFoot !== 'All Feet') {
        const footVal = String(
          p.preferredFoot || p.strongFoot || p.foot || p.strong_foot || p.strongfoot ||
          p.Foot || p['Preferred Foot'] || p.preferred_foot || 'Right'
        ).toLowerCase();
        const targetFoot = preferredFoot.toLowerCase();
        if (!footVal.startsWith(targetFoot.charAt(0))) {
          return false;
        }
      }
      // Playstyle
      if (selectedPlaystyle !== 'All' && selectedPlaystyle !== 'All Playstyles' && p.playstyle !== selectedPlaystyle) {
        return false;
      }
      // Skill Filter
      if (skillFilter !== 'All' && skillFilter !== 'All Skills') {
        const target = skillFilter.toLowerCase().replace(/\s/g, '');
        const check = (arr) => {
          if (!arr) return false;
          const skillsArray = Array.isArray(arr) ? arr : [arr];
          if (skillFilter === 'Any Special Skill') {
            return skillsArray.some(s => SPECIAL_SKILLS.includes(s));
          }
          return skillsArray.some(s => s?.toString().toLowerCase().replace(/\s/g, '') === target);
        };
        const hasSkill = check(p.skills) || check(p.additionalSkills);
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [players, selectedPos, clubSearch, leagueSearch, natSearch, matchesMin, matchesMax, preferredFoot, selectedPlaystyle, skillFilter]);

  // Compute active parameter count
  const paramCount = useMemo(() => {
    let count = 0;
    if (selectedPos !== 'All' && selectedPos !== 'All Positions') count++;
    if (clubSearch.trim() !== '') count++;
    if (leagueSearch.trim() !== '') count++;
    if (natSearch.trim() !== '') count++;
    if (matchesMin.trim() !== '' && matchesMin !== '0') count++;
    if (matchesMax.trim() !== '') count++;
    if (preferredFoot !== 'All' && preferredFoot !== 'All Feet') count++;
    if (selectedPlaystyle !== 'All' && selectedPlaystyle !== 'All Playstyles') count++;
    if (skillFilter !== 'All' && skillFilter !== 'All Skills') count++;
    return count;
  }, [selectedPos, clubSearch, leagueSearch, natSearch, matchesMin, matchesMax, preferredFoot, selectedPlaystyle, skillFilter]);

  // Clear all filters action
  const handleClearAll = () => {
    setSelectedPos('All');
    setClubSearch('');
    setLeagueSearch('');
    setNatSearch('');
    setMatchesMin('0');
    setMatchesMax('');
    setPreferredFoot('All');
    setSelectedPlaystyle('All');
    setSkillFilter('All');
  };

  const handleGenerate = () => {
    if (matchedPlayers.length === 0) return;

    setIsSpinning(true);
    let duration = 800; // ms
    let intervalTime = 60; // ms
    let elapsed = 0;

    const interval = setInterval(() => {
      const temp = [];
      for (let i = 0; i < Math.min(outputCount, matchedPlayers.length); i++) {
        let randomPlayer = matchedPlayers[Math.floor(Math.random() * matchedPlayers.length)];
        let attempts = 0;
        while (temp.some(p => p._id === randomPlayer._id) && attempts < 10 && matchedPlayers.length > i) {
          randomPlayer = matchedPlayers[Math.floor(Math.random() * matchedPlayers.length)];
          attempts++;
        }
        temp.push(randomPlayer);
      }
      setGeneratedPlayers(temp);
      elapsed += intervalTime;

      if (elapsed >= duration) {
        clearInterval(interval);
        const finalSelection = [];
        const indices = new Set();
        while (finalSelection.length < Math.min(outputCount, matchedPlayers.length)) {
          const idx = Math.floor(Math.random() * matchedPlayers.length);
          if (!indices.has(idx)) {
            indices.add(idx);
            finalSelection.push(matchedPlayers[idx]);
          }
        }
        setGeneratedPlayers(finalSelection);
        setIsSpinning(false);
      }
    }, intervalTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>RANDOM CHOOSER</Text>
          <Text style={styles.headerSub}>SQUAD ROULETTES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Collapsible Filters Card */}
        <View style={styles.filterCard}>
          {/* Collapsible Toggle Header Row */}
          <TouchableOpacity
            style={styles.filterHeaderRow}
            onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <MaterialCommunityIcons name="filter-variant" size={18} color={COLORS.blue} style={styles.funnelIcon} />
              <Text style={styles.collapsibleTitle}>FILTERS & PARAMETERS</Text>
              {paramCount > 0 && <View style={styles.activeDot} />}
              
              {/* Small Matches Count Badge Beside Filter Button */}
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedBadgeText}>
                  {matchedPlayers.length} {matchedPlayers.length === 1 ? 'PLAYER' : 'PLAYERS'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name={isFiltersExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="rgba(255,255,255,0.4)" 
            />
          </TouchableOpacity>

          {/* Expanded Content Area */}
          {isFiltersExpanded && (
            <View style={styles.filterContent}>
              <View style={styles.grid}>
                
                {/* POSITION */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>POSITION</Text>
                  <TouchableOpacity
                    style={styles.filterPickerBtn}
                    onPress={() => setPickerConfig({
                      visible: true,
                      title: 'SELECT POSITION',
                      options: positionOptions,
                      selected: selectedPos === 'All' ? 'All Positions' : selectedPos,
                      onSelect: (val) => setSelectedPos(val === 'All Positions' ? 'All' : val)
                    })}
                  >
                    <Text style={styles.filterPickerText} numberOfLines={1}>
                      {selectedPos === 'All' ? 'All Positions' : selectedPos}
                    </Text>
                    <Text style={styles.dropdownBtnArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* CLUB */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>CLUB</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Search club..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={clubSearch}
                    onChangeText={setClubSearch}
                  />
                </View>

                {/* LEAGUE */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>LEAGUE</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Search league..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={leagueSearch}
                    onChangeText={setLeagueSearch}
                  />
                </View>

                {/* NATIONALITY */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>NATIONALITY</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Search nation..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={natSearch}
                    onChangeText={setNatSearch}
                  />
                </View>

                {/* MATCHES (MIN) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>MATCHES (MIN)</Text>
                  <TextInput
                    style={styles.filterInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={matchesMin}
                    onChangeText={setMatchesMin}
                  />
                </View>

                {/* MATCHES (MAX) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>MATCHES (MAX)</Text>
                  <TextInput
                    style={styles.filterInput}
                    keyboardType="numeric"
                    placeholder="No limit"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={matchesMax}
                    onChangeText={setMatchesMax}
                  />
                </View>

                {/* PREFERRED FOOT */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>PREFERRED FOOT</Text>
                  <TouchableOpacity
                    style={styles.filterPickerBtn}
                    onPress={() => setPickerConfig({
                      visible: true,
                      title: 'PREFERRED FOOT',
                      options: preferredFootOptions,
                      selected: preferredFoot === 'All' ? 'All Feet' : preferredFoot,
                      onSelect: (val) => setPreferredFoot(val === 'All Feet' ? 'All' : val)
                    })}
                  >
                    <Text style={styles.filterPickerText} numberOfLines={1}>
                      {preferredFoot === 'All' ? 'All Feet' : preferredFoot}
                    </Text>
                    <Text style={styles.dropdownBtnArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* PLAYSTYLE */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>PLAYSTYLE</Text>
                  <TouchableOpacity
                    style={styles.filterPickerBtn}
                    onPress={() => setPickerConfig({
                      visible: true,
                      title: 'SELECT PLAYSTYLE',
                      options: playstyleOptions,
                      selected: selectedPlaystyle === 'All' ? 'All Playstyles' : selectedPlaystyle,
                      onSelect: (val) => setSelectedPlaystyle(val === 'All Playstyles' ? 'All' : val)
                    })}
                  >
                    <Text style={styles.filterPickerText} numberOfLines={1}>
                      {selectedPlaystyle === 'All' ? 'All Playstyles' : selectedPlaystyle}
                    </Text>
                    <Text style={styles.dropdownBtnArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* SKILL FILTER */}
                <View style={[styles.filterGroup, { width: '100%' }]}>
                  <Text style={styles.filterLabel}>SKILL FILTER</Text>
                  <TouchableOpacity
                    style={styles.filterPickerBtn}
                    onPress={() => setPickerConfig({
                      visible: true,
                      title: 'SELECT SKILL',
                      options: skillOptions,
                      selected: skillFilter === 'All' ? 'All Skills' : skillFilter,
                      onSelect: (val) => setSkillFilter(val === 'All Skills' ? 'All' : val)
                    })}
                  >
                    <Text style={styles.filterPickerText} numberOfLines={1}>
                      {skillFilter === 'All' ? 'All Skills' : skillFilter}
                    </Text>
                    <Text style={styles.dropdownBtnArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

              </View>

              {/* Filters Footer Summary Row */}
              <View style={styles.filterFooter}>
                <Text style={styles.paramCountText}>PARAM_COUNT: {paramCount}</Text>
                
                {paramCount > 0 && (
                  <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
                    <Text style={styles.clearBtnText}>✕ CLEAR ALL PARAMETERS</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          )}
        </View>

        {/* Output Selector & Generate Button */}
        <View style={styles.generateRow}>
          <View style={styles.outputBox}>
            <Text style={styles.outputLabel}>TOTAL OUTPUT</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setOutputCount(c => Math.max(1, c - 1))}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.stepVal}>
                <Text style={styles.stepValText}>{outputCount}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setOutputCount(c => Math.min(5, c + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.generateBtn,
              matchedPlayers.length === 0 && styles.generateBtnDisabled
            ]}
            disabled={matchedPlayers.length === 0 || isSpinning}
            onPress={handleGenerate}
          >
            <Text style={[
              styles.generateBtnText,
              matchedPlayers.length === 0 && { color: 'rgba(255,255,255,0.2)' }
            ]}>
              {isSpinning ? 'SPINNING...' : 'GENERATE'}
            </Text>
          </TouchableOpacity>
        </View>

        {matchedPlayers.length === 0 && (
          <Text style={styles.noMatchesTip}>
            ⚠️ Adjust filters to find matching players in your squad.
          </Text>
        )}

        {/* Results Area */}
        {generatedPlayers.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>GENERATED PLAYERS</Text>
            <View style={styles.resultGrid}>
              {generatedPlayers.map((player) => (
                <View key={player._id} style={styles.cardContainer}>
                  <PlayerCard
                    player={player}
                    settings={settings}
                    onPress={() => onPlayerPress(player)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Picker Modal overlay */}
      {pickerConfig.visible && (
        <PickerModal
          visible={true}
          title={pickerConfig.title}
          options={pickerConfig.options}
          selected={pickerConfig.selected}
          onSelect={pickerConfig.onSelect}
          onClose={() => setPickerConfig(p => ({ ...p, visible: false }))}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  headerSub: { color: COLORS.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 2 },

  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: { color: COLORS.blue, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 15, textTransform: 'uppercase' },

  // Collapsible Filters Card
  filterCard: {
    backgroundColor: '#0d0d0f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  funnelIcon: {
    marginRight: 8,
  },
  collapsibleTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
    marginLeft: 6,
  },
  matchedBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginLeft: 12,
  },
  matchedBadgeText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  filterContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginTop: 12,
  },
  filterGroup: {
    width: '48%',
  },
  filterLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterInput: {
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 12,
  },
  filterPickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
  },
  filterPickerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownBtnArrow: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
  },

  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  paramCountText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,68,68,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.15)',
  },
  clearBtnText: {
    color: '#FF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Stepper & Generator
  generateRow: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 30 },
  outputBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  outputLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stepVal: { minWidth: 28, alignItems: 'center' },
  stepValText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  generateBtn: { 
    flex: 1.3, 
    height: 60, 
    borderRadius: 20, 
    backgroundColor: '#000', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  generateBtnDisabled: { 
    opacity: 0.4,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  generateBtnText: { color: COLORS.accent, fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  noMatchesTip: { color: 'rgba(255,100,100,0.5)', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: -15, marginBottom: 25, letterSpacing: 0.5 },

  resultSection: { marginTop: 10 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  cardContainer: { width: '48%' },

  // Picker Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  pickerCard: { width: '90%', maxHeight: '70%', backgroundColor: '#0a0a0c', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pickerHeaderTitle: { color: COLORS.accent, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  pickerCloseBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  pickerCloseIcon: { color: '#fff', fontSize: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 44, backgroundColor: 'rgba(255,255,255,0.03)', margin: 15, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  pickerList: { paddingHorizontal: 15 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  pickerItemActive: { backgroundColor: 'rgba(255,255,255,0.02)' },
  pickerItemText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800' },
  pickerItemTextActive: { color: COLORS.accent },
  pickerCheck: { color: COLORS.accent, fontSize: 14, fontWeight: '900' },
});

export default RandomChooserScreen;
