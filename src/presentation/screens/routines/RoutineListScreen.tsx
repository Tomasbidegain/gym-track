import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { ConfirmModal } from '../../components/ConfirmModal';
import type { Routine } from '../../../domain';
import { useTheme } from '../../context/ThemeContext';

const muscleGroupLabels: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Piernas',
  core: 'Core',
  forearms: 'Antebrazos',
  glutes: 'Gluteos',
  calves: 'Gemelos',
};

function getMuscleGroupBadges(routine: Routine): string[] {
  const allExercises = routine.days.flatMap((d) => d.exercises);
  const groups = new Set(allExercises.map((ex) => ex.muscleGroup));
  return Array.from(groups).slice(0, 3);
}

export function RoutineListScreen({ navigation }: RoutineScreenProps<'RoutineList'>) {
  const { theme } = useTheme();
  const { routines, isLoading, refresh, deleteRoutine, duplicateRoutine, clearError } =
    useRoutines();

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const sortedRoutines = React.useMemo(() => {
    return [...routines].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [routines]);

  const handleRefresh = useCallback(() => {
    clearError();
    refresh();
  }, [clearError, refresh]);

  const handleCreate = useCallback(() => {
    clearError();
    navigation.navigate('RoutineCreate');
  }, [clearError, navigation]);

  const handleRoutinePress = useCallback(
    (routine: Routine) => {
      clearError();
      navigation.navigate('RoutineDetail', { routineId: routine.id });
    },
    [clearError, navigation],
  );

  const handleEdit = useCallback(
    (routine: Routine) => {
      clearError();
      navigation.navigate('RoutineEdit', { routineId: routine.id });
    },
    [clearError, navigation],
  );

  const handleDuplicate = useCallback(
    async (routine: Routine) => {
      clearError();
      await duplicateRoutine(routine.id);
    },
    [clearError, duplicateRoutine],
  );

  const handleDeleteRequest = useCallback(() => {
    setShowActionModal(false);
    setShowDeleteConfirmModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirmModal(false);
    if (selectedRoutine) {
      deleteRoutine(selectedRoutine.id);
    }
    setSelectedRoutine(null);
  }, [selectedRoutine, deleteRoutine]);

  const handleLongPress = useCallback(
    (routine: Routine) => {
      clearError();
      setSelectedRoutine(routine);
      setShowActionModal(true);
    },
    [clearError],
  );

  const renderItem = useCallback(
    ({ item }: { item: Routine }) => {
      const badges = getMuscleGroupBadges(item);
      const totalExercises = item.days.reduce((sum, d) => sum + d.exercises.length, 0);
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleRoutinePress(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={400}
          style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
        >
          <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.dayCount, { color: theme.colors.textMuted }]}>
            {item.days.length} {item.days.length === 1 ? 'dia' : 'dias'}
            {totalExercises > 0 && ` · ${totalExercises} ejercicios`}
          </Text>
          <View style={styles.badgesRow}>
            {badges.map((group) => (
              <View key={group} style={[styles.badge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: theme.colors.text }]}>
                  {muscleGroupLabels[group] ?? group}
                </Text>
              </View>
            ))}
            {badges.length > 0 && totalExercises > badges.length && (
              <Text style={[styles.moreBadge, { color: theme.colors.textMuted }]}>+{totalExercises - badges.length}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleRoutinePress, handleLongPress, theme],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={sortedRoutines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No tenes rutinas</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Crea una para empezar a entrenar con orden
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={handleCreate} activeOpacity={0.8}>
        <Text style={[styles.fabText, { color: theme.colors.surface }]}>+</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showActionModal}
        title={selectedRoutine?.name ?? ''}
        buttons={[
          { text: 'Editar', onPress: () => { setShowActionModal(false); if (selectedRoutine) handleEdit(selectedRoutine); }, style: 'default' },
          { text: 'Duplicar', onPress: () => { setShowActionModal(false); if (selectedRoutine) handleDuplicate(selectedRoutine); }, style: 'default' },
          { text: 'Eliminar', onPress: handleDeleteRequest, style: 'destructive' },
          { text: 'Cancelar', onPress: () => { setShowActionModal(false); setSelectedRoutine(null); }, style: 'cancel' },
        ]}
        onClose={() => { setShowActionModal(false); setSelectedRoutine(null); }}
      />

      <ConfirmModal
        visible={showDeleteConfirmModal}
        title="Eliminar rutina"
        message={selectedRoutine ? `Estas seguro de que queres eliminar "${selectedRoutine.name}"?` : ''}
        buttons={[
          { text: 'Cancelar', onPress: () => { setShowDeleteConfirmModal(false); setSelectedRoutine(null); }, style: 'cancel' },
          { text: 'Eliminar', onPress: handleConfirmDelete, style: 'destructive' },
        ]}
        onClose={() => { setShowDeleteConfirmModal(false); setSelectedRoutine(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayCount: {
    fontSize: 13,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
