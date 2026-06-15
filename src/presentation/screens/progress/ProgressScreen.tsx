import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { MainAppTabScreenProps } from '../../navigation/types';
import { useWorkoutSessionContext } from '../../context/WorkoutSessionContext';
import { StatsOverviewCard } from './components/StatsOverviewCard';
import { TopExerciseCard } from './components/TopExerciseCard';
import { CalendarView } from './components/CalendarView';
import { useTheme } from '../../context/ThemeContext';

type TimeFilter = 'week' | 'month' | 'all';

interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessions: Array<{
    date: Date;
    maxWeight: number;
    totalVolume: number;
  }>;
}

export function ProgressScreen({ navigation }: MainAppTabScreenProps<'Progress'>) {
  const { theme } = useTheme();
  const { sessions } = useWorkoutSessionContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Filter sessions by time
  const filteredSessions = useMemo(() => {
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

    return sessions.filter(
      (s) => s.isCompleted && s.completedAt && s.completedAt >= startDate
    );
  }, [sessions, timeFilter]);

  // Calculate general stats
  const generalStats = useMemo(() => {
    const completedSessions = sessions.filter((s) => s.isCompleted);

    // Now and month ago
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total unique workout days in the last month (not sessions)
    const monthWorkoutDates = new Set(
      completedSessions
        .filter((s) => {
          const d = s.completedAt || s.startedAt;
          return d >= monthAgo;
        })
        .map((s) => {
          const d = s.completedAt || s.startedAt;
          return d.toISOString().split('T')[0];
        })
    );
    const totalWorkouts = monthWorkoutDates.size;

    // Weekly volume (last 7 days, regardless of filter)
    const weeklyVolume = completedSessions
      .filter((s) => {
        const d = s.completedAt || s.startedAt;
        return d >= weekAgo;
      })
      .reduce((sum, s) => sum + s.totalVolume, 0);

    // PR Global (all time)
    let globalPR = 0;
    completedSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight));
        if (maxWeight > globalPR) globalPR = maxWeight;
      });
    });

    // Streak calculation (all time)
    const allWorkoutDates = new Set(
      completedSessions.map((s) => {
        const d = s.completedAt || s.startedAt;
        return d.toISOString().split('T')[0];
      })
    );
    const sortedDates = Array.from(allWorkoutDates).sort();
    let streak = 0;
    let currentStreak = 0;

    if (sortedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Check if today or yesterday was a workout day
      const hasRecentWorkout = sortedDates.includes(today) || sortedDates.includes(yesterday);

      if (hasRecentWorkout) {
        currentStreak = 1;
        for (let i = sortedDates.length - 1; i > 0; i--) {
          const current = new Date(sortedDates[i]);
          const previous = new Date(sortedDates[i - 1]);
          const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      streak = currentStreak;
    }

    return {
      totalWorkouts,
      weeklyVolume,
      globalPR,
      streak,
    };
  }, [sessions]);

  // Calculate exercise progress
  const exerciseProgress = useMemo(() => {
    const progressMap = new Map<string, ExerciseProgress>();

    filteredSessions.forEach((session) => {
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
          const totalVolume = completedSets.reduce(
            (sum, s) => sum + s.weight * s.reps,
            0
          );

          progress.sessions.push({
            date: session.completedAt || session.startedAt,
            maxWeight,
            totalVolume,
          });
        }
      });
    });

    // Sort sessions by date
    progressMap.forEach((progress) => {
      progress.sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return Array.from(progressMap.values());
  }, [filteredSessions]);

  // Top 5 exercises
  const topExercises = useMemo(() => {
    return exerciseProgress
      .sort((a, b) => b.sessions.length - a.sessions.length)
      .slice(0, 5)
      .map((progress) => {
        const latestSession = progress.sessions[progress.sessions.length - 1];
        const firstSession = progress.sessions[0];
        const improvement = latestSession.maxWeight - firstSession.maxWeight;
        const maxWeight = Math.max(...progress.sessions.map((s) => s.maxWeight));
        const weightHistory = progress.sessions.map((s) => s.maxWeight);

        return {
          exerciseId: progress.exerciseId,
          exerciseName: progress.exerciseName,
          maxWeight,
          sessionsCount: progress.sessions.length,
          weightHistory,
          improvement,
        };
      });
  }, [exerciseProgress]);

  // All sessions for heatmap (always show all, not filtered by time)
  const allCompletedSessions = useMemo(() => {
    return sessions.filter((s) => s.isCompleted);
  }, [sessions]);

  if (filteredSessions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin datos todavía</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Completá algunos entrenamientos para ver tu progreso
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Time Filter */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: timeFilter === 'week' ? theme.colors.primary : theme.colors.background },
          ]}
          onPress={() => setTimeFilter('week')}
        >
          <Text
            style={[
              styles.filterText,
              { color: timeFilter === 'week' ? theme.colors.surface : theme.colors.textSecondary },
            ]}
          >
            Semana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: timeFilter === 'month' ? theme.colors.primary : theme.colors.background },
          ]}
          onPress={() => setTimeFilter('month')}
        >
          <Text
            style={[
              styles.filterText,
              { color: timeFilter === 'month' ? theme.colors.surface : theme.colors.textSecondary },
            ]}
          >
            Mes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: timeFilter === 'all' ? theme.colors.primary : theme.colors.background },
          ]}
          onPress={() => setTimeFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: timeFilter === 'all' ? theme.colors.surface : theme.colors.textSecondary },
            ]}
          >
            Todo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Section 1: Stats Overview */}
        <StatsOverviewCard
          totalWorkouts={generalStats.totalWorkouts}
          weeklyVolume={generalStats.weeklyVolume}
          globalPR={generalStats.globalPR}
          streak={generalStats.streak}
        />

        {/* Section 2: Top Exercises */}
        {topExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ejercicios Principales</Text>
            {topExercises.map((exercise) => (
              <TopExerciseCard
                key={exercise.exerciseId}
                exerciseName={exercise.exerciseName}
                maxWeight={exercise.maxWeight}
                sessionsCount={exercise.sessionsCount}
                weightHistory={exercise.weightHistory}
                improvement={exercise.improvement}
              />
            ))}
          </View>
        )}

        {/* Section 3: Calendar View */}
        <CalendarView sessions={allCompletedSessions} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
