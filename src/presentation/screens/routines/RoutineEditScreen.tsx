import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RoutineScreenProps } from '../../navigation/types';
import { useRoutines } from '../../hooks/useRoutines';
import { useExercises } from '../../hooks/useExercises';
import { useExercisePicker } from '../../context/ExercisePickerContext';
import type { RoutineExercise } from '../../../domain';
import type { Exercise } from '../../../domain';

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
  const { routines, updateRoutine, clearError } = useRoutines();
  const { exercises: catalogExercises } = useExercises();
  const picker = useExercisePicker();

  const routine = React.useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const expectingReturnRef = useRef(false);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description ?? '');
      setExercises(
        routine.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ex) => ({ ...ex })),
      );
      setIsReady(true);
    }
  }, [routine]);

  const clearFormError = useCallback(() => {
    setFormError(null);
    clearError();
  }, [clearError]);

  const openPicker = useCallback(() => {
    clearFormError();
    picker.clear();
    exercises.forEach((ex) => picker.select(ex.exerciseId));
    expectingReturnRef.current = true;
    navigation.navigate('ExercisePicker');
  }, [clearFormError, picker, exercises, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (expectingReturnRef.current) {
        expectingReturnRef.current = false;
        const selectedIds = picker.getSelected();
        const newExercises = selectedIds
          .map((id) => catalogExercises.find((e) => e.id === id))
          .filter((e): e is Exercise => e !== undefined)
          .filter((e) => !exercises.some((ex) => ex.exerciseId === e.id))
          .map((e) => createDefaultRoutineExercise(e, exercises.length));

        if (newExercises.length > 0) {
          setExercises((prev) => [...prev, ...newExercises].map((ex, i) => ({ ...ex, order: i })));
        }
      }
    }, [picker, catalogExercises, exercises]),
  );

  const updateExercise = useCallback(
    (index: number, updates: Partial<RoutineExercise>) => {
      setExercises((prev) =>
        prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex)),
      );
    },
    [],
  );

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    setExercises((prev) => {
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const newExercises = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newExercises[index];
      newExercises[index] = newExercises[swapIndex];
      newExercises[swapIndex] = temp;
      return newExercises.map((ex, i) => ({ ...ex, order: i }));
    });
  }, []);

  const removeExercise = useCallback(
    (index: number) => {
      clearFormError();
      if (exercises.length <= 1) {
        Alert.alert('No se puede eliminar', 'La rutina debe tener al menos un ejercicio.');
        return;
      }
      Alert.alert('Eliminar ejercicio', 'Queres eliminar este ejercicio de la rutina?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setExercises((prev) => {
              const removedId = prev[index].exerciseId;
              picker.deselect(removedId);
              return prev.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i }));
            });
          },
        },
      ]);
    },
    [clearFormError, exercises.length, picker],
  );

  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    if (exercises.length === 0) {
      setFormError('Agrega al menos un ejercicio');
      return false;
    }
    for (const ex of exercises) {
      if (ex.targetSets < 1) {
        setFormError('Los sets deben ser al menos 1');
        return false;
      }
      if (ex.restSeconds < 0) {
        setFormError('El descanso no puede ser negativo');
        return false;
      }
    }
    return true;
  }, [name, exercises]);

  const handleSave = useCallback(async () => {
    clearFormError();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updated = await updateRoutine(routineId, {
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: exercises.map((ex, index) => ({ ...ex, order: index })),
      });
      if (updated) {
        picker.clear();
        navigation.goBack();
      }
    } finally {
      setIsSaving(false);
    }
  }, [clearFormError, validate, updateRoutine, routineId, name, description, exercises, picker, navigation]);

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

        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionTitle}>Ejercicios</Text>
          <TouchableOpacity style={styles.addButton} onPress={openPicker} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>+ Agregar ejercicios</Text>
          </TouchableOpacity>
        </View>

        {exercises.map((exercise, index) => (
          <View key={`${exercise.exerciseId}-${index}`} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <TouchableOpacity onPress={() => removeExercise(index)} activeOpacity={0.8}>
                <Text style={styles.removeText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldsRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Series</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={String(exercise.targetSets)}
                  onChangeText={(text) => {
                    const val = parseInt(text, 10);
                    updateExercise(index, { targetSets: isNaN(val) ? 0 : val });
                    clearFormError();
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={String(exercise.targetReps)}
                  onChangeText={(text) => {
                    const val = parseInt(text, 10);
                    updateExercise(index, { targetReps: isNaN(val) ? 0 : val });
                    clearFormError();
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Descanso (s)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={String(exercise.restSeconds)}
                  onChangeText={(text) => {
                    const val = parseInt(text, 10);
                    updateExercise(index, { restSeconds: isNaN(val) ? 0 : val });
                    clearFormError();
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              value={exercise.notes ?? ''}
              onChangeText={(text) => updateExercise(index, { notes: text || undefined })}
              placeholder="Notas (opcional)"
              maxLength={200}
            />

            <View style={styles.reorderRow}>
              <TouchableOpacity
                style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                onPress={() => moveExercise(index, 'up')}
                disabled={index === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.reorderButtonText}>Arriba</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reorderButton,
                  index === exercises.length - 1 && styles.reorderButtonDisabled,
                ]}
                onPress={() => moveExercise(index, 'down')}
                disabled={index === exercises.length - 1}
                activeOpacity={0.8}
              >
                <Text style={styles.reorderButtonText}>Abajo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {exercises.length === 0 ? (
          <Text style={styles.noExercisesText}>
            Todavia no agregaste ejercicios. Usa el boton de arriba.
          </Text>
        ) : null}

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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
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
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  reorderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  reorderButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  reorderButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  noExercisesText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
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
