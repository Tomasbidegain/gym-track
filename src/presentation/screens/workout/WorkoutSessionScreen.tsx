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
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SessionTimer } from '../../components/SessionTimer';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useWorkoutSessionContext } from '../../context/WorkoutSessionContext';
import { useCompletedDaysInWeek } from '../../hooks/useCompletedDaysInWeek';
import { generateSetsFromRoutine } from '../../../domain';
import type { RoutineDay, WorkoutExercise } from '../../../domain';

type SessionExercise = WorkoutExercise & {
  restSeconds: number;
  isTimeBased?: boolean;
  targetDurationSeconds?: number;
  targetReps: number;
  targetSets: number;
};

type FooterMode = 'idle' | 'start_set' | 'end_set' | 'rest' | 'next_exercise' | 'finish';

export function WorkoutSessionScreen({ route, navigation }: TrainScreenProps<'WorkoutSession'>) {
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
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
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
      Alert.alert(
        `${day?.name} is incomplete`,
        'Mark as completed or resume another day?',
        [
          {
            text: 'Resume later',
            style: 'cancel',
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: 'Mark complete',
            onPress: async () => {
              await markSessionComplete(sessionId);
              navigation.dispatch(e.data.action);
            },
          },
        ],
        { cancelable: true },
      );
    });

    return unsubscribe;
  }, [navigation, sessionId, sessions, markSessionComplete, day]);

  // Android hardware back fallback
  useEffect(() => {
    const onBackPress = () => {
      if (!sessionId || sessionCompletedRef.current) return false;
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.isCompleted) return false;

      Alert.alert(
        `${day?.name} is incomplete`,
        'Mark as completed or resume another day?',
        [
          {
            text: 'Resume later',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Mark complete',
            onPress: async () => {
              await markSessionComplete(sessionId);
              navigation.goBack();
            },
          },
        ],
        { cancelable: true },
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [sessionId, sessions, markSessionComplete, day, navigation]);

  const handleCompleteSession = useCallback(async () => {
    if (!sessionId || !routine) return;
    Alert.alert(
      'Finalizar entrenamiento',
      '¿Estas seguro de que queres finalizar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
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
          },
        },
      ],
    );
  }, [sessionId, routine, currentDayId, exercises, completeSession, updateRoutine, routineId, navigation]);

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
      <View style={styles.container}>
        <Text style={styles.errorText}>Rutina no encontrada</Text>
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.dayName}>{day.name}</Text>
        </View>
        {activeSession && (
          <SessionTimer startedAt={activeSession.startedAt} />
        )}
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsContainer}
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
                isActive && isCompleted && styles.dayTabActiveCompleted,
                isActive && !isCompleted && styles.dayTabActive,
                !isActive && isCompleted && styles.dayTabCompleted,
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
                  isActive && isCompleted && styles.dayTabTextActiveCompleted,
                  isActive && !isCompleted && styles.dayTabTextActive,
                  !isActive && isCompleted && styles.dayTabTextCompleted,
                ]}
              >
                {d.name}
              </Text>
              {isCompleted && (
                <Text style={[
                  styles.dayTabCheckmark,
                  isActive && isCompleted && styles.dayTabTextActiveCompleted
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
          <ActivityIndicator size="small" color="#2f95dc" />
        </View>
      ) : (
        <>
          {isDayCompleted && completedSession && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerText}>Día completado</Text>
              <Text style={styles.completedBannerSubtext}>
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
                  <View key={ex.exerciseId} style={styles.completedExerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseHeaderInfo}>
                        <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                        <Text style={styles.exerciseMeta}>
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
                                isCompleted && styles.timelineDotCompleted,
                              ]}>
                                <Text style={[
                                  styles.timelineDotText,
                                  isCompleted && styles.timelineDotTextCompleted,
                                ]}>
                                  {isCompleted ? '✓' : set.setNumber}
                                </Text>
                              </View>
                              {!isLast && (
                                <View style={[
                                  styles.timelineLine,
                                  isCompleted && styles.timelineLineCompleted,
                                ]} />
                              )}
                            </View>

                            <View style={[
                              styles.setCard,
                              isCompleted && styles.setCardCompleted,
                            ]}>
                              <View style={styles.setCardContent}>
                                {ex.isTimeBased ? (
                                  <Text style={styles.setCardValue}>
                                    {set.durationSeconds && set.durationSeconds > 0
                                      ? formatTime(set.durationSeconds)
                                      : formatTime(ex.targetDurationSeconds || 0)}
                                    <Text style={styles.setCardUnit}> tiempo</Text>
                                  </Text>
                                ) : (
                                  <Text style={styles.setCardValue}>
                                    {set.reps}
                                    <Text style={styles.setCardUnit}> reps</Text>
                                  </Text>
                                )}
                                <Text style={styles.setCardDivider}>•</Text>
                                <Text style={styles.setCardValue}>
                                  {set.weight}
                                  <Text style={styles.setCardUnit}> kg</Text>
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
                      <View style={styles.exerciseImagePlaceholder}>
                        <Text style={styles.exerciseImageText}>💪</Text>
                      </View>
                      <View style={styles.exerciseHeaderInfo}>
                        <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
                        <Text style={styles.exerciseMeta}>
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
                                isCompleted && styles.timelineDotCompleted,
                                isActive && !isCompleted && styles.timelineDotActive,
                              ]}>
                                <Text style={[
                                  styles.timelineDotText,
                                  isCompleted && styles.timelineDotTextCompleted,
                                  isActive && !isCompleted && styles.timelineDotTextActive,
                                ]}>
                                  {isCompleted ? '✓' : set.setNumber}
                                </Text>
                              </View>
                              {!isLast && (
                                <View style={[
                                  styles.timelineLine,
                                  isCompleted && styles.timelineLineCompleted,
                                ]} />
                              )}
                            </View>

                            {/* Set card */}
                            <View style={[
                              styles.setCard,
                              isCompleted && styles.setCardCompleted,
                              isActive && !isCompleted && styles.setCardActive,
                            ]}>
                              <View style={styles.setCardContent}>
                                {currentExercise.isTimeBased ? (
                                  <Text style={styles.setCardValue}>
                                    {set.durationSeconds && set.durationSeconds > 0
                                      ? formatTime(set.durationSeconds)
                                      : formatTime(currentExercise.targetDurationSeconds || 0)}
                                    <Text style={styles.setCardUnit}> tiempo</Text>
                                  </Text>
                                ) : (
                                  <Text style={styles.setCardValue}>
                                    {set.reps}
                                    <Text style={styles.setCardUnit}> reps</Text>
                                  </Text>
                                )}
                                <Text style={styles.setCardDivider}>•</Text>
                                <Text style={styles.setCardValue}>
                                  {set.weight}
                                  <Text style={styles.setCardUnit}> kg</Text>
                                </Text>
                              </View>

                              {/* Inputs for active set */}
                              {isActive && !isCompleted && !isDayCompleted && sessionId && (
                                <View style={styles.setInputs}>
                                  <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Peso (kg)</Text>
                                    <TextInput
                                      style={styles.setInput}
                                      value={String(set.weight)}
                                      onChangeText={(text) => {
                                        const val = parseFloat(text) || 0;
                                        handleUpdateSetValue(currentExerciseIndex, setIdx, 'weight', val);
                                      }}
                                      keyboardType="numeric"
                                      placeholder="0"
                                      placeholderTextColor="#888"
                                      editable={!isDayCompleted}
                                    />
                                  </View>
                                  {!currentExercise.isTimeBased && (
                                    <View style={styles.inputGroup}>
                                      <Text style={styles.inputLabel}>Reps</Text>
                                      <TextInput
                                        style={styles.setInput}
                                        value={String(set.reps)}
                                        onChangeText={(text) => {
                                          const val = parseInt(text, 10) || 0;
                                          handleUpdateSetValue(currentExerciseIndex, setIdx, 'reps', val);
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#888"
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
                        <Text style={styles.nextExerciseLabel}>Siguiente ejercicio</Text>
                        <View style={styles.nextExerciseCard}>
                          <View style={styles.nextExerciseImagePlaceholder}>
                            <Text style={styles.nextExerciseImageText}>💪</Text>
                          </View>
                          <View style={styles.nextExerciseInfo}>
                            <Text style={styles.nextExerciseName}>{nextExercise.exerciseName}</Text>
                            <Text style={styles.nextExerciseMeta}>
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
                    <Text style={styles.emptyStateText}>No hay ejercicios para este día</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!isDayCompleted && (
            <View style={styles.footer}>
              {footerMode === 'idle' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonStart, isSaving && styles.buttonDisabled]}
                  onPress={handleStartSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>
                    {isSaving ? 'Iniciando...' : 'Iniciar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              )}

              {footerMode === 'start_set' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonStart]}
                  onPress={handleStartSet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Iniciar serie {getActiveSetText()}</Text>
                </TouchableOpacity>
              )}

              {footerMode === 'end_set' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonEnd]}
                  onPress={handleEndSet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Terminar serie {getActiveSetText()}</Text>
                  {currentExercise?.isTimeBased && (
                    <Text style={styles.actionButtonSubtext}>
                      {formatTime(exerciseTimerSeconds)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {footerMode === 'rest' && (
                <View>
                  <Text style={styles.restTitle}>Descanso</Text>
                  <Text style={styles.restTimerText}>{formatTime(restTimerSeconds)}</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonRest]}
                    onPress={handleCancelRest}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Detener</Text>
                  </TouchableOpacity>
                  <Text style={styles.cancelHint}>Tocar para detener el timer</Text>
                </View>
              )}

              {footerMode === 'next_exercise' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonNext]}
                  onPress={handleNextExercise}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Siguiente ejercicio</Text>
                  <Text style={styles.actionButtonSubtext}>
                    {nextExercise?.exerciseName}
                  </Text>
                </TouchableOpacity>
              )}

              {footerMode === 'finish' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonFinish]}
                  onPress={handleCompleteSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>
                    {isSaving ? 'Finalizando...' : 'Finalizar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dayName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  dayTabsContainer: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayTabActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2f95dc',
  },
  dayTabCompleted: {
    backgroundColor: '#f0f9f0',
    borderColor: '#4caf50',
  },
  dayTabActiveCompleted: {
    backgroundColor: '#4caf50',
    borderColor: '#388e3c',
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  dayTabTextActive: {
    color: '#2f95dc',
  },
  dayTabTextCompleted: {
    color: '#4caf50',
  },
  dayTabTextActiveCompleted: {
    color: '#fff',
  },
  dayTabCheckmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4caf50',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  completedExerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 14,
    color: '#888',
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
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotActive: {
    borderColor: '#2f95dc',
    backgroundColor: '#e3f2fd',
  },
  timelineDotCompleted: {
    borderColor: '#4caf50',
    backgroundColor: '#f0f9f0',
  },
  timelineDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  timelineDotTextActive: {
    color: '#2f95dc',
  },
  timelineDotTextCompleted: {
    color: '#4caf50',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e8e8e8',
    minHeight: 40,
  },
  timelineLineCompleted: {
    backgroundColor: '#4caf50',
  },
  setCard: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  setCardActive: {
    borderColor: '#2f95dc',
    backgroundColor: '#e3f2fd',
  },
  setCardCompleted: {
    borderColor: '#4caf50',
    backgroundColor: '#f0f9f0',
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
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
  },
  setCardUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  setCardDivider: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
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
    color: '#888',
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  nextExerciseSection: {
    marginTop: 8,
  },
  nextExerciseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  nextExerciseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
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
    color: '#1a1a1a',
    marginBottom: 2,
  },
  nextExerciseMeta: {
    fontSize: 13,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    paddingVertical: 16,
    backgroundColor: '#2f95dc',
    borderRadius: 14,
    alignItems: 'center',
  },
  actionButtonStart: {
    backgroundColor: '#2f95dc',
  },
  actionButtonEnd: {
    backgroundColor: '#ff9500',
  },
  actionButtonRest: {
    backgroundColor: '#ff6b35',
  },
  actionButtonNext: {
    backgroundColor: '#2f95dc',
  },
  actionButtonFinish: {
    backgroundColor: '#4caf50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  actionButtonSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff90',
    marginTop: 2,
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  restTimerText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  cancelHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  completedBanner: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  completedBannerSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e8f5e9',
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 40,
  },
});
