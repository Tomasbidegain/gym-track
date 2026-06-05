import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SparklineChart } from './SparklineChart';

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={styles.sessionsCount}>
            {sessionsCount} sesión{sessionsCount !== 1 ? 'es' : ''}
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.maxWeight}>{maxWeight} kg</Text>
          {improvement !== 0 && (
            <Text
              style={[
                styles.improvement,
                { color: improvement > 0 ? '#4caf50' : '#f44336' },
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
          color="#2f95dc"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#1a1a1a',
    marginBottom: 2,
  },
  sessionsCount: {
    fontSize: 12,
    color: '#888',
  },
  stats: {
    alignItems: 'flex-end',
  },
  maxWeight: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2f95dc',
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
