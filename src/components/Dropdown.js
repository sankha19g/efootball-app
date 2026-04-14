import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const Dropdown = ({ 
  label, 
  options, 
  value, 
  onSelect, 
  placeholder = 'Select...', 
  searchable = false,
  multiSelect = false,
  children,
  containerStyle,
  triggerStyle,
  triggerTextStyle,
  labelStyle,
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = searchable 
    ? options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (item) => {
    if (multiSelect) {
      let newValue;
      if (item === 'All') {
        newValue = ['All'];
      } else {
        const currentSelection = Array.isArray(value) ? value : [];
        if (currentSelection.includes(item)) {
          newValue = currentSelection.filter(i => i !== item);
        } else {
          newValue = [...currentSelection.filter(i => i !== 'All'), item];
        }
        if (newValue.length === 0) newValue = ['All'];
      }
      onSelect(newValue);
    } else {
      onSelect(item);
      setVisible(false);
      setSearch('');
    }
  };

  const isSelected = (item) => {
    if (multiSelect) {
      return Array.isArray(value) && value.includes(item);
    }
    return value === item;
  };

  const getTriggerText = () => {
    if (multiSelect) {
      if (!Array.isArray(value) || value.length === 0 || (value.length === 1 && value[0] === 'All')) {
        return placeholder;
      }
      return value.join(', ');
    }
    return value || placeholder;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      {children ? (
        <TouchableOpacity onPress={() => setVisible(true)}>
          {children}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.trigger, triggerStyle]} 
          onPress={() => setVisible(true)}
        >
          <Text 
            numberOfLines={1}
            style={[styles.triggerText, (!value || (multiSelect && (!Array.isArray(value) || value.length === 0 || value[0] === 'All'))) && styles.placeholder, triggerTextStyle]}
          >
            {getTriggerText()}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={COLORS.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.option, isSelected(item) && styles.selectedOption]} 
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, isSelected(item) && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {isSelected(item) && (
                    <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              )}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  trigger: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 8,
  },
  option: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  selectedOption: {
    backgroundColor: 'rgba(0,255,136,0.05)',
  },
  optionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});

export default Dropdown;
