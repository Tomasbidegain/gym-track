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

export function TrainLobbyScreen({
  navigation,
}: TrainScreenProps<'TrainLobby'>) {
  const { routines, isLoading } = useRoutines();

  useEffect(() => {
    if (routines.length === 1) {
      navigation.replace('DaySelection', { routineId: routines[0].id });
    }
  }, [routines, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Cargando rutinas...</Text>
      </View>
    );
  }

  if (routines.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No tenes rutinas creadas</Text>
        <Text style={styles.hintText}>Crea una rutina para empezar a entrenar</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Elegi una rutina</Text>
      {routines.map((routine) => (
        <TouchableOpacity
          key={routine.id}
          style={styles.card}
          onPress={() => navigation.navigate('DaySelection', { routineId: routine.id })}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>{routine.name}</Text>
          {routine.description ? (
            <Text style={styles.cardDescription}>{routine.description}</Text>
          ) : null}
          <Text style={styles.cardMeta}>
            {routine.days.length} {routine.days.length === 1 ? 'dia' : 'dias'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});
