import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Entrenamientos (mes)</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{weeklyVolume.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Vol. semanal (kg)</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{globalPR}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>PR Global (kg)</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Racha (días)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
