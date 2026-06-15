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
import { ConfirmModal } from '../../components/ConfirmModal';

export function ProfileScreen() {
  const { user, logout, updateDisplayName, isLoading, clearError } = useAuth();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Mi Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              maxLength={50}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.smallButton, isLoading && styles.smallButtonDisabled]}
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
              style={[styles.smallButtonSecondary, isLoading && styles.smallButtonDisabled]}
              onPress={handleCancelEdit}
              disabled={isLoading}
            >
              <Text style={styles.smallButtonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.displayRow}>
            <Text style={styles.value}>
              {user?.displayName ?? 'Sin nombre'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setNewName(user?.displayName ?? '');
                setEditingName(true);
              }}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Miembro desde</Text>
        <Text style={styles.value}>{memberSince}</Text>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, isLoading && styles.buttonDisabled]}
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#2f95dc',
    fontSize: 14,
    fontWeight: '600',
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2f95dc',
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
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  smallButtonSecondaryText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    height: 52,
    backgroundColor: '#d32f2f',
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
});
