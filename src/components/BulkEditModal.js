import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PLAYSTYLES, CARD_TYPES } from '../constants';
import Dropdown from './Dropdown';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BulkEditModal = ({ visible, onClose, onApply, selectedCount }) => {
  const [formData, setFormData] = useState({
    playstyle: '-- Keep Original --',
    cardType: '-- Keep Original --',
    rating: '',
    club: '',
    league: '',
    nationality: '',
    age: '',
    height: '',
    strongFoot: '-- Keep Original --',
    bulkTags: '',
    clubLink: '',
    nationLink: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    // Filter out fields that are "Keep Original" or empty
    const updates = {};
    if (formData.playstyle !== '-- Keep Original --') updates.playstyle = formData.playstyle;
    if (formData.cardType !== '-- Keep Original --') updates.cardType = formData.cardType;
    if (formData.rating !== '') updates.rating = parseInt(formData.rating);
    if (formData.club !== '') updates.club = formData.club;
    if (formData.league !== '') updates.league = formData.league;
    if (formData.nationality !== '') updates.nationality = formData.nationality;
    if (formData.age !== '') updates.age = parseInt(formData.age);
    if (formData.height !== '') updates.height = parseInt(formData.height);
    if (formData.strongFoot !== '-- Keep Original --') updates.strongFoot = formData.strongFoot;
    
    // Tags handling (if any logic is needed to append)
    if (formData.bulkTags !== '') {
        updates.tags = formData.bulkTags.split(/[\s,]+/).filter(Boolean);
    }

    onApply(updates);
  };

  const NumberInput = ({ label, value, onChange, placeholder }) => (
    <View style={styles.fieldCol}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.numberInputWrap}>
        <TextInput
          style={styles.numberInput}
          value={String(value)}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
        />
        <View style={styles.numberControls}>
            <TouchableOpacity onPress={() => onChange(String((parseInt(value) || 0) + 1))}>
                <MaterialCommunityIcons name="chevron-up" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange(String(Math.max(0, (parseInt(value) || 0) - 1)))}>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const TextInputField = ({ label, value, onChange, placeholder, halfWidth = false }) => (
    <View style={halfWidth ? styles.fieldCol : styles.fieldFull}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a20', '#0a0a0c']} style={styles.content}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons name="pencil-box-outline" size={24} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.headerTitle}>BULK EDIT PLAYERS</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              
              <Text style={styles.selectionInfo}>UPDATING {selectedCount} SELECTED PLAYERS</Text>

              {/* Grid 2 Columns */}
              <View style={styles.gridRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>CHANGE PLAYSTYLE</Text>
                  <Dropdown
                    options={['-- Keep Original --', ...PLAYSTYLES]}
                    value={formData.playstyle}
                    onSelect={(v) => handleChange('playstyle', v)}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>CHANGE CARD TYPE</Text>
                  <Dropdown
                    options={['-- Keep Original --', ...CARD_TYPES]}
                    value={formData.cardType}
                    onSelect={(v) => handleChange('cardType', v)}
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <NumberInput 
                  label="CHANGE RATING" 
                  value={formData.rating} 
                  onChange={(v) => handleChange('rating', v)} 
                  placeholder="Enter rating..." 
                />
                <View style={styles.fieldCol} />
              </View>

              <View style={styles.gridRow}>
                <TextInputField 
                  label="CHANGE CLUB NAME" 
                  value={formData.club} 
                  onChange={(v) => handleChange('club', v)} 
                  placeholder="Search club..." 
                  halfWidth 
                />
                <TextInputField 
                  label="CHANGE LEAGUE" 
                  value={formData.league} 
                  onChange={(v) => handleChange('league', v)} 
                  placeholder="Enter league..." 
                  halfWidth 
                />
              </View>

              <View style={styles.gridRow}>
                <TextInputField 
                  label="CHANGE NATIONALITY" 
                  value={formData.nationality} 
                  onChange={(v) => handleChange('nationality', v)} 
                  placeholder="Search nation..." 
                  halfWidth 
                />
                <NumberInput 
                  label="CHANGE AGE" 
                  value={formData.age} 
                  onChange={(v) => handleChange('age', v)} 
                  placeholder="Enter age..." 
                />
              </View>

              <View style={styles.gridRow}>
                <NumberInput 
                  label="CHANGE HEIGHT (CM)" 
                  value={formData.height} 
                  onChange={(v) => handleChange('height', v)} 
                  placeholder="Enter height..." 
                />
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>CHANGE STRONG FOOT</Text>
                  <Dropdown
                    options={['-- Keep Original --', 'Right', 'Left']}
                    value={formData.strongFoot}
                    onSelect={(v) => handleChange('strongFoot', v)}
                  />
                </View>
              </View>

              {/* Action Square Buttons */}
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionBox}>
                    <MaterialCommunityIcons name="shield" size={32} color="#FF4444" />
                    <Text style={styles.actionBoxText}>ADD CLUB</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBox}>
                    <MaterialCommunityIcons name="flag" size={32} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.actionBoxText}>ADD NATION</Text>
                </TouchableOpacity>
              </View>

              {/* Tags Section */}
              <View style={styles.tagsSection}>
                <Text style={styles.fieldLabel}>ADD BULK TAGS</Text>
                <View style={styles.tagInputWrap}>
                    <TextInput 
                        style={styles.tagInput}
                        value={formData.bulkTags}
                        onChangeText={(v) => handleChange('bulkTags', v)}
                        placeholder="Type and press Enter to add tag..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                    <TouchableOpacity style={styles.addTagBtn} onPress={() => {}}>
                        <Text style={styles.addTagBtnText}>ADD</Text>
                    </TouchableOpacity>
                </View>
              </View>

              {/* Links Section */}
              <View style={styles.gridRow}>
                <TextInputField 
                    label="OR PASTE CLUB LINK" 
                    value={formData.clubLink} 
                    onChange={(v) => handleChange('clubLink', v)} 
                    placeholder="https://..." 
                    halfWidth 
                />
                <TextInputField 
                    label="OR PASTE NATION LINK" 
                    value={formData.nationLink} 
                    onChange={(v) => handleChange('nationLink', v)} 
                    placeholder="https://..." 
                    halfWidth 
                />
              </View>

            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>APPLY CHANGES</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.92,
    height: '92%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  selectionInfo: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  scrollBody: {
    padding: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fieldCol: {
    width: '48%',
  },
  fieldFull: {
    width: '100%',
    marginBottom: 15,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  numberInputWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  numberInput: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '700',
  },
  numberControls: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
    marginTop: 10,
  },
  actionBox: {
    flex: 1,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBoxText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 10,
  },
  tagsSection: {
    marginBottom: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
  },
  tagInputWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 15,
    color: '#fff',
  },
  addTagBtn: {
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '900',
    fontSize: 14,
  },
  applyBtn: {
    flex: 1.5,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#00C3FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
});

export default BulkEditModal;
