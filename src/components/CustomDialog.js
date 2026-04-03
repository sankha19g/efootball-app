import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { COLORS } from '../constants';

const CustomDialog = ({ isOpen, title, message, type, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  const getAccentColor = () => {
    switch (type) {
      case 'danger': return '#FF4444';
      case 'success': return COLORS.accent;
      case 'warning': return '#FFB800';
      default: return COLORS.blue;
    }
  };

  const accentColor = getAccentColor();

  return (
    <Modal transparent={true} visible={isOpen} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {/* Header accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonRow}>
              {onCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: accentColor }]}
                onPress={onConfirm}>
                <Text style={[styles.confirmText, { color: type === 'danger' ? '#fff' : '#000' }]}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#111114',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  accentBar: { height: 3, width: '100%' },
  content: { padding: 24 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 21,
    marginBottom: 24,
  },
  buttonRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 14 },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmText: { fontWeight: '900', fontSize: 14 },
});

export default CustomDialog;
