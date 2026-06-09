import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useExercises } from '../../hooks/useExercises';
import { isOrphaned } from '../../../domain';
import type { Routine, RoutineExercise } from '../../../domain';

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

function formatRest(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

function getUniqueMuscleGroupsForDay(dayExercises: RoutineExercise[]): string[] {
  const groups = new Set(dayExercises.map((ex) => ex.muscleGroup));
  return Array.from(groups);
}

export function RoutineDetailScreen({
  route,
  navigation,
}: RoutineScreenProps<'RoutineDetail'>) {
  const { routineId } = route.params;
  const { routines, deleteRoutine, duplicateRoutine, clearError } = useRoutines();
  const { exercises: catalogExercises } = useExercises();

  const routine = useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId],
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const validExerciseIds = useMemo(
    () => catalogExercises.map((e) => e.id),
    [catalogExercises],
  );

  const selectedDay = routine?.days[selectedDayIndex];
  const muscleGroups = useMemo(() => {
    return selectedDay ? getUniqueMuscleGroupsForDay(selectedDay.exercises) : [];
  }, [selectedDay]);

  const handleEdit = useCallback(() => {
    clearError();
    navigation.navigate('RoutineEdit', { routineId });
  }, [clearError, navigation, routineId]);

  const handleDuplicate = useCallback(async () => {
    clearError();
    await duplicateRoutine(routineId);
    navigation.goBack();
  }, [clearError, duplicateRoutine, navigation, routineId]);

  const handleDelete = useCallback(() => {
    clearError();
    if (!routine) return;
    Alert.alert(
      'Eliminar rutina',
      `Estas seguro de que queres eliminar "${routine.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutine(routineId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [clearError, routine, deleteRoutine, navigation, routineId]);

  if (!routine) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Rutina no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{routine.name}</Text>

        {routine.description ? (
          <Text style={styles.description}>{routine.description}</Text>
        ) : null}

        {routine.days.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {routine.days.map((day, index) => (
              <TouchableOpacity
                key={day.id}
                style={[styles.tab, index === selectedDayIndex && styles.tabActive]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabText, index === selectedDayIndex && styles.tabTextActive]}
                >
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.singleDayLabel}>{routine.days[0]?.name}</Text>
        )}

        <View style={styles.badgesRow}>
          {muscleGroups.map((group) => (
            <View key={group} style={styles.badge}>
              <Text style={styles.badgeText}>{muscleGroupLabels[group] ?? group}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ejercicios</Text>

        {selectedDay?.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((exercise) => (
            <ExerciseCard
              key={`${exercise.exerciseId}-${exercise.order}`}
              exercise={exercise}
              isOrphaned={isOrphaned(exercise, validExerciseIds)}
            />
          ))}
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExerciseCard({
  exercise,
  isOrphaned: orphaned,
}: {
  exercise: RoutineExercise;
  isOrphaned: boolean;
}) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseName, orphaned && styles.orphanedText]}>
          {exercise.exerciseName}
        </Text>
        {orphaned ? (
          <View style={styles.orphanedBadge}>
            <Text style={styles.orphanedBadgeText}>Ejercicio eliminado</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.exerciseDetails}>
        <Text style={styles.detailText}>
          {exercise.isTimeBased
            ? `${exercise.targetSets} sets x ${exercise.targetDurationSeconds}s`
            : `${exercise.targetSets} sets x ${exercise.targetReps} reps`}
        </Text>
        <Text style={styles.detailText}>Descanso: {formatRest(exercise.restSeconds)}</Text>
        {exercise.notes ? <Text style={styles.notesText}>Nota: {exercise.notes}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  singleDayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  orphanedText: {
    color: '#888',
  },
  orphanedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ffebee',
    marginLeft: 8,
  },
  orphanedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d32f2f',
  },
  exerciseDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
  },
  notesText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2f95dc',
  },
  duplicateButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2f95dc',
  },
  startButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
});
