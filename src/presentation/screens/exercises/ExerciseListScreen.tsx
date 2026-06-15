import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import type { ExerciseScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';
import { ExerciseCard } from '../../components/ExerciseCard';
import type { MuscleGroup, Equipment } from '../../../domain';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../../../domain';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';

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
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Input
          placeholder="Buscar ejercicio..."
          value={searchQuery}
          onChangeText={(text) => {
            clearError();
            setSearchQuery(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.borderLight }]}>
        <Text style={[styles.filterLabel, { color: theme.colors.textMuted }]}>Grupo muscular</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {MUSCLE_GROUPS.map((group) => (
            <TouchableOpacity
              key={group}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight },
                muscleGroupFilter === group && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => handleMuscleGroupToggle(group)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.textSecondary },
                  muscleGroupFilter === group && { color: theme.colors.surface },
                ]}
              >
                {muscleGroupLabels[group] ?? group}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.filterLabel, { color: theme.colors.textMuted }]}>Equipamiento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {EQUIPMENT_TYPES.map((equipment) => (
            <TouchableOpacity
              key={equipment}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight },
                equipmentFilter === equipment && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => handleEquipmentToggle(equipment)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.textSecondary },
                  equipmentFilter === equipment && { color: theme.colors.surface },
                ]}
              >
                {equipmentLabels[equipment] ?? equipment}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button title="Reintentar" onPress={refresh} variant="primary" size="small" />
        </View>
      ) : null}

      {isLoading && exercises.length === 0 ? (
        <View style={styles.listContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ marginHorizontal: 16, marginVertical: 6 }}>
              <Skeleton width="100%" height={72} borderRadius={12} />
            </View>
          ))}
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
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💪"
              title="No hay ejercicios"
              message={
                searchQuery || muscleGroupFilter || equipmentFilter
                  ? 'Probá ajustando los filtros de búsqueda'
                  : 'Agregá tu primer ejercicio con el botón +'
              }
              actionLabel={!searchQuery && !muscleGroupFilter && !equipmentFilter ? 'Agregar' : undefined}
              onAction={!searchQuery && !muscleGroupFilter && !equipmentFilter ? handleCreate : undefined}
            />
          }
        />
      )}

      <Button
        title="+"
        onPress={handleCreate}
        style={styles.fab}
        textStyle={styles.fabText}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  errorContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
