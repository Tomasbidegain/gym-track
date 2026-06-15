import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useCompletedDaysInWeek } from '../../hooks/useCompletedDaysInWeek';
import { useTheme } from '../../context/ThemeContext';

export function DaySelectionScreen({
  route,
  navigation,
}: TrainScreenProps<'DaySelection'>) {
  const { theme } = useTheme();
  const { routineId } = route.params;
  const { routines } = useRoutines();
  const { completedDayIds, isLoading, refresh } = useCompletedDaysInWeek(routineId);

  // Refresh completed days when screen receives focus (e.g., after completing a workout)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const routine = routines.find((r) => r.id === routineId);

  if (!routine) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Rutina no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.backButtonText, { color: theme.colors.surface }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDayPress = (dayId: string) => {
    navigation.navigate('WorkoutSession', { routineId, dayId });
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{routine.name}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Selecciona un dia</Text>

      {routine.days.map((day) => {
        const isCompleted = completedDayIds.has(day.id);
        return (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
            ]}
            onPress={() => handleDayPress(day.id)}
            activeOpacity={0.8}
          >
            <View style={styles.dayCardRow}>
              <Text style={[
                styles.dayName,
                { color: theme.colors.text },
                isCompleted && { color: theme.colors.success },
              ]}>
                {day.name}
              </Text>
              {isCompleted && <Text style={[styles.checkmark, { color: theme.colors.success }]}>✓</Text>}
            </View>
            <Text style={[
              styles.dayMeta,
              { color: theme.colors.textMuted },
              isCompleted && { color: theme.colors.success },
            ]}>
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
    flex: 1,
  },
  content: {
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
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
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  dayMeta: {
    fontSize: 13,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
});
