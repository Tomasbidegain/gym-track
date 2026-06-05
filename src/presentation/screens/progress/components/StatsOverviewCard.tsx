import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsOverviewCardProps {
  totalWorkouts: number;
  weeklyVolume: number;
  globalPR: number;
  streak: number;
}

export function StatsOverviewCard({
  totalWorkouts,
  weeklyVolume,
  globalPR,
  streak,
}: StatsOverviewCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Entrenamientos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weeklyVolume.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Vol. semanal (kg)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{globalPR}</Text>
          <Text style={styles.statLabel}>PR Global (kg)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Racha (días)</Text>
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2f95dc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textAlign: 'center',
  },
});
