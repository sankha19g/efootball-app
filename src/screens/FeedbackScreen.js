import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { getFeedback, saveFeedback } from '../services/feedbackService';

const FeedbackScreen = ({ onClose, userId }) => {
  const [items, setItems] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from Firestore on mount
  useEffect(() => {
    const load = async () => {
      const data = await getFeedback(userId);
      setItems(data);
      setLoading(false);
    };
    load();
  }, [userId]);

  // Save to Firestore whenever items change
  const updateAndSave = async (newList) => {
    setItems(newList);
    await saveFeedback(userId, newList);
  };

  const handleAdd = async () => {
    if (!inputText.trim()) {
      setIsAdding(false);
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };
    const next = [newItem, ...items];
    await updateAndSave(next);
    setInputText('');
    setIsAdding(false);
  };

  const handleComplete = (id) => {
    Alert.alert(
      "COMPLETE FEEDBACK",
      "Are you sure you want to mark this feedback as complete? It will be permanently removed.",
      [
        { text: "CANCEL", style: "cancel" },
        { 
          text: "YES, COMPLETE", 
          onPress: async () => {
            const next = items.filter(item => item.id !== id);
            await updateAndSave(next);
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.feedbackItem}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.text}</Text>
        <Text style={styles.itemTime}>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <TouchableOpacity 
        style={styles.completeBtn} 
        onPress={() => handleComplete(item.id)}
      >
        <LinearGradient
          colors={['#00ffaa', '#00cc88']}
          style={styles.completeGrad}
        >
          <MaterialCommunityIcons name="check-bold" size={16} color="#000" />
          <Text style={styles.completeText}>DONE</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER FEEDBACK</Text>
        <TouchableOpacity 
          onPress={() => setIsAdding(true)} 
          style={styles.addTrigger}
        >
          <MaterialCommunityIcons name="plus-circle" size={28} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isAdding && (
          <BlurView intensity={80} tint="dark" style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="What's your feedback or idea?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              multiline
            />
            <View style={styles.inputActions}>
              <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={styles.submitBtn}>
                <LinearGradient colors={[COLORS.accent, '#ccff00']} style={styles.submitGrad}>
                  <Text style={styles.submitText}>ADD FEEDBACK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>SYNCING FEEDBACK...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="message-draw" size={60} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyTitle}>NO FEEDBACK YET</Text>
                <Text style={styles.emptyDesc}>Tap the (+) button at top to share your thoughts with us.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  addTrigger: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  
  content: { flex: 1 },
  list: { padding: 20, paddingBottom: 100 },
  
  inputContainer: {
    margin: 20,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  input: {
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    fontWeight: '600'
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 15
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 15 },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: 11 },
  submitBtn: { borderRadius: 12, overflow: 'hidden' },
  submitGrad: { paddingVertical: 10, paddingHorizontal: 20 },
  submitText: { color: '#000', fontWeight: '900', fontSize: 11 },

  feedbackItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  itemContent: { flex: 1, marginRight: 15 },
  itemText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  itemTime: { color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 6, fontWeight: '800' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', marginTop: 15, letterSpacing: 2 },

  completeBtn: { borderRadius: 12, overflow: 'hidden' },
  completeGrad: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 12,
    gap: 6
  },
  completeText: { color: '#000', fontWeight: '900', fontSize: 10 },

  emptyContainer: { 
    marginTop: 80, 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  emptyTitle: { 
    color: 'rgba(255,255,255,0.2)', 
    fontSize: 14, 
    fontWeight: '900', 
    marginTop: 20,
    letterSpacing: 2
  },
  emptyDesc: { 
    color: 'rgba(255,255,255,0.1)', 
    fontSize: 11, 
    fontWeight: '600', 
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18
  }
});

export default FeedbackScreen;
