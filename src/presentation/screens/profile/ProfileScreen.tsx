import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { ConfirmModal } from '../../components/ConfirmModal';

export function ProfileScreen() {
  const { user, logout, updateDisplayName, isLoading, clearError } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName ?? '');
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSaveName = async () => {
    clearError();
    if (!newName.trim()) return;
    await updateDisplayName(newName.trim());
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setNewName(user?.displayName ?? '');
    setEditingName(false);
    clearError();
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    logout();
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Claro', icon: '☀️' },
    { mode: 'dark', label: 'Oscuro', icon: '🌙' },
    { mode: 'system', label: 'Sistema', icon: '📱' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mi Perfil</Text>

      {/* Appearance Section */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Apariencia</Text>
        <View style={styles.themeOptions}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: themeMode === option.mode ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                  borderColor: themeMode === option.mode ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setThemeMode(option.mode)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>{option.icon}</Text>
              <Text 
                style={[
                  styles.themeLabel, 
                  { color: themeMode === option.mode ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user?.email ?? '-'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Nombre</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={[
                styles.nameInput,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  color: theme.colors.text,
                },
              ]}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              maxLength={50}
              editable={!isLoading}
              placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: theme.colors.primary }, isLoading && styles.smallButtonDisabled]}
              onPress={handleSaveName}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.smallButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButtonSecondary, { backgroundColor: theme.colors.surfaceElevated }, isLoading && styles.smallButtonDisabled]}
              onPress={handleCancelEdit}
              disabled={isLoading}
            >
              <Text style={[styles.smallButtonSecondaryText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {user?.displayName ?? 'Sin nombre'}
            </Text>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => {
                setNewName(user?.displayName ?? '');
                setEditingName(true);
              }}
            >
              <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Miembro desde</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{memberSince}</Text>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: theme.colors.error }, isLoading && styles.buttonDisabled]}
        onPress={handleSignOut}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showSignOutModal}
        title="Cerrar sesión"
        message="¿Estás seguro de que querés cerrar sesión?"
        buttons={[
          { text: 'Cancelar', onPress: () => setShowSignOutModal(false), style: 'cancel' },
          { text: 'Cerrar sesión', onPress: handleConfirmSignOut, style: 'destructive' },
        ]}
        onClose={() => setShowSignOutModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallButtonDisabled: {
    opacity: 0.6,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  smallButtonSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
