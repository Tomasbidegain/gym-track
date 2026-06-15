import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const isColumnLayout = buttons.length > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>}
          <View style={[styles.buttons, isColumnLayout && styles.buttonsColumn]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  isColumnLayout && styles.buttonColumn,
                  button.style === 'cancel' && [styles.buttonCancel, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }],
                  button.style === 'destructive' && [styles.buttonDestructive, { backgroundColor: theme.colors.error }],
                  button.style === 'default' && [styles.buttonDefault, { backgroundColor: theme.colors.primary }],
                ]}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && [styles.buttonTextCancel, { color: theme.colors.textSecondary }],
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Android shadow
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonColumn: {
    flex: 0,
    marginBottom: 8,
  },
  buttonDefault: {
    // backgroundColor set dynamically
  },
  buttonCancel: {
    borderWidth: 1.5,
  },
  buttonDestructive: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDefault: {
    color: '#fff',
  },
  buttonTextCancel: {
    // color set dynamically
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});
