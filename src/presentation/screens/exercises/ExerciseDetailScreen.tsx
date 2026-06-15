import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { ExerciseScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useTheme } from '../../context/ThemeContext';

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

const equipmentLabels: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  machine: 'Máquina',
  cable: 'Cable',
  bodyweight: 'Peso corporal',
  kettlebell: 'Pesa rusa',
  band: 'Banda',
  other: 'Otro',
};

export function ExerciseDetailScreen({
  navigation,
  route,
}: ExerciseScreenProps<'ExerciseDetail'>) {
  const { theme } = useTheme();
  const { exerciseId } = route.params;
  const { exercises, isLoading, deleteExercise } = useExercises();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const exercise = useMemo(() => {
    return exercises.find((e) => e.id === exerciseId) ?? null;
  }, [exercises, exerciseId]);

  const handleEdit = () => {
    if (!exercise) return;
    navigation.navigate('ExerciseEdit', { exerciseId: exercise.id });
  };

  const handleDelete = () => {
    if (!exercise) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    await deleteExercise(exerciseId);
    navigation.goBack();
  };

  if (isLoading && !exercise) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Cargando...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>No se encontró el ejercicio</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.name, { color: theme.colors.text }]}>{exercise.name}</Text>

        {!exercise.isCustom ? (
          <View style={[styles.preloadedBadge, { backgroundColor: theme.colors.warningLight }]}>
            <Text style={[styles.preloadedBadgeText, { color: theme.colors.warning }]}>Ejercicio pre-cargado</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Grupo muscular</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Equipamiento</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {equipmentLabels[exercise.equipment] ?? exercise.equipment}
          </Text>
        </View>
      </View>

      {exercise.isCustom ? (
        <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary }]} onPress={handleEdit} activeOpacity={0.8}>
            <Text style={[styles.editButtonText, { color: theme.colors.surface }]}>Editar ejercicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error }]} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Eliminar ejercicio</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ConfirmModal
        visible={showDeleteModal}
        title="Eliminar ejercicio"
        message={`¿Estás seguro de que querés eliminar "${exercise.name}"?`}
        buttons={[
          { text: 'Cancelar', onPress: () => setShowDeleteModal(false), style: 'cancel' },
          { text: 'Eliminar', onPress: handleConfirmDelete, style: 'destructive' },
        ]}
        onClose={() => setShowDeleteModal(false)}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  preloadedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  preloadedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
  },
  actionsCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  editButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
