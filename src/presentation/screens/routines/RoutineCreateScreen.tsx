import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useExercises } from '../../hooks/useExercises';
import { useExercisePicker } from '../../context/ExercisePickerContext';
import type { RoutineDay, RoutineExercise } from '../../../domain';
import type { Exercise } from '../../../domain';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

let dayCounter = 0;
function generateDayId(): string {
  dayCounter++;
  return `day-${Date.now()}-${dayCounter}`;
}

function createDefaultDay(name?: string): RoutineDay {
  return {
    id: generateDayId(),
    name: name ?? 'Dia 1',
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
    isTimeBased: false,
    targetDurationSeconds: 0,
  };
}

export function RoutineCreateScreen({ navigation }: RoutineScreenProps<'RoutineCreate'>) {
  const { createRoutine, clearError } = useRoutines();
  const { exercises: catalogExercises } = useExercises();
  const picker = useExercisePicker();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<RoutineDay[]>([createDefaultDay()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const expectingReturnRef = useRef(false);

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
    setDays((prev) => [...prev, createDefaultDay(`Dia ${prev.length + 1}`)]);
  }, [clearFormError]);

  const removeDay = useCallback(
    (dayIndex: number) => {
      clearFormError();
      if (days.length <= 1) {
        Alert.alert('No se puede eliminar', 'La rutina debe tener al menos un dia.');
        return;
      }
      Alert.alert('Eliminar dia', `Queres eliminar "${days[dayIndex].name}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDays((prev) => prev.filter((_, i) => i !== dayIndex));
          },
        },
      ]);
    },
    [clearFormError, days],
  );

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
        Alert.alert('No se puede eliminar', 'El dia debe tener al menos un ejercicio.');
        return;
      }
      Alert.alert('Eliminar ejercicio', 'Queres eliminar este ejercicio del dia?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
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
          },
        },
      ]);
    },
    [clearFormError, days],
  );

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
        if (ex.restSeconds < 0) {
          setFormError('El descanso no puede ser negativo');
          return false;
        }
        if (ex.isTimeBased) {
          if (!ex.targetDurationSeconds || ex.targetDurationSeconds <= 0) {
            setFormError('La duracion debe ser mayor a 0 para ejercicios basados en tiempo');
            return false;
          }
        } else {
          if (ex.targetReps <= 0) {
            setFormError('Las reps deben ser al menos 1');
            return false;
          }
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
      const created = await createRoutine({
        name: name.trim(),
        description: description.trim() || undefined,
        days: days.map((day) => ({
          ...day,
          exercises: day.exercises.map((ex, index) => ({ ...ex, order: index })),
        })),
      });
      if (created) {
        picker.clear();
        navigation.goBack();
      }
    } finally {
      setIsSaving(false);
    }
  }, [clearFormError, validate, createRoutine, name, description, days, picker, navigation]);

  const handleCancel = useCallback(() => {
    clearFormError();
    picker.clear();
    navigation.goBack();
  }, [clearFormError, picker, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

          {days.map((day, dayIndex) => (
            <View key={day.id} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <TextInput
                  style={styles.dayNameInput}
                  value={day.name}
                  onChangeText={(text) => updateDayName(dayIndex, text)}
                  placeholder="Nombre del dia"
                  maxLength={100}
                />
                <TouchableOpacity onPress={() => removeDay(dayIndex)} activeOpacity={0.8}>
                  <Text style={styles.removeDayText}>Eliminar dia</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dayExercisesHeader}>
                <Text style={styles.dayExercisesTitle}>Ejercicios</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openPicker(dayIndex)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>+ Agregar ejercicios</Text>
                </TouchableOpacity>
              </View>

              {day.exercises.length > 0 ? (
                <DraggableFlatList
                  data={day.exercises}
                  onDragEnd={({ data }) => handleDragEnd(dayIndex, data)}
                  keyExtractor={(item) => `${item.exerciseId}-${item.order}`}
                  renderItem={({ item, drag }) => (
                    <ScaleDecorator>
                      <TouchableOpacity onLongPress={drag} activeOpacity={0.9} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                          <TouchableOpacity
                            onPress={() => removeExercise(dayIndex, item.order)}
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
                              updateExercise(dayIndex, item.order, {
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
                                updateExercise(dayIndex, item.order, { targetSets: isNaN(val) ? 0 : val });
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
                                  updateExercise(dayIndex, item.order, { targetDurationSeconds: isNaN(val) ? 0 : val });
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
                                  updateExercise(dayIndex, item.order, { targetReps: isNaN(val) ? 0 : val });
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
                                updateExercise(dayIndex, item.order, { restSeconds: isNaN(val) ? 0 : val });
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
                          onChangeText={(text) => updateExercise(dayIndex, item.order, { notes: text || undefined })}
                          placeholder="Notas (opcional)"
                          maxLength={200}
                        />
                      </TouchableOpacity>
                    </ScaleDecorator>
                  )}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noExercisesText}>
                  Todavia no agregaste ejercicios a este dia.
                </Text>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addDayButton} onPress={addDay} activeOpacity={0.8}>
            <Text style={styles.addDayButtonText}>+ Agregar dia</Text>
          </TouchableOpacity>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
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
  },
  notesInput: {
    marginBottom: 8,
    marginTop: 4,
  },
  daySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  dayNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 10,
  },
  removeDayText: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
  dayExercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayExercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f95dc',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f95dc',
  },
  exerciseCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  removeText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
    marginBottom: 3,
    textAlign: 'center',
  },
  fieldInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  noExercisesText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
  addDayButton: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2f95dc',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addDayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f95dc',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 8,
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
