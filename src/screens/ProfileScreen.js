import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Switch, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { logout } from '../services/authService';
import SettingsScreen from './SettingsScreen';
import ProfileStatsScreen from './ProfileStatsScreen';
import FeedbackScreen from './FeedbackScreen';
import { saveProfile } from '../services/profileService';

import { useAppContext } from '../../App';

const ProfileScreen = () => {
  const { user, setUser, settings, setSettings, players, setPlayers, squads } = useAppContext();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [showEditProfile, setShowEditProfile] = React.useState(false);

  // Edit fields state
  const [editName, setEditName] = React.useState(user?.name || '');
  const [editPicture, setEditPicture] = React.useState(user?.picture || '');
  const [editBanner, setEditBanner] = React.useState(user?.bannerUrl || '');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPicture(user.picture);
      setEditBanner(user.bannerUrl);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const updatedProfile = {
        name: editName,
        picture: editPicture,
        bannerUrl: editBanner
      };
      await saveProfile(user.uid, updatedProfile);
      setUser({ ...user, ...updatedProfile });
      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bannerContainer}>
        <Image source={{ uri: user.bannerUrl }} style={styles.banner} />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,12,0.8)', '#0a0a0c']}
          style={styles.bannerOverlay}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.statusBadge} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>PRO</Text>
            <Text style={styles.statLabel}>RANK</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{players?.length || 0}</Text>
            <Text style={styles.statLabel}>PLAYERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{squads?.length || 0}</Text>
            <Text style={styles.statLabel}>SQUADS</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowEditProfile(true)}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>App Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowStats(true)}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>My Profile Statistics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={styles.menuText}>Privacy & Security</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowFeedback(true)}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>Feedback</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LinearGradient
              colors={['#FF4444', '#CC0000']}
              style={styles.logoutGrad}
            >
              <Text style={styles.logoutText}>LOGOUT ACCOUNT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfile}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowEditProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>Update Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DISPLAY NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="E.g. Messi Fan"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PROFILE PICTURE URL</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editPicture}
                    onChangeText={setEditPicture}
                    placeholder="https://..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BANNER IMAGE URL</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editBanner}
                    onChangeText={setEditBanner}
                    placeholder="https://..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                  onPress={handleUpdateProfile}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={[COLORS.accent, '#00CCFF']}
                    style={styles.saveGrad}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.saveText}>UPDATE PROFILE</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSettings}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowSettings(false)}
        >
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            players={players}
            setPlayers={setPlayers}
            user={user}
            onClose={() => setShowSettings(false)}
          />
        </Modal>

        <Modal
          visible={showStats}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowStats(false)}
        >
          <ProfileStatsScreen
            players={players}
            onClose={() => setShowStats(false)}
          />
        </Modal>

        <Modal
          visible={showFeedback}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowFeedback(false)}
        >
          <FeedbackScreen
            userId={user.uid}
            onClose={() => setShowFeedback(false)}
          />
        </Modal>

        <View style={styles.footer}>
          <Text style={styles.footerText}>EFOOTBALL STATS TRACKER</Text>
          <Text style={styles.footerText}>USER ID: {user.uid.substring(0, 12)}...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  bannerContainer: { height: 180, width: '100%', position: 'absolute', top: 0 },
  banner: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  
  header: { paddingTop: 100, paddingBottom: 30, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#0a0a0c' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#0a0a0c' },
  avatarText: { color: '#fff', fontSize: 44, fontWeight: '900' },
  statusBadge: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#00ff00', borderWidth: 4, borderColor: '#0a0a0c' },
  userName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  userEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, fontWeight: '600' },

  content: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statVal: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 1 },

  menu: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  menuIcon: { fontSize: 20, marginRight: 15 },
  menuText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },

  logoutBtn: { overflow: 'hidden', borderRadius: 20 },
  logoutGrad: { paddingVertical: 18, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 2 },

  footer: { marginTop: 40, alignItems: 'center', opacity: 0.2 },
  footerText: { color: '#fff', fontSize: 10, fontWeight: '800', marginBottom: 5, letterSpacing: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  editModalContent: { backgroundColor: '#1a1d24', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  editTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { color: '#fff', fontSize: 24, padding: 5, opacity: 0.5 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  textInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  saveBtn: { marginTop: 10, borderRadius: 15, overflow: 'hidden' },
  saveGrad: { paddingVertical: 18, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});

export default ProfileScreen;
