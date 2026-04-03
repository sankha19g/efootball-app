import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../constants';

const BrochureScreen = ({ onClose }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.backBtn}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>SQUAD BROCHURE</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.emoji}>📖</Text>
      <Text style={styles.title}>Brochure Mode</Text>
      <Text style={styles.subtitle}>Coming soon to mobile. Showcase your legendary squad in a premium, shareable layout.</Text>
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
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  closeBtn: { paddingHorizontal: 30, py: 15, backgroundColor: COLORS.accent, borderRadius: 12 },
  closeBtnText: { color: '#000', fontWeight: '900' }
});

export default BrochureScreen;
