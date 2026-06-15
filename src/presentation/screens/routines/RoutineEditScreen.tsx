import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useExercises } from '../../hooks/useExercises';
import { useExercisePicker } from '../../context/ExercisePickerContext';
import type { RoutineDay, RoutineExercise } from '../../../domain';
import type { Exercise } from '../../../domain';
import { ConfirmModal } from '../../components/ConfirmModal';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

let dayCounter = 0;
function generateDayId(): string {
  dayCounter++;
  return `day-${Date.now()}-${dayCounter}`;
}

function createDefaultDay(name?: string): RoutineDay {
  return {
    id: generateDayId(),
    name: name ?? 'Nuevo dia',
    exercises: [],
  };
}

function createDefaultRoutineExercise(exercise: Exercise, order: number): RoutineExercise {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    order,
    targetSets: 3,
    targetReps: 8,
    restSeconds: 90,
    notes: undefined,
  };
}

export function RoutineEditScreen({ route, navigation }: RoutineScreenProps<'RoutineEdit'>) {
  const { routineId } = route.params;
  const { routines, updateRoutine, clearError, error: routineError } = useRoutines();
  const { exercises: catalogExercises } = useExercises();
  const picker = useExercisePicker();

  const routine = React.useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [showCannotDeleteDayModal, setShowCannotDeleteDayModal] = useState(false);
  const [showDeleteDayModal, setShowDeleteDayModal] = useState(false);
  const [pendingDeleteDayIndex, setPendingDeleteDayIndex] = useState<number | null>(null);

  const [showCannotDeleteExerciseModal, setShowCannotDeleteExerciseModal] = useState(false);
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false);
  const [pendingDeleteExercise, setPendingDeleteExercise] = useState<{ dayIndex: number; exIndex: number } | null>(null);

  const expectingReturnRef = useRef(false);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description ?? '');
      setDays(
        routine.days.map((day) => ({
          id: day.id,
          name: day.name,
          exercises: day.exercises
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ex) => ({ ...ex })),
        })),
      );
      setIsReady(true);
    }
  }, [routine]);

  const clearFormError = useCallback(() => {
    setFormError(null);
    clearError();
  }, [clearError]);

  const openPicker = useCallback(
    (dayIndex: number) => {
      clearFormError();
      picker.clear();
      picker.setTargetDayIndex(dayIndex);
      days[dayIndex].exercises.forEach((ex) => picker.select(ex.exerciseId));
      expectingReturnRef.current = true;
      navigation.navigate('ExercisePicker' as never);
    },
    [clearFormError, picker, days, navigation],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (expectingReturnRef.current) {
        expectingReturnRef.current = false;
        const dayIndex = picker.targetDayIndex;
        if (dayIndex === null) return;
        const selectedIds = picker.getSelected();
        const dayExercises = days[dayIndex]?.exercises ?? [];
        const newExercises = selectedIds
          .map((id) => catalogExercises.find((e) => e.id === id))
          .filter((e): e is Exercise => e !== undefined)
          .filter((e) => !dayExercises.some((ex) => ex.exerciseId === e.id))
          .map((e) => createDefaultRoutineExercise(e, dayExercises.length));

        if (newExercises.length > 0) {
          setDays((prev) =>
            prev.map((d, i) =>
              i === dayIndex
                ? {
                    ...d,
                    exercises: [...d.exercises, ...newExercises].map((ex, idx) => ({
                      ...ex,
                      order: idx,
                    })),
                  }
                : d,
            ),
          );
        }
      }
    }, [picker, catalogExercises, days]),
  );

  const addDay = useCallback(() => {
    clearFormError();
    setDays((prev) => {
      const newDays = [...prev, createDefaultDay(`Dia ${prev.length + 1}`)];
      setActiveDayIndex(newDays.length - 1);
      return newDays;
    });
  }, [clearFormError]);

  const removeDay = useCallback(
    (dayIndex: number) => {
      clearFormError();
      if (days.length <= 1) {
        setShowCannotDeleteDayModal(true);
        return;
      }
      setPendingDeleteDayIndex(dayIndex);
      setShowDeleteDayModal(true);
    },
    [clearFormError, days],
  );

  const handleConfirmDeleteDay = useCallback(() => {
    if (pendingDeleteDayIndex === null) return;
    setShowDeleteDayModal(false);
    const dayIndex = pendingDeleteDayIndex;
    setPendingDeleteDayIndex(null);
    setDays((prev) => {
      const newDays = prev.filter((_, i) => i !== dayIndex);
      if (activeDayIndex >= newDays.length) {
        setActiveDayIndex(newDays.length - 1);
      } else if (activeDayIndex === dayIndex) {
        setActiveDayIndex(Math.max(0, dayIndex - 1));
      }
      return newDays;
    });
  }, [pendingDeleteDayIndex, activeDayIndex]);

  const updateDayName = useCallback((dayIndex: number, newName: string) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, name: newName } : d)),
    );
  }, []);

  const updateExercise = useCallback(
    (dayIndex: number, exIndex: number, updates: Partial<RoutineExercise>) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: d.exercises.map((ex, idx) =>
                  idx === exIndex ? { ...ex, ...updates } : ex,
                ),
              }
            : d,
        ),
      );
    },
    [],
  );

  const removeExercise = useCallback(
    (dayIndex: number, exIndex: number) => {
      clearFormError();
      const day = days[dayIndex];
      if (day.exercises.length <= 1) {
        setShowCannotDeleteExerciseModal(true);
        return;
      }
      setPendingDeleteExercise({ dayIndex, exIndex });
      setShowDeleteExerciseModal(true);
    },
    [clearFormError, days],
  );

  const handleConfirmDeleteExercise = useCallback(() => {
    if (!pendingDeleteExercise) return;
    setShowDeleteExerciseModal(false);
    const { dayIndex, exIndex } = pendingDeleteExercise;
    setPendingDeleteExercise(null);
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              exercises: d.exercises
                .filter((_, idx) => idx !== exIndex)
                .map((ex, idx) => ({ ...ex, order: idx })),
            }
          : d,
      ),
    );
  }, [pendingDeleteExercise]);

  const handleDragEnd = useCallback(
    (dayIndex: number, newData: RoutineExercise[]) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: newData.map((ex, idx) => ({ ...ex, order: idx })),
              }
            : d,
        ),
      );
    },
    [],
  );

  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    if (days.length === 0) {
      setFormError('Agrega al menos un dia');
      return false;
    }
    for (const day of days) {
      if (!day.name.trim()) {
        setFormError('Cada dia debe tener un nombre');
        return false;
      }
      if (day.exercises.length === 0) {
        setFormError(`"${day.name}" debe tener al menos un ejercicio`);
        return false;
      }
      for (const ex of day.exercises) {
        if (ex.targetSets < 1) {
          setFormError('Los sets deben ser al menos 1');
          return false;
        }
        if (ex.isTimeBased) {
          if (!ex.targetDurationSeconds || ex.targetDurationSeconds <= 0) {
            setFormError('La duracion debe ser mayor a 0 para ejercicios basados en tiempo');
            return false;
          }
        } else {
          if (ex.targetReps < 1) {
            setFormError('Las repeticiones deben ser al menos 1');
            return false;
          }
        }
        if (ex.restSeconds < 0) {
          setFormError('El descanso no puede ser negativo');
          return false;
        }
      }
    }
    return true;
  }, [name, days]);

  const handleSave = useCallback(async () => {
    clearFormError();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updated = await updateRoutine(routineId, {
        name: name.trim(),
        description: description.trim() || undefined,
        days: days.map((day) => ({
          ...day,
          exercises: day.exercises.map((ex, index) => ({ ...ex, order: index })),
        })),
      });
      if (updated) {
        picker.clear();
        navigation.goBack();
      } else {
        setFormError('No se pudo actualizar la rutina');
      }
    } catch (err) {
      setFormError('Error al actualizar. Verifica tu conexion.');
    } finally {
      setIsSaving(false);
    }
  }, [clearFormError, validate, updateRoutine, routineId, name, description, days, picker, navigation]);

  const handleCancel = useCallback(() => {
    clearFormError();
    picker.clear();
    navigation.goBack();
  }, [clearFormError, picker, navigation]);

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Cargando rutina...</Text>
      </View>
    );
  }

  const activeDay = days[activeDayIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearFormError();
            }}
            placeholder="Nombre de la rutina"
            maxLength={100}
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Descripcion (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              clearFormError();
            }}
            placeholder="Descripcion de la rutina"
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Day Tabs */}
        <View style={styles.dayTabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabsContent}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayTab,
                  index === activeDayIndex && styles.dayTabActive,
                ]}
                onPress={() => setActiveDayIndex(index)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.dayTabText,
                  index === activeDayIndex && styles.dayTabTextActive,
                ]}>
                  {day.name}
                </Text>
                {days.length > 1 && (
                  <TouchableOpacity
                    style={styles.dayTabRemove}
                    onPress={() => removeDay(index)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.dayTabRemoveText}>×</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.dayTabAdd} onPress={addDay} activeOpacity={0.8}>
              <Text style={styles.dayTabAddText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Active Day Content */}
        <View style={styles.dayContent}>
          <View style={styles.dayContentHeader}>
            <Text style={styles.dayContentTitle}>{activeDay.name}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openPicker(activeDayIndex)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Agregar ejercicios</Text>
            </TouchableOpacity>
          </View>

          {activeDay.exercises.length > 0 ? (
            <DraggableFlatList
              data={activeDay.exercises}
              onDragEnd={({ data }) => handleDragEnd(activeDayIndex, data)}
              keyExtractor={(item) => `${item.exerciseId}-${item.order}`}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator activeScale={0.98}>
                  <TouchableOpacity 
                    onLongPress={drag} 
                    activeOpacity={0.9} 
                    style={[
                      styles.exerciseCard,
                      isActive && styles.exerciseCardActive,
                    ]}
                  >
                    <View style={styles.exerciseHeader}>
                      <View style={styles.dragHandle}>
                        <Text style={styles.dragHandleText}>⇅</Text>
                      </View>
                      <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                      <TouchableOpacity
                        onPress={() => removeExercise(activeDayIndex, item.order)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.removeText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>Ejercicio basado en tiempo</Text>
                      <Switch
                        value={item.isTimeBased ?? false}
                        onValueChange={(val) => {
                          updateExercise(activeDayIndex, item.order, {
                            isTimeBased: val,
                            targetDurationSeconds: val ? (item.targetDurationSeconds || 45) : undefined,
                          });
                          clearFormError();
                        }}
                        trackColor={{ false: '#ddd', true: '#2f95dc' }}
                        thumbColor="#fff"
                      />
                    </View>

                    <View style={styles.fieldsRow}>
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Series</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={String(item.targetSets)}
                          onChangeText={(text) => {
                            const val = parseInt(text, 10);
                            updateExercise(activeDayIndex, item.order, { targetSets: isNaN(val) ? 0 : val });
                            clearFormError();
                          }}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      {item.isTimeBased ? (
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Duracion (s)</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={String(item.targetDurationSeconds ?? 0)}
                            onChangeText={(text) => {
                              const val = parseInt(text, 10);
                              updateExercise(activeDayIndex, item.order, { targetDurationSeconds: isNaN(val) ? 0 : val });
                              clearFormError();
                            }}
                            keyboardType="numeric"
                            maxLength={4}
                          />
                        </View>
                      ) : (
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Reps</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={String(item.targetReps)}
                            onChangeText={(text) => {
                              const val = parseInt(text, 10);
                              updateExercise(activeDayIndex, item.order, { targetReps: isNaN(val) ? 0 : val });
                              clearFormError();
                            }}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                        </View>
                      )}
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Descanso (s)</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={String(item.restSeconds)}
                          onChangeText={(text) => {
                            const val = parseInt(text, 10);
                            updateExercise(activeDayIndex, item.order, { restSeconds: isNaN(val) ? 0 : val });
                            clearFormError();
                          }}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    </View>

                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      value={item.notes ?? ''}
                      onChangeText={(text) => updateExercise(activeDayIndex, item.order, { notes: text || undefined })}
                      placeholder="Notas (opcional)"
                      maxLength={200}
                    />
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Este dia no tiene ejercicios.{'\n'}
                Toca "+ Agregar ejercicios" para empezar.
              </Text>
            </View>
          )}
        </View>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {routineError ? <Text style={styles.errorText}>{routineError}</Text> : null}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ConfirmModal
          visible={showCannotDeleteDayModal}
          title="No se puede eliminar"
          message="La rutina debe tener al menos un dia."
          buttons={[{ text: 'OK', onPress: () => setShowCannotDeleteDayModal(false), style: 'default' }]}
          onClose={() => setShowCannotDeleteDayModal(false)}
        />

        <ConfirmModal
          visible={showDeleteDayModal}
          title="Eliminar dia"
          message={pendingDeleteDayIndex !== null ? `Queres eliminar "${days[pendingDeleteDayIndex]?.name}"?` : ''}
          buttons={[
            { text: 'Cancelar', onPress: () => { setShowDeleteDayModal(false); setPendingDeleteDayIndex(null); }, style: 'cancel' },
            { text: 'Eliminar', onPress: handleConfirmDeleteDay, style: 'destructive' },
          ]}
          onClose={() => { setShowDeleteDayModal(false); setPendingDeleteDayIndex(null); }}
        />

        <ConfirmModal
          visible={showCannotDeleteExerciseModal}
          title="No se puede eliminar"
          message="El dia debe tener al menos un ejercicio."
          buttons={[{ text: 'OK', onPress: () => setShowCannotDeleteExerciseModal(false), style: 'default' }]}
          onClose={() => setShowCannotDeleteExerciseModal(false)}
        />

        <ConfirmModal
          visible={showDeleteExerciseModal}
          title="Eliminar ejercicio"
          message="Queres eliminar este ejercicio del dia?"
          buttons={[
            { text: 'Cancelar', onPress: () => { setShowDeleteExerciseModal(false); setPendingDeleteExercise(null); }, style: 'cancel' },
            { text: 'Eliminar', onPress: handleConfirmDeleteExercise, style: 'destructive' },
          ]}
          onClose={() => { setShowDeleteExerciseModal(false); setPendingDeleteExercise(null); }}
        />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    marginBottom: 0,
  },
  notesInput: {
    marginBottom: 8,
    marginTop: 4,
  },
  dayTabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  dayTabsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 36,
  },
  dayTabActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  dayTabTextActive: {
    color: '#fff',
  },
  dayTabRemove: {
    marginLeft: 4,
    padding: 2,
  },
  dayTabRemoveText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  dayTabAdd: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2f95dc',
    borderStyle: 'dashed',
    minHeight: 36,
    justifyContent: 'center',
  },
  dayTabAddText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f95dc',
  },
  dayContent: {
    flex: 1,
    padding: 16,
  },
  dayContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayContentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f95dc',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f95dc',
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseCardActive: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  dragHandleText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  removeText: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  fieldInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
});
