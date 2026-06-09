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
  const wasRunningBeforeBackground = useRef(false);

  // Keep ref in sync with state so AppState listener always sees latest value
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Single active timer enforcement: stop when another timer starts
  useEffect(() => {
    const handleActiveChange = (id: string | null) => {
      if (id !== timerId && isRunningRef.current) {
        handleStopInternal();
      }
    };
    listeners.add(handleActiveChange);
    return () => {
      listeners.delete(handleActiveChange);
    };
  }, [timerId]);

  // Interval management
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
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
  }, [isRunning]);

  // AppState handling: pause on background, resume on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (wasRunningBeforeBackground.current) {
          setIsRunning(true);
          // Re-assert this timer as the global active one after returning
          setGlobalActiveTimer(timerId);
        }
      } else {
        wasRunningBeforeBackground.current = isRunningRef.current;
        if (isRunningRef.current) {
          setIsRunning(false);
        }
      }
    });

    return () => subscription.remove();
  }, [timerId]);

  const handleStopInternal = useCallback(() => {
    setIsRunning(false);
    if (activeTimerId === timerId) {
      setGlobalActiveTimer(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerId]);

  const handleStart = useCallback(() => {
    // Reset if starting a new run after completion
    if (isCompleted) {
      setIsCompleted(false);
      setElapsedSeconds(0);
    }
    setIsRunning(true);
    setGlobalActiveTimer(timerId);
  }, [timerId, isCompleted]);

  const handleStop = useCallback(() => {
    handleStopInternal();

    const finalDuration = elapsedSeconds;
    if (finalDuration > 0) {
      setIsCompleted(true);
    }
    onComplete(finalDuration);
  }, [handleStopInternal, elapsedSeconds, onComplete]);

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
