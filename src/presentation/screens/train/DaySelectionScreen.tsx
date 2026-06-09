import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useCompletedDaysInWeek } from '../../hooks/useCompletedDaysInWeek';

export function DaySelectionScreen({
  route,
  navigation,
}: TrainScreenProps<'DaySelection'>) {
  const { routineId } = route.params;
  const { routines } = useRoutines();
  const { completedDayIds, refresh } = useCompletedDaysInWeek(routineId);

  // Refresh completed days when screen receives focus (e.g., after completing a workout)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

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

  const handleDayPress = (dayId: string) => {
    navigation.navigate('WorkoutSession', { routineId, dayId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{routine.name}</Text>
      <Text style={styles.subtitle}>Selecciona un dia</Text>

      {routine.days.map((day) => {
        const isCompleted = completedDayIds.has(day.id);
        return (
          <TouchableOpacity
            key={day.id}
            style={[styles.dayCard, isCompleted && styles.dayCardCompleted]}
            onPress={() => handleDayPress(day.id)}
            activeOpacity={0.8}
          >
            <View style={styles.dayCardRow}>
              <Text style={[styles.dayName, isCompleted && styles.dayNameCompleted]}>
                {day.name}
              </Text>
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.dayMeta, isCompleted && styles.dayMetaCompleted]}>
              {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  dayCardCompleted: {
    backgroundColor: '#f0f9f0',
    borderColor: '#4caf50',
  },
  dayCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayNameCompleted: {
    color: '#4caf50',
  },
  dayMeta: {
    fontSize: 13,
    color: '#888',
  },
  dayMetaCompleted: {
    color: '#81c784',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
});
