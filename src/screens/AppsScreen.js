import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getApps, deleteApp, addApp, saveAppsOrder } from '../services/miscService';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../App';

const BG_GRADIENT = ['#0a0a0c', '#151518'];

const { width } = Dimensions.get('window');
// Calculate width for 3 columns with padding
const PADDING = 20;
const GAP = 15;
const COLUMN_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 3;

const AppItem = React.memo(({ app, index, onOpen, onDelete, onMove, isEditMode }) => (
  <View style={[styles.gridItemContainer, isEditMode && styles.gridItemWiggle]}>
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={isEditMode ? 1 : 0.7}
      disabled={isEditMode}
      onPress={() => onOpen(app.url)}
    >
      <View style={[styles.gridIconBox, isEditMode && styles.gridIconBoxEdit]}>
        {isEditMode && (
          <View style={styles.editBadge}>
            <MaterialCommunityIcons name="drag-vertical" size={14} color="#00ffaa" />
          </View>
        )}

        {app.icon && (app.icon.startsWith('http') || app.icon.startsWith('data:')) ? (
          <Image source={{ uri: app.icon }} style={styles.gridIconImage} />
        ) : (
          <Text style={styles.gridEmoji}>{app.icon || '🌍'}</Text>
        )}
      </View>
      <Text style={styles.gridLabel} numberOfLines={2}>{app.name}</Text>
    </TouchableOpacity>

    {isEditMode && (
      <View style={styles.editControls}>
        <TouchableOpacity
          style={styles.deleteIndicator}
          onPress={() => onDelete(app.id)}
        >
          <MaterialCommunityIcons name="close" size={12} color="#fff" />
        </TouchableOpacity>

        <View style={styles.reorderLayer}>
          <TouchableOpacity onPress={() => onMove(index, -1)} style={styles.moveBtn}>
            <MaterialCommunityIcons name="chevron-left" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onMove(index, 1)} style={styles.moveBtn}>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    )}
  </View>
));

const AppsScreen = ({ navigation }) => {
  const { user } = useUser();
  const [userApps, setUserApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = React.useCallback(async () => {
    if (isEditMode && user) {
      // Save order to cloud before exiting
      try {
        await saveAppsOrder(user.uid, userApps);
      } catch (err) {
        console.error('Save order error:', err);
      }
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, user, userApps]);

  const fetchUserApps = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const apps = await getApps(user.uid);
      setUserApps(apps);
    } catch (err) {
      console.error('Fetch apps error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserApps();
    }, [fetchUserApps])
  );

  const handleOpenApp = React.useCallback((url) => {
    Linking.openURL(url).catch(err => console.error(err));
  }, []);

  const handleMoveApp = React.useCallback((index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= userApps.length) return;

    const newArr = [...userApps];
    const item = newArr.splice(index, 1)[0];
    newArr.splice(newIndex, 0, item);
    setUserApps(newArr);
  }, [userApps]);

  const handleDeleteApp = React.useCallback(async (appId) => {
    if (!user) return;
    try {
      await deleteApp(user.uid, appId);
      setUserApps(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={BG_GRADIENT}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.overlayDimmer} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={[styles.editModeButton, isEditMode && styles.editActive]}
            onPress={toggleEditMode}
          >
            <MaterialCommunityIcons
              name={isEditMode ? "check" : "pencil"}
              size={20}
              color={isEditMode ? "#00ffaa" : "#fff"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MY APPS</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation?.goBack()}
        >
          <MaterialCommunityIcons name="close" size={26} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && userApps.length === 0 ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.grid}>
            {userApps.map((app, index) => (
              <AppItem
                key={app.id || index}
                app={app}
                index={index}
                onOpen={handleOpenApp}
                onDelete={handleDeleteApp}
                onMove={handleMoveApp}
                isEditMode={isEditMode}
              />
            ))}
          </View>
        )}

        {!loading && userApps.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="apps-box" size={60} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyText}>No Apps Added</Text>
            <Text style={styles.emptySub}>Add some links in the Quick Links section to see them here.</Text>
          </View>
        )}

        {!loading && userApps.length > 0 && (
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>{isEditMode ? 'DONE TO SAVE ORDER' : 'CLOUD SYNCED'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,10,12,0.95)',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  closeButton: { padding: 5 },
  scrollContent: {
    padding: PADDING,
    paddingBottom: 100
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: GAP
  },
  gridItemContainer: {
    width: COLUMN_WIDTH,
    marginBottom: 25,
    alignItems: 'center',
    position: 'relative',
  },
  gridItem: {
    width: '100%',
    alignItems: 'center',
  },
  gridIconBox: {
    width: COLUMN_WIDTH - 5,
    height: COLUMN_WIDTH - 5,
    backgroundColor: '#111',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gridIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridEmoji: { fontSize: 32 },
  gridLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    letterSpacing: 0.2,
    opacity: 0.9,
    marginTop: 2,
  },
  gridIconBoxEdit: {
    borderColor: 'rgba(255,170,0,0.5)',
    borderWidth: 2,
    backgroundColor: 'rgba(255,170,0,0.05)',
  },
  deleteIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  editModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editActive: {
    backgroundColor: 'rgba(0,255,170,0.15)',
    borderColor: 'rgba(0,255,170,0.4)',
    borderWidth: 1.5,
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    padding: 2,
    zIndex: 5,
  },
  editControls: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 20,
  },
  reorderLayer: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  moveBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,255,170,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,170,0.5)',
  },
  gridItemWiggle: {
    transform: [{ scale: 0.95 }],
    opacity: 1,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    opacity: 0.4,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 20
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  footerInfo: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.2,
  },
  footerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  }
});

export default AppsScreen;
