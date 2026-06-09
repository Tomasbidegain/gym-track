import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';

export function DaySelectionScreen({
  route,
  navigation,
}: TrainScreenProps<'DaySelection'>) {
  const { routineId } = route.params;
  const { routines } = useRoutines();

  const routine = routines.find((r) => r.id === routineId);

  if (!routine) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Rutina no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{routine.name}</Text>
      <Text style={styles.subtitle}>Selecciona un dia</Text>

      {routine.days.map((day) => (
        <TouchableOpacity
          key={day.id}
          style={styles.dayCard}
          onPress={() => navigation.navigate('WorkoutSession', { routineId, dayId: day.id })}
          activeOpacity={0.8}
        >
          <Text style={styles.dayName}>{day.name}</Text>
          <Text style={styles.dayMeta}>
            {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
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
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dayMeta: {
    fontSize: 13,
    color: '#888',
  },
});
