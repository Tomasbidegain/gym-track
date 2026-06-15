import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SparklineChart } from './SparklineChart';
import { useTheme } from '../../../context/ThemeContext';

interface TopExerciseCardProps {
  exerciseName: string;
  maxWeight: number;
  sessionsCount: number;
  weightHistory: number[];
  improvement: number;
}

export function TopExerciseCard({
  exerciseName,
  maxWeight,
  sessionsCount,
  weightHistory,
  improvement,
}: TopExerciseCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={[styles.sessionsCount, { color: theme.colors.textSecondary }]}>
            {sessionsCount} sesión{sessionsCount !== 1 ? 'es' : ''}
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={[styles.maxWeight, { color: theme.colors.primary }]}>{maxWeight} kg</Text>
          {improvement !== 0 && (
            <Text
              style={[
                styles.improvement,
                { color: improvement > 0 ? theme.colors.success : theme.colors.error },
              ]}
            >
              {improvement > 0 ? '+' : ''}
              {improvement} kg
            </Text>
          )}
        </View>
      </View>
      <View style={styles.chartContainer}>
        <SparklineChart
          data={weightHistory}
          width={120}
          height={40}
          color={theme.colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionsCount: {
    fontSize: 12,
  },
  stats: {
    alignItems: 'flex-end',
  },
  maxWeight: {
    fontSize: 20,
    fontWeight: '800',
  },
  improvement: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
});
