import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import type { Routine } from '../../../domain';

const muscleGroupLabels: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  core: 'Core',
  forearms: 'Antebrazos',
  glutes: 'Glúteos',
  calves: 'Gemelos',
};

function getMuscleGroupBadges(routine: Routine): string[] {
  const groups = new Set(routine.exercises.map((ex) => ex.muscleGroup));
  return Array.from(groups).slice(0, 3);
}

export function RoutineListScreen({ navigation }: RoutineScreenProps<'RoutineList'>) {
  const { routines, isLoading, refresh, deleteRoutine, duplicateRoutine, clearError } =
    useRoutines();

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

  const handleDelete = useCallback(
    (routine: Routine) => {
      clearError();
      Alert.alert(
        'Eliminar rutina',
        `¿Estás seguro de que querés eliminar "${routine.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteRoutine(routine.id),
          },
        ],
      );
    },
    [clearError, deleteRoutine],
  );

  const handleLongPress = useCallback(
    (routine: Routine) => {
      clearError();
      Alert.alert(routine.name, undefined, [
        { text: 'Editar', onPress: () => handleEdit(routine) },
        { text: 'Duplicar', onPress: () => handleDuplicate(routine) },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDelete(routine),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [clearError, handleEdit, handleDuplicate, handleDelete],
  );

  const renderItem = useCallback(
    ({ item }: { item: Routine }) => {
      const badges = getMuscleGroupBadges(item);
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleRoutinePress(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={400}
          style={styles.card}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.exerciseCount}>
            {item.exercises.length}{' '}
            {item.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
          <View style={styles.badgesRow}>
            {badges.map((group) => (
              <View key={group} style={styles.badge}>
                <Text style={styles.badgeText}>
                  {muscleGroupLabels[group] ?? group}
                </Text>
              </View>
            ))}
            {item.exercises.length > badges.length && (
              <Text style={styles.moreBadge}>+{item.exercises.length - badges.length}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleRoutinePress, handleLongPress],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedRoutines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#2f95dc" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tenés rutinas</Text>
            <Text style={styles.emptySubtitle}>
              Creá una para empezar a entrenar con orden
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 13,
    color: '#888',
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
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  moreBadge: {
    fontSize: 12,
    color: '#888',
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
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f95dc',
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
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});
