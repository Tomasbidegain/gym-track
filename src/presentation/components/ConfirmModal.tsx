import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface ConfirmModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: ConfirmModalButton[];
  onClose?: () => void;
}

export function ConfirmModal({ visible, title, message, buttons, onClose }: ConfirmModalProps) {
  const isColumnLayout = buttons.length > 2;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={[styles.buttons, isColumnLayout && styles.buttonsColumn]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  isColumnLayout && styles.buttonColumn,
                  button.style === 'cancel' && styles.buttonCancel,
                  button.style === 'destructive' && styles.buttonDestructive,
                  button.style === 'default' && styles.buttonDefault,
                ]}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.buttonTextCancel,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                    button.style === 'default' && styles.buttonTextDefault,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonColumn: {
    flex: 0,
    marginBottom: 8,
  },
  buttonDefault: {
    backgroundColor: '#4caf50',
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonDestructive: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDefault: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#666',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});
