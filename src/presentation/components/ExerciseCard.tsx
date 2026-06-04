import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Exercise } from '../../domain';

interface ExerciseCardProps {
  exercise: Exercise;
}

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

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{exercise.name}</Text>
      <View style={styles.badgesRow}>
        <View style={[styles.badge, styles.muscleGroupBadge]}>
          <Text style={styles.badgeText}>
            {muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
          </Text>
        </View>
        <View style={[styles.badge, styles.equipmentBadge]}>
          <Text style={styles.badgeText}>
            {equipmentLabels[exercise.equipment] ?? exercise.equipment}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleGroupBadge: {
    backgroundColor: '#e3f2fd',
  },
  equipmentBadge: {
    backgroundColor: '#e8f5e9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});
