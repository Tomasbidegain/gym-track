import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SessionTimer } from '../../components/SessionTimer';
import { ConfirmModal } from '../../components/ConfirmModal';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useWorkoutSessionContext } from '../../context/WorkoutSessionContext';
import { useCompletedDaysInWeek } from '../../hooks/useCompletedDaysInWeek';
import { generateSetsFromRoutine } from '../../../domain';
import type { RoutineDay, WorkoutExercise } from '../../../domain';
import { useTheme } from '../../context/ThemeContext';

type SessionExercise = WorkoutExercise & {
  restSeconds: number;
  isTimeBased?: boolean;
  targetDurationSeconds?: number;
  targetReps: number;
  targetSets: number;
};

type FooterMode = 'idle' | 'start_set' | 'end_set' | 'rest' | 'next_exercise' | 'finish';

export function WorkoutSessionScreen({ route, navigation }: TrainScreenProps<'WorkoutSession'>) {
  const { theme } = useTheme();
  const { routineId, dayId: initialDayId } = route.params;
  const { routines, updateRoutine } = useRoutines();
  const { startSession, updateSet, completeSession, markSessionComplete, sessions } = useWorkoutSessionContext();
  const { completedDayIds, isLoading: isLoadingCompletedDays, refresh: refreshCompletedDays } = useCompletedDaysInWeek(routineId);

  const [currentDayId, setCurrentDayId] = useState(initialDayId);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [footerMode, setFooterMode] = useState<FooterMode>('idle');
  const [exerciseTimerSeconds, setExerciseTimerSeconds] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerTotal, setRestTimerTotal] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [currentSetInProgress, setCurrentSetInProgress] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<any>(null);
  const sessionCompletedRef = useRef(false);

  const routine = routines.find((r) => r.id === routineId);
  const day = routine?.days.find((d) => d.id === currentDayId);
  const isDayCompleted = completedDayIds.has(currentDayId);

  const completedSession = useMemo(() => {
    if (!isDayCompleted) return null;
    return sessions.find(
      (s) => s.dayId === currentDayId && s.routineId === routineId && s.isCompleted
    ) || null;
  }, [isDayCompleted, sessions, currentDayId, routineId]);

  const activeSession = sessionId ? sessions.find((s) => s.id === sessionId) : null;

  // Find the last weight and reps for an exercise from previous completed sessions
  const findLastSetForExercise = useCallback((exerciseId: string) => {
    const completedSessions = sessions.filter((s) => s.isCompleted);
    const sessionsWithExercise = completedSessions
      .map((s) => {
        const exercise = s.exercises.find((e) => e.exerciseId === exerciseId);
        if (!exercise) return null;
        const completedSets = exercise.sets.filter((set) => set.completed);
        if (completedSets.length === 0) return null;
        const lastSet = completedSets[completedSets.length - 1];
        return { weight: lastSet.weight, reps: lastSet.reps, completedAt: s.completedAt };
      })
      .filter((item): item is { weight: number; reps: number; completedAt: Date | undefined } => item !== null);

    sessionsWithExercise.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return b.completedAt.getTime() - a.completedAt.getTime();
    });

    return sessionsWithExercise[0] || null;
  }, [sessions]);

  const [exercises, setExercises] = useState<SessionExercise[]>(() => {
    if (!day) return [];
    if (completedSession) {
      return day.exercises.map((routineEx) => {
        const sessionEx = completedSession.exercises.find(
          (se) => se.exerciseId === routineEx.exerciseId
        );
        return {
          ...routineEx,
          sets: sessionEx ? sessionEx.sets : generateSetsFromRoutine(routineEx),
        };
      });
    }
    return day.exercises.map((ex) => {
      const lastSet = findLastSetForExercise(ex.exerciseId);
      return {
        ...ex,
        sets: generateSetsFromRoutine(ex).map((set) => ({
          ...set,
          weight: lastSet ? lastSet.weight : set.weight,
          reps: lastSet ? lastSet.reps : set.reps,
        })),
      };
    });
  });

  // Reset exercise index and timers when day changes
  useEffect(() => {
    setCurrentExerciseIndex(0);
    setIsRestRunning(false);
    setExerciseTimerSeconds(0);
    setRestTimerSeconds(0);
    setFooterMode('idle');
    setCurrentSetInProgress(false);
  }, [currentDayId]);

  // When switching days, update exercises based on completion status
  useEffect(() => {
    if (isDayCompleted && completedSession && day) {
      const mergedExercises = day.exercises.map((routineEx) => {
        const sessionEx = completedSession.exercises.find(
          (se) => se.exerciseId === routineEx.exerciseId
        );
        return {
          ...routineEx,
          sets: sessionEx ? sessionEx.sets : generateSetsFromRoutine(routineEx),
        };
      });
      setExercises(mergedExercises);
      setSessionId(null);
    } else if (!isDayCompleted && day) {
      const exercisesWithLastWeight = day.exercises.map((ex) => {
        const lastSet = findLastSetForExercise(ex.exerciseId);
        return {
          ...ex,
          sets: generateSetsFromRoutine(ex).map((set) => ({
            ...set,
            weight: lastSet ? lastSet.weight : set.weight,
            reps: lastSet ? lastSet.reps : set.reps,
          })),
        };
      });
      setExercises(exercisesWithLastWeight);
      setSessionId(null);
    }
  }, [isDayCompleted, completedSession, day, currentDayId]);

  // Ensure currentExerciseIndex is valid
  useEffect(() => {
    if (exercises.length > 0 && currentExerciseIndex >= exercises.length) {
      setCurrentExerciseIndex(0);
    }
  }, [exercises.length, currentExerciseIndex]);

  const currentExercise = exercises[currentExerciseIndex];
  const activeSetIndex = useMemo(() => {
    if (!currentExercise) return -1;
    return currentExercise.sets.findIndex((s) => !s.completed);
  }, [currentExercise]);
  const nextExercise = useMemo(() => {
    return exercises[currentExerciseIndex + 1] || null;
  }, [exercises, currentExerciseIndex]);

  const handleStartSession = useCallback(async () => {
    if (!routine || !day) return;
    setIsSaving(true);
    try {
      const session = await startSession({
        routineId: routine.id,
        routineName: routine.name,
        dayId: day.id,
        dayName: day.name,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          order: ex.order,
          sets: ex.sets,
        })),
      });
      if (session) {
        setSessionId(session.id);
        setExerciseTimerSeconds(0);
        setCurrentSetInProgress(false);
        setFooterMode('start_set');
      }
    } catch (error) {
      console.error('Error al iniciar sesion:', error);
      setErrorMessage('No se pudo iniciar el entrenamiento');
      setShowErrorModal(true);
    }
    setIsSaving(false);
  }, [routine, day, exercises, startSession]);

  const handleUpdateSetValue = useCallback(
    async (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
      if (!sessionId) return;
      const newExercises = exercises.map((ex, idx) => {
        if (idx !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (sIdx !== setIndex) return s;
            return { ...s, [field]: value };
          }),
        };
      });
      setExercises(newExercises);

      const updatedSet = newExercises[exerciseIndex].sets[setIndex];
      await updateSet(sessionId, {
        exerciseIndex,
        setIndex,
        reps: updatedSet.reps,
        weight: updatedSet.weight,
        completed: updatedSet.completed,
      });
    },
    [sessionId, exercises, updateSet],
  );

  const handleStartSet = useCallback(() => {
    if (!sessionId) return;
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx) return;
    const setIdx = currentEx.sets.findIndex((s) => !s.completed);
    if (setIdx < 0) return;

    if (currentEx.isTimeBased) {
      setExerciseTimerSeconds(0);
    }
    setCurrentSetInProgress(true);
    setFooterMode('end_set');
  }, [sessionId, exercises, currentExerciseIndex]);

  const handleCompleteSet = useCallback(async (exIndex: number, setIndex: number, durationSeconds?: number) => {
    if (!sessionId) return;

    const newExercises = exercises.map((ex, idx) => {
      if (idx !== exIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sIdx) => {
          if (sIdx !== setIndex) return s;
          return {
            ...s,
            completed: true,
            ...(durationSeconds !== undefined && durationSeconds > 0 ? { durationSeconds } : {}),
          };
        }),
      };
    });
    setExercises(newExercises);

    // Start rest timer IMMEDIATELY (don't wait for network)
    setCurrentSetInProgress(false);
    const exercise = newExercises[exIndex];
    const restSeconds = exercise.restSeconds || 90;
    setRestTimerSeconds(restSeconds);
    setRestTimerTotal(restSeconds);
    setIsRestRunning(true);
    setFooterMode('rest');

    // Save to backend in background (fire-and-forget, don't block UI)
    const updatedSet = newExercises[exIndex].sets[setIndex];
    updateSet(sessionId, {
      exerciseIndex: exIndex,
      setIndex,
      reps: updatedSet.reps,
      weight: updatedSet.weight,
      completed: true,
      durationSeconds: updatedSet.durationSeconds,
    }).catch((err) => {
      console.error('Error saving set:', err);
    });
  }, [sessionId, exercises, updateSet]);

  const handleEndSet = useCallback(() => {
    if (!sessionId) return;
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx) return;
    const setIdx = currentEx.sets.findIndex((s) => !s.completed);
    if (setIdx < 0) return;

    if (currentEx.isTimeBased) {
      handleCompleteSet(currentExerciseIndex, setIdx, exerciseTimerSeconds);
      setExerciseTimerSeconds(0);
    } else {
      handleCompleteSet(currentExerciseIndex, setIdx);
    }
  }, [sessionId, exercises, currentExerciseIndex, handleCompleteSet, exerciseTimerSeconds]);

  // Exercise timer effect (for time-based exercises when in end_set mode)
  useEffect(() => {
    if (footerMode !== 'end_set') return;
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx || !currentEx.isTimeBased) return;

    const interval = setInterval(() => {
      setExerciseTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [footerMode, exercises, currentExerciseIndex]);

  // Rest timer countdown effect
  useEffect(() => {
    if (footerMode !== 'rest' || !isRestRunning) return;

    const interval = setInterval(() => {
      setRestTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRestRunning(false);

          const currentEx = exercises[currentExerciseIndex];
          if (!currentEx) {
            setFooterMode('finish');
            return 0;
          }
          const nextSetIdx = currentEx.sets.findIndex((s) => !s.completed);
          if (nextSetIdx >= 0) {
            setFooterMode('start_set');
          } else {
            const hasNextEx = currentExerciseIndex < exercises.length - 1;
            setFooterMode(hasNextEx ? 'next_exercise' : 'finish');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [footerMode, isRestRunning, exercises, currentExerciseIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsRestRunning(false);
    };
  }, []);

  // Intercept navigation exit when session is incomplete
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!sessionId || sessionCompletedRef.current) return;
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.isCompleted) return;

      e.preventDefault();
      setPendingNavigationAction(e.data.action);
      setShowIncompleteModal(true);
    });

    return unsubscribe;
  }, [navigation, sessionId, sessions, markSessionComplete, day]);

  // Android hardware back fallback
  useEffect(() => {
    const onBackPress = () => {
      if (!sessionId || sessionCompletedRef.current) return false;
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.isCompleted) return false;

      setPendingNavigationAction(null);
      setShowIncompleteModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [sessionId, sessions, markSessionComplete, day, navigation]);

  const handleCompleteSession = useCallback(async () => {
    if (!sessionId || !routine) return;
    setShowCompleteModal(true);
  }, [sessionId, routine]);

  const confirmCompleteSession = useCallback(async () => {
    setShowCompleteModal(false);
    if (!sessionId || !routine) return;
    
    setIsSaving(true);
    setIsRestRunning(false);

    const updatedDays: RoutineDay[] = routine.days.map((d) => {
      if (d.id !== currentDayId) return d;
      const updatedExercises = d.exercises.map((ex) => {
        const sessionExercise = exercises.find((se) => se.exerciseId === ex.exerciseId);
        if (!sessionExercise) return ex;
        const completedSets = sessionExercise.sets.filter((s) => s.completed);
        if (completedSets.length === 0) return ex;

        if (ex.isTimeBased) {
          const avgDuration = completedSets.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / completedSets.length;
          return {
            ...ex,
            targetSets: completedSets.length,
            targetDurationSeconds: Math.round(avgDuration),
          };
        }

        const avgWeight = completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length;
        const avgReps = completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
        return {
          ...ex,
          targetSets: completedSets.length,
          targetReps: Math.round(avgReps),
        };
      });
      return { ...d, exercises: updatedExercises };
    });

    await updateRoutine(routineId, { days: updatedDays });
    await completeSession(sessionId);
    sessionCompletedRef.current = true;
    setIsSaving(false);
    navigation.goBack();
  }, [sessionId, routine, currentDayId, exercises, completeSession, updateRoutine, routineId, navigation]);

  const handleIncompleteResume = useCallback(() => {
    setShowIncompleteModal(false);
    if (pendingNavigationAction) {
      navigation.dispatch(pendingNavigationAction);
    } else {
      navigation.goBack();
    }
    setPendingNavigationAction(null);
  }, [navigation, pendingNavigationAction]);

  const handleIncompleteMarkComplete = useCallback(async () => {
    setShowIncompleteModal(false);
    if (sessionId) {
      await markSessionComplete(sessionId);
      if (pendingNavigationAction) {
        navigation.dispatch(pendingNavigationAction);
      } else {
        navigation.goBack();
      }
    }
    setPendingNavigationAction(null);
  }, [sessionId, markSessionComplete, navigation, pendingNavigationAction]);

  const handleCancelRest = useCallback(() => {
    setIsRestRunning(false);
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx) {
      setFooterMode('finish');
      return;
    }

    const nextSetIdx = currentEx.sets.findIndex((s) => !s.completed);
    if (nextSetIdx >= 0) {
      setFooterMode('start_set');
    } else {
      const hasNextEx = currentExerciseIndex < exercises.length - 1;
      setFooterMode(hasNextEx ? 'next_exercise' : 'finish');
    }
  }, [exercises, currentExerciseIndex]);

  const handleNextExercise = useCallback(() => {
    setCurrentExerciseIndex((prev) => prev + 1);
    setExerciseTimerSeconds(0);
    setCurrentSetInProgress(false);
    setFooterMode('start_set');
  }, []);

  if (!routine || !day) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Rutina no encontrada</Text>
      </View>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveSetText = () => {
    if (!currentExercise || activeSetIndex < 0) return '';
    return `${activeSetIndex + 1}/${currentExercise.sets.length}`;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.routineName, { color: theme.colors.text }]}>{routine.name}</Text>
          <Text style={[styles.dayName, { color: theme.colors.textSecondary }]}>{day.name}</Text>
        </View>
        {activeSession && (
          <SessionTimer startedAt={activeSession.startedAt} />
        )}
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.dayTabsContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}
        contentContainerStyle={styles.dayTabsContent}
      >
        {routine.days.map((d) => {
          const isCompleted = completedDayIds.has(d.id);
          const isActive = d.id === currentDayId;
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.dayTab,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                isActive && !isCompleted && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
                !isActive && isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
                isActive && isCompleted && { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
              ]}
              onPress={() => {
                if (d.id === currentDayId) return;
                setCurrentDayId(d.id);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayTabText,
                  { color: theme.colors.textSecondary },
                  isActive && !isCompleted && { color: theme.colors.primary },
                  !isActive && isCompleted && { color: theme.colors.success },
                  isActive && isCompleted && { color: theme.colors.surface },
                ]}
              >
                {d.name}
              </Text>
              {isCompleted && (
                <Text style={[
                  styles.dayTabCheckmark,
                  !isActive && isCompleted && { color: theme.colors.success },
                  isActive && isCompleted && { color: theme.colors.surface },
                ]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoadingCompletedDays ? (
        <View style={styles.contentLoadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {isDayCompleted && completedSession && (
            <View style={[styles.completedBanner, { backgroundColor: theme.colors.success }]}>
              <Text style={[styles.completedBannerText, { color: theme.colors.surface }]}>Día completado</Text>
              <Text style={[styles.completedBannerSubtext, { color: theme.colors.successLight }]}>
                Duración: {(() => {
                  const mins = Math.floor((completedSession.totalDurationSeconds || 0) / 60);
                  const secs = (completedSession.totalDurationSeconds || 0) % 60;
                  return `${mins} min ${secs} seg`;
                })()}
              </Text>
            </View>
          )}

          {/* Main content */}
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentInner}>
            {isDayCompleted ? (
              // Show all exercises when completed
              <>
                {exercises.map((ex, exIdx) => (
                  <View key={ex.exerciseId} style={[styles.completedExerciseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseHeaderInfo}>
                        <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{ex.exerciseName}</Text>
                        <Text style={[styles.exerciseMeta, { color: theme.colors.textMuted }]}>
                          {ex.muscleGroup} • {ex.equipment}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timelineContainer}>
                      {ex.sets.map((set, setIdx) => {
                        const isCompleted = set.completed;
                        const isLast = setIdx === ex.sets.length - 1;

                        return (
                          <View key={set.setNumber} style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                              <View style={[
                                styles.timelineDot,
                                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
                              ]}>
                                <Text style={[
                                  styles.timelineDotText,
                                  { color: theme.colors.textSecondary },
                                  isCompleted && { color: theme.colors.success },
                                ]}>
                                  {isCompleted ? '✓' : set.setNumber}
                                </Text>
                              </View>
                              {!isLast && (
                                <View style={[
                                  styles.timelineLine,
                                  { backgroundColor: theme.colors.border },
                                  isCompleted && { backgroundColor: theme.colors.success },
                                ]} />
                              )}
                            </View>

                            <View style={[
                              styles.setCard,
                              { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                              isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
                            ]}>
                              <View style={styles.setCardContent}>
                                {ex.isTimeBased ? (
                                  <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                    {set.durationSeconds && set.durationSeconds > 0
                                      ? formatTime(set.durationSeconds)
                                      : formatTime(ex.targetDurationSeconds || 0)}
                                    <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> tiempo</Text>
                                  </Text>
                                ) : (
                                  <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                    {set.reps}
                                    <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> reps</Text>
                                  </Text>
                                )}
                                <Text style={[styles.setCardDivider, { color: theme.colors.textMuted }]}>•</Text>
                                <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                  {set.weight}
                                  <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> kg</Text>
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              // Show one exercise at a time when active
              <>
                {currentExercise ? (
                  <>
                    {/* Exercise header */}
                    <View style={styles.exerciseHeader}>
                      <View style={[styles.exerciseImagePlaceholder, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={styles.exerciseImageText}>💪</Text>
                      </View>
                      <View style={styles.exerciseHeaderInfo}>
                        <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{currentExercise.exerciseName}</Text>
                        <Text style={[styles.exerciseMeta, { color: theme.colors.textMuted }]}>
                          {currentExercise.muscleGroup} • {currentExercise.equipment}
                        </Text>
                      </View>
                    </View>

                    {/* Sets timeline */}
                    <View style={styles.timelineContainer}>
                      {currentExercise.sets.map((set, setIdx) => {
                        const isCompleted = set.completed;
                        const isActive = setIdx === activeSetIndex;
                        const isLast = setIdx === currentExercise.sets.length - 1;

                        return (
                          <View key={set.setNumber} style={styles.timelineRow}>
                            {/* Timeline left */}
                            <View style={styles.timelineLeft}>
                              <View style={[
                                styles.timelineDot,
                                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
                                isActive && !isCompleted && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
                              ]}>
                                <Text style={[
                                  styles.timelineDotText,
                                  { color: theme.colors.textSecondary },
                                  isCompleted && { color: theme.colors.success },
                                  isActive && !isCompleted && { color: theme.colors.primary },
                                ]}>
                                  {isCompleted ? '✓' : set.setNumber}
                                </Text>
                              </View>
                              {!isLast && (
                                <View style={[
                                  styles.timelineLine,
                                  { backgroundColor: theme.colors.border },
                                  isCompleted && { backgroundColor: theme.colors.success },
                                ]} />
                              )}
                            </View>

                            {/* Set card */}
                            <View style={[
                              styles.setCard,
                              { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                              isCompleted && { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
                              isActive && !isCompleted && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
                            ]}>
                              <View style={styles.setCardContent}>
                                {currentExercise.isTimeBased ? (
                                  <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                    {set.durationSeconds && set.durationSeconds > 0
                                      ? formatTime(set.durationSeconds)
                                      : formatTime(currentExercise.targetDurationSeconds || 0)}
                                    <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> tiempo</Text>
                                  </Text>
                                ) : (
                                  <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                    {set.reps}
                                    <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> reps</Text>
                                  </Text>
                                )}
                                <Text style={[styles.setCardDivider, { color: theme.colors.textMuted }]}>•</Text>
                                <Text style={[styles.setCardValue, { color: theme.colors.text }]}>
                                  {set.weight}
                                  <Text style={[styles.setCardUnit, { color: theme.colors.textMuted }]}> kg</Text>
                                </Text>
                              </View>

                              {/* Inputs for active set */}
                              {isActive && !isCompleted && !isDayCompleted && sessionId && (
                                <View style={styles.setInputs}>
                                  <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>Peso (kg)</Text>
                                    <TextInput
                                      style={[styles.setInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                      value={String(set.weight)}
                                      onChangeText={(text) => {
                                        const val = parseFloat(text) || 0;
                                        handleUpdateSetValue(currentExerciseIndex, setIdx, 'weight', val);
                                      }}
                                      keyboardType="numeric"
                                      placeholder="0"
                                      placeholderTextColor={theme.colors.textMuted}
                                      editable={!isDayCompleted}
                                    />
                                  </View>
                                  {!currentExercise.isTimeBased && (
                                    <View style={styles.inputGroup}>
                                      <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>Reps</Text>
                                      <TextInput
                                        style={[styles.setInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                        value={String(set.reps)}
                                        onChangeText={(text) => {
                                          const val = parseInt(text, 10) || 0;
                                          handleUpdateSetValue(currentExerciseIndex, setIdx, 'reps', val);
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.textMuted}
                                        editable={!isDayCompleted}
                                      />
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Next exercise card */}
                    {nextExercise && footerMode !== 'finish' && (
                      <View style={styles.nextExerciseSection}>
                        <Text style={[styles.nextExerciseLabel, { color: theme.colors.textMuted }]}>Siguiente ejercicio</Text>
                        <View style={[styles.nextExerciseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                          <View style={[styles.nextExerciseImagePlaceholder, { backgroundColor: theme.colors.background }]}>
                            <Text style={styles.nextExerciseImageText}>💪</Text>
                          </View>
                          <View style={styles.nextExerciseInfo}>
                            <Text style={[styles.nextExerciseName, { color: theme.colors.text }]}>{nextExercise.exerciseName}</Text>
                            <Text style={[styles.nextExerciseMeta, { color: theme.colors.textMuted }]}>
                              {nextExercise.sets.length} series
                              {nextExercise.isTimeBased
                                ? ` • ${formatTime(nextExercise.targetDurationSeconds || 0)}`
                                : ` • ${nextExercise.targetReps} reps`}
                              {` • ${nextExercise.targetReps} kg`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>No hay ejercicios para este día</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!isDayCompleted && (
            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight }]}>
              {footerMode === 'idle' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }, isSaving && styles.buttonDisabled]}
                  onPress={handleStartSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>
                    {isSaving ? 'Iniciando...' : 'Iniciar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              )}

              {footerMode === 'start_set' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleStartSet}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>Iniciar serie {getActiveSetText()}</Text>
                </TouchableOpacity>
              )}

              {footerMode === 'end_set' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
                  onPress={handleEndSet}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>Terminar serie {getActiveSetText()}</Text>
                  {currentExercise?.isTimeBased && (
                    <Text style={[styles.actionButtonSubtext, { color: theme.colors.surface }]}>
                      {formatTime(exerciseTimerSeconds)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {footerMode === 'rest' && (
                <View>
                  <Text style={[styles.restTitle, { color: theme.colors.text }]}>Descanso</Text>
                  <Text style={[styles.restTimerText, { color: theme.colors.text }]}>{formatTime(restTimerSeconds)}</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
                    onPress={handleCancelRest}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>Detener</Text>
                  </TouchableOpacity>
                  <Text style={[styles.cancelHint, { color: theme.colors.textMuted }]}>Tocar para detener el timer</Text>
                </View>
              )}

              {footerMode === 'next_exercise' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleNextExercise}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>Siguiente ejercicio</Text>
                  <Text style={[styles.actionButtonSubtext, { color: theme.colors.surface }]}>
                    {nextExercise?.exerciseName}
                  </Text>
                </TouchableOpacity>
              )}

              {footerMode === 'finish' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  onPress={handleCompleteSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.surface }]}>
                    {isSaving ? 'Finalizando...' : 'Finalizar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      {/* Complete Session Confirmation Modal */}
      <ConfirmModal
        visible={showCompleteModal}
        title="Finalizar entrenamiento"
        message="¿Estás seguro de que querés finalizar?"
        buttons={[
          { text: 'Cancelar', onPress: () => setShowCompleteModal(false), style: 'cancel' },
          { text: 'Finalizar', onPress: confirmCompleteSession, style: 'default' },
        ]}
        onClose={() => setShowCompleteModal(false)}
      />

      {/* Error Modal */}
      <ConfirmModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        buttons={[
          { text: 'OK', onPress: () => setShowErrorModal(false), style: 'default' },
        ]}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Incomplete Session Modal */}
      <ConfirmModal
        visible={showIncompleteModal}
        title={`${day?.name} incompleto`}
        message="¿Marcar como completado o retomar otro día?"
        buttons={[
          { text: 'Retomar otro día', onPress: handleIncompleteResume, style: 'cancel' },
          { text: 'Marcar completado', onPress: handleIncompleteMarkComplete, style: 'default' },
        ]}
        onClose={() => setShowIncompleteModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
  },
  dayName: {
    fontSize: 16,
    marginTop: 4,
  },
  dayTabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  dayTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayTabCheckmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  completedExerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  exerciseImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  exerciseImageText: {
    fontSize: 32,
  },
  exerciseHeaderInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 14,
  },
  timelineContainer: {
    marginBottom: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
  },
  setCard: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  setCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setCardValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  setCardUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  setCardDivider: {
    fontSize: 14,
    fontWeight: '500',
  },
  setInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  setInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextExerciseSection: {
    marginTop: 8,
  },
  nextExerciseLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  nextExerciseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextExerciseImageText: {
    fontSize: 24,
  },
  nextExerciseInfo: {
    flex: 1,
  },
  nextExerciseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextExerciseMeta: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionButtonSubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  restTimerText: {
    fontSize: 48,
    fontWeight: '200',
    textAlign: 'center',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  cancelHint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  completedBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  completedBannerSubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
