import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface RestTimerProps {
  isActive: boolean;
  isRunning: boolean;
  seconds: number;
  totalSeconds: number;
  exerciseName: string;
  setNumber: number;
  nextSetNumber?: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onAddTime: (seconds: number) => void;
}

export function RestTimer({
  isActive,
  isRunning,
  seconds,
  totalSeconds,
  exerciseName,
  setNumber,
  nextSetNumber,
  onPause,
  onResume,
  onCancel,
  onAddTime,
}: RestTimerProps) {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  
  const getColor = () => {
    const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
    if (percentage > 60) return '#4caf50';
    if (percentage > 30) return '#ff9800';
    return '#f44336';
  };

  const color = getColor();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    if (seconds <= 10 && seconds > 0 && isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [seconds, isRunning, pulseAnim]);

  useEffect(() => {
    if (isActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, fadeAnim]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
      <View style={[styles.progressBarContainer, { backgroundColor: `${color}20` }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.restLabel, { color }]}>DESCANSO</Text>
        
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={styles.subtitle}>
            Set {setNumber} completado
            {nextSetNumber ? ` • Próximo: Set ${nextSetNumber}` : ''}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color }]}>
            {formatTime(seconds)}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: `${color}15`, borderColor: color }]}
            onPress={isRunning ? onPause : onResume}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {isRunning ? (
                <View style={styles.pauseIcon}>
                  <View style={[styles.pauseBar, { backgroundColor: color }]} />
                  <View style={[styles.pauseBar, { backgroundColor: color }]} />
                </View>
              ) : (
                <View style={[styles.playIcon, { borderLeftColor: color }]} />
              )}
            </View>
            <Text style={[styles.controlButtonText, { color }]}>
              {isRunning ? 'Pausar' : 'Reanudar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <View style={styles.cancelIcon}>
                <View style={[styles.cancelLine1, { backgroundColor: '#d32f2f' }]} />
                <View style={[styles.cancelLine2, { backgroundColor: '#d32f2f' }]} />
              </View>
            </View>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickAdd}>
          <TouchableOpacity
            style={[styles.quickAddButton, { borderColor: color }]}
            onPress={() => onAddTime(15)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickAddText, { color }]}>+15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAddButton, { borderColor: color }]}
            onPress={() => onAddTime(30)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickAddText, { color }]}>+30s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAddButton, { borderColor: color }]}
            onPress={() => onAddTime(60)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickAddText, { color }]}>+1min</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressBar: {
    height: '100%',
    borderTopLeftRadius: 20,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  restLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  controlButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#ffcdd2',
    gap: 8,
  },
  cancelIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  cancelLine1: {
    position: 'absolute',
    width: 20,
    height: 3,
    top: 6.5,
    left: -2,
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  cancelLine2: {
    position: 'absolute',
    width: 20,
    height: 3,
    top: 6.5,
    left: -2,
    borderRadius: 1.5,
    transform: [{ rotate: '-45deg' }],
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d32f2f',
  },
  quickAdd: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  quickAddText: {
    fontSize: 15,
    fontWeight: '700',
  },
});