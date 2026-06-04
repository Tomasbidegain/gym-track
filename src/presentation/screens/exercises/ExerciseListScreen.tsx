import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { ExerciseScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';
import { ExerciseCard } from '../../components/ExerciseCard';
import type { MuscleGroup, Equipment } from '../../../domain';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../../../domain';

const muscleGroupLabels: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  core: 'Core',
  forearms: 'Antebrazos',
  glutes: 'Glúteos',
  calves: 'Gemelos',
};

const equipmentLabels: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  machine: 'Máquina',
  cable: 'Cable',
  bodyweight: 'Peso corporal',
  kettlebell: 'Pesa rusa',
  band: 'Banda',
  other: 'Otro',
};

export function ExerciseListScreen({ navigation }: ExerciseScreenProps<'ExerciseList'>) {
  const {
    exercises,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    muscleGroupFilter,
    setMuscleGroupFilter,
    equipmentFilter,
    setEquipmentFilter,
    refresh,
    clearError,
  } = useExercises();

  const handleMuscleGroupToggle = (group: MuscleGroup) => {
    clearError();
    setMuscleGroupFilter(muscleGroupFilter === group ? null : group);
  };

  const handleEquipmentToggle = (equipment: Equipment) => {
    clearError();
    setEquipmentFilter(equipmentFilter === equipment ? null : equipment);
  };

  const handleCreate = () => {
    clearError();
    navigation.navigate('ExerciseCreate');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          value={searchQuery}
          onChangeText={(text) => {
            clearError();
            setSearchQuery(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Grupo muscular</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {MUSCLE_GROUPS.map((group) => (
            <TouchableOpacity
              key={group}
              style={[
                styles.chip,
                muscleGroupFilter === group && styles.chipActive,
              ]}
              onPress={() => handleMuscleGroupToggle(group)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  muscleGroupFilter === group && styles.chipTextActive,
                ]}
              >
                {muscleGroupLabels[group] ?? group}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Equipamiento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {EQUIPMENT_TYPES.map((equipment) => (
            <TouchableOpacity
              key={equipment}
              style={[
                styles.chip,
                equipmentFilter === equipment && styles.chipActive,
              ]}
              onPress={() => handleEquipmentToggle(equipment)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  equipmentFilter === equipment && styles.chipTextActive,
                ]}
              >
                {equipmentLabels[equipment] ?? equipment}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading && exercises.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            >
              <ExerciseCard exercise={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#2f95dc" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No hay ejercicios</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || muscleGroupFilter || equipmentFilter
                  ? 'Probá ajustando los filtros de búsqueda'
                  : 'Agregá tu primer ejercicio con el botón +'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});
