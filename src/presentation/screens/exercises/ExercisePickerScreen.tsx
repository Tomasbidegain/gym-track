import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';
import { useExercisePicker } from '../../context/ExercisePickerContext';
import type { Exercise, MuscleGroup, Equipment } from '../../../domain';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '../../../domain';

const muscleGroupLabels: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Piernas',
  core: 'Core',
  forearms: 'Antebrazos',
  glutes: 'Gluteos',
  calves: 'Gemelos',
};

const equipmentLabels: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  machine: 'Maquina',
  cable: 'Cable',
  bodyweight: 'Peso corporal',
  kettlebell: 'Pesa rusa',
  band: 'Banda',
  other: 'Otro',
};

function ExercisePickerItem({
  exercise,
  isSelected,
  onToggle,
}: {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[styles.item, isSelected && styles.itemSelected]}
    >
      <View style={styles.checkbox}>
        {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{exercise.name}</Text>
        <View style={styles.itemBadges}>
          <View style={styles.itemBadge}>
            <Text style={styles.itemBadgeText}>
              {muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
            </Text>
          </View>
          <View style={[styles.itemBadge, styles.equipmentBadge]}>
            <Text style={styles.itemBadgeText}>
              {equipmentLabels[exercise.equipment] ?? exercise.equipment}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ExercisePickerScreen({ navigation }: RoutineScreenProps<'ExercisePicker'>) {
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

  const { selectedIds, toggle, getSelected, clear, targetDayIndex } = useExercisePicker();

  const selectedCount = selectedIds.length;

  const handleMuscleGroupToggle = useCallback(
    (group: MuscleGroup) => {
      clearError();
      setMuscleGroupFilter(muscleGroupFilter === group ? null : group);
    },
    [clearError, muscleGroupFilter, setMuscleGroupFilter],
  );

  const handleEquipmentToggle = useCallback(
    (equipment: Equipment) => {
      clearError();
      setEquipmentFilter(equipmentFilter === equipment ? null : equipment);
    },
    [clearError, equipmentFilter, setEquipmentFilter],
  );

  const handleConfirm = useCallback(() => {
    getSelected();
    navigation.goBack();
  }, [getSelected, navigation]);

  const handleCancel = useCallback(() => {
    clear();
    navigation.goBack();
  }, [clear, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExercisePickerItem
        exercise={item}
        isSelected={selectedIds.includes(item.id)}
        onToggle={() => toggle(item.id)}
      />
    ),
    [selectedIds, toggle],
  );

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
              style={[styles.chip, muscleGroupFilter === group && styles.chipActive]}
              onPress={() => handleMuscleGroupToggle(group)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, muscleGroupFilter === group && styles.chipTextActive]}>
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
              style={[styles.chip, equipmentFilter === equipment && styles.chipActive]}
              onPress={() => handleEquipmentToggle(equipment)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, equipmentFilter === equipment && styles.chipTextActive]}>
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

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay ejercicios</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || muscleGroupFilter || equipmentFilter
                ? 'Proba ajustando los filtros de busqueda'
                : 'Agrega ejercicios desde la pestana Ejercicios'}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, selectedCount === 0 && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={selectedCount === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            {selectedCount > 0 ? `Agregar ${selectedCount} ejercicios` : 'Seleccionar ejercicios'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: '#2f95dc',
    padding: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f95dc',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  itemBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  itemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  equipmentBadge: {
    backgroundColor: '#e8f5e9',
  },
  itemBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
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
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
