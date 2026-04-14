import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from "react-native-youtube-iframe";
import { PROGRESSION_GROUPS } from '../constants';
import { uploadBase64Image } from '../services/playerService';
import { useAppContext } from '../../App';
import SavedProgressionsModal from './SavedProgressionsModal';
import { COLORS, getCardGradient, ALL_SKILLS, SPECIAL_SKILLS, PLAYER_SKILLS, POSITIONS } from '../constants';
import PlayerCard from '../components/PlayerCard';
import { getSecondaryPositionsFromPlayer } from '../utils/playerUtils';
import ProgressionIcon from './ProgressionIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');




// 1. Context-Aware Skill Picker
const SkillPickerPopup = ({ visible, onClose, onSelect, type = 'core', currentSkills = [] }) => {
  const [search, setSearch] = useState('');

  const availableSkills = (type === 'additional' ? PLAYER_SKILLS : ALL_SKILLS)
    .filter(s => !currentSkills.includes(s)) // Prevent duplicates
    .filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerPopupCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>ADD {type.toUpperCase()} SKILL</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
              <Text style={styles.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter list..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView style={styles.skillListScroll}>
            {availableSkills.map((skill) => {
              const isSp = SPECIAL_SKILLS.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={styles.skillItem}
                  onPress={() => {
                    onSelect(skill);
                    onClose();
                  }}
                >
                  <View style={[styles.skillDot, isSp && styles.skillDotSpecial]} />
                  <Text style={[styles.skillItemText, isSp && styles.skillItemTextSpecial]}>{skill}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// 2. High-Fidelity Management Modal
const SkillSelectionModal = ({ visible, onClose, coreSkills, additionalSkills, onUpdate }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState('core');
  const [activeSlot, setActiveSlot] = useState(null);

  const handleSelect = (skill) => {
    onUpdate(skill, pickerType, activeSlot);
  };

  const allOwnedSkills = [...coreSkills, ...additionalSkills.filter(Boolean)];

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.skillEditCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>MANAGE PLAYER SKILLS</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
              <Text style={styles.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editContentScroll}>
            {/* Core Skills Section */}
            <View style={styles.editGroup}>
              <View style={styles.editGroupHeader}>
                <Text style={styles.editGroupTitle}>CORE SKILLS</Text>
                <TouchableOpacity
                  style={styles.addGroupBtn}
                  onPress={() => { setPickerType('core'); setActiveSlot(null); setShowPicker(true); }}
                >
                  <Text style={styles.addGroupText}>+ ADD</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.editPillsRow}>
                {coreSkills.map((s, idx) => (
                  <View key={idx} style={[styles.editPill, SPECIAL_SKILLS.includes(s) && styles.editPillSpecial]}>
                    <Text style={styles.editPillText}>{s}</Text>
                    <TouchableOpacity onPress={() => onUpdate(idx, 'remove_core')}>
                      <Text style={styles.editPillRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Additional Skills Section */}
            <View style={[styles.editGroup, { marginTop: 20 }]}>
              <View style={styles.editGroupHeader}>
                <Text style={styles.editGroupTitleBlue}>ADDITIONAL SKILLS (TRAINER)</Text>
              </View>
              <View style={styles.additionalEditSlots}>
                {additionalSkills.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.editSlot, s ? styles.editSlotActive : styles.editSlotEmpty]}
                    onPress={() => { setPickerType('additional'); setActiveSlot(idx); setShowPicker(true); }}
                  >
                    <View style={[styles.slotDot, s && styles.slotDotActive]} />
                    <Text style={[styles.editSlotText, !s && styles.editSlotTextEmpty]} numberOfLines={1}>
                      {s || `EMPTY SLOT ${idx + 1}`}
                    </Text>
                    {s && (
                      <TouchableOpacity onPress={() => onUpdate(idx, 'remove_additional')}>
                        <Text style={styles.editPillRemove}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <SkillPickerPopup
            visible={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={handleSelect}
            type={pickerType}
            currentSkills={allOwnedSkills}
          />
        </View>
      </View>
    </Modal>
  );
};

const StatBox = ({ label, value, color = '#fff' }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value, icon, subValue, color = '#fff' }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      {icon && <Text style={styles.infoIcon}>{icon}</Text>}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <View style={styles.infoValueContainer}>
      <Text style={[styles.infoValue, { color }]}>{value || '--'}</Text>
      {subValue && <Text style={styles.infoSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const CompactInfo = ({ icon, text, image, isFlag = false }) => (
  <View style={styles.compactInfoChip}>
    {image ? (
      <Image source={{ uri: image }} style={[styles.badgeImage, isFlag && styles.flagImage]} resizeMode="contain" />
    ) : (
      <Text style={styles.compactInfoIcon}>{icon}</Text>
    )}
    <Text style={styles.compactInfoText} numberOfLines={1}>{text || '--'}</Text>
  </View>
);

const EfficiencyItem = ({ icon, label, value, color }) => (
  <View style={styles.effItem}>
    <View style={[styles.effIconContainer, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
    </View>
    <View style={styles.effInfo}>
      <Text style={[styles.effValue, { color }]}>{value}</Text>
      <Text style={styles.effLabel}>{label}</Text>
    </View>
  </View>
);

const PerformanceItem = ({ icon, label, value, color = '#fff', isFull = false, badge }) => (
  <View style={[styles.perfItem, isFull && styles.perfItemFull]}>
    <View style={styles.perfHeader}>
      <MaterialCommunityIcons name={icon} size={11} color={color} style={{ opacity: 0.4 }} />
      <Text style={styles.perfLabel}>{label}</Text>
    </View>
    <View style={styles.perfValueContainer}>
      <Text style={[styles.perfValue, { color }]} numberOfLines={1}>{value || '--'}</Text>
      {badge && (
        <View style={[styles.perfBadge, { backgroundColor: badge.color }]}>
          <Text style={styles.perfBadgeText}>{badge.text}</Text>
        </View>
      )}
    </View>
  </View>
);

const getWFBadge = (val, type) => {
  if (!val) return null;
  const v = String(val).toLowerCase();
  
  if (type === 'usage') {
    if (v.includes('almost never') || v === '1') return { text: '1', color: '#FF4444' };
    if (v.includes('rarely') || v === '2') return { text: '2', color: '#FFD700' };
    if (v.includes('occasionally') || v === '3') return { text: '3', color: '#00E676' };
    if (v.includes('regularly') || v === '4') return { text: '4', color: '#2979FF' };
  } else if (type === 'accuracy') {
    if (v.includes('low') || v === '1') return { text: '1', color: '#FF4444' };
    if (v.includes('medium') || v === '2') return { text: '2', color: '#FFD700' };
    if (v.includes('very high') || v === '4') return { text: '4', color: '#2979FF' };
    if (v.includes('high') || v === '3') return { text: '3', color: '#00E676' };
  }
  return null;
};

const StylishAlert = ({ visible, title, message, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent={true} animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.alertCard}>
        <View style={styles.alertGlow} />
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMsg}>{message}</Text>
        <View style={styles.alertButtons}>
          <TouchableOpacity style={styles.btnAlertCancel} onPress={onCancel}>
            <Text style={styles.btnAlertCancelText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAlertPrimary} onPress={onConfirm}>
            <LinearGradient colors={ALERT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnAlertGrad}>
              <Text style={styles.btnAlertPrimaryText}>YES, OPEN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const compOptions = [
  { id: 'goals', label: 'GOALS', icon: '⚽' },
  { id: 'assists', label: 'ASSISTS', icon: '🎯' },
  { id: 'matches', label: 'MATCHES', icon: '🏟️' },
  { id: 'ga', label: 'G+A', icon: '🔥' },
  { id: 'gpg', label: 'GOALS/GM', icon: '⚡' },
  { id: 'apg', label: 'AST/GM', icon: '👟' },
  { id: 'gapg', label: 'G+A/GM', icon: '⭐' }
];

const compContextOptions = [
  { id: 'all', label: 'ENTIRE SQUAD', icon: '🌎' },
  { id: 'position', label: 'SAME POSITION', icon: '🎯' },
  { id: 'league', label: 'SAME LEAGUE', icon: '🏆' },
  { id: 'club', label: 'SAME CLUB', icon: '🛡️' },
  { id: 'country', label: 'SAME COUNTRY', icon: '🏳️' }
];

const ALERT_GRADIENT = [COLORS.accent, COLORS.blue];
const CURRENT_BAR_GRADIENT = [COLORS.accent, COLORS.blue];

const ComparisonView = ({ player, players, stat, setStat, context, setContext, showStatDrop, setShowStatDrop, showGroupDrop, setShowGroupDrop }) => {
  const [selectedBar, setSelectedBar] = useState(null);

  const comparisonData = useMemo(() => {
    if (!players || players.length === 0) return { label: 'Goals', data: [], max: 1 };

    let getValue = p => {
      const g = Number(p.goals || 0);
      const a = Number(p.assists || 0);
      const m = Number(p.matches || 1) || 1;
      switch (stat) {
        case 'goals': return g;
        case 'assists': return a;
        case 'matches': return Number(p.matches || 0);
        case 'ga': return g + a;
        case 'gpg': return g / m;
        case 'apg': return a / m;
        case 'gapg': return (g + a) / m;
        default: return g;
      }
    };

    const uniqueSquadMap = new Map();
    players.forEach(p => {
      const key = p._id || p.id || p.playerId || p.name;
      if (key) uniqueSquadMap.set(key, p);
    });

    const currentKey = player._id || player.id || player.playerId || player.name;
    uniqueSquadMap.set(currentKey, player);

    let filtered = Array.from(uniqueSquadMap.values());
    if (context === 'position') filtered = filtered.filter(p => p.position === player.position);
    if (context === 'league') filtered = filtered.filter(p => p.league === player.league);
    if (context === 'club') filtered = filtered.filter(p => p.club === player.club);
    if (context === 'country') filtered = filtered.filter(p => p.nationality === player.nationality);

    const sorted = [...filtered].sort((a, b) => getValue(b) - getValue(a));
    const playerIndex = sorted.findIndex(p =>
      (p._id && p._id === player._id) ||
      (p.id && p.id === player.id) ||
      (p.playerId && p.playerId === player.playerId)
    );

    let displayPlayers = [];
    if (playerIndex >= 0 && playerIndex < 5) {
      displayPlayers = sorted.slice(0, 5);
    } else if (playerIndex >= 5) {
      displayPlayers = [...sorted.slice(0, 4), sorted[playerIndex]];
    } else {
      displayPlayers = sorted.slice(0, 5);
    }

    displayPlayers = displayPlayers.map(p => ({
      ...p,
      shortName: p.name ? p.name.split(' ').pop() : 'PLAYER',
      image: p.image
    }));

    const maxValue = Math.max(...sorted.map(getValue), 0.1);

    return {
      max: maxValue,
      rank: playerIndex !== -1 ? playerIndex + 1 : '-',
      total: sorted.length,
      data: displayPlayers.map(p => {
        const isCurrent = (p._id && p._id === player._id) ||
          (p.id && p.id === player.id) ||
          (p.playerId && p.playerId === player.playerId);
        return {
          id: p._id || p.id || p.playerId || p.name || idx,
          fullName: p.name,
          name: p.shortName,
          image: p.image,
          value: getValue(p),
          rank: sorted.findIndex(s => (s._id || s.id || s.playerId) === (p._id || p.id || p.playerId)) + 1,
          isCurrent: isCurrent
        }
      })
    };
  }, [players, player, stat, context]);

  return (
    <View style={styles.compContainer}>
      <View style={styles.compHeader}>
        <View style={[styles.compDropdownWrapper, { zIndex: 2000 }]}>
          <TouchableOpacity style={styles.compFilterBtn} onPress={() => { setShowStatDrop(false); setShowGroupDrop(!showGroupDrop); }}>
            <Text style={styles.compFilterIcon}>{compContextOptions.find(o => o.id === context)?.icon}</Text>
            <Text style={styles.compFilterText}>{compContextOptions.find(o => o.id === context)?.label}</Text>
            <Text style={styles.compFilterArrow}>▼</Text>
          </TouchableOpacity>
          {showGroupDrop && (
            <View style={styles.compDropdownMenu}>
              {compContextOptions.map(opt => (
                <TouchableOpacity key={opt.id} style={styles.compDropDownItem} onPress={() => { setContext(opt.id); setShowGroupDrop(false); }}>
                  <Text style={styles.compDropDownIcon}>{opt.icon}</Text>
                  <Text style={styles.compDropDownText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.compDropdownWrapper, { zIndex: 1900 }]}>
          <TouchableOpacity style={styles.compFilterBtn} onPress={() => { setShowGroupDrop(false); setShowStatDrop(!showStatDrop); }}>
            <Text style={styles.compFilterIcon}>{compOptions.find(o => o.id === stat)?.icon}</Text>
            <Text style={styles.compFilterText}>{compOptions.find(o => o.id === stat)?.label}</Text>
            <Text style={styles.compFilterArrow}>▼</Text>
          </TouchableOpacity>
          {showStatDrop && (
            <View style={styles.compDropdownMenu}>
              {compOptions.map(opt => (
                <TouchableOpacity key={opt.id} style={styles.compDropDownItem} onPress={() => { setStat(opt.id); setShowStatDrop(false); }}>
                  <Text style={styles.compDropDownIcon}>{opt.icon}</Text>
                  <Text style={styles.compDropDownText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.compSummaryRow}>
        <View>
          <Text style={styles.compRankLabel}>RANKED</Text>
          <Text style={styles.compRankValue}>#{comparisonData.rank} <Text style={styles.compRankSmall}>of {comparisonData.total}</Text></Text>
        </View>
        <View style={styles.compMiniBadge}>
          <Text style={styles.compMiniIcon}>{compOptions.find(o => o.id === stat)?.icon}</Text>
          <Text style={styles.compMiniLabel}>{compOptions.find(o => o.id === stat)?.label}</Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {[1, 0.75, 0.5, 0.25, 0].map(tier => (
          <View key={tier} style={[styles.guideLine, { bottom: `${tier * 100}%` }]}>
            <Text style={styles.guideText}>{tier === 0 ? '0' : Math.round(comparisonData.max * tier)}</Text>
          </View>
        ))}

        <View style={styles.barsContainer}>
          {comparisonData.data.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.barCol}
              activeOpacity={0.8}
              onPress={() => setSelectedBar(selectedBar === idx ? null : idx)}
            >
              {selectedBar === idx && (
                <View style={styles.compTooltip}>
                  <View style={styles.tooltipInner}>
                    <View style={styles.tooltipHeader}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.tooltipAvatar} />
                      ) : (
                        <View style={styles.tooltipNoAvatar}><Text style={{ fontSize: 8 }}>👤</Text></View>
                      )}
                      <View>
                        <Text style={styles.tooltipName}>{item.fullName}</Text>
                        <Text style={styles.tooltipVal}>{stat.includes('/') ? item.value.toFixed(2) : item.value}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.tooltipArrow} />
                </View>
              )}
              <View style={styles.barTopInfo}>
                <Text style={[styles.barRank, item.isCurrent && { color: COLORS.accent }]}>#{item.rank}</Text>
                <Text style={[styles.barValue, item.isCurrent && { color: COLORS.accent }]}>{stat.includes('/') ? item.value.toFixed(2) : item.value}</Text>
              </View>
              <View style={styles.barWrapper}>
                <View style={[styles.barBody, { height: `${(item.value / comparisonData.max) * 100}%` }, item.isCurrent && styles.barBodyCurrent]}>
                  {item.isCurrent && <LinearGradient colors={CURRENT_BAR_GRADIENT} style={StyleSheet.absoluteFill} />}
                </View>
              </View>
              <View style={[styles.barNameContainer, item.isCurrent && styles.barNameContainerCurrent]}>
                <Text style={[styles.barName, item.isCurrent && styles.barNameCurrent]} numberOfLines={1}>{item.name.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const ProgressionView = ({ player, onShowSaved, onEditBuild, onDeleteBuild }) => {
  const progressions = player.progressions || [];

  return (
    <View style={styles.progContainer}>
      <TouchableOpacity style={styles.addProgBtn} onPress={onShowSaved}>
        <Text style={styles.addProgIcon}>+</Text>
        <Text style={styles.addProgText}>CREATE NEW BUILD</Text>
      </TouchableOpacity>

      <View style={styles.progList}>
        {progressions.length > 0 ? (
          progressions.map((build, idx) => (
            <View key={build.id || idx} style={styles.buildCard}>
              <Image source={{ uri: build.image || player.image }} style={styles.buildCardImg} />
              <View style={styles.buildCardInfo}>
                <View style={styles.buildCardHeader}>
                  <Text style={styles.buildCardName}>{build.name}</Text>
                  <Text style={styles.buildCardRating}>{build.rating}</Text>
                </View>
                <View style={styles.buildCardStats}>
                  {['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBody', 'aerial', 'defending'].map(stat => (
                    build[stat] > 0 && (
                      <View key={stat} style={styles.miniStatPill}>
                        <ProgressionIcon statKey={stat} size={16} color="rgba(255,255,255,0.8)" showBackground={true} />
                        <Text style={[styles.miniStatText, { marginLeft: 4 }]}>{build[stat]}</Text>
                      </View>
                    )
                  ))}
                </View>
              </View>
              <View style={styles.buildActions}>
                <TouchableOpacity onPress={() => onShowSaved(build)} style={styles.buildActionBtn}>
                  <Text style={styles.buildActionIcon}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteBuild(build.id)} style={styles.buildActionBtn}>
                  <Text style={[styles.buildActionIcon, { color: COLORS.danger }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyProg}>
            <Text style={styles.emptyProgText}>NO SAVED PROGRESSIONS</Text>
            <Text style={styles.emptyProgSub}>TAP CREATE NEW BUILD TO START</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getPinterestPinId = (url) => {
  // Handles standard pin URLs and pins with extra query params
  const regExp = /pin\/(\d+)/;
  const match = url.match(regExp);
  if (match) return match[1];
  return null;
};

const PINTEREST_CLEANUP_SCRIPT = `
  (function() {
    const style = document.createElement('style');
    style.innerHTML = \`
      div[data-test-id="header"], 
      div[data-test-id="navbar"],
      div[data-test-id="close-button"],
      div[data-test-id="pin-page-header"],
      .header-container,
      .footer-container,
      .unauth-pin-page-footer,
      div[data-test-id="save-button-container"] { display: none !important; }
      body { background-color: #000 !important; }
      .light-mode { background-color: #000 !important; }
    \`;
    document.head.appendChild(style);
  })();
  true;
`;

const MediaView = ({ media, onAddMedia, onDeleteMedia, onToggleAspect }) => {
  const [isDeleteMode, setIsDeleteMode] = React.useState(false);
  return (
    <View style={styles.compContainer}>
      <View style={styles.mediaHeaderRow}>
        <TouchableOpacity style={styles.addProgBtn} onPress={onAddMedia}>
          <Text style={styles.addProgIcon}>+</Text>
          <Text style={styles.addProgText}>ADD MEDIA LINK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mediaDeleteToggle, isDeleteMode && styles.mediaDeleteToggleActive]}
          onPress={() => setIsDeleteMode(!isDeleteMode)}
        >
          <Text style={styles.mediaDeleteToggleIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mediaMasonryGrid}>
        {media.length > 0 ? (
          media.map((item, idx) => {
            const videoId = item.type === 'video' ? getYouTubeVideoId(item.url) : null;
            const isShorts = /shorts/i.test(item.url);
            const isPinterest = /pinterest\.com|pin\.it/i.test(item.url);

            const isPortrait = item.aspect === 'portrait' || (item.aspect !== 'landscape' && (isShorts || isPinterest));

            const containerWidth = SCREEN_WIDTH - 40;
            // Precise percent-based layout for ultimate stability
            const visualWidth = isPortrait ? '48%' : '98%';
            const visualMargin = '1%';

            const calcWidth = isPortrait
              ? (containerWidth - 30) / 2
              : containerWidth - 10;

            const contentHeight = isPortrait ? calcWidth * 1.778 : calcWidth * 0.5625;

            return (
              <View key={idx} style={[
                styles.mediaMasonryItem,
                { width: visualWidth, margin: visualMargin, height: contentHeight }
              ]}>
                <View style={[
                  styles.mediaContentFull,
                  {
                    height: contentHeight,
                    borderRadius: 20,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    backgroundColor: '#000'
                  }
                ]}>
                  {videoId ? (
                    <View style={isPortrait ? styles.shortsPlayerContainer : styles.youtubeWrapper}>
                      {isPortrait ? (
                        <View style={[styles.shortsPlayerIframeWrapper, {
                          width: calcWidth * 3.16,
                          height: calcWidth * 1.778 + 2, // Slight overfill to prevent lines
                          marginLeft: -(calcWidth * 3.16) / 2
                        }]}>
                          <YoutubePlayer
                            width={calcWidth * 3.16}
                            height={calcWidth * 1.778 + 2}
                            play={false}
                            videoId={videoId}
                            webViewProps={{
                              allowsFullscreenVideo: true,
                              scrollEnabled: false,
                            }}
                            initialPlayerParams={{
                              controls: 0,
                              modestbranding: 1,
                              rel: 0,
                              showinfo: 0,
                              autoplay: 0,
                              iv_load_policy: 3,
                            }}
                          />
                        </View>
                      ) : (
                        <YoutubePlayer
                          height={calcWidth * 0.5625}
                          play={false}
                          videoId={videoId}
                          initialPlayerParams={{
                            controls: 1,
                            modestbranding: 1,
                            rel: 0,
                            showinfo: 0,
                          }}
                        />
                      )}
                    </View>
                  ) : (item.url.includes('pinterest.com') || item.url.includes('pin.it')) ? (
                    <View style={styles.pinterestWrapper}>
                      <WebView
                        source={{
                          uri: getPinterestPinId(item.url)
                            ? `https://assets.pinterest.com/ext/embed.html?id=${getPinterestPinId(item.url)}`
                            : item.url
                        }}
                        style={styles.pinterestWebView}
                        injectedJavaScript={PINTEREST_CLEANUP_SCRIPT}
                        onMessage={() => { }}
                        allowsFullscreenVideo
                        scrollEnabled={false}
                      />
                    </View>
                  ) : item.type === 'image' ? (
                    <Image
                      key={item.url}
                      source={{
                        uri: item.url,
                        headers: item.url.includes('wikimedia.org') ? {
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        } : {}
                      }}
                      style={{
                        width: isPortrait ? calcWidth : containerWidth - 10,
                        height: isPortrait ? calcWidth * 1.778 : (containerWidth - 10) * 0.5625,
                        backgroundColor: '#111'
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoPlaceholderFull}>
                      <Text style={styles.videoPlayIcon}>▶</Text>
                      <Text style={styles.videoUrlText} numberOfLines={1}>{item.url}</Text>
                    </View>
                  )}
                  <View style={styles.mediaTypeBadge}>
                    <Text style={styles.mediaTypeText}>{item.type.toUpperCase()}</Text>
                  </View>
                </View>
                {isDeleteMode && (
                  <View style={styles.mediaItemActions}>
                    <TouchableOpacity
                      style={[styles.mediaActionBtn, styles.mediaDeleteBtnActive]}
                      onPress={() => onDeleteMedia(idx)}
                    >
                      <Text style={styles.mediaActionBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyProg}>
            <Text style={styles.emptyProgText}>NO MEDIA ADDED</Text>
            <Text style={styles.emptyProgSub}>TAP ADD TO SAVE LINKS</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const MediaAddModal = ({ visible, onClose, onAdd, userId }) => {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState('video');
  const [aspect, setAspect] = useState('landscape');
  const [isUploading, setIsUploading] = useState(false);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsUploading(true);
        const uploadedUrl = await uploadBase64Image(userId, result.assets[0].base64);
        onAdd(uploadedUrl, 'image', 'landscape');
        onClose();
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Could not upload image to ImgBB');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerPopupCard, { maxHeight: 500 }]}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>ADD MEDIA LINK</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
              <Text style={styles.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {/* Type Selector */}
            <View style={styles.mediaTypeSelector}>
              <TouchableOpacity
                style={[styles.mediaTypeBtn, mediaType === 'video' && styles.mediaTypeBtnActive]}
                onPress={() => setMediaType('video')}
              >
                <Text style={[styles.mediaTypeBtnText, mediaType === 'video' && styles.mediaTypeBtnTextActive]}>🎥 VIDEO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mediaTypeBtn, mediaType === 'image' && styles.mediaTypeBtnActive]}
                onPress={() => setMediaType('image')}
              >
                <Text style={[styles.mediaTypeBtnText, mediaType === 'image' && styles.mediaTypeBtnTextActive]}>📸 IMAGE</Text>
              </TouchableOpacity>
            </View>

            {/* Orientation Selector */}
            <View style={styles.aspectSelector}>
              <Text style={styles.selectorLabel}>ORIENTATION:</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[styles.radioItem, aspect === 'landscape' && styles.radioItemActive]}
                  onPress={() => setAspect('landscape')}
                >
                  <View style={[styles.radioCheck, aspect === 'landscape' && styles.radioCheckActive]} />
                  <Text style={styles.radioText}>LANDSCAPE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioItem, aspect === 'portrait' && styles.radioItemActive]}
                  onPress={() => setAspect('portrait')}
                >
                  <View style={[styles.radioCheck, aspect === 'portrait' && styles.radioCheckActive]} />
                  <Text style={styles.radioText}>PORTRAIT</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.mediaInput}
              placeholder={`Paste ${mediaType} URL here...`}
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={url}
              onChangeText={setUrl}
            />

            {mediaType === 'image' && (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleImagePicker}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <>
                    <Text style={styles.uploadBtnIcon}>📤</Text>
                    <Text style={styles.uploadBtnText}>UPLOAD FROM GALLERY</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.applyBtn, { marginTop: 25 }]}
              onPress={() => {
                if (url.trim()) {
                  let finalType = mediaType;
                  const trimmedUrl = url.trim().toLowerCase();

                  // Enhanced auto-detection for images
                  const commonImgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
                  const isImgLink = commonImgExts.some(ext => trimmedUrl.includes(ext)) ||
                    trimmedUrl.includes('wikimedia.org') ||
                    trimmedUrl.includes('imgbb.com') ||
                    trimmedUrl.includes('images.app.goo.gl');

                  if (isImgLink) {
                    finalType = 'image';
                  } else if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be') || trimmedUrl.includes('vimeo.com')) {
                    finalType = 'video';
                  }

                  onAdd(url.trim(), finalType, aspect);
                  setUrl('');
                  onClose();
                }
              }}
              disabled={isUploading}
            >
              <Text style={styles.applyBtnText}>{isUploading ? 'UPLOADING...' : 'ADD TO PLAYER'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const rankingOptions = [
  { id: 'all', label: 'ENTIRE SQUAD', icon: '🌎' },
  { id: 'position', label: 'BY POSITION', icon: '🎯' },
  { id: 'league', label: 'BY LEAGUE', icon: '🏆' },
  { id: 'club', label: 'BY CLUB', icon: '🛡️' },
  { id: 'country', label: 'BY COUNTRY', icon: '🏳️' }
];

const PositionTrainingModal = React.memo(({ visible, player, additionalPositions, onClose, onUpdate }) => {
  const availablePositions = React.useMemo(() =>
    POSITIONS.filter(p => !player.position?.split(',').includes(p) && !additionalPositions.includes(p)),
    [player?.position, additionalPositions]
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerPopupCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>MANAGE POSITION TRAINING</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
              <Text style={styles.pickerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {/* 1. CURRENTLY TRAINED SECTION */}
            <View style={{ marginBottom: 25 }}>
              <Text style={[styles.sectionTitle, { color: COLORS.accent, marginBottom: 12 }]}>TRAINED POSITIONS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {additionalPositions.length > 0 ? additionalPositions.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.posTrainingBtn, { borderColor: 'rgba(0, 255, 136, 0.3)', backgroundColor: 'rgba(0, 255, 136, 0.05)', flexDirection: 'row', gap: 10 }]}
                    onPress={() => onUpdate(pos, 'remove_pos')}
                  >
                    <Text style={[styles.posTrainingText, { color: COLORS.accent }]}>{pos}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={{ color: 'rgba(255,255,255,0.15)', fontStyle: 'italic', fontSize: 10 }}>NO ADDITIONAL POSITIONS TRAINED</Text>
                )}
              </View>
            </View>

            {/* 2. AVAILABLE POSITIONS SECTION */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>AVAILABLE POSITIONS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {availablePositions.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={styles.posTrainingBtn}
                    onPress={() => onUpdate(p, 'add_pos')}
                  >
                    <Text style={styles.posTrainingText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// No longer using 2D grid array, switching to 3-column layout for better spanning control

const PositionGrid = React.memo(({ primaryPosition, additionalPositions }) => {
  const primaryPos = primaryPosition?.split(',') || [];
  const allActivePos = [...primaryPos, ...additionalPositions];

  const renderCell = (pos) => {
    const isActive = allActivePos.includes(pos);
    return (
      <View style={[styles.gridCell, isActive && styles.gridCellActive, { height: '100%' }]}>
        <Text style={[styles.gridCellText, isActive && styles.gridCellTextActive]}>
          {pos}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.gridWrapper}>
      <View style={styles.gridContainer}>
        {/* Left Column */}
        <View style={styles.gridColumn}>
          <View style={{ flex: 2 }}>{renderCell('LWF')}</View>
          <View style={{ flex: 3 }}>{renderCell('LMF')}</View>
          <View style={{ flex: 2 }}>{renderCell('LB')}</View>
        </View>

        {/* Center Column */}
        <View style={[styles.gridColumn, { flex: 1.25 }]}>
          <View style={{ flex: 1 }}>{renderCell('CF')}</View>
          <View style={{ flex: 1 }}>{renderCell('SS')}</View>
          <View style={{ flex: 1 }}>{renderCell('AMF')}</View>
          <View style={{ flex: 1 }}>{renderCell('CMF')}</View>
          <View style={{ flex: 1 }}>{renderCell('DMF')}</View>
          <View style={{ flex: 1 }}>{renderCell('CB')}</View>
          <View style={{ flex: 1 }}>{renderCell('GK')}</View>
        </View>

        {/* Right Column */}
        <View style={styles.gridColumn}>
          <View style={{ flex: 2 }}>{renderCell('RWF')}</View>
          <View style={{ flex: 3 }}>{renderCell('RMF')}</View>
          <View style={{ flex: 2 }}>{renderCell('RB')}</View>
        </View>
      </View>
    </View>
  );
});

const PlayerDetailsModal = ({ visible, player, players = [], onClose, onEditDetailed, onUpdate }) => {
  const { user } = useAppContext();
  const [rankingContext, setRankingContext] = useState('all');
  const [showRankDropdown, setShowRankDropdown] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPosConfirm, setShowPosConfirm] = useState(false);
  const [modalPage, setModalPage] = useState(0);
  const [comparisonStat, setComparisonStat] = useState('goals');
  const [comparisonContext, setComparisonContext] = useState('all');
  const [showCompStatDropdown, setShowCompStatDropdown] = useState(false);
  const [showCompGroupDropdown, setShowCompGroupDropdown] = useState(false);
  const [showSavedProgressions, setShowSavedProgressions] = useState(false);
  const [showMediaAdd, setShowMediaAdd] = useState(false);
  const [editingBuild, setEditingBuild] = useState(null);
  const [pickerType, setPickerType] = useState('skill'); // 'skill' or 'pos'

  const gradientColors = useMemo(() => {
    if (!player) return ['#0a0a0c', '#0a0a0c'];
    const base = getCardGradient(player.cardType);
    return [...base, '#0a0a0c'];
  }, [player?.cardType]);

  const [coreSkills, setCoreSkills] = useState([]);
  const [additionalSkills, setAdditionalSkills] = useState(['', '', '', '', '']);
  const [additionalPositions, setAdditionalPositions] = useState([]);
  const [tags, setTags] = useState([]);
  const [media, setMedia] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (player) {
      setCoreSkills(player.skills || []);
      setAdditionalSkills(player.additionalSkills || ['', '', '', '', '']);
      setAdditionalPositions(getSecondaryPositionsFromPlayer(player).filter(pos => pos !== player.position));
      setTags(player.tags || []);
      setMedia(player.media || []);
    }
  }, [player]);

  const rankInfo = useMemo(() => {
    if (!player || !players) return { matches: '-', ga: '-', goals: '-', assists: '-', gpg: '-', apg: '-', gapg: '-', total: 0 };

    const calculateRank = (statKey, type = 'normal') => {
      let filteredPlayers = [...players];
      if (rankingContext === 'position') filteredPlayers = filteredPlayers.filter(p => p.position === player.position);
      else if (rankingContext === 'league') filteredPlayers = filteredPlayers.filter(p => p.league === player.league);
      else if (rankingContext === 'club') filteredPlayers = filteredPlayers.filter(p => p.club === player.club);
      else if (rankingContext === 'country') filteredPlayers = filteredPlayers.filter(p => p.nationality === player.nationality || p.country === player.nationality);

      let sorted;
      if (type === 'ratio') {
        const playersWithMatches = filteredPlayers.filter(p => (p.matches || 0) > 0);
        sorted = [...playersWithMatches].sort((a, b) => {
          let valA, valB;
          if (statKey === 'gpg') { valA = (a.goals || 0) / a.matches; valB = (b.goals || 0) / b.matches; }
          else if (statKey === 'apg') { valA = (a.assists || 0) / a.matches; valB = (b.assists || 0) / b.matches; }
          else if (statKey === 'gapg') { valA = ((a.goals || 0) + (a.assists || 0)) / a.matches; valB = ((b.goals || 0) + (b.assists || 0)) / b.matches; }
          return valB - valA;
        });
      } else {
        sorted = [...filteredPlayers].sort((a, b) => {
          const statA = type === 'ga' ? ((a.goals || 0) + (a.assists || 0)) : (a[statKey] || 0);
          const statB = type === 'ga' ? ((b.goals || 0) + (b.assists || 0)) : (b[statKey] || 0);
          return statB - statA;
        });
      }
      const rank = sorted.findIndex(p => (p._id || p.id || p.playerId) === (player._id || player.id || player.playerId)) + 1;
      return rank > 0 ? `#${rank}` : '-';
    };

    return {
      matches: calculateRank('matches'),
      ga: calculateRank(null, 'ga'),
      goals: calculateRank('goals'),
      assists: calculateRank('assists'),
      gpg: calculateRank('gpg', 'ratio'),
      apg: calculateRank('apg', 'ratio'),
      gapg: calculateRank('gapg', 'ratio'),
      total: players.length // Total players in context is better shown elsewhere if filtered, but sticking to logic
    };
  }, [player, players, rankingContext]);

  const updatePositions = React.useCallback((playerId, next) => {
    const nextStr = next.join(', ');
    onUpdate?.(playerId, {
      additionalPositions: next,
      secondaryPositions: next,
      secondary_positions: next,
      sec_pos: nextStr,
      additional_pos: nextStr,
      positions: next,
      secondaryPosition: nextStr,
      secondary_pos: nextStr,
      secPos: nextStr,
      additionalPos: nextStr,
      secondary: nextStr,
      pos2: nextStr
    });
  }, [onUpdate]);

  const handleManagementUpdate = React.useCallback((skillOrIdx, type, slotIdx = null) => {
    const playerId = player?._id;
    if (!playerId) {
      console.warn('Cannot update: player._id is missing');
      return;
    }

    if (type === 'core') {
      const next = [...coreSkills, skillOrIdx];
      setCoreSkills(next);
      onUpdate?.(playerId, { skills: next });
    } else if (type === 'additional') {
      const next = [...additionalSkills];
      next[slotIdx] = skillOrIdx;
      setAdditionalSkills(next);
      const nextStr = next.filter(s => s).join(', ');
      onUpdate?.(playerId, {
        additionalSkills: next,
        secondarySkills: next,
        secondary_skills: nextStr
      });
    } else if (type === 'remove_core') {
      const next = coreSkills.filter((_, i) => i !== skillOrIdx);
      setCoreSkills(next);
      onUpdate?.(playerId, { skills: next });
    } else if (type === 'remove_additional') {
      const next = [...additionalSkills];
      next[skillOrIdx] = '';
      setAdditionalSkills(next);
      const nextStr = next.filter(s => s).join(', ');
      onUpdate?.(playerId, {
        additionalSkills: next,
        secondarySkills: next,
        secondary_skills: nextStr
      });
    } else if (type === 'add_pos') {
      if (!additionalPositions.includes(skillOrIdx)) {
        const next = [...additionalPositions, skillOrIdx];
        setAdditionalPositions(next);
        updatePositions(playerId, next);
      }
    } else if (type === 'remove_pos') {
      const next = additionalPositions.filter(p => p !== skillOrIdx);
      setAdditionalPositions(next);
      updatePositions(playerId, next);
    } else if (type === 'add_tag') {
      if (skillOrIdx && !tags.includes(skillOrIdx)) {
        const next = [...tags, skillOrIdx];
        setTags(next);
        onUpdate?.(playerId, { tags: next });
      }
    } else if (type === 'remove_tag') {
      const next = tags.filter((_, i) => i !== skillOrIdx);
      setTags(next);
      onUpdate?.(playerId, { tags: next });
    }

  }, [coreSkills, additionalSkills, additionalPositions, player?._id, onUpdate, updatePositions]);



  if (!player) return null;



  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={gradientColors} style={styles.headerBackground}>
          <View style={styles.safeHeader}>
            <View style={styles.topNav}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEditDetailed?.({ ...player, additionalPositions, additionalSkills, skills: coreSkills })} style={styles.editBtn}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
              <View style={styles.modalTabs}>
                <TouchableOpacity style={[styles.tabBtn, modalPage === 0 && styles.tabBtnActive]} onPress={() => setModalPage(0)}>
                  <Text style={[styles.tabText, modalPage === 0 && styles.tabTextActive]}>DETAILS</Text>
                  {modalPage === 0 && <View style={styles.tabActiveLine} />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, modalPage === 1 && styles.tabBtnActive]} onPress={() => setModalPage(1)}>
                  <Text style={[styles.tabText, modalPage === 1 && styles.tabTextActive]}>RANKING</Text>
                  {modalPage === 1 && <View style={styles.tabActiveLine} />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, modalPage === 2 && styles.tabBtnActive]} onPress={() => setModalPage(2)}>
                  <Text style={[styles.tabText, modalPage === 2 && styles.tabTextActive]}>BUILDS</Text>
                  {modalPage === 2 && <View style={styles.tabActiveLine} />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, modalPage === 3 && styles.tabBtnActive]} onPress={() => setModalPage(3)}>
                  <Text style={[styles.tabText, modalPage === 3 && styles.tabTextActive]}>MEDIA</Text>
                  {modalPage === 3 && <View style={styles.tabActiveLine} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroSection}>
              <View style={styles.cardContainer}>
                <PlayerCard player={player} settings={{ showStats: false }} />
              </View>
              <View style={styles.basicInfo}>
                <View style={styles.nameHeader}>
                  <Text style={styles.playerName}>{player.name.toUpperCase()}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.mainPos, { color: COLORS.accent }]}>{player.position}</Text>
                  <Text style={styles.separator}>|</Text>
                  <Text style={[styles.playstyleText, { color: COLORS.accent }]}>{player.playstyle || 'None'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={styles.idList}>
                    <CompactInfo icon="🛡️" text={player.club} image={player.logos?.club || player.club_badge_url} />
                    <CompactInfo icon="🏳️" text={player.nationality} image={player.logos?.country || player.nationality_flag_url} isFlag={true} />
                    <CompactInfo icon="🏆" text={player.league} image={player.logos?.league || player.league_badge_url} />
                    <CompactInfo icon="🆔" text={player.pesdb_id || player.playerId} />
                    <CompactInfo icon="👤" text={`${player.age || '--'} • ${player.strongFoot || player.foot || player.strong_foot || player.strongfoot || '--'} • ${player.height || '--'}CM`} />
                  </View>

                    <TouchableOpacity 
                      style={styles.efhubBtn}
                      onPress={() => {
                        const id = player.playerId || player.pesdb_id;
                        if (id) {
                          Linking.openURL(`https://efhub.com/players/${id}`);
                        } else {
                          Alert.alert('No ID', 'This player does not have a valid ID for EFHub.');
                        }
                      }}
                    >
                      <View style={styles.efhubSquare}>
                        <Image 
                          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-u_c9SzJg_Kfn9aRGf2y5-0drkCDmurWmQQ&s' }} 
                          style={{ width: 28, height: 28, borderRadius: 8 }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.efhubText}>EFHUB</Text>
                    </TouchableOpacity>
                </View>
                {player.cardType && <Text style={styles.cardTypeText}>{player.cardType.toUpperCase()}</Text>}
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {modalPage === 0 && (
            <View key="page-details">
              <View style={styles.statsGrid}>
                <StatBox label="MATCHES" value={player.matches || 0} />
                <StatBox label="G+A TOTAL" value={(player.goals || 0) + (player.assists || 0)} color={COLORS.accent} />
                <StatBox label="GOALS" value={player.goals || 0} />
                <StatBox label="ASSISTS" value={player.assists || 0} />
              </View>
              <View style={styles.twinGrid}>
                <View style={styles.twinColumnLeft}>
                  <Text style={styles.sectionTitle}>EFFICIENCY</Text>
                  <View style={styles.efficiencyCard}>
                    <EfficiencyItem
                      icon="soccer"
                      label="GOALS / GM"
                      value={player.matches > 0 ? (player.goals / player.matches).toFixed(2) : '0.00'}
                      color={COLORS.accent}
                    />
                    <EfficiencyItem
                      icon="target"
                      label="ASSISTS / GM"
                      value={player.matches > 0 ? (player.assists / player.matches).toFixed(2) : '0.00'}
                      color={COLORS.blue}
                    />
                    <EfficiencyItem
                      icon="flash"
                      label="G+A / GM"
                      value={player.matches > 0 ? ((player.goals + player.assists) / player.matches).toFixed(2) : '0.00'}
                      color="#fff"
                    />
                  </View>
                </View>
                <View style={styles.twinColumnRight}>
                  <Text style={styles.sectionTitle}>RANKING ({rankingOptions.find(o => o.id === rankingContext)?.label.toUpperCase()})</Text>
                  <View style={styles.rankingGrid8}>
                    <View style={styles.rankItemFirst}>
                      <View style={styles.inlineDropdownWrapper}>
                        <TouchableOpacity style={styles.slimFilterBtnFull} onPress={() => setShowRankDropdown(!showRankDropdown)}>
                          <Text style={styles.slimFilterIcon}>{rankingOptions.find(o => o.id === rankingContext)?.icon}</Text>
                          <Text style={styles.slimFilterArrow}>{showRankDropdown ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        {showRankDropdown && (
                          <View style={styles.dropdownMenuCompact}>
                            {rankingOptions.map((opt) => (
                              <TouchableOpacity key={opt.id} style={[styles.dropdownItem, rankingContext === opt.id && styles.dropdownItemActive]} onPress={() => { setRankingContext(opt.id); setShowRankDropdown(false); }}>
                                <View style={styles.dropdownItemInner}>
                                  <Text style={styles.dropdownIcon}>{opt.icon}</Text>
                                  <Text style={[styles.dropdownText, rankingContext === opt.id && styles.dropdownTextActive]}>{opt.label}</Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.rankingTotalPill}>{rankInfo.total}</Text>
                    </View>
                    <View style={styles.rankItemCell}><Text style={styles.rankLabel}>MATCHES</Text><Text style={styles.rankValue}>{rankInfo.matches}</Text></View>
                    <View style={styles.rankItemCell}><Text style={[styles.rankLabel, { color: COLORS.accent }]}>G+A</Text><Text style={[styles.rankValue, { color: COLORS.accent }]}>{rankInfo.ga}</Text></View>
                    <View style={styles.rankItemCell}><Text style={styles.rankLabel}>GOALS</Text><Text style={styles.rankValue}>{rankInfo.goals}</Text></View>
                    <View style={styles.rankItemCell}><Text style={[styles.rankLabel, { color: COLORS.blue }]}>ASSISTS</Text><Text style={[styles.rankValue, { color: COLORS.blue }]}>{rankInfo.assists}</Text></View>
                    <View style={styles.rankItemCell}><Text style={styles.rankLabel}>GOALS/GM</Text><Text style={[styles.rankValue, { color: COLORS.accent }]}>{rankInfo.gpg}</Text></View>
                    <View style={styles.rankItemCell}><Text style={[styles.rankLabel, { color: COLORS.blue }]}>AST/GM</Text><Text style={[styles.rankValue, { color: COLORS.blue }]}>{rankInfo.apg}</Text></View>
                    <View style={styles.rankItemCell}><Text style={styles.rankLabel}>G+A / GAME</Text><Text style={[styles.rankValue, { color: COLORS.accent }]}>{rankInfo.gapg}</Text></View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>PLAYER SKILLS</Text>
                  <TouchableOpacity style={styles.miniEditBtn} onPress={() => { setShowConfirm(true); setPickerType('core'); }}><Text style={styles.miniEditIcon}>✏️</Text></TouchableOpacity>
                </View>
                <View style={styles.skillsWrapper}>
                  {coreSkills.map((skill, index) => {
                    const isSpecial = SPECIAL_SKILLS.includes(skill) || skill.startsWith('*');
                    const cleanSkill = skill.startsWith('*') ? skill.substring(1) : skill;
                    return (
                      <View key={index} style={[styles.skillBadge, isSpecial && styles.specialSkillBadge]}>
                        <Text style={[styles.skillText, isSpecial && styles.specialSkillText]}>{cleanSkill}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.additionalSkillsContainer}>
                  <View style={styles.additionalHeader}>
                    <Text style={styles.additionalTitle}>ADDITIONAL SKILLS</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                      <Text style={styles.additionalCount}>{additionalSkills.filter(s => s !== '').length}/5</Text>
                      <TouchableOpacity onPress={() => { setShowPicker(true); setPickerType('skill'); }}><Text style={styles.miniEditIcon}>✏️</Text></TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.additionalPillsRow}>
                    {additionalSkills.map((addedSkill, idx) => (
                      <View key={idx} style={[styles.additionalPill, addedSkill ? styles.additionalPillActive : styles.additionalPillEmpty]}>
                        <Text style={[styles.additionalPillText, !addedSkill && styles.additionalPillTextEmpty]} numberOfLines={1}>{addedSkill || `SLOT ${idx + 1}`}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.additionalSkillsContainer, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', marginTop: 20, paddingTop: 20 }]}>
                  <View style={styles.additionalHeader}>
                    <Text style={[styles.additionalTitle, { color: COLORS.accent }]}>POSITION TRAINING</Text>
                    <TouchableOpacity onPress={() => setShowPosConfirm(true)}><Text style={styles.miniEditIcon}>✏️</Text></TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 15, alignItems: 'center' }}>
                    <PositionGrid primaryPosition={player.position} additionalPositions={additionalPositions} />
                  </View>
                </View>

                <View style={[styles.additionalSkillsContainer, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', marginTop: 20, paddingTop: 20 }]}>
                  <View style={styles.additionalHeader}>
                    <Text style={[styles.additionalTitle, { color: COLORS.blue }]}>TAGS</Text>
                    <View style={styles.tagInputRow}>
                      <TextInput
                        style={styles.tagsInput}
                        placeholder="Add tag..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={newTag}
                        onChangeText={setNewTag}
                        onSubmitEditing={() => {
                          if (newTag.trim()) {
                            handleManagementUpdate(newTag.trim(), 'add_tag');
                            setNewTag('');
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={styles.addTagSmallBtn}
                        onPress={() => {
                          if (newTag.trim()) {
                            handleManagementUpdate(newTag.trim(), 'add_tag');
                            setNewTag('');
                          }
                        }}
                      >
                        <Text style={styles.addTagSmallBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.tagsDisplayRow}>
                    {tags.length > 0 ? (
                      tags.map((tag, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.tagPill}
                          onPress={() => handleManagementUpdate(idx, 'remove_tag')}
                        >
                          <Text style={styles.tagPillText}>{tag.toUpperCase()}</Text>
                          <Text style={styles.tagPillRemove}>✕</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noTagsText}>NO TAGS ADDED</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.additionalSkillsContainer, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', marginTop: 20, paddingTop: 20 }]}>
                  <View style={styles.additionalHeader}>
                    <Text style={[styles.additionalTitle, { color: COLORS.accent }]}>PERFORMANCE & ORIGIN</Text>
                  </View>
                  <View style={styles.performanceGrid}>
                    <View style={styles.perfRow}>
                      <PerformanceItem 
                        icon="shoe-print" 
                        label="WF USAGE" 
                        value={player['Weak Foot Usage'] || player.weakFootUsage || player.weak_foot_usage} 
                        badge={getWFBadge(player['Weak Foot Usage'] || player.weakFootUsage || player.weak_foot_usage, 'usage')}
                      />
                      <PerformanceItem 
                        icon="bullseye-arrow" 
                        label="WF ACCURACY" 
                        value={player['Weak Foot Accuracy'] || player.weakFootAccuracy || player.weak_foot_accuracy} 
                        badge={getWFBadge(player['Weak Foot Accuracy'] || player.weakFootAccuracy || player.weak_foot_accuracy, 'accuracy')}
                      />
                    </View>
                    <View style={styles.perfRow}>
                      <PerformanceItem icon="medical-bag" label="INJURY RES" value={player['Injury Resistance'] || player.injuryResistance || player.injury_resistance} />
                      <PerformanceItem icon="heart-pulse" label="FORM" value={player.form || player.Form} />
                    </View>
                    <View style={styles.perfDivider} />
                    <PerformanceItem
                      icon="package-variant-closed"
                      label="FEATURED PACK"
                      value={(player['Featured Players'] || player.featuredPack || player.featured_pack || player.pack || '--').toUpperCase()}
                      color={COLORS.accent}
                      isFull
                    />
                    <View style={styles.perfRow}>
                      <PerformanceItem
                        icon="calendar-plus"
                        label="ADDED"
                        value={(player['Date Added'] && player['Date Added'] !== '') ? player['Date Added'].toUpperCase() : (player.createdAt || player.dateAdded) ? new Date(player.createdAt || player.dateAdded).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '--'}
                        color="rgba(255,255,255,0.5)"
                      />
                      <PerformanceItem
                        icon="cloud-upload"
                        label="UPDATED"
                        value={player.lastUpdated ? new Date(player.lastUpdated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : (player.updatedAt ? new Date(player.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '--')}
                        color="rgba(255,255,255,0.5)"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {modalPage === 1 && (
            <View key="page-ranking">
              <ComparisonView
                player={player}
                players={players}
                stat={comparisonStat}
                setStat={setComparisonStat}
                context={comparisonContext}
                setContext={setComparisonContext}
                showStatDrop={showCompStatDropdown}
                setShowStatDrop={setShowCompStatDropdown}
                showGroupDrop={showCompGroupDropdown}
                setShowGroupDrop={setShowCompGroupDropdown}
              />
            </View>
          )}

          {modalPage === 2 && (
            <View key="page-prog" style={{ padding: 20 }}>
              <ProgressionView
                player={player}
                onShowSaved={(build = null) => {
                  setEditingBuild(build);
                  setShowSavedProgressions(true);
                }}
                onDeleteBuild={(id) => {
                  const updatedProg = (player.progressions || []).filter(p => p.id !== id);
                  onUpdate?.(player?._id, { progressions: updatedProg });
                }}
              />
            </View>
          )}

          {modalPage === 3 && (
            <View key="page-media" style={{ padding: 20 }}>
              <MediaView
                media={media}
                onAddMedia={() => setShowMediaAdd(true)}
                onDeleteMedia={(idx) => {
                  const next = media.filter((_, i) => i !== idx);
                  setMedia(next);
                  onUpdate?.(player?._id, { media: next });
                }}
                onToggleAspect={(idx) => {
                  const next = [...media];
                  const current = next[idx].aspect || 'landscape';
                  next[idx] = { ...next[idx], aspect: current === 'portrait' ? 'landscape' : 'portrait' };
                  setMedia(next);
                  onUpdate?.(player?._id, { media: next });
                }}
              />
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Global Modals & Alerts */}
        {showPicker && pickerType === 'pos' && (
          <PositionTrainingModal
            visible={true}
            player={player}
            additionalPositions={additionalPositions}
            onClose={() => setShowPicker(false)}
            onUpdate={handleManagementUpdate}
          />
        )}

        {showPicker && pickerType === 'skill' && (
          <SkillSelectionModal
            visible={true}
            coreSkills={coreSkills}
            additionalSkills={additionalSkills}
            onClose={() => setShowPicker(false)}
            onUpdate={handleManagementUpdate}
          />
        )}

        {showConfirm && (
          <StylishAlert
            visible={true}
            title="MANAGE SKILLS"
            message={`Do you want to edit or add skills for ${player.name}?`}
            onCancel={() => setShowConfirm(false)}
            onConfirm={() => { setShowConfirm(false); setShowPicker(true); }}
          />
        )}

        {showPosConfirm && (
          <StylishAlert
            visible={true}
            title="POSITION TRAINING"
            message={`Do you want to train ${player.name} in new positions?`}
            onCancel={() => setShowPosConfirm(false)}
            onConfirm={() => { setShowPosConfirm(false); setShowPicker(true); setPickerType('pos'); }}
          />
        )}

        {showSavedProgressions && (
          <SavedProgressionsModal
            visible={true}
            player={player}
            initialBuild={editingBuild}
            onClose={() => {
              setShowSavedProgressions(false);
              setEditingBuild(null);
            }}
            onUpdatePlayer={(id, data) => {
              onUpdate?.(player?._id, data);
            }}
          />
        )}

        <MediaAddModal
          visible={showMediaAdd}
          onClose={() => setShowMediaAdd(false)}
          userId={user?.uid}
          onAdd={(url, type, aspect) => {
            const newItem = { url, type, aspect };
            const next = [...media, newItem];
            setMedia(next);
            onUpdate?.(player?._id, { media: next });
          }}
        />

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  headerBackground: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  safeHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 10, paddingBottom: 5 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, height: 44, zIndex: 50 },
  tabsContainer: { paddingHorizontal: 20, marginTop: -2, marginBottom: 15, alignItems: 'center' },
  modalTabs: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 4, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18, position: 'relative' },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: COLORS.accent },
  tabActiveLine: { position: 'absolute', bottom: 4, left: '35%', right: '35%', height: 2, backgroundColor: COLORS.accent, borderRadius: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: '#fff', fontSize: 13, fontWeight: '300' },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  editIcon: { fontSize: 12 },
  heroSection: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 0, alignItems: 'center', gap: 20 },
  cardContainer: { width: SCREEN_WIDTH * 0.35, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 },
  basicInfo: { flex: 1, justifyContent: 'center' },
  playerName: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tagText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  idList: { marginTop: 4, marginBottom: 8, gap: 2 },
  compactInfoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 1 },
  compactInfoIcon: { fontSize: 10, opacity: 0.6 },
  compactInfoText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  badgeImage: { width: 14, height: 14, opacity: 0.8 },
  flagImage: { width: 16, height: 12, borderRadius: 2 },
  cardTypeText: { color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  efhubBtn: { alignItems: 'center', gap: 6, marginRight: 5, marginTop: 10 },
  efhubSquare: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  efhubText: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 120 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  twinGrid: { flexDirection: 'row', gap: 12, marginBottom: 25, alignItems: 'flex-start' },
  twinColumnLeft: { flex: 1 },
  twinColumnRight: { flex: 1.35 },
  sectionTitle: { color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10, marginLeft: 2, textTransform: 'uppercase' },
  efficiencyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 210,
    justifyContent: 'space-between',
  },
  effItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginVertical: 4,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  effIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  effInfo: {
    flex: 1,
  },
  effValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  effLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  rankingGrid8: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 210 },
  rankItemCell: { width: '48%', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 4, justifyContent: 'center', height: 46 },
  rankItemFirst: { width: '48%', backgroundColor: 'rgba(0,204,255,0.05)', borderRadius: 10, padding: 4, justifyContent: 'center', alignItems: 'center', height: 46, borderWidth: 1, borderColor: 'rgba(0,204,255,0.1)' },
  rankLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 6.5, fontWeight: '900', marginBottom: 1, textAlign: 'center', textTransform: 'uppercase' },
  rankValue: { color: '#fff', fontSize: 10.5, fontWeight: '900', textAlign: 'center' },
  rankingTotalPill: { color: COLORS.blue, fontSize: 8.5, fontWeight: '900', marginTop: 1, opacity: 0.8 },
  slimFilterBtnFull: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  slimFilterIcon: { fontSize: 12 },
  slimFilterArrow: { color: 'rgba(0,204,255,0.4)', fontSize: 6 },
  inlineDropdownWrapper: { position: 'relative', zIndex: 100 },
  dropdownMenuCompact: { position: 'absolute', top: 35, left: -20, width: 140, backgroundColor: '#121214', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', elevation: 25, zIndex: 1000 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropdownItemActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  dropdownItemInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownIcon: { fontSize: 13 },
  dropdownText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dropdownTextActive: { color: COLORS.accent },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15 },
  infoLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { fontSize: 14, opacity: 0.6 },
  infoLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  infoValueContainer: { alignItems: 'flex-end' },
  infoValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  infoSubValue: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2, fontWeight: '600' },
  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  specialSkillBadge: { backgroundColor: 'rgba(255, 0, 0, 0.1)', borderColor: '#ff4d4d', shadowColor: '#ff0000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  skillText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  specialSkillText: { color: '#fff', textTransform: 'uppercase' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  miniEditBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  miniEditIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  additionalSkillsContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', paddingTop: 15 },
  additionalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  additionalTitle: { color: COLORS.blue, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  additionalCount: { color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '900' },
  additionalPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  additionalPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, gap: 6 },
  additionalPillActive: { backgroundColor: 'rgba(0, 204, 255, 0.1)', borderColor: 'rgba(0, 204, 255, 0.3)' },
  additionalPillEmpty: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  slotDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  slotDotActive: { backgroundColor: COLORS.blue },
  additionalPillText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  additionalPillTextEmpty: { color: 'rgba(255,255,255,0.1)', fontSize: 8, fontStyle: 'italic' },
  performanceGrid: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 5,
  },
  perfRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  perfItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  perfItemFull: {
    width: '100%',
    marginBottom: 12,
  },
  perfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  perfLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  perfValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 17,
  },
  perfValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  perfBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  perfDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
    marginBottom: 16,
  },

  // Position Training Grid Styles
  trainingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  posBtn: {
    width: (SCREEN_WIDTH - 80) / 4,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  posBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  posBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9.5,
    fontWeight: '900',
  },
  posBtnTextActive: {
    color: '#000',
  },

  // Name Header & Meta Info Styles
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  playerName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  mainPos: { fontSize: 13, fontWeight: '900' },
  playstyleText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  separator: { color: 'rgba(255,255,255,0.1)', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pickerTitle: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  pickerClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  pickerCloseIcon: { color: '#fff', fontSize: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', margin: 15, borderRadius: 12, paddingHorizontal: 15, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchIcon: { fontSize: 12, marginRight: 10, opacity: 0.4 },
  searchInput: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },
  skillItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)', gap: 12 },
  skillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  skillDotSpecial: { backgroundColor: '#ff4d4d' },
  skillItemText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', flex: 1 },
  skillItemTextSpecial: { color: '#ff4d4d' },
  skillEditCard: { width: '100%', maxHeight: '90%', backgroundColor: '#0a0a0c', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  editContentScroll: { padding: 20 },
  editGroup: { marginBottom: 10 },
  editGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  editGroupTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  editGroupTitleBlue: { color: COLORS.blue, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  addGroupBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  addGroupText: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },
  editPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
  editPillSpecial: { borderColor: '#ff4d4d', backgroundColor: 'rgba(255,0,0,0.05)' },
  editPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  editPillRemove: { color: 'rgba(255,255,255,0.3)', fontSize: 14, paddingLeft: 5 },
  additionalEditSlots: { gap: 8 },
  editSlot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 44, borderRadius: 12, borderWidth: 1, gap: 12 },
  editSlotActive: { backgroundColor: 'rgba(0,204,255,0.05)', borderColor: 'rgba(0,204,255,0.2)' },
  editSlotEmpty: { backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  editSlotText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  editSlotTextEmpty: { color: 'rgba(255,255,255,0.1)', fontStyle: 'italic' },
  pickerPopupCard: { width: '85%', maxHeight: '70%', backgroundColor: '#121214', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', elevation: 30 },
  skillListScroll: { padding: 5 },
  alertCard: { width: '80%', backgroundColor: '#0a0a0c', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  alertGlow: { position: 'absolute', top: -50, right: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.accent, opacity: 0.1 },
  alertTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 15 },
  alertMsg: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 25, fontWeight: '600' },
  alertButtons: { flexDirection: 'row', gap: 12 },
  btnAlertCancel: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  btnAlertCancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900' },
  btnAlertPrimary: { flex: 1.5, height: 44, borderRadius: 12, overflow: 'hidden' },
  btnAlertGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnAlertPrimaryText: { color: '#000', fontSize: 10, fontWeight: '900' },
  compContainer: { flex: 1, paddingTop: 10 },
  compHeader: { flexDirection: 'row', gap: 10, marginBottom: 30, zIndex: 1000 },
  compDropdownWrapper: { flex: 1, position: 'relative' },
  compFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  compFilterIcon: { fontSize: 13 },
  compFilterText: { flex: 1, color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  compFilterArrow: { color: 'rgba(255,255,255,0.3)', fontSize: 7 },
  compDropdownMenu: { position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#121214', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', elevation: 20 },
  compDropDownItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  compDropDownIcon: { fontSize: 14 },
  compDropDownText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  compSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 },
  compRankLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  compRankValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  compRankSmall: { fontSize: 14, color: 'rgba(255,255,255,0.2)' },
  compMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,255,136,0.05)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  compMiniIcon: { fontSize: 10 },
  compMiniLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  chartArea: { height: 350, position: 'relative', marginTop: 20 },
  guideLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  guideText: { position: 'absolute', left: 0, top: -15, color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '800' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  barCol: { width: '18%', alignItems: 'center' },
  barTopInfo: { alignItems: 'center', marginBottom: 8 },
  barRank: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '900', marginBottom: 2 },
  barValue: { color: '#fff', fontSize: 10, fontWeight: '900' },
  barWrapper: { width: '100%', height: 260, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barBody: { width: '100%', backgroundColor: 'rgba(0,195,255,0.3)', borderRadius: 2 },
  barBodyCurrent: { backgroundColor: COLORS.accent },
  barNameContainer: { marginTop: 12, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  barNameContainerCurrent: { borderBottomColor: COLORS.accent },
  barName: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '900', textAlign: 'center' },
  barNameCurrent: { color: COLORS.accent },
  compTooltip: { position: 'absolute', top: -35, left: -20, right: -20, alignItems: 'center', zIndex: 1000 },
  tooltipInner: { backgroundColor: '#18181b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', elevation: 15 },
  tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tooltipAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tooltipNoAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  tooltipName: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '800' },
  tooltipVal: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },
  tooltipArrow: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'rgba(255,255,255,0.2)' },
  progTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  addProgBtn: { width: '100%', height: 70, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 25 },
  addProgIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 24, fontWeight: '200' },
  addProgText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  progList: { gap: 15 },
  emptyProg: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyProgText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  emptyProgSub: { color: 'rgba(255,255,255,0.1)', fontSize: 8, fontWeight: '700' },
  buildCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 20, gap: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  buildCardImg: { width: 45, height: 60, borderRadius: 10, backgroundColor: '#000' },
  buildCardInfo: { flex: 1 },
  buildCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  buildCardName: { color: '#fff', fontSize: 13, fontWeight: '900' },
  buildCardRating: { color: COLORS.accent, fontSize: 10, fontWeight: '900', backgroundColor: 'rgba(0,255,136,0.1)', paddingHorizontal: 6, borderRadius: 4 },
  buildCardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniStatPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  miniStatText: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '800' },
  buildActions: { flexDirection: 'row', gap: 6 },
  buildActionBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  buildActionIcon: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  posTrainingBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  posTrainingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pickerPopupCard: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: '#1a1d24',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pickerTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pickerClose: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  pickerCloseIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridWrapper: {
    alignSelf: 'center',
    borderRadius: 15,
    padding: 1,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
    marginVertical: 20,
  },
  gridContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: 340,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 136, 0.4)',
  },
  gridColumn: {
    flex: 1,
  },
  gridCell: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  gridCellActive: {
    backgroundColor: '#00FF88',
    borderColor: '#000',
  },
  gridCellEmpty: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridCellText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '900',
  },
  gridCellTextActive: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagsInput: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    width: 60,
    padding: 0,
  },
  addTagSmallBtn: {
    marginLeft: 5,
    paddingHorizontal: 5,
  },
  addTagSmallBtnText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  tagsDisplayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 195, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 195, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  tagPillText: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagPillRemove: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noTagsText: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 9,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  // Media Styles
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  addProgBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    gap: 10,
  },
  mediaDeleteToggle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mediaDeleteToggleActive: {
    backgroundColor: 'rgba(255, 59, 114, 0.1)',
    borderColor: '#FF3B72',
    shadowColor: '#FF3B72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  mediaDeleteToggleIcon: {
    fontSize: 18,
  },
  mediaList: {
    gap: 20,
  },
  mediaMasonryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
  },
  mediaMasonryItem: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.5)',
    marginBottom: 15,
    shadowColor: 'rgba(0, 255, 136, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mediaItemFull: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.5)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 15,
    shadowColor: 'rgba(0, 255, 136, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  mediaContentFull: {
    width: '100%',
  },
  mediaImageFull: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  youtubeWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
  videoPlaceholderFull: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mediaTypeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mediaItemActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
    zIndex: 100,
  },
  mediaActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  mediaActionBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  mediaDeleteBtnActive: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B72',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  mediaDeleteIconActive: {
    fontSize: 16,
  },
  pinterestWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  pinterestWebView: {
    width: '100%',
    height: '100%',
  },
  portraitWrapper: {
    height: (SCREEN_WIDTH - 40) * 1.778,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: 25,
  },
  shortsPlayerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  shortsPlayerIframeWrapper: {
    position: 'absolute',
    top: 0,
    left: '50%',
    // width is set dynamically in the component or use calcWidth math
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitImageFull: {
    width: '100%',
    height: '100%',
  },
  mediaTypeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  mediaTypeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mediaTypeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  mediaTypeBtnTextActive: {
    color: COLORS.accent,
  },
  aspectSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 15,
  },
  radioItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  radioItemActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  radioCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  radioCheckActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  radioText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    gap: 10,
  },
  uploadBtnIcon: {
    fontSize: 16,
  },
  uploadBtnText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: COLORS.accent,
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  applyBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  mediaInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: 18,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PlayerDetailsModal;


