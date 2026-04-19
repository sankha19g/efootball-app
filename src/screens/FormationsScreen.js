import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    FlatList,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    PanResponder
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SQUAD_FORMATIONS, POSITIONS, CARD_TYPES, PLAYSTYLES, ALL_SKILLS } from '../constants';
import { getSquads, saveSquad, deleteSquad } from '../services/squadService';
import { updatePlayer } from '../services/playerService';
import Dropdown from '../components/Dropdown';
import PlayerDetailsModal from '../components/PlayerDetailsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PITCH_HEIGHT = 450;

import { useAppContext } from '../../App';

const FormationsScreen = () => {
    const navigation = useNavigation();
    const { user, players, setPlayers } = useAppContext();
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [currentSquad, setCurrentSquad] = useState(null);

    // Editor & Library States
    const [activeSlot, setActiveSlot] = useState(null);
    const [showPlayerPicker, setShowPlayerPicker] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [activePage, setActivePage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Robust Filtering State
    const [showFilters, setShowFilters] = useState(false);
    const [filterPos, setFilterPos] = useState('All');
    const [filterCardType, setFilterCardType] = useState('All');
    const [filterClub, setFilterClub] = useState('');
    const [filterNationality, setFilterNationality] = useState('');
    const [filterPlaystyle, setFilterPlaystyle] = useState('All');
    const [filterSkill, setFilterSkill] = useState('All');
    const [sortBy, setSortBy] = useState('RATING');
    const [isDragMode, setIsDragMode] = useState(false);
    const [isDraftingMode, setIsDraftingMode] = useState(false);
    const [activeDraftSelection, setActiveDraftSelection] = useState(null);
    const [draggedPlayerOffset, setDraggedPlayerOffset] = useState({ x: 0, y: 0 }); // Current touch position
    const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);

    const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState(null);
    const [showPlayerDetail, setShowPlayerDetail] = useState(false);
    const [isRoleMode, setIsRoleMode] = useState(false);
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [activeRoleSlot, setActiveRoleSlot] = useState(null);
    const [showStatsUpdate, setShowStatsUpdate] = useState(false);
    const [isStatsEditMode, setIsStatsEditMode] = useState(false);

    const filteredPlayers = players
        .filter(p => {
            // Exclude players already in the squad (Starting XI or Subs)
            const squadPlayerIds = [
                ...(currentSquad?.startingXI || []),
                ...(currentSquad?.subBench || [])
            ].map(s => s?.playerId).filter(id => id !== null);

            if (squadPlayerIds.includes(p._id)) return false;

            // Search
            const searchLower = (searchQuery || '').toLowerCase();
            const nameMatch = (p.name || '').toLowerCase().includes(searchLower);
            const tagsMatch = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(searchLower));
            const matchesSearch = !searchQuery || nameMatch || tagsMatch;
            if (!matchesSearch) return false;

            // Position
            if (filterPos !== 'All' && p.position !== filterPos) return false;

            // Card Type
            if (filterCardType !== 'All' && p.cardType !== filterCardType) return false;

            // Club
            if (filterClub && !(p.club || '').toLowerCase().includes(filterClub.toLowerCase())) return false;

            // Nationality
            if (filterNationality && !(p.nationality || '').toLowerCase().includes(filterNationality.toLowerCase())) return false;

            // Playstyle
            if (filterPlaystyle !== 'All' && p.playstyle !== filterPlaystyle) return false;

            // Skills
            if (filterSkill !== 'All') {
                const target = filterSkill.toLowerCase().replace(/\s/g, '');
                const skillsArr = Array.isArray(p.skills) ? p.skills : [p.skills];
                const addSkillsArr = Array.isArray(p.additionalSkills) ? p.additionalSkills : [p.additionalSkills];
                const hasSkill = [...skillsArr, ...addSkillsArr].some(s => s?.toString().toLowerCase().replace(/\s/g, '') === target);
                if (!hasSkill) return false;
            }

            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'DATE') {
                const dateA = a.createdAt || a.created_at || 0;
                const dateB = b.createdAt || b.created_at || 0;
                return dateB.toString().localeCompare(dateA.toString());
            }
            if (sortBy === 'GAMES') return (b.matches || 0) - (a.matches || 0);
            if (sortBy === 'GOALS') return (b.goals || 0) - (a.goals || 0);
            if (sortBy === 'ASSISTS') return (b.assists || 0) - (a.assists || 0);
            if (sortBy === 'GA') {
                const gaA = (a.goals || 0) + (a.assists || 0);
                const gaB = (b.goals || 0) + (b.assists || 0);
                return gaB - gaA;
            }
            return (a.name || '').localeCompare(b.name || '');
        });

    const handleLibraryScroll = (event) => {
        const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (page !== activePage) setActivePage(page);
    };

    useEffect(() => {
        fetchSquads();
    }, [user]);

    const fetchSquads = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getSquads(user.uid);
        // Normalize data: ensure 'subBench' exists and 'id' is consistent
        const normalized = data.map(s => {
            const squad = { ...s, id: s.id || s._id };
            // Map legacy 'subs' to 'subBench' if needed
            if (!squad.subBench && squad.subs) {
                squad.subBench = squad.subs;
            }
            // Ensure subBench is an array
            if (!Array.isArray(squad.subBench)) {
                squad.subBench = Array(12).fill(null).map(() => ({ playerId: null }));
            }
            // Ensure startingXI is an array
            if (!Array.isArray(squad.startingXI)) {
                squad.startingXI = Array(11).fill(null).map(() => ({ playerId: null }));
            }
            return squad;
        });
        setSquads(normalized);
        setLoading(false);
    };

    const handleCreateNew = () => {
        const newSquad = {
            name: `SQUAD ${squads.length + 1}`,
            formation: '4-3-3',
            startingXI: Array(11).fill(null).map(() => ({ playerId: null })),
            subBench: Array(12).fill(null).map(() => ({ playerId: null })),
            positions: SQUAD_FORMATIONS['4-3-3']
        };
        setCurrentSquad(newSquad);
        setView('editor');
    };

    const handleEditSquad = (squad) => {
        setCurrentSquad(squad);
        setView('editor');
    };

    const handleSave = async () => {
        if (!user || !currentSquad) return;
        try {
            await saveSquad(user.uid, currentSquad);
            await fetchSquads();
            setView('list');
            setCurrentSquad(null);
        } catch (err) {
            Alert.alert("Error", "Failed to save squad");
        }
    };

    const handleDelete = async (id) => {
        Alert.alert("Delete Squad", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteSquad(user.uid, id);
                    await fetchSquads();
                }
            }
        ]);
    };

    const handleSelectFormation = (f) => {
        const isCustom = f === 'CUSTOM';
        const newPositions = isCustom && currentSquad?.customPositions
            ? currentSquad.customPositions
            : SQUAD_FORMATIONS[f];

        setCurrentSquad({
            ...currentSquad,
            formation: f,
            positions: newPositions
        });
    };

    const cyclePositionRole = (index) => {
        const roleMap = {
            'CF': ['CF', 'SS'],
            'SS': ['CF', 'SS'],
            'LWF': ['LWF', 'SS'],
            'RWF': ['RWF', 'SS'],
            'AMF': ['AMF', 'CMF'],
            'CMF': ['CMF', 'AMF', 'DMF'],
            'DMF': ['DMF', 'CMF'],
            'CB': ['CB', 'LB', 'RB'],
            'LB': ['LB', 'CB'],
            'RB': ['RB', 'CB'],
            'GK': ['GK']
        };

        const startingXI = currentSquad?.startingXI || [];
        const currentSlot = startingXI[index];
        const formation = currentSquad?.formation || '4-3-3';
        const initialPos = SQUAD_FORMATIONS[formation][index];
        const currentLabel = currentSlot?.positionLabel || initialPos?.role;

        const possibleRoles = roleMap[initialPos?.role] || [initialPos?.role];
        const currentIndex = possibleRoles.indexOf(currentLabel);
        const nextIndex = (currentIndex + 1) % possibleRoles.length;
        const nextRole = possibleRoles[nextIndex];

        const newXI = [...startingXI];
        newXI[activeRoleSlot] = { ...newXI[activeRoleSlot], positionLabel: nextRole };
        setCurrentSquad({ ...currentSquad, startingXI: newXI });
        setShowRoleSelector(false);
        setActiveRoleSlot(null);
    };

    const handleSlotPress = (index, isSub = false) => {
        const startingXI = Array.isArray(currentSquad.startingXI) ? currentSquad.startingXI : [];
        const subBench = Array.isArray(currentSquad.subBench) ? currentSquad.subBench : [];

        if (isRoleMode && !isSub) {
            setActiveRoleSlot(index);
            setShowRoleSelector(true);
            return;
        }

        if (isDraftingMode) {
            handleDraftInteraction(isSub ? 'SUB' : 'XI', index);
            return;
        }

        // IF NOT DRAFTING -> Open Player Details if slot is filled
        const slot = isSub ? subBench[index] : startingXI[index];
        if (slot?.playerId) {
            const player = players.find(p => p._id === slot.playerId);
            if (player) {
                setSelectedPlayerForDetail(player);
                setShowPlayerDetail(true);
            }
            return;
        }

        // IF EMPTY -> Open Picker (Legacy or intentional add)
        setActiveSlot(index);
        setShowPlayerPicker(true);
    };

    const handleLibraryPlayerPress = (player) => {
        if (isDraftingMode) {
            if (activeDraftSelection?.type === 'LIB' && activeDraftSelection.player._id === player._id) {
                setActiveDraftSelection(null);
            } else {
                setActiveDraftSelection({ type: 'LIB', player });
            }
            return;
        }

        // IF NOT DRAFTING -> Open Scout Details
        if (player) {
            setSelectedPlayerForDetail(player);
            setShowPlayerDetail(true);
        }
    };

    const handleDraftInteraction = (type, index, playerObj = null) => {
        const startingXI = Array.isArray(currentSquad.startingXI) ? currentSquad.startingXI : Array(11).fill({ playerId: null });
        const subBench = Array.isArray(currentSquad.subBench) ? currentSquad.subBench : Array(12).fill({ playerId: null });

        if (!activeDraftSelection) {
            let player;
            if (type === 'XI') player = players.find(p => p._id === startingXI[index]?.playerId);
            if (type === 'SUB') player = players.find(p => p._id === subBench[index]?.playerId);
            if (type === 'LIB') player = playerObj;

            if (player) {
                setActiveDraftSelection({ type, index, player });
            }
            return;
        }

        const source = activeDraftSelection;
        const dest = { type, index };
        if (dest.type === 'LIB') { setActiveDraftSelection(null); return; }

        const newSquad = { ...currentSquad, startingXI: [...startingXI], subBench: [...subBench] };
        const movingPlayerId = source.player._id;

        if (dest.type === 'XI') {
            const existingInDest = newSquad.startingXI[dest.index]?.playerId;
            newSquad.startingXI[dest.index] = { playerId: movingPlayerId };
            if (source.type === 'SUB') newSquad.subBench[source.index] = existingInDest ? { playerId: existingInDest } : { playerId: null };
            else if (source.type === 'XI' && source.index !== dest.index) newSquad.startingXI[source.index] = existingInDest ? { playerId: existingInDest } : { playerId: null };
        } else if (dest.type === 'SUB') {
            const existingInDest = newSquad.subBench[dest.index]?.playerId;
            newSquad.subBench[dest.index] = { playerId: movingPlayerId };
            if (source.type === 'XI') newSquad.startingXI[source.index] = existingInDest ? { playerId: existingInDest } : { playerId: null };
            else if (source.type === 'SUB' && source.index !== dest.index) newSquad.subBench[source.index] = existingInDest ? { playerId: existingInDest } : { playerId: null };
        }

        setCurrentSquad(newSquad);
        setActiveDraftSelection(null);
    };

    const createDraftPanResponder = (type, index, player) => PanResponder.create({
        onStartShouldSetPanResponder: () => isDraftingMode,
        onMoveShouldSetPanResponder: (_, gesture) => isDraftingMode && (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10),
        onPanResponderGrant: () => {
            setActiveDraftSelection({ type, index, player });
            setIsCurrentlyDragging(true);
        },
        onPanResponderMove: (e) => {
            setDraggedPlayerOffset({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
        },
        onPanResponderRelease: (e, gesture) => {
            setIsCurrentlyDragging(false);
            detectDropTarget(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
    });

    const detectDropTarget = (x, y) => {
        // Determine target based on screen coordinates
        // Pitch is at typical top-middle position
        // We can iterate through slot positions and check distance
        const PITCH_TOP = 200; // Estimated from layout
        const pitchSlots = currentSquad?.positions || [];
        let closestIndex = -1;
        let minDistance = 50; // Threshold pixels

        pitchSlots.forEach((pos, idx) => {
            // Convert % positions to absolute pixel estimates
            const slotX = 20 + ((pos.x / 100) * (SCREEN_WIDTH - 40));
            const slotY = PITCH_TOP + ((pos.y / 100) * PITCH_HEIGHT);
            const dist = Math.sqrt(Math.pow(x - slotX, 2) + Math.pow(y - slotY, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = idx;
            }
        });

        if (closestIndex !== -1) {
            handleDraftInteraction('XI', closestIndex);
        } else {
            // Did we drop on SUB bench areas? Or just cancel
            setActiveDraftSelection(null);
        }
    };

    const assignPlayerToSlot = (player) => {
        const newXI = [...currentSquad.startingXI];
        newXI[activeSlot] = { playerId: player._id };
        setCurrentSquad({ ...currentSquad, startingXI: newXI });
        setShowPlayerPicker(false);
        setActiveSlot(null);
    };

    const handleMoveSlot = (index, newX, newY) => {
        if (currentSquad.formation !== 'CUSTOM') return;

        const newPositions = [...currentSquad.positions];
        // Constrain to pitch bounds (0-100%)
        const clampedX = Math.min(Math.max(newX, 5), 95);
        const clampedY = Math.min(Math.max(newY, 5), 95);

        newPositions[index] = { ...newPositions[index], x: clampedX, y: clampedY };

        setCurrentSquad(prev => ({
            ...prev,
            positions: newPositions,
            customPositions: newPositions // Cache as custom
        }));
    };

    const renderPlayer = (index, pos) => {
        const startingXI = currentSquad?.startingXI || [];
        const slot = startingXI[index];
        const player = Array.isArray(players) ? players.find(p => p._id === slot?.playerId) : null;
        const isCustom = currentSquad?.formation === 'CUSTOM';
        const canDrag = isCustom && isDragMode;
        const isSelectedForDraft = activeDraftSelection?.player?._id === player?._id && activeDraftSelection?.index === index && activeDraftSelection?.type === 'XI';

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gs) => canDrag && (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10),
            onPanResponderMove: (evt, gestureState) => {
                if (!canDrag) return;
                const deltaXPercent = (gestureState.dx / (SCREEN_WIDTH - 80)) * 100;
                const deltaYPercentVal = (gestureState.dy / PITCH_HEIGHT) * 100;
                handleMoveSlot(index, pos.x + deltaXPercent, pos.y + deltaYPercentVal);
            },
            onPanResponderTerminationRequest: () => false,
        });

        const draftResponder = createDraftPanResponder('XI', index, player);
        const handlers = isDraftingMode ? draftResponder.panHandlers : (canDrag ? panResponder.panHandlers : {});

        return (
            <View
                key={index}
                style={[
                    styles.playerSlot,
                    { left: `${pos.x}%`, top: `${pos.y}%` },
                    (canDrag || isDraftingMode || isSelectedForDraft) && { zIndex: 100 }
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSlotPress(index)}
                    {...handlers}
                >
                    <View style={[
                        styles.cardFrame,
                        player && styles.cardFrameActive,
                        isSelectedForDraft && { borderColor: '#fff', borderWidth: 3, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 20, elevation: 15 }
                    ]}>
                        {player ? (
                            <>
                                <Image source={{ uri: player.image }} style={styles.playerImg} />
                                <View style={[styles.posBadge, { backgroundColor: '#000', paddingHorizontal: 3, borderRadius: 3, zIndex: 5 }]}>
                                    <Text style={styles.posText}>{slot?.positionLabel || pos.role}</Text>
                                </View>
                                <View style={[styles.ratingBadge, { backgroundColor: '#000', paddingHorizontal: 3, borderRadius: 3, zIndex: 5 }]}>
                                    <Text style={styles.ratingText}>{player.rating}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptySlot}>
                                <Text style={styles.plusIcon}>+</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderMiniPitch = (squad) => {
        const positions = squad?.positions || [];
        const startingXI = squad?.startingXI || [];

        return (
            <LinearGradient colors={['#1a3a11', '#0a1a05']} style={styles.miniPitchOverlay}>
                {positions.map((pos, idx) => {
                    const slot = startingXI[idx];
                    const player = Array.isArray(players) ? players.find(p => p._id === slot?.playerId) : null;
                    return (
                        <View
                            key={idx}
                            style={[
                                styles.miniPlayer,
                                { left: `${pos.x}%`, top: `${pos.y}%` }
                            ]}
                        >
                            {player ? (
                                <Image source={{ uri: player.image }} style={styles.miniImg} />
                            ) : (
                                <View style={styles.miniEmpty} />
                            )}
                        </View>
                    );
                })}
            </LinearGradient>
        );
    };

    if (view === 'list') {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.headerTitle}>TACTICAL HUB</Text>
                            <Text style={styles.headerSub}>PREVIEW & MANAGE YOUR SQUADS</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.hubCloseBtn}
                            onPress={() => navigation.navigate('Squad')}
                        >
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={COLORS.accent} />
                    </View>
                ) : (
                    <FlatList
                        data={[{ isAdd: true }, ...squads]}
                        numColumns={2}
                        keyExtractor={(s, index) => s.id || `squad-${index}`}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.rowWrapper}
                        renderItem={({ item: s, index }) => {
                            if (s.isAdd) {
                                return (
                                    <TouchableOpacity style={styles.addSquadCardGrid} onPress={handleCreateNew}>
                                        <Text style={styles.addIconSmall}>+</Text>
                                        <Text style={styles.addTextSmall}>NEW SQUAD</Text>
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <View key={s.id || `squad-${index}`} style={styles.squadCardGrid}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleEditSquad(s)}>
                                        <View style={styles.miniPitchGridWrapper}>
                                            {renderMiniPitch(s)}
                                        </View>
                                        <View style={styles.squadInfoGrid}>
                                            <Text style={styles.squadNameSmall} numberOfLines={1}>{(s.name || 'UNNAMED SQUAD').toUpperCase()}</Text>
                                            <View style={styles.squadBadgeRowSmall}>
                                                <Text style={styles.squadFormationSmall}>{s.formation || 'N/A'}</Text>
                                                <View style={styles.countBadgeSmall}>
                                                    <Text style={styles.countTextSmall}>{(s.startingXI || []).filter(x => x?.playerId).length}/11</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteBtnGrid}
                                        onPress={() => {
                                            const squadId = s.id || s._id;
                                            if (squadId) {
                                                console.log("Deleting squad ID:", squadId);
                                                handleDelete(squadId);
                                            } else {
                                                console.warn("Cannot delete squad: Missing ID", s);
                                            }
                                        }}
                                    >
                                        <Text style={styles.deleteIconSmall}>🗑</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.headerMainTitle}>{currentSquad?.name?.toUpperCase() || 'SQUAD BUILDER'}</Text>
                        <Text style={styles.headerTacticSub}>{currentSquad?.formation || 'NOT SET'}</Text>
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveText}>SAVE</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formationSelectorRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                        <Dropdown
                            options={Object.keys(SQUAD_FORMATIONS)}
                            value={currentSquad.formation}
                            onSelect={(f) => handleSelectFormation(f)}
                            containerStyle={{ marginBottom: 0 }}
                        >
                            <View style={styles.formationLogoContainer}>
                                <MaterialCommunityIcons
                                    name="strategy"
                                    size={24}
                                    color={COLORS.accent}
                                />
                            </View>
                        </Dropdown>

                        <TouchableOpacity
                            onPress={() => {
                                setIsDraftingMode(!isDraftingMode);
                                setIsRoleMode(false);
                                setShowStatsUpdate(false);
                                setActiveDraftSelection(null);
                            }}
                            style={[styles.draftToggleBtn, isDraftingMode && styles.draftToggleActive]}
                        >
                            <MaterialCommunityIcons
                                name={isDraftingMode ? "check" : "pencil"}
                                size={22}
                                color={isDraftingMode ? "#000" : COLORS.accent}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setIsRoleMode(!isRoleMode);
                                setIsDraftingMode(false);
                                setIsDragMode(false);
                                setShowStatsUpdate(false);
                            }}
                            style={[styles.roleBtn, isRoleMode && styles.roleBtnActive]}
                        >
                            <MaterialCommunityIcons
                                name="run"
                                size={24}
                                color={isRoleMode ? "#000" : COLORS.accent}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statsBtn, showStatsUpdate && styles.statsBtnActive]}
                            onPress={() => {
                                setShowStatsUpdate(!showStatsUpdate);
                                setIsRoleMode(false);
                                setIsDraftingMode(false);
                                setIsDragMode(false);
                            }}
                        >
                            <MaterialCommunityIcons
                                name="chart-bar"
                                size={22}
                                color={showStatsUpdate ? '#000' : COLORS.accent}
                            />
                        </TouchableOpacity>

                        {isDraftingMode && (
                            <View style={styles.draftHint}>
                                <Text style={styles.draftHintText}>
                                    {activeDraftSelection ? `MOVE ${activeDraftSelection.player.name.split(' ').pop()} TO...` : 'PICK A PLAYER TO START DRAFTING'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentScroll}>

                <View style={styles.pitchContainer}>
                    <LinearGradient
                        colors={isDragMode ? ['#050a1a', '#02050a'] : ['#0c1a0c', '#050a05']}
                        style={styles.pitchBg}
                    >
                        <View style={[styles.pitchLines, isDragMode && { opacity: 0.4 }]}>
                            <View style={styles.pitchOuterLine} />
                            <View style={styles.pitchCenterCircle} />
                            <View style={styles.pitchPenaltyAreaTop} />
                            <View style={[styles.pitchPenaltyAreaTop, { top: undefined, bottom: 0, transform: [{ rotate: '180deg' }] }]} />
                        </View>
                        {currentSquad.positions.map((pos, idx) => renderPlayer(idx, pos))}

                        {currentSquad.formation === 'CUSTOM' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.moveToggleBtn, isDragMode && styles.moveToggleActive]}
                                    onPress={() => setIsDragMode(!isDragMode)}
                                >
                                    <Text style={[styles.moveIconText, isDragMode && { color: '#000' }]}>{isDragMode ? '✓' : '✥'}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </LinearGradient>
                </View>

                {/* SUB BENCH */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SUB BENCH</Text>
                    <Text style={styles.sectionBadge}>12 SLOTS</Text>
                </View>
                <View style={styles.benchGridContainer}>
                    <View style={styles.benchGrid}>
                        {(currentSquad.subBench || Array(12).fill({ playerId: null })).slice(0, 12).map((s, i) => {
                            const player = players.find(p => p._id === s?.playerId);
                            const isSelected = activeDraftSelection?.player?._id === player?._id && activeDraftSelection?.index === i && activeDraftSelection?.type === 'SUB';
                            const draftResponder = createDraftPanResponder('SUB', i, player);
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.benchGridItem, { width: (SCREEN_WIDTH - 60) / 6, marginRight: 4 }]}
                                    onPress={() => handleSlotPress(i, true)}
                                    {...(player ? draftResponder.panHandlers : {})}
                                >
                                    <View style={[
                                        styles.cardFrame,
                                        player && styles.cardFrameActive,
                                        { width: '100%', borderRadius: 6 },
                                        isSelected && { borderColor: '#fff', borderWidth: 2, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 10, elevation: 10 }
                                    ]}>
                                        {player ? (
                                            <>
                                                <Image source={{ uri: player.image }} style={styles.playerImg} />
                                                <View style={[styles.posBadge, { paddingHorizontal: 2 }]}>
                                                    <Text style={[styles.posText, { fontSize: 5 }]}>{player.position}</Text>
                                                </View>
                                                <View style={[styles.ratingBadge, { paddingHorizontal: 2 }]}>
                                                    <Text style={[styles.ratingText, { fontSize: 6 }]}>{player.rating}</Text>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={[styles.plusIcon, { fontSize: 14 }]}>+</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* LIBRARY TOGGLE BUTTON */}
                <TouchableOpacity
                    style={styles.libToggleButton}
                    onPress={() => setShowLibrary(!showLibrary)}
                >
                    <Text style={styles.toggleLabel}>PLAYER LIBRARY ({players.length})</Text>
                    <Text style={styles.toggleIcon}>{showLibrary ? '▼ COLLAPSE' : '▲ EXPAND'}</Text>
                </TouchableOpacity>

                {showLibrary && (
                    <View>
                        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                            <Text style={styles.sectionTitle}>COLLECTION ({filteredPlayers.length})</Text>
                        </View>

                        {/* SEARCH & FILTER TOOLBAR */}
                        <View style={styles.toolbarContainer}>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.scoutInput}
                                    placeholder="SEARCH PORTRAITS..."
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.scoutActionBtn, (filterPos !== 'All' || filterCardType !== 'All' || filterClub || filterNationality || filterPlaystyle !== 'All' || filterSkill !== 'All') && styles.scoutActionBtnActive]}
                                onPress={() => setShowFilters(true)}
                            >
                                <Text style={[styles.scoutActionText, (filterPos !== 'All' || filterCardType !== 'All' || filterClub || filterNationality || filterPlaystyle !== 'All' || filterSkill !== 'All') && styles.scoutActionTextActive]}>FILTER / SORT</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Filter Modal */}
                        <Modal visible={showFilters} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFilters(false)} />
                                <View style={styles.modalContentFull}>
                                    <View style={styles.modalHeaderRow}>
                                        <View>
                                            <Text style={styles.modalTitleFull}>FILTER & SORT</Text>
                                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', marginTop: 2 }}>CLICK TO CLOSE</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setFilterPos('All');
                                            setFilterCardType('All');
                                            setFilterClub('');
                                            setFilterNationality('');
                                            setFilterPlaystyle('All');
                                            setFilterSkill('All');
                                            setSortBy('rating');
                                        }}>
                                            <Text style={styles.clearAllText}>RESET ALL</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                                        <View style={styles.modalTwoCol}>
                                            <View style={styles.modalCol}>
                                                <Text style={styles.modalSectionLabelSmall}>SORT BY</Text>
                                                <Dropdown
                                                    options={['RATING', 'NAME', 'DATE', 'GAMES', 'GOALS', 'ASSISTS', 'GA']}
                                                    value={sortBy}
                                                    onSelect={setSortBy}
                                                />
                                            </View>
                                            <View style={styles.modalCol}>
                                                <Text style={styles.modalSectionLabelSmall}>POSITION</Text>
                                                <Dropdown
                                                    options={['All', ...POSITIONS]}
                                                    value={filterPos}
                                                    onSelect={setFilterPos}
                                                />
                                            </View>
                                        </View>

                                        <Text style={styles.modalSectionLabelSmall}>CARD TYPE</Text>
                                        <Dropdown
                                            options={['All', ...CARD_TYPES]}
                                            value={filterCardType}
                                            onSelect={setFilterCardType}
                                        />

                                        <View style={styles.modalTwoCol}>
                                            <View style={styles.modalCol}>
                                                <Text style={styles.modalSectionLabelSmall}>CLUB</Text>
                                                <TextInput
                                                    style={styles.filterInput}
                                                    placeholder="Club name..."
                                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                                    value={filterClub}
                                                    onChangeText={setFilterClub}
                                                />
                                            </View>
                                            <View style={styles.modalCol}>
                                                <Text style={styles.modalSectionLabelSmall}>NATIONALITY</Text>
                                                <TextInput
                                                    style={styles.filterInput}
                                                    placeholder="Country..."
                                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                                    value={filterNationality}
                                                    onChangeText={setFilterNationality}
                                                />
                                            </View>
                                        </View>

                                        <Text style={styles.modalSectionLabelSmall}>PLAYSTYLE</Text>
                                        <Dropdown
                                            options={['All', ...PLAYSTYLES]}
                                            value={filterPlaystyle}
                                            onSelect={setFilterPlaystyle}
                                        />

                                        <Text style={styles.modalSectionLabelSmall}>SPECIFIC SKILL</Text>
                                        <Dropdown
                                            options={['All', ...ALL_SKILLS]}
                                            value={filterSkill}
                                            onSelect={setFilterSkill}
                                            searchable
                                        />

                                        <TouchableOpacity style={styles.applyBtnFull} onPress={() => setShowFilters(false)}>
                                            <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleLibraryScroll}
                            style={styles.libraryHorizontal}
                            scrollEventThrottle={16}
                        >
                            {Array.from({ length: Math.ceil(filteredPlayers.length / 30) }).map((_, pageIdx) => {
                                // Virtualization logic: only render current, before, and after pages
                                const isVisible = Math.abs(pageIdx - activePage) <= 1;
                                return (
                                    <View key={pageIdx} style={styles.libraryPage}>
                                        {isVisible ? (
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'flex-start', width: SCREEN_WIDTH }}>
                                                {filteredPlayers.slice(pageIdx * 30, (pageIdx + 1) * 30).map((p, i) => {
                                                    const isSelected = activeDraftSelection?.player?._id === p._id && activeDraftSelection?.type === 'LIB';
                                                    const draftResponder = createDraftPanResponder('LIB', i + (pageIdx * 30), p);
                                                    return (
                                                        <TouchableOpacity
                                                            key={p._id || i}
                                                            style={[styles.libCard, { width: (SCREEN_WIDTH - 60) / 5, marginBottom: 15, marginRight: 5 }]}
                                                            onPress={() => handleLibraryPlayerPress(p)}
                                                            {...draftResponder.panHandlers}
                                                        >
                                                            <View style={[
                                                                styles.libCardInner,
                                                                styles.cardFrameActive,
                                                                { width: '100%', aspectRatio: 1 },
                                                                isSelected && { borderColor: '#fff', borderWidth: 2, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 10, elevation: 10 }
                                                            ]}>
                                                                <Image source={{ uri: p.image }} style={styles.libImg} />
                                                                <View style={[styles.posBadge, { paddingHorizontal: 2, top: 1, left: 1 }]}>
                                                                    <Text style={[styles.posText, { fontSize: 5 }]}>{p.position}</Text>
                                                                </View>
                                                                <View style={[styles.ratingBadge, { paddingHorizontal: 2, bottom: 1, right: 1 }]}>
                                                                    <Text style={[styles.ratingText, { fontSize: 6 }]}>{p.rating}</Text>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        ) : (
                                            <View style={{ justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH, height: 600 }}>
                                                <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>LOADING COLLECTION...</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {isCurrentlyDragging && activeDraftSelection && (
                <View
                    pointerEvents="none"
                    style={[
                        styles.floatingCard,
                        { left: draggedPlayerOffset.x - 30, top: draggedPlayerOffset.y - 30 }
                    ]}
                >
                    <Image source={{ uri: activeDraftSelection.player.image }} style={styles.floatingImg} />
                    <View style={styles.floatingGlow} />
                </View>
            )}

            {selectedPlayerForDetail && (
                <PlayerDetailsModal
                    visible={showPlayerDetail}
                    player={selectedPlayerForDetail}
                    players={players}
                    onClose={() => {
                        setShowPlayerDetail(false);
                        setSelectedPlayerForDetail(null);
                    }}
                    onUpdate={async (id, updates) => {
                        await updatePlayer(user.uid, id, updates);
                        setPlayers(prev => prev.map(p => p._id === id ? { ...p, ...updates } : p));
                    }}
                    onEditDetailed={(player) => {
                        setShowPlayerDetail(false);
                        setSelectedPlayerForDetail(null);
                        // In FormationsScreen, we don't have direct AddPlayerScreen modal, but we can potentially navigate
                        // For now, let's just make it do nothing or show a message
                        Alert.alert('Edit Stats', 'Please edit detailed stats from the Library screen.');
                    }}
                />
            )}

            {/* TACTICAL ROLE SELECTOR */}
            <Modal visible={showRoleSelector} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => { setShowRoleSelector(false); setActiveRoleSlot(null); }}
                >
                    <View style={styles.rolePickerCard}>
                        <Text style={styles.rolePickerTitle}>SELECT TACTICAL ROLE</Text>
                        <View style={styles.roleGrid}>
                            {POSITIONS.map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.roleItem, (currentSquad.startingXI[activeRoleSlot]?.positionLabel === p) && styles.roleItemActive]}
                                    onPress={() => {
                                        const newXI = [...currentSquad.startingXI];
                                        newXI[activeRoleSlot] = { ...newXI[activeRoleSlot], positionLabel: p };
                                        setCurrentSquad({ ...currentSquad, startingXI: newXI });
                                        setShowRoleSelector(false);
                                        setActiveRoleSlot(null);
                                    }}
                                >
                                    <Text style={[styles.roleItemText, (currentSquad.startingXI[activeRoleSlot]?.positionLabel === p) && styles.roleItemTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.roleCancelBtn} onPress={() => { setShowRoleSelector(false); setActiveRoleSlot(null); }}>
                            <Text style={styles.roleCancelText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {showPlayerPicker && (
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>SELECT PLAYER</Text>
                            <TouchableOpacity onPress={() => setShowPlayerPicker(false)}>
                                <Text style={styles.pickerClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={players.sort((a, b) => b.rating - a.rating)}
                            keyExtractor={(item, index) => item._id || `player-${index}`}
                            numColumns={3}
                            contentContainerStyle={{ padding: 10 }}
                            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 10, marginBottom: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.pickerItemBox} onPress={() => assignPlayerToSlot(item)}>
                                    <Image source={{ uri: item.image }} style={styles.pickerImgBox} />
                                    <View style={styles.pickerOverlayBox}>
                                        <Text style={styles.pickerRatingBox}>{item.rating}</Text>
                                        <Text style={styles.pickerNameBox} numberOfLines={1}>{item.name.split(' ').pop()}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            )}

            {showStatsUpdate && (
                <View style={styles.statsOverlay}>
                    <View style={styles.statsHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <Text style={styles.statsTitle}>PLAYER STATS UPDATE</Text>
                            <TouchableOpacity
                                style={[styles.statsEditModeBtn, isStatsEditMode && styles.statsEditModeBtnActive]}
                                onPress={() => setIsStatsEditMode(!isStatsEditMode)}
                            >
                                <MaterialCommunityIcons
                                    name={isStatsEditMode ? "lock-open" : "lock"}
                                    size={14}
                                    color={isStatsEditMode ? "#000" : COLORS.accent}
                                />
                                <Text style={[styles.statsEditModeText, isStatsEditMode && styles.statsEditModeTextActive]}>
                                    {isStatsEditMode ? "UNLOCKED" : "LOCKED"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => { setShowStatsUpdate(false); setIsStatsEditMode(false); }}>
                            <Text style={styles.statsClose}>✓ DONE</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.statsList}
                        showsVerticalScrollIndicator={false}
                    >
                        {[...(currentSquad?.startingXI || []), ...(currentSquad?.subBench || [])].map((slot, idx) => {
                            if (!slot?.playerId) return null;
                            const player = Array.isArray(players) ? players.find(p => p._id === slot.playerId) : null;
                            if (!player) return null;

                            const isXI = idx < 11;

                            return (
                                <View key={`${idx}-${slot.playerId}`} style={styles.statsRow}>
                                    <View style={styles.statsPlayerInfo}>
                                        <Image source={{ uri: player.image }} style={styles.statsPlayerImg} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.statsPlayerName} numberOfLines={1}>{player.name.toUpperCase()}</Text>
                                            <Text style={styles.statsPlayerPos}>{isXI ? 'STARTING XI' : 'SUB BENCH'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.statsInputsContainer}>
                                        <View style={styles.statsInputBox}>
                                            <Text style={styles.statsInputLabel}>GAMES</Text>
                                            <TextInput
                                                style={[styles.statsInput, !isStatsEditMode && styles.statsInputDisabled]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                editable={isStatsEditMode}
                                                placeholderTextColor="rgba(255,255,255,0.1)"
                                                value={String(player.matches || '0')}
                                                onChangeText={async (val) => {
                                                    const cleanVal = val.replace(/[^0-9]/g, '');
                                                    // Update Local State
                                                    const newPlayers = players.map(p =>
                                                        p._id === player._id ? { ...p, matches: cleanVal } : p
                                                    );
                                                    setPlayers(newPlayers);
                                                    // Update Firebase in background
                                                    updatePlayer(user.uid, player._id, { matches: cleanVal }).catch(() => { });
                                                }}
                                            />
                                        </View>
                                        <View style={styles.statsInputBox}>
                                            <Text style={styles.statsInputLabel}>GOALS</Text>
                                            <TextInput
                                                style={[styles.statsInput, !isStatsEditMode && styles.statsInputDisabled]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                editable={isStatsEditMode}
                                                placeholderTextColor="rgba(255,255,255,0.1)"
                                                value={String(player.goals || '0')}
                                                onChangeText={async (val) => {
                                                    const cleanVal = val.replace(/[^0-9]/g, '');
                                                    const newPlayers = players.map(p =>
                                                        p._id === player._id ? { ...p, goals: cleanVal } : p
                                                    );
                                                    setPlayers(newPlayers);
                                                    updatePlayer(user.uid, player._id, { goals: cleanVal }).catch(() => { });
                                                }}
                                            />
                                        </View>
                                        <View style={styles.statsInputBox}>
                                            <Text style={styles.statsInputLabel}>ASSISTS</Text>
                                            <TextInput
                                                style={[styles.statsInput, !isStatsEditMode && styles.statsInputDisabled]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                editable={isStatsEditMode}
                                                placeholderTextColor="rgba(255,255,255,0.1)"
                                                value={String(player.assists || '0')}
                                                onChangeText={async (val) => {
                                                    const cleanVal = val.replace(/[^0-9]/g, '');
                                                    const newPlayers = players.map(p =>
                                                        p._id === player._id ? { ...p, assists: cleanVal } : p
                                                    );
                                                    setPlayers(newPlayers);
                                                    updatePlayer(user.uid, player._id, { assists: cleanVal }).catch(() => { });
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0c' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 15, paddingTop: 10 },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    hubCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
    headerTacticSub: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    backIcon: { color: COLORS.accent, fontSize: 24 },
    saveBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.accent },
    saveText: { color: '#000', fontWeight: '900', fontSize: 12 },

    formationSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15 },
    formationLogoContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,255,136,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent + '33' },

    draftToggleBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    draftToggleActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

    roleBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    roleBtnActive: { backgroundColor: '#00ccff', borderColor: '#00ccff' },
    draftHint: { backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.accent },
    draftHintText: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

    formationLogo: { width: 24, height: 24, tintColor: COLORS.accent },
    formationLabel: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    formationHint: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

    dragStatusIndicator: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    dragStatusActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(0,255,136,0.1)' },
    dragStatusText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    moveToggleBtn: { position: 'absolute', bottom: 20, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1.5, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
    moveToggleActive: { backgroundColor: COLORS.accent, borderColor: '#fff' },
    moveIconText: { fontSize: 24, color: COLORS.accent },

    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    headerSub: { fontSize: 9, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.5, marginTop: 2 },
    saveBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
    saveText: { color: '#000', fontWeight: '900', fontSize: 11 },

    content: { flex: 1 },
    gridContainer: { padding: 12, paddingBottom: 60 },
    rowWrapper: { justifyContent: 'space-between', marginBottom: 12 },
    addSquadCardGrid: { width: '48.5%', aspectRatio: 1, borderRadius: 28, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 255, 136, 0.03)' },
    addIconSmall: { color: COLORS.accent, fontSize: 32, fontWeight: '100' },
    addTextSmall: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 8 },

    squadCardGrid: { width: '48.5%', aspectRatio: 1, backgroundColor: '#111116', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    miniPitchGridWrapper: { width: '100%', height: '65%', padding: 8 },
    miniPitchOverlay: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    miniPlayer: { position: 'absolute', width: 14, height: 14, marginLeft: -7, marginTop: -7, alignItems: 'center', justifyContent: 'center' },
    miniImg: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    miniEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
    squadInfoGrid: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.02)', flex: 1, justifyContent: 'center' },
    squadNameSmall: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    squadBadgeRowSmall: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
    squadFormationSmall: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    countBadgeSmall: { backgroundColor: 'rgba(0, 255, 136, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)' },
    countTextSmall: { color: COLORS.accent, fontSize: 8, fontWeight: '900' },
    deleteBtnGrid: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    deleteIconSmall: { color: '#FF4444', fontSize: 14 },

    // Editor Styles
    formationRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
    formationBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    formationBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    formationBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900' },
    formationBtnTextActive: { color: '#000' },

    pitchContainer: { width: SCREEN_WIDTH, height: PITCH_HEIGHT, padding: 10 },
    pitchBg: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)' },
    pitchLines: { ...StyleSheet.absoluteFillObject },
    pitchOuterLine: { ...StyleSheet.absoluteFillObject, margin: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
    pitchCenterCircle: { position: 'absolute', top: '50%', left: '50%', width: 100, height: 100, marginLeft: -50, marginTop: -50, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 50 },
    pitchPenaltyAreaTop: { position: 'absolute', top: 15, left: '20%', right: '20%', height: '18%', borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },

    playerSlot: { position: 'absolute', width: 66, height: 86, marginLeft: -33, marginTop: -43, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    cardFrame: { width: 55, aspectRatio: 1, backgroundColor: '#000', borderRadius: 12, borderWidth: 1, borderColor: '#333', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    cardFrameActive: { borderColor: COLORS.accent, borderWidth: 2, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
    playerImg: { width: '100%', height: '180%', resizeMode: 'cover', position: 'absolute', top: 0 },
    plusIcon: { color: '#333', fontSize: 24, fontWeight: '100' },
    posBadge: { position: 'absolute', top: 1, left: 1, backgroundColor: '#000', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3, borderBottomRightRadius: 0 },
    posText: { color: COLORS.accent, fontSize: 6, fontWeight: '900' },
    ratingBadge: { position: 'absolute', bottom: 1, right: 1, backgroundColor: '#000', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3, borderTopLeftRadius: 0 },
    ratingText: { color: '#fff', fontSize: 7, fontWeight: '900' },
    playerName: { color: '#fff', fontSize: 8, fontWeight: '900', marginTop: 15, textAlign: 'center', width: 80, textShadowColor: '#000', textShadowRadius: 3 },
    contentScroll: { paddingBottom: 80 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
    sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    sectionBadge: { color: COLORS.accent, fontSize: 8, fontWeight: '900', opacity: 0.6 },

    benchGridContainer: { paddingHorizontal: 10, marginBottom: 20 },
    benchGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    benchGridItem: { width: (SCREEN_WIDTH - 40) / 6, marginBottom: 15, marginRight: 5, alignItems: 'center' },

    libToggleButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
        marginVertical: 20,
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center'
    },
    toggleLabel: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    toggleIcon: { color: COLORS.accent, fontSize: 10, fontWeight: '700', marginTop: 4 },

    toolbarContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, gap: 10, alignItems: 'center', zIndex: 100 },
    searchContainer: { flex: 1 },
    scoutInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    scoutActionBtn: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minWidth: 60, alignItems: 'center' },
    scoutActionBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    scoutActionText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900' },
    scoutActionTextActive: { color: '#000' },

    dropdownMenu: { position: 'absolute', top: 125, left: 20, backgroundColor: '#1a1a1f', borderRadius: 15, padding: 10, width: 140, zIndex: 1000, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    dropdownItemText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

    libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 10, justifyContent: 'center', paddingBottom: 50 },
    libCard: { width: (SCREEN_WIDTH - 80) / 5, marginBottom: 15 },
    libCardInner: { width: '100%', aspectRatio: 1, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
    libImg: { width: '100%', height: '160%', resizeMode: 'cover', position: 'absolute', top: 0 },
    libRating: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#000', paddingHorizontal: 2, borderRadius: 2 },
    libRatingText: { color: COLORS.accent, fontSize: 6, fontWeight: '900' },
    libPos: { position: 'absolute', top: 2, left: 2, backgroundColor: '#000', paddingHorizontal: 2, borderRadius: 2 },
    libPosText: { color: '#fff', fontSize: 5, fontWeight: '900' },

    hudSection: { padding: 30, alignItems: 'center' },
    hudGrid: { flexDirection: 'row', gap: 40 },
    hudItem: { alignItems: 'center' },
    hudVal: { color: COLORS.accent, fontSize: 24, fontWeight: '900' },
    hudLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContentFull: { width: SCREEN_WIDTH * 0.9, backgroundColor: '#1a1d24', borderRadius: 20, padding: 20, height: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitleFull: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    clearAllText: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    modalBodyScroll: { flex: 1 },
    modalTwoCol: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    modalCol: { flex: 1 },
    modalSectionLabelSmall: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    filterInput: { height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
    applyBtnFull: { marginTop: 20, backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    applyBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    floatingCard: { position: 'absolute', width: 60, height: 60, zIndex: 10000, borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', backgroundColor: COLORS.accent },
    floatingImg: { width: '100%', height: '100%' },
    floatingGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 30, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 10, elevation: 20 },

    pickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, padding: 20, paddingTop: 60 },
    pickerContainer: { height: '80%', backgroundColor: '#0a0a0c', borderTopLeftRadius: 30, borderTopRightRadius: 30 },

    rolePickerCard: { backgroundColor: '#121214', width: '90%', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: '#00ccff33', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
    rolePickerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    roleItem: { width: '30%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    roleItemActive: { backgroundColor: 'rgba(0, 204, 255, 0.1)', borderColor: '#00ccff55' },
    roleItemText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '900' },
    roleItemTextActive: { color: '#00ccff' },
    roleCancelBtn: { marginTop: 25, paddingVertical: 18, borderRadius: 15, backgroundColor: 'rgba(255,50,50,0.05)', alignItems: 'center' },
    roleCancelText: { color: '#FF4444', fontSize: 11, fontWeight: '900', letterSpacing: 2 },

    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    pickerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    pickerClose: { color: '#fff', fontSize: 18 },
    statsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsBtnActive: { backgroundColor: '#ffcc00', borderColor: '#ffcc00' },

    statsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a0c', zIndex: 3000 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingTop: 50 },
    statsTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 3 },
    statsClose: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    statsList: { padding: 15 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 15, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    statsPlayerInfo: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statsPlayerImg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#000' },
    statsPlayerName: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    statsPlayerPos: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
    statsInputsContainer: { flex: 2, flexDirection: 'row', gap: 6 },
    statsInputBox: { flex: 1, alignItems: 'center' },
    statsInputLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 6, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    statsInput: { width: '100%', height: 32, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, color: COLORS.accent, fontSize: 11, fontWeight: '900', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statsInputDisabled: { opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.02)' },
    statsEditModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsEditModeBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    statsEditModeText: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    statsEditModeTextActive: { color: '#000' },
});

export default FormationsScreen;
