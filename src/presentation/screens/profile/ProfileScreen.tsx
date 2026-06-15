import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

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
      <Card style={{ gap: 6 }}>
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
      </Card>

      <Card style={{ gap: 6 }}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user?.email ?? '-'}</Text>
      </Card>

      <Card style={{ gap: 6 }}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Nombre</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <Input
              containerStyle={{ marginBottom: 0, flex: 1 }}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              maxLength={50}
              editable={!isLoading}
            />
            <Button
              title="Guardar"
              onPress={handleSaveName}
              disabled={isLoading}
              loading={isLoading}
              size="small"
            />
            <Button
              title="Cancelar"
              onPress={handleCancelEdit}
              disabled={isLoading}
              variant="secondary"
              size="small"
            />
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {user?.displayName ?? 'Sin nombre'}
            </Text>
            <Button
              title="Editar"
              onPress={() => {
                setNewName(user?.displayName ?? '');
                setEditingName(true);
              }}
              variant="secondary"
              size="small"
            />
          </View>
        )}
      </Card>

      <Card style={{ gap: 6 }}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Miembro desde</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{memberSince}</Text>
      </Card>

      <Button
        title="Cerrar sesión"
        onPress={handleSignOut}
        variant="danger"
      />

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
