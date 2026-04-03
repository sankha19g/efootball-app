import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const FormationsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
        <Text style={styles.headerTitle}>📋 FORMATIONS</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>Formations Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16, opacity: 0.3 },
  emptyTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.4,
  },
});

export default FormationsScreen;
