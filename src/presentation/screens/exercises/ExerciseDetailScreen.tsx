import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { ExerciseScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';

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
  const { exerciseId } = route.params;
  const { exercises, isLoading, deleteExercise } = useExercises();

  const exercise = useMemo(() => {
    return exercises.find((e) => e.id === exerciseId) ?? null;
  }, [exercises, exerciseId]);

  const handleEdit = () => {
    if (!exercise) return;
    navigation.navigate('ExerciseEdit', { exerciseId: exercise.id });
  };

  const handleDelete = () => {
    if (!exercise) return;
    Alert.alert(
      'Eliminar ejercicio',
      `¿Estás seguro de que querés eliminar "${exercise.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteExercise(exerciseId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (isLoading && !exercise) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se encontró el ejercicio</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{exercise.name}</Text>

        {!exercise.isCustom ? (
          <View style={styles.preloadedBadge}>
            <Text style={styles.preloadedBadgeText}>Ejercicio pre-cargado</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Grupo muscular</Text>
          <Text style={styles.value}>
            {muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Equipamiento</Text>
          <Text style={styles.value}>
            {equipmentLabels[exercise.equipment] ?? exercise.equipment}
          </Text>
        </View>
      </View>

      {exercise.isCustom ? (
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.8}>
            <Text style={styles.editButtonText}>Editar ejercicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={styles.deleteButtonText}>Eliminar ejercicio</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  preloadedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  preloadedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e65100',
  },
  infoRow: {
    gap: 4,
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
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  editButton: {
    height: 52,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    height: 52,
    backgroundColor: '#ffebee',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
});
