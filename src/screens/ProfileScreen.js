import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import { logout } from '../services/authService';
import SettingsScreen from './SettingsScreen';
import ProfileStatsScreen from './ProfileStatsScreen';
import { Modal } from 'react-native';

import { useAppContext } from '../../App';

const ProfileScreen = () => {
  const { user, settings, setSettings, players, setPlayers, squads } = useAppContext();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);

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
      <LinearGradient colors={['#1a1d24', '#0a0a0c']} style={styles.header}>
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
      </LinearGradient>

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
          <TouchableOpacity style={styles.menuItem}>
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
  header: { padding: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.accent },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.accent },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  statusBadge: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#00ff00', borderVertical: 4, borderColor: '#0a0a0c' },
  userName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  userEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, fontWeight: '600' },

  content: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statVal: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', marginTop: 4, letterSpacing: 1 },

  menu: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 15, borderVertical: 1, borderColor: 'rgba(255,255,255,0.05)' },
  menuIcon: { fontSize: 18, marginRight: 15 },
  menuText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },

  logoutBtn: { overflow: 'hidden', borderRadius: 15 },
  logoutGrad: { paddingVertical: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },

  footer: { marginTop: 40, alignItems: 'center', opacity: 0.2 },
  footerText: { color: '#fff', fontSize: 10, fontWeight: '800', marginBottom: 5, letterSpacing: 1 }
});

export default ProfileScreen;
