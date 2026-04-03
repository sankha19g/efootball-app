import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const ScreenshotsScreen = ({ onClose }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.backBtn}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>SCREENSHOTS</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.emoji}>📸</Text>
      <Text style={styles.title}>SCREENSHOT GALLERY</Text>
      <Text style={styles.subtitle}>Feature to browse your saved squad snapshots. Capture and share your history with the community.</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeBtnText}>BACK TO SQUAD</Text></TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { color: COLORS.accent, fontSize: 24, fontWeight: '900', marginBottom: 10, letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, fontWeight: '600', marginBottom: 30 },
  closeBtn: { paddingHorizontal: 30, paddingVertical: 15, backgroundColor: COLORS.accent, borderRadius: 12 },
  closeBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1 }
});

export default ScreenshotsScreen;
