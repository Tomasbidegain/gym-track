import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
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
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, fadeAnim, slideAnim]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />

        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.card}>
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

            <Animated.View
              style={[styles.content, { transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={[styles.restLabel, { color }]}>DESCANSO</Text>

              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={2}>
                  {exerciseName}
                </Text>
                <Text style={styles.subtitle}>
                  Set {setNumber} completado
                  {nextSetNumber ? ` \u2022 Próximo: Set ${nextSetNumber}` : ''}
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
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 10,
  },
  progressBar: {
    height: '100%',
  },
  content: {
    padding: 28,
    paddingTop: 24,
    alignItems: 'center',
  },
  restLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerText: {
    fontSize: 80,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
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
    paddingVertical: 14,
    borderRadius: 14,
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
    width: '100%',
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  quickAddText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
