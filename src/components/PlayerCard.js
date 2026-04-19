import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, STAT_OPTIONS, getCardGradient } from '../constants';
import { getPlayerBadge } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

const PlayerCard = memo(({ player, isSelectionMode, isSelected, onToggleSelect, onPress, settings = {} }) => {
  const {
    showName = true,
    showLabels = true,
    showRatings = true,
    showStats = true,
    showClub = true,
    showPlaystyle = true,
    showClubBadge = true,
    showNationBadge = true,
    customStatSlots = ['matches', 'goals', 'assists'],
    overlayHeight = 70,
    overlayOpacity = 0.95,
    blurIntensity = 0,
    showOverlay = true,
    cardSize = 'normal',
  } = settings;

  const isMini = cardSize === 'mini';
  const gradientColors = useMemo(() => getCardGradient(player.cardType), [player.cardType]);

  const getStatValue = (slotId) => {
    if (slotId === 'totalGA') return (player.goals || 0) + (player.assists || 0);
    return player[slotId] || 0;
  };

  return (
    <TouchableOpacity
      onPress={() => isSelectionMode ? onToggleSelect(player._id) : onPress?.(player)}
      onLongPress={() => onToggleSelect?.(player._id)}
      activeOpacity={0.85}
      style={[styles.cardWrapper, isSelected && styles.cardSelected, isMini && { marginBottom: 0 }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>

        {/* Player Image */}
        <View style={styles.imageContainer}>
          {getPlayerBadge(player, 'player') ? (
            <Image
              source={{ uri: getPlayerBadge(player, 'player') }}
              style={styles.playerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>👤</Text>
            </View>
          )}
          {showOverlay && (
            <>
              <LinearGradient
                colors={[
                  'transparent',
                  `rgba(0,0,0,${overlayOpacity * 0.2})`,
                  `rgba(0,0,0,${overlayOpacity * 0.6})`,
                  `rgba(0,0,0,${overlayOpacity * 0.9})`,
                  `rgba(0,0,0,${overlayOpacity})`
                ]}
                locations={[0, 0.2, 0.5, 0.8, 1]}
                style={[styles.imageOverlay, { height: `${overlayHeight}%` }]}
              />
              {blurIntensity > 0 && (
                <BlurView intensity={blurIntensity} tint="dark" style={[styles.bottomBlur, { height: `${overlayHeight * 0.5}%` }]} />
              )}
            </>
          )}
        </View>

        {/* HUD Top-Left: Rating & Position */}
        {showRatings && (
          <View style={[styles.ratingHud, isMini && { paddingHorizontal: 4, paddingVertical: 2, minWidth: 25 }]}>
            <Text style={[styles.ratingText, isMini && { fontSize: 10, lineHeight: 12 }]}>{player.rating || 0}</Text>
            <Text style={[styles.positionText, isMini && { fontSize: 6 }]}>{player.position}</Text>
          </View>
        )}

        {/* Badges column */}
        <View style={[styles.badgesColumn, isMini && { top: 35, left: 4 }]}>
          {showClubBadge && getPlayerBadge(player, 'club') ? (
            <Image
              source={{ uri: getPlayerBadge(player, 'club') }}
              style={[styles.badge, isMini && { width: 12, height: 12 }]}
              resizeMode="contain"
            />
          ) : null}
          {showNationBadge && getPlayerBadge(player, 'national') ? (
            <Image
              source={{ uri: getPlayerBadge(player, 'national') }}
              style={[styles.badge, isMini && { width: 12, height: 12 }]}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {/* Bottom content */}
        <View style={[styles.bottomContent, isMini && { padding: 4 }]}>
          {showName && (
            <Text style={[styles.playerName, isMini && { fontSize: 8 }]} numberOfLines={1}>
              {player.name}
            </Text>
          )}
          {showClub && player.club && !isMini ? (
            <Text style={styles.clubName} numberOfLines={1}>
              {player.club}
            </Text>
          ) : null}
          {showPlaystyle && player.playstyle && player.playstyle !== 'None' && !isMini ? (
            <Text style={styles.playstyle} numberOfLines={1}>
              {player.playstyle}
            </Text>
          ) : null}

          {/* Stats Row */}
          {showStats && (
            <View style={styles.statsRow}>
              {customStatSlots.map((slotId, idx) => {
                const opt = STAT_OPTIONS.find((o) => o.id === slotId);
                if (!opt) return null;
                const value = getStatValue(slotId);
                const color = slotId === 'goals' ? COLORS.accent : slotId === 'assists' ? COLORS.blue : COLORS.text;
                return (
                  <View key={idx} style={[styles.statItem, isMini && { paddingVertical: 1, borderRadius: 3 }]}>
                    {showLabels && <Text style={[styles.statLabel, { color }, isMini && { fontSize: 5, lineHeight: 6 }]}>{opt.short}</Text>}
                    <Text style={[styles.statValue, { color }, isMini && { fontSize: 7, lineHeight: 8 }]}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Selection Overlay */}
        {isSelectionMode && (
          <View style={[styles.selectionCircle, isSelected && styles.selectionCircleActive]}>
            {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 170, 0.2)',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  card: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  playerImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  noImageText: { fontSize: 40, opacity: 0.3 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  ratingHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomRightRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 40,
    zIndex: 20,
  },
  ratingText: {
    color: COLORS.accent,
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 18,
  },
  positionText: {
    color: COLORS.accent,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  badgesColumn: {
    position: 'absolute',
    top: 52,
    left: 6,
    gap: 4,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 20,
  },
  badge: { width: 20, height: 20, marginBottom: 4 },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    zIndex: 30,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  playerName: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  clubName: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  playstyle: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.6,
    textTransform: 'uppercase',
    lineHeight: 9,
  },
  statValue: {
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  selectionCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  selectionCircleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkMark: { color: '#000', fontWeight: '900', fontSize: 12 },
});

export default PlayerCard;
