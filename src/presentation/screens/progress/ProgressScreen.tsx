import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { MainAppTabScreenProps } from '../../navigation/types';
import { useWorkoutSessionContext } from '../../context/WorkoutSessionContext';
import { useExercises } from '../../hooks/useExercises';

type TimeFilter = 'week' | 'month' | 'all';

interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessions: Array<{
    date: Date;
    maxWeight: number;
    totalVolume: number;
    totalSets: number;
  }>;
}

export function ProgressScreen({ navigation }: MainAppTabScreenProps<'Progress'>) {
  const { sessions } = useWorkoutSessionContext();
  const { exercises } = useExercises();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  const exerciseProgress = useMemo(() => {
    const progressMap = new Map<string, ExerciseProgress>();

    sessions.forEach((session) => {
      if (!session.isCompleted) return;

      session.exercises.forEach((exercise) => {
        if (!progressMap.has(exercise.exerciseId)) {
          progressMap.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sessions: [],
          });
        }

        const progress = progressMap.get(exercise.exerciseId)!;
        const completedSets = exercise.sets.filter((s) => s.completed);
        
        if (completedSets.length > 0) {
          const maxWeight = Math.max(...completedSets.map((s) => s.weight));
          const totalVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          const totalSets = completedSets.length;

          progress.sessions.push({
            date: session.startedAt,
            maxWeight,
            totalVolume,
            totalSets,
          });
        }
      });
    });

    // Sort sessions by date
    progressMap.forEach((progress) => {
      progress.sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return Array.from(progressMap.values());
  }, [sessions]);

  const filteredProgress = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    return exerciseProgress
      .map((progress) => ({
        ...progress,
        sessions: progress.sessions.filter((s) => s.date >= startDate),
      }))
      .filter((progress) => progress.sessions.length > 0);
  }, [exerciseProgress, timeFilter]);

  const selectedExerciseProgress = useMemo(() => {
    if (!selectedExercise) return null;
    return filteredProgress.find((p) => p.exerciseId === selectedExercise);
  }, [filteredProgress, selectedExercise]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  if (filteredProgress.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sin datos todavía</Text>
          <Text style={styles.emptyText}>
            Completá algunos entrenamientos para ver tu progreso
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Time Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[styles.filterText, timeFilter === 'week' && styles.filterTextActive]}>
            Semana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[styles.filterText, timeFilter === 'month' && styles.filterTextActive]}>
            Mes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.filterText, timeFilter === 'all' && styles.filterTextActive]}>
            Todo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Selected Exercise Chart */}
        {selectedExerciseProgress && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {selectedExerciseProgress.exerciseName}
            </Text>
            <Text style={styles.chartSubtitle}>Peso máximo (kg)</Text>
            {selectedExerciseProgress.sessions.length > 1 ? (
              <LineChart
                data={{
                  labels: selectedExerciseProgress.sessions.map((s) => formatDate(s.date)),
                  datasets: [
                    {
                      data: selectedExerciseProgress.sessions.map((s) => s.maxWeight),
                    },
                  ],
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(47, 149, 220, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#2f95dc',
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.singleSessionContainer}>
                <Text style={styles.singleSessionText}>
                  {selectedExerciseProgress.sessions[0]?.maxWeight} kg
                </Text>
                <Text style={styles.singleSessionDate}>
                  {selectedExerciseProgress.sessions[0] && formatDate(selectedExerciseProgress.sessions[0].date)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.closeChartButton}
              onPress={() => setSelectedExercise(null)}
            >
              <Text style={styles.closeChartText}>Cerrar gráfico</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Exercise List */}
        <Text style={styles.sectionTitle}>Ejercicios</Text>
        {filteredProgress.map((progress) => {
          const latestSession = progress.sessions[progress.sessions.length - 1];
          const firstSession = progress.sessions[0];
          const improvement = latestSession.maxWeight - firstSession.maxWeight;

          return (
            <TouchableOpacity
              key={progress.exerciseId}
              style={styles.exerciseCard}
              onPress={() => setSelectedExercise(progress.exerciseId)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{progress.exerciseName}</Text>
                <Text style={styles.sessionCount}>
                  {progress.sessions.length} sesión{progress.sessions.length !== 1 ? 'es' : ''}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Último</Text>
                  <Text style={styles.statValue}>{latestSession.maxWeight} kg</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Mejor</Text>
                  <Text style={styles.statValue}>
                    {Math.max(...progress.sessions.map((s) => s.maxWeight))} kg
                  </Text>
                </View>
                {improvement !== 0 && (
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Progreso</Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: improvement > 0 ? '#4caf50' : '#f44336' },
                      ]}
                    >
                      {improvement > 0 ? '+' : ''}
                      {improvement} kg
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2f95dc',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  closeChartButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeChartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  singleSessionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
  },
  singleSessionText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2f95dc',
  },
  singleSessionDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  exerciseCard: {
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  sessionCount: {
    fontSize: 13,
    color: '#888',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});