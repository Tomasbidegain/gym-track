import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { TrainScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';

export function TrainLobbyScreen({
  navigation,
}: TrainScreenProps<'TrainLobby'>) {
  const { theme } = useTheme();
  const { routines, isLoading } = useRoutines();

  useEffect(() => {
    if (routines.length === 1) {
      navigation.replace('DaySelection', { routineId: routines[0].id });
    }
  }, [routines, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Skeleton width="60%" height={28} borderRadius={8} style={{ marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} elevated>
              <Skeleton width="50%" height={22} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="30%" height={14} borderRadius={8} />
            </Card>
          ))}
        </View>
      </View>
    );
  }

  if (routines.length === 0) {
    return (
      <EmptyState
        icon="🏋️"
        title="No tenes rutinas creadas"
        message="Crea una rutina para empezar a entrenar"
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Elegi una rutina</Text>
      {routines.map((routine) => (
        <TouchableOpacity
          key={routine.id}
          onPress={() => navigation.navigate('DaySelection', { routineId: routine.id })}
          activeOpacity={0.8}
        >
          <Card elevated>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{routine.name}</Text>
            {routine.description ? (
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>{routine.description}</Text>
            ) : null}
            <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>
              {routine.days.length} {routine.days.length === 1 ? 'dia' : 'dias'}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
});
