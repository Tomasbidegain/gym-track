import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';

interface SessionTimerProps {
  startedAt: Date;
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isForeground, setIsForeground] = useState(true);

  const calculateElapsed = useCallback(() => {
    const now = Date.now();
    const start = startedAt.getTime();
    return Math.max(0, Math.floor((now - start) / 1000));
  }, [startedAt]);

  useEffect(() => {
    // Derive immediately on mount to avoid initial 00:00 flash
    setElapsedSeconds(calculateElapsed());

    const interval = setInterval(() => {
      // Only update state while foreground to avoid unnecessary re-renders
      // but the derivation on focus will correct any drift
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setIsForeground(true);
        // Re-derive on focus to eliminate background drift
        setElapsedSeconds(calculateElapsed());
      } else {
        setIsForeground(false);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [calculateElapsed]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');

    if (hours > 0) {
      const hh = hours.toString().padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timerText, !isForeground && styles.pausedText]}>
        {formatTime(elapsedSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
  },
  pausedText: {
    color: '#888',
  },
});
