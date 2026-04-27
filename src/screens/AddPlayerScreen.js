import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, POSITIONS, PLAYSTYLES, CARD_TYPES, WF_USAGE, WF_ACCURACY, INJURY_RES, FORM } from '../constants';
import { addPlayer, uploadBase64Image } from '../services/playerService';

const FORM_FIELDS = [
  { key: 'name', label: 'Player Name', placeholder: 'e.g. Lionel Messi', required: true },
  { key: 'position', label: 'Main Position', placeholder: 'e.g. CF, SS', required: true },
  { key: 'additionalPositions', label: 'Secondary Positions', placeholder: 'e.g. AMF, LWF' },
  { key: 'club', label: 'Club', placeholder: 'e.g. Inter Miami' },
  { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Argentina' },
  { key: 'rating', label: 'Overall Rating', placeholder: '0-110', keyboardType: 'numeric' },
  { key: 'matches', label: 'Matches', placeholder: '0', keyboardType: 'numeric' },
  { key: 'goals', label: 'Goals', placeholder: '0', keyboardType: 'numeric' },
  { key: 'assists', label: 'Assists', placeholder: '0', keyboardType: 'numeric' },
  { key: 'bannerImage', label: 'Hero Banner Image URL', placeholder: 'https://... (Optional)' },
];

const DropdownField = ({ label, value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.dropdownBtn}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || `Select ${label}`}
        </Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, value === item && styles.optionItemActive]}
                  onPress={() => { onSelect(item); setVisible(false); }}>
                  <Text style={[styles.optionText, value === item && styles.optionTextActive]}>
                    {item}
                  </Text>
                  {value === item && <Text style={styles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const AddPlayerScreen = ({ userId, initialData, onSave, onClose }) => {
  const [form, setForm] = useState(() => {
    if (!initialData) return {
      name: '', club: '', nationality: '', rating: '', cardType: 'Standard',
      position: 'CF', playstyle: 'None', matches: '0', goals: '0', assists: '0',
      image: null, leagueImage: null, bannerImage: null,
      additionalPositions: [], additionalSkills: ['', '', '', '', ''],
      weakFootUsage: 'Occasionally', weakFootAccuracy: 'Medium', injuryResistance: 'Medium', form: 'Standard',
    };
    
    // Destructure to remove legacy keys from spreading
    const { 
      'Weak Foot Usage': _wfu, 'Weak Foot Accuracy': _wfa, 'Injury Resistance': _ir, Form: _f,
      weak_foot_usage: _wfu2, weak_foot_accuracy: _wfa2, injury_resistance: _ir2,
      ...cleanData 
    } = initialData;

    return {
      ...cleanData,
      weakFootUsage: initialData.weakFootUsage || initialData['Weak Foot Usage'] || initialData.weak_foot_usage || 'Occasionally',
      weakFootAccuracy: initialData.weakFootAccuracy || initialData['Weak Foot Accuracy'] || initialData.weak_foot_accuracy || 'Medium',
      injuryResistance: initialData.injuryResistance || initialData['Injury Resistance'] || initialData.injury_resistance || 'Medium',
      form: initialData.form || initialData.Form || 'Standard',
      rating: String(initialData.rating || ''),
      matches: String(initialData.matches || '0'),
      goals: String(initialData.goals || '0'),
      assists: String(initialData.assists || '0'),
    };
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!initialData;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const uploadedUrl = await uploadBase64Image(userId, base64Uri);
        updateField('image', uploadedUrl);
      } catch (err) {
        Alert.alert('Upload failed', 'Could not upload image. The local URI will be used temporarily.');
        updateField('image', result.assets[0].uri);
      } finally {
        setUploading(false);
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name || !String(form.name).trim()) errs.name = 'Player name is required';
    if (form.rating && (isNaN(form.rating) || Number(form.rating) < 0 || Number(form.rating) > 110))
      errs.rating = 'Rating must be 0-110';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const player = {
        ...form,
        rating: Number(form.rating) || 0,
        matches: Number(form.matches) || 0,
        goals: Number(form.goals) || 0,
        assists: Number(form.assists) || 0,
      };
      await onSave(player);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save player.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#111116', '#0a0a0c']} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{isEditing ? 'Edit Player' : 'Add Player'}</Text>
          <Text style={styles.subtitle}>SQUAD BUILDER</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || uploading}
          style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}>
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <LinearGradient
              colors={[COLORS.accent, COLORS.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGrad}>
              <Text style={styles.saveBtnText}>Save</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {/* Image Picker */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker} disabled={uploading}>
            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.playerImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePickerEmpty}>
                {uploading ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <>
                    <Text style={styles.imagePickerIcon}>📸</Text>
                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          {FORM_FIELDS.map(({ key, label, placeholder, required, keyboardType }) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
              <TextInput
                style={[styles.input, errors[key] && styles.inputError]}
                value={String(form[key] || '')}
                onChangeText={(val) => updateField(key, val)}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType={keyboardType || 'default'}
              />
              {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
            </View>
          ))}

          {/* Dropdowns */}
          {/* Position was here, removed as per user request */}

          <DropdownField
            label="Card Type"
            value={form.cardType}
            options={CARD_TYPES}
            onSelect={(val) => updateField('cardType', val)}
          />

          <DropdownField
            label="Playstyle"
            value={form.playstyle}
            options={PLAYSTYLES}
            onSelect={(val) => updateField('playstyle', val)}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <DropdownField
                label="WF Usage"
                value={form.weakFootUsage}
                options={WF_USAGE}
                onSelect={(val) => updateField('weakFootUsage', val)}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <DropdownField
                label="WF Accuracy"
                value={form.weakFootAccuracy}
                options={WF_ACCURACY}
                onSelect={(val) => updateField('weakFootAccuracy', val)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <DropdownField
                label="Injury Res."
                value={form.injuryResistance}
                options={INJURY_RES}
                onSelect={(val) => updateField('injuryResistance', val)}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <DropdownField
                label="Form"
                value={form.form}
                options={FORM}
                onSelect={(val) => updateField('form', val)}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: '#fff', fontSize: 20 },
  headerTitle: { flex: 1 },
  title: {
    fontSize: 18, fontWeight: '900', color: COLORS.accent,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  saveBtn: { borderRadius: 12, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGrad: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
  formContent: { padding: 16, gap: 4 },
  imagePicker: {
    width: 120, height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  playerImage: { width: '100%', height: '100%' },
  imagePickerEmpty: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imagePickerIcon: { fontSize: 32, marginBottom: 8, opacity: 0.5 },
  imagePickerText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)',
    marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  input: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: { borderColor: '#FF4444' },
  errorText: { color: '#FF6B6B', fontSize: 11, fontWeight: '700', marginTop: 4 },
  dropdownBtn: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dropdownPlaceholder: { color: 'rgba(255,255,255,0.2)' },
  dropdownArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalClose: { padding: 4 },
  modalCloseText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '900' },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  optionItemActive: { backgroundColor: 'rgba(0,255,136,0.08)' },
  optionText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
  optionTextActive: { color: COLORS.accent, fontWeight: '900' },
  optionCheck: { color: COLORS.accent, fontWeight: '900', fontSize: 16 },
});

export default AddPlayerScreen;
