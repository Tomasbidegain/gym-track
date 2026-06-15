import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useExercises } from '../../hooks/useExercises';
import { isOrphaned } from '../../../domain';
import type { Routine, RoutineExercise } from '../../../domain';
import { ConfirmModal } from '../../components/ConfirmModal';
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
  const { theme } = useTheme();
  const { routineId } = route.params;
  const { routines, deleteRoutine, duplicateRoutine, clearError } = useRoutines();
  const { exercises: catalogExercises, isLoading: isLoadingExercises } = useExercises();

  const routine = useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId],
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    setShowDeleteModal(true);
  }, [clearError, routine]);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    await deleteRoutine(routineId);
    navigation.goBack();
  }, [deleteRoutine, navigation, routineId]);

  if (!routine) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Rutina no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.backButtonText, { color: theme.colors.surface }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingExercises) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Cargando ejercicios...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{routine.name}</Text>

        {routine.description ? (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{routine.description}</Text>
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
                style={[
                  styles.tab,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  index === selectedDayIndex && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.colors.textSecondary },
                    index === selectedDayIndex && { color: theme.colors.surface },
                  ]}
                >
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.singleDayLabel, { color: theme.colors.textSecondary }]}>{routine.days[0]?.name}</Text>
        )}

        <View style={styles.badgesRow}>
          {muscleGroups.map((group) => (
            <View key={group} style={[styles.badge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: theme.colors.text }]}>{muscleGroupLabels[group] ?? group}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ejercicios</Text>

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

      <View style={[styles.actionsContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight }]}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} onPress={handleEdit}>
          <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error },
          styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText, { color: theme.colors.error }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showDeleteModal}
        title="Eliminar rutina"
        message={`Estas seguro de que queres eliminar "${routine.name}"?`}
        buttons={[
          { text: 'Cancelar', onPress: () => setShowDeleteModal(false), style: 'cancel' },
          { text: 'Eliminar', onPress: handleConfirmDelete, style: 'destructive' },
        ]}
        onClose={() => setShowDeleteModal(false)}
      />
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
  const { theme } = useTheme();
  return (
    <View style={[styles.exerciseCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseName, { color: theme.colors.text }, orphaned && { color: theme.colors.textMuted }]}>
          {exercise.exerciseName}
        </Text>
        {orphaned ? (
          <View style={[styles.orphanedBadge, { backgroundColor: theme.colors.errorLight }]}>
            <Text style={[styles.orphanedBadgeText, { color: theme.colors.error }]}>Ejercicio eliminado</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.exerciseDetails}>
        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
          {exercise.isTimeBased
            ? `${exercise.targetSets} sets x ${exercise.targetDurationSeconds}s`
            : `${exercise.targetSets} sets x ${exercise.targetReps} reps`}
        </Text>
        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>Descanso: {formatRest(exercise.restSeconds)}</Text>
        {exercise.notes ? <Text style={[styles.notesText, { color: theme.colors.textMuted }]}>Nota: {exercise.notes}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
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
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  singleDayLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    flex: 1,
  },
  orphanedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  orphanedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonText: {
  },
});
