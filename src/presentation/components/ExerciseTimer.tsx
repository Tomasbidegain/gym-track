import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
} from 'react-native';

interface ExerciseTimerProps {
  onComplete: (durationSeconds: number) => void;
  targetDuration?: number;
}

// Module-level singleton for single-active timer enforcement.
// Only one ExerciseTimer may be running at a time across the entire app.
type TimerListener = (activeId: string | null) => void;

const listeners = new Set<TimerListener>();
let activeTimerId: string | null = null;

function setGlobalActiveTimer(id: string | null) {
  activeTimerId = id;
  listeners.forEach((cb) => cb(id));
}

export function ExerciseTimer({ onComplete, targetDuration }: ExerciseTimerProps) {
  const [timerId] = useState(() =>
    Math.random().toString(36).slice(2)
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  const startedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  // Keep ref in sync with state so AppState listener always sees latest value
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Calculate elapsed seconds from wall-clock time, accounting for pauses
  const getElapsedSeconds = useCallback(() => {
    if (startedAtRef.current === null) return 0;
    const now = Date.now();
    let paused = pausedDurationRef.current;
    if (pauseStartedAtRef.current !== null) {
      paused += now - pauseStartedAtRef.current;
    }
    return Math.max(0, Math.floor((now - startedAtRef.current - paused) / 1000));
  }, []);

  // Single active timer enforcement: stop when another timer starts
  useEffect(() => {
    const handleActiveChange = (id: string | null) => {
      if (id !== timerId && isRunningRef.current) {
        setIsRunning(false);
        if (activeTimerId === timerId) {
          setGlobalActiveTimer(null);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const finalDuration = getElapsedSeconds();
        if (finalDuration > 0) {
          setIsCompleted(true);
        }
        onComplete(finalDuration);
      }
    };
    listeners.add(handleActiveChange);
    return () => {
      listeners.delete(handleActiveChange);
    };
  }, [timerId, onComplete, getElapsedSeconds]);

  // Interval management: only for UI re-renders, not time accumulation
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(getElapsedSeconds());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, getElapsedSeconds]);

  // AppState handling: pause on background, resume on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (pauseStartedAtRef.current !== null) {
          const now = Date.now();
          pausedDurationRef.current += now - pauseStartedAtRef.current;
          pauseStartedAtRef.current = null;
          setIsRunning(true);
          // Re-assert this timer as the global active one after returning
          setGlobalActiveTimer(timerId);
          setElapsedSeconds(getElapsedSeconds());
        }
      } else {
        if (isRunningRef.current && pauseStartedAtRef.current === null) {
          pauseStartedAtRef.current = Date.now();
          setIsRunning(false);
        }
      }
    });

    return () => subscription.remove();
  }, [timerId, getElapsedSeconds]);

  const handleStart = useCallback(() => {
    // Reset if starting a new run after completion
    if (isCompleted) {
      setIsCompleted(false);
      startedAtRef.current = Date.now();
      pausedDurationRef.current = 0;
      pauseStartedAtRef.current = null;
    } else if (startedAtRef.current === null) {
      // First start
      startedAtRef.current = Date.now();
      pausedDurationRef.current = 0;
      pauseStartedAtRef.current = null;
    }
    setIsRunning(true);
    setGlobalActiveTimer(timerId);
    setElapsedSeconds(getElapsedSeconds());
  }, [timerId, isCompleted, getElapsedSeconds]);

  const handleStop = useCallback(() => {
    const finalDuration = getElapsedSeconds();
    setIsRunning(false);
    if (activeTimerId === timerId) {
      setGlobalActiveTimer(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (finalDuration > 0) {
      setIsCompleted(true);
    }
    onComplete(finalDuration);
  }, [timerId, onComplete, getElapsedSeconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text
          style={[
            styles.timerText,
            isRunning && styles.timerTextRunning,
            isCompleted && styles.timerTextCompleted,
          ]}
        >
          {formatTime(elapsedSeconds)}
        </Text>
        {targetDuration ? (
          <Text style={styles.targetText}> / {formatTime(targetDuration)}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isRunning && styles.buttonRunning,
          isCompleted && styles.buttonCompleted,
        ]}
        onPress={isRunning ? handleStop : handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Stop' : isCompleted ? 'Done' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    fontVariant: ['tabular-nums'],
    minWidth: 50,
  },
  timerTextRunning: {
    color: '#4caf50',
  },
  timerTextCompleted: {
    color: '#2f95dc',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
    fontVariant: ['tabular-nums'],
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  buttonRunning: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  buttonCompleted: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
});
