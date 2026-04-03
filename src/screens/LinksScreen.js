import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const QUICK_LINKS = [
  { 
    title: 'EFHUB 24', 
    url: 'https://efhub.app', 
    subtitle: 'Database & Player Comparison', 
    emoji: '📲',
    color: '#00ccff',
    bg: 'rgba(0,204,255,0.1)'
  },
  { 
    title: 'EFOOTBALL DB', 
    url: 'https://efootballdb.com', 
    subtitle: 'Official Item List & Stats', 
    emoji: '⚽',
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.1)'
  },
  { 
    title: 'REMATCH.GG', 
    url: 'https://rematch.gg', 
    subtitle: 'Tournaments & Matches', 
    emoji: '🏆',
    color: '#ffaa00',
    bg: 'rgba(255,170,0,0.1)'
  },
  { 
    title: 'PESMASTER', 
    url: 'https://pesmaster.com', 
    subtitle: 'Build & Squad Simulator', 
    emoji: '🧤',
    color: '#4488ff',
    bg: 'rgba(68,136,255,0.1)'
  },
  { 
    title: 'MY EFOOTBALL', 
    url: 'https://my.konami.net', 
    subtitle: 'Official Konami Support', 
    emoji: '🛡️',
    color: '#ff4444',
    bg: 'rgba(255,68,68,0.1)'
  }
];

const LinksScreen = ({ onClose }) => {
  const handleLink = (url) => {
    Linking.openURL(url).catch(err => console.error(err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>QUICK LINKS</Text>
          <Text style={styles.headerSub}>EXTERNAL RESOURCES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {QUICK_LINKS.map((link, index) => (
          <TouchableOpacity 
            key={index} 
            activeOpacity={0.7} 
            onPress={() => handleLink(link.url)}
            style={[styles.linkCard, { borderLeftColor: link.color }]}
          >
            <View style={[styles.emojiBox, { backgroundColor: link.bg }]}>
              <Text style={styles.emojiText}>{link.emoji}</Text>
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
              <Text style={styles.linkUrl}>{link.url}</Text>
            </View>
            <Text style={styles.arrow}>↗</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  headerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', letterSpacing: 2 },

  scroll: { padding: 20, gap: 12 },
  linkCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 4,
  },
  emojiBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 20 },
  linkInfo: { flex: 1, marginLeft: 15 },
  linkTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  linkSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  linkUrl: { color: COLORS.accent, fontSize: 10, fontWeight: '600', marginTop: 4, opacity: 0.6 },
  arrow: { color: 'rgba(255,255,255,0.2)', fontSize: 20, fontWeight: '200' },
});

export default LinksScreen;
