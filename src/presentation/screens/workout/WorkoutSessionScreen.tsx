import React, { useCallback, useState, useEffect, useRef } from 'react';
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
import { RestTimer } from '../../components/RestTimer';
import { SessionTimer } from '../../components/SessionTimer';
import { ExerciseTimer } from '../../components/ExerciseTimer';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useWorkoutSessionContext } from '../../context/WorkoutSessionContext';
import { useCompletedDaysInWeek } from '../../hooks/useCompletedDaysInWeek';
import { generateSetsFromRoutine } from '../../../domain';
import type { RoutineDay, RoutineExercise, WorkoutExercise, WorkoutSet } from '../../../domain';

// Extended exercise type that includes both routine metadata and workout set data
type SessionExercise = WorkoutExercise & {
  restSeconds: number;
  isTimeBased?: boolean;
  targetDurationSeconds?: number;
};

export function WorkoutSessionScreen({ route, navigation }: TrainScreenProps<'WorkoutSession'>) {
  const { routineId, dayId: initialDayId } = route.params;
  const { routines, updateRoutine } = useRoutines();
  const { startSession, updateSet, completeSession, markSessionComplete, sessions } = useWorkoutSessionContext();
  const { completedDayIds, isLoading: isLoadingCompletedDays, refresh: refreshCompletedDays } = useCompletedDaysInWeek(routineId);

  // Local state for current day (no navigation between days)
  const [currentDayId, setCurrentDayId] = useState(initialDayId);

  // Refresh completed days only once on mount
  useEffect(() => {
    refreshCompletedDays();
  }, [refreshCompletedDays]);

  const routine = routines.find((r) => r.id === routineId);
  const day = routine?.days.find((d) => d.id === currentDayId);

  const isDayCompleted = completedDayIds.has(currentDayId);

  // Find the completed session for this day (most recent completed this week)
  const completedSession = React.useMemo(() => {
    if (!isDayCompleted) return null;
    return sessions.find(
      (s) => s.dayId === currentDayId && s.routineId === routineId && s.isCompleted
    ) || null;
  }, [isDayCompleted, sessions, currentDayId, routineId]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const activeSession = sessionId ? sessions.find((s) => s.id === sessionId) : null;
  const sessionCompletedRef = React.useRef(false);

  const [exercises, setExercises] = useState<SessionExercise[]>(() => {
    if (!day) return [];
    if (completedSession) {
      // Merge session data with routine metadata for completed days
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
    return day.exercises.map((ex) => ({
      ...ex,
      sets: generateSetsFromRoutine(ex),
    }));
  });
  const [isSaving, setIsSaving] = useState(false);

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
      setExercises(
        day.exercises.map((ex) => ({
          ...ex,
          sets: generateSetsFromRoutine(ex),
        }))
      );
      setSessionId(null);
    }
  }, [isDayCompleted, completedSession, day, currentDayId]);

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [timerExerciseName, setTimerExerciseName] = useState('');
  const [timerSetNumber, setTimerSetNumber] = useState(0);
  const [timerNextSet, setTimerNextSet] = useState<number | undefined>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartSession = useCallback(async () => {
    if (!routine || !day) {
      console.log('No hay routine o day');
      return;
    }
    console.log('Iniciando sesion...');
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
      console.log('Session creada:', session);
      if (session) {
        setSessionId(session.id);
      } else {
        console.log('Session es null');
      }
    } catch (error) {
      console.error('Error al iniciar sesion:', error);
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
    }
    setIsSaving(false);
  }, [routine, day, exercises, startSession]);

  // Timer countdown effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setTimerRunning(false);
            // Keep showing "finished" state for 2 seconds, then hide
            setTimeout(() => {
              setTimerActive(false);
            }, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerRunning, timerSeconds]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Intercept navigation exit when session is incomplete
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Allow navigation if no session or session was just completed
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
      // Allow navigation if no session or session was just completed
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

  const handleUpdateSet = useCallback(
    async (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
      if (!sessionId) return;
      const newExercises = [...exercises];
      newExercises[exerciseIndex].sets[setIndex] = {
        ...newExercises[exerciseIndex].sets[setIndex],
        [field]: value,
      };
      setExercises(newExercises);

      await updateSet(sessionId, {
        exerciseIndex,
        setIndex,
        reps: newExercises[exerciseIndex].sets[setIndex].reps,
        weight: newExercises[exerciseIndex].sets[setIndex].weight,
        completed: newExercises[exerciseIndex].sets[setIndex].completed,
      });
    },
    [sessionId, exercises, updateSet],
  );

  const handleToggleSet = useCallback(
    async (exerciseIndex: number, setIndex: number) => {
      if (!sessionId) return;
      if (timerActive && timerRunning) return; // Block during active rest timer
      
      const newExercises = [...exercises];
      const set = newExercises[exerciseIndex].sets[setIndex];
      const wasCompleted = set.completed;
      set.completed = !set.completed;
      setExercises(newExercises);

      // Start timer immediately when set is completed (not when uncompleted)
      if (!wasCompleted && set.completed && routine) {
        const exercise = newExercises[exerciseIndex];
        const restSeconds = exercise.restSeconds || 90;
        const nextSetIdx = exercise.sets.findIndex((s, idx) => idx > setIndex && !s.completed);
        
        setTimerExerciseName(exercise.exerciseName);
        setTimerSetNumber(setIndex + 1);
        setTimerNextSet(nextSetIdx >= 0 ? nextSetIdx + 1 : undefined);
        setTimerSeconds(restSeconds);
        setTimerTotal(restSeconds);
        setTimerActive(true);
        setTimerRunning(true);
      }

      await updateSet(sessionId, {
        exerciseIndex,
        setIndex,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed,
      });
    },
    [sessionId, exercises, updateSet, routine, timerActive, timerRunning],
  );

  // Timer functions
  const handlePauseTimer = useCallback(() => {
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleResumeTimer = useCallback(() => {
    setTimerRunning(true);
  }, []);

  const handleCancelTimer = useCallback(() => {
    setTimerActive(false);
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleAddTime = useCallback((seconds: number) => {
    setTimerSeconds((prev) => prev + seconds);
    setTimerTotal((prev) => prev + seconds);
  }, []);

  const handleTimerComplete = useCallback(
    async (exerciseIndex: number, setIndex: number, durationSeconds: number) => {
      if (!sessionId) return;
      if (durationSeconds <= 0) return;

      const newExercises = [...exercises];
      const set = newExercises[exerciseIndex].sets[setIndex];
      set.completed = true;
      set.durationSeconds = durationSeconds;
      setExercises(newExercises);

      // Start rest timer immediately
      if (routine) {
        const exercise = newExercises[exerciseIndex];
        const restSeconds = exercise.restSeconds || 90;
        const nextSetIdx = exercise.sets.findIndex((s, idx) => idx > setIndex && !s.completed);

        setTimerExerciseName(exercise.exerciseName);
        setTimerSetNumber(setIndex + 1);
        setTimerNextSet(nextSetIdx >= 0 ? nextSetIdx + 1 : undefined);
        setTimerSeconds(restSeconds);
        setTimerTotal(restSeconds);
        setTimerActive(true);
        setTimerRunning(true);
      }

      await updateSet(sessionId, {
        exerciseIndex,
        setIndex,
        reps: set.reps,
        weight: set.weight,
        completed: true,
        durationSeconds,
      });
    },
    [sessionId, exercises, updateSet, routine],
  );

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
            
            // Update routine with new weights/reps
            const updatedDays: RoutineDay[] = routine.days.map((d) => {
              if (d.id !== currentDayId) return d;
              
              const updatedExercises = d.exercises.map((ex) => {
                const sessionExercise = exercises.find((se) => se.exerciseId === ex.exerciseId);
                if (!sessionExercise) return ex;
                
                // Calculate averages from completed sets
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
            
            await updateRoutine(routineId, {
              days: updatedDays,
            });
            
            await completeSession(sessionId);
            sessionCompletedRef.current = true;
            setIsSaving(false);
            // Cancel timer if active
            handleCancelTimer();
            navigation.goBack();
          },
        },
      ],
    );
  }, [sessionId, routine, currentDayId, exercises, completeSession, updateRoutine, routineId, navigation]);

  if (!routine || !day) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Rutina no encontrada</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.dayName}>{day.name}</Text>
        </View>
        {activeSession && (
          <SessionTimer startedAt={activeSession.startedAt} />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsContainer}
        contentContainerStyle={styles.dayTabsContent}
      >
        {routine.days.map((d) => {
          const isDayCompleted = completedDayIds.has(d.id);
          const isActive = d.id === currentDayId;
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.dayTab,
                isActive && isDayCompleted && styles.dayTabActiveCompleted,
                isActive && !isDayCompleted && styles.dayTabActive,
                !isActive && isDayCompleted && styles.dayTabCompleted,
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
                  isActive && isDayCompleted && styles.dayTabTextActiveCompleted,
                  isActive && !isDayCompleted && styles.dayTabTextActive,
                  !isActive && isDayCompleted && styles.dayTabTextCompleted,
                ]}
              >
                {d.name}
              </Text>
              {isDayCompleted && (
                <Text style={[
                  styles.dayTabCheckmark,
                  isActive && isDayCompleted && styles.dayTabTextActiveCompleted
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
              <Text style={styles.completedBannerText}>
                Día completado
              </Text>
              <Text style={styles.completedBannerSubtext}>
                Duración: {(() => {
                  const mins = Math.floor((completedSession.totalDurationSeconds || 0) / 60);
                  const secs = (completedSession.totalDurationSeconds || 0) % 60;
                  return `${mins} min ${secs} seg`;
                })()}
              </Text>
            </View>
          )}

          <ScrollView style={styles.scrollContent}>
            {exercises.map((exercise, exIndex) => (
              <View key={exercise.exerciseId} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                <Text style={styles.exerciseInfo}>
                  {exercise.muscleGroup} • {exercise.equipment}
                </Text>

                <View style={styles.setsContainer}>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={set.setNumber} style={styles.setRow}>
                      <Text style={styles.setNumber}>Set {set.setNumber}</Text>

                      {exercise.isTimeBased ? (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Peso (kg)</Text>
                            <TextInput
                              style={styles.setInput}
                              value={String(set.weight)}
                              onChangeText={(text) => {
                                const val = parseFloat(text) || 0;
                                handleUpdateSet(exIndex, setIndex, 'weight', val);
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                              editable={!!sessionId && !isDayCompleted}
                            />
                          </View>

                          {sessionId && !isDayCompleted ? (
                            <ExerciseTimer
                              onComplete={(duration) => handleTimerComplete(exIndex, setIndex, duration)}
                              targetDuration={exercise.targetDurationSeconds}
                            />
                          ) : (
                            <View style={styles.timerPlaceholder}>
                              <Text style={styles.timerPlaceholderText}>
                                {set.durationSeconds
                                  ? `${Math.floor(set.durationSeconds / 60).toString().padStart(2, '0')}:${(set.durationSeconds % 60).toString().padStart(2, '0')}`
                                  : '--:--'}
                              </Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Peso (kg)</Text>
                            <TextInput
                              style={styles.setInput}
                              value={String(set.weight)}
                              onChangeText={(text) => {
                                const val = parseFloat(text) || 0;
                                handleUpdateSet(exIndex, setIndex, 'weight', val);
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                              editable={!!sessionId && !isDayCompleted}
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Reps</Text>
                            <TextInput
                              style={styles.setInput}
                              value={String(set.reps)}
                              onChangeText={(text) => {
                                const val = parseInt(text, 10) || 0;
                                handleUpdateSet(exIndex, setIndex, 'reps', val);
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                              editable={!!sessionId && !isDayCompleted}
                            />
                          </View>

                          {sessionId && !isDayCompleted && (
                            <TouchableOpacity
                              style={[
                                styles.checkButton,
                                set.completed && styles.checkButtonActive,
                                (timerActive && timerRunning) && styles.checkButtonDisabled
                              ]}
                              onPress={() => handleToggleSet(exIndex, setIndex)}
                              disabled={timerActive && timerRunning}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.checkButtonText}>
                                {set.completed ? '✓' : ''}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {!isDayCompleted && (
            <View style={styles.footer}>
              {!sessionId ? (
                <TouchableOpacity
                  style={[styles.startButton, isSaving && styles.buttonDisabled]}
                  onPress={handleStartSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startButtonText}>
                    {isSaving ? 'Iniciando...' : 'Iniciar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.completeButton, isSaving && styles.buttonDisabled]}
                  onPress={handleCompleteSession}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeButtonText}>
                    {isSaving ? 'Finalizando...' : 'Finalizar entrenamiento'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      <RestTimer
        isActive={timerActive}
        isRunning={timerRunning}
        seconds={timerSeconds}
        totalSeconds={timerTotal}
        exerciseName={timerExerciseName}
        setNumber={timerSetNumber}
        nextSetNumber={timerNextSet}
        onPause={handlePauseTimer}
        onResume={handleResumeTimer}
        onCancel={handleCancelTimer}
        onAddTime={handleAddTime}
      />
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
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 50,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#e0e0e0',
    borderColor: '#bdbdbd',
  },
  checkButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  timerPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  timerPlaceholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    paddingVertical: 14,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButton: {
    paddingVertical: 14,
    backgroundColor: '#4caf50',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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