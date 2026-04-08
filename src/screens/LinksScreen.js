import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';
import * as ImagePicker from 'expo-image-picker';
import { getLinks, addLink, deleteLink, addApp, updateLink, updateApp, getApps } from '../services/miscService';
import { uploadBase64Image } from '../services/playerService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../App';

const LinksScreen = ({ onClose }) => {
  const { user } = useAppContext();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '', emoji: '🌍' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getLinks(user.uid);
      setLinks(data);
    } catch (err) {
      console.error('Fetch links error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error(err));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const imageUrl = await uploadBase64Image(user.uid, result.assets[0].base64);
        setNewLink(p => ({ ...p, icon: imageUrl }));
        setUploading(false);
      }
    } catch (err) {
      console.error('Image pick error:', err);
      Alert.alert('Error', 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url || !user) return;
    let url = newLink.url;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    try {
      if (editingId) {
        await updateLink(user.uid, editingId, { ...newLink, url });
        setLinks(prev => prev.map(l => l.id === editingId ? { ...l, ...newLink, url } : l));
        
        // Sync with My Apps: Find any app with the same URL and update its icon/name
        const existingApps = await getApps(user.uid);
        const matchingApp = existingApps.find(a => a.url === url || a.url === newLink.url);
        if (matchingApp) {
          await updateApp(user.uid, matchingApp.id, {
             name: newLink.title,
             icon: newLink.icon || newLink.emoji,
          });
        }
        
        setEditingId(null);
      } else {
        const added = await addLink(user.uid, { ...newLink, url });
        setLinks(prev => [added, ...prev]);
      }
      setNewLink({ title: '', url: '', icon: '', emoji: '🌍' });
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Error', editingId ? 'Failed to update link' : 'Failed to add link');
    }
  };

  const handleEdit = (link) => {
    setNewLink({ 
      title: link.title, 
      url: link.url, 
      emoji: link.emoji || '🌍', 
      icon: link.icon || link.image || link.picture || '' 
    });
    setEditingId(link.id);
    setShowAddForm(true);
  };

  const handleDeleteLink = async (id) => {
    if (!user) return;
    try {
      await deleteLink(user.uid, id);
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete link');
    }
  };

  const handleAddToApps = async (link) => {
    if (!user) return;
    try {
      await addApp(user.uid, {
        name: link.title,
        url: link.url,
        icon: link.icon || link.image || link.picture || link.emoji, 
        color: COLORS.accent,
      });
      Alert.alert('Success', `${link.title} added to your Apps page!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to add to apps');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>QUICK LINKS</Text>
          <Text style={styles.headerSub}>EXTERNAL RESOURCES</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtnHeader} 
          onPress={() => {
            if (showAddForm) {
              setEditingId(null);
              setNewLink({ title: '', url: '', icon: '', emoji: '🌍' });
            }
            setShowAddForm(!showAddForm);
          }}
        >
          <MaterialCommunityIcons name={showAddForm ? "close" : "plus"} size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>{editingId ? 'EDIT RESOURCE' : 'NEW RESOURCE'}</Text>
          
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={COLORS.accent} size="small" />
              ) : newLink.icon ? (
                <Image source={{ uri: newLink.icon }} style={styles.pickedImage} />
              ) : (
                <MaterialCommunityIcons name="image-plus" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Emoji (e.g. 🔗)"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={newLink.emoji}
              onChangeText={(t) => setNewLink(p => ({ ...p, emoji: t }))}
            />
          </View>

          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Link Name (e.g. EFHub)"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={newLink.title}
            onChangeText={(t) => setNewLink(p => ({ ...p, title: t }))}
          />
          <TextInput
            style={styles.input}
            placeholder="URL (e.g. efhub.app)"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={newLink.url}
            onChangeText={(t) => setNewLink(p => ({ ...p, url: t }))}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddLink} disabled={uploading}>
            <Text style={styles.submitBtnText}>{editingId ? 'UPDATE RESOURCE' : 'ADD TO LIST'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {links.length === 0 && !showAddForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No links found. Add your first resource!</Text>
            </View>
          )}
          {links.map((link, index) => (
            <View key={link.id || index} style={styles.linkCard}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => handleOpenLink(link.url)}
                style={styles.linkMain}
              >
                <View style={[styles.emojiBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  { (link.icon || link.image || link.picture) ? (
                    <Image source={{ uri: link.icon || link.image || link.picture }} style={styles.emojiImage} />
                  ) : (
                    <Text style={styles.emojiText}>{link.emoji || '🌍'}</Text>
                  )}
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle} numberOfLines={1}>{link.title}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleAddToApps(link)}
                >
                  <MaterialCommunityIcons name="cellphone-link" size={20} color={COLORS.accent} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleEdit(link)}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#ffaa00" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleDeleteLink(link.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.accent, fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  headerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  addBtnHeader: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

  formContainer: { padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  formLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    padding: 12, 
    color: '#fff', 
    marginBottom: 10,
    fontWeight: '600'
  },
  submitBtn: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  scroll: { padding: 20, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },

  linkCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    paddingRight: 10,
  },
  linkMain: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
  },
  emojiBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 20 },
  linkInfo: { flex: 1, marginLeft: 15 },
  linkTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  linkUrl: { color: COLORS.accent, fontSize: 10, fontWeight: '600', marginTop: 4, opacity: 0.6 },
  
  actions: { flexDirection: 'row', gap: 5, paddingRight: 10 },
  actionBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imagePicker: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden'
  },
  pickedImage: { width: '100%', height: '100%' },
  emojiImage: { width: 32, height: 32, borderRadius: 8 },
});

export default LinksScreen;
