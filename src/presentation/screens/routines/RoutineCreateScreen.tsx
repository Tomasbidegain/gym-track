import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
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
  };
}

export function RoutineCreateScreen({ navigation }: RoutineScreenProps<'RoutineCreate'>) {
  const { createRoutine, clearError, error: routineError } = useRoutines();
  const { exercises: catalogExercises } = useExercises();
  const picker = useExercisePicker();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dayCount, setDayCount] = useState('1');
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showCannotDeleteDayModal, setShowCannotDeleteDayModal] = useState(false);
  const [showDeleteDayModal, setShowDeleteDayModal] = useState(false);
  const [pendingDeleteDayIndex, setPendingDeleteDayIndex] = useState<number | null>(null);

  const [showCannotDeleteExerciseModal, setShowCannotDeleteExerciseModal] = useState(false);
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false);
  const [pendingDeleteExercise, setPendingDeleteExercise] = useState<{ dayIndex: number; exIndex: number } | null>(null);

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

  const validateStep1 = useCallback((): boolean => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    const count = parseInt(dayCount, 10);
    if (isNaN(count) || count < 1) {
      setFormError('La cantidad de dias debe ser al menos 1');
      return false;
    }
    if (count > 7) {
      setFormError('La cantidad maxima de dias es 7');
      return false;
    }
    return true;
  }, [name, dayCount]);

  const validateStep2 = useCallback((): boolean => {
    for (const day of days) {
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
  }, [days]);

  const handleNext = useCallback(() => {
    clearFormError();
    if (validateStep1()) {
      const count = parseInt(dayCount, 10);
      const newDays = Array.from({ length: count }, (_, i) =>
        createDefaultDay(`Dia ${i + 1}`)
      );
      setDays(newDays);
      setActiveDayIndex(0);
      setStep(2);
    }
  }, [clearFormError, validateStep1, dayCount]);

  const handleBack = useCallback(() => {
    clearFormError();
    setStep(1);
  }, [clearFormError]);

  const handleSave = useCallback(async () => {
    clearFormError();
    if (!validateStep2()) return;

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
      } else {
        setFormError('No se pudo guardar la rutina. Revisa los datos e intenta de nuevo.');
      }
    } catch (err) {
      setFormError('Error al guardar. Verifica tu conexion e intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }, [clearFormError, validateStep2, createRoutine, name, description, days, picker, navigation]);

  const handleCancel = useCallback(() => {
    clearFormError();
    picker.clear();
    navigation.goBack();
  }, [clearFormError, picker, navigation]);

  const activeDay = days[activeDayIndex];

  // Render Step 1: Configuration
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.step1Content}>
        <Text style={styles.stepTitle}>Configuracion de la rutina</Text>
        
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

        <Text style={styles.label}>Cantidad de dias</Text>
        <View style={styles.dayCountInputWrapper}>
          <TouchableOpacity
            style={styles.dayCountButton}
            onPress={() => {
              const current = parseInt(dayCount, 10) || 1;
              if (current > 1) {
                setDayCount(String(current - 1));
                clearFormError();
              }
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.dayCountButtonText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.dayCountInputField}
            value={dayCount}
            onChangeText={(text) => {
              const val = text.replace(/[^0-9]/g, '');
              if (val === '') {
                setDayCount('');
              } else {
                const num = parseInt(val, 10);
                if (num >= 1 && num <= 7) {
                  setDayCount(val);
                }
              }
              clearFormError();
            }}
            placeholder="1"
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
          />
          <TouchableOpacity
            style={styles.dayCountButton}
            onPress={() => {
              const current = parseInt(dayCount, 10) || 1;
              if (current < 7) {
                setDayCount(String(current + 1));
                clearFormError();
              }
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.dayCountButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Siguiente →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Step 2: Exercises
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Ejercicios por dia</Text>
        <Text style={styles.stepSubtitle}>{name}</Text>
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

      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>← Atras</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {step === 1 ? renderStep1() : renderStep2()}

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
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stepContainer: {
    flex: 1,
  },
  step1Content: {
    padding: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  stepHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
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
  dayCountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  dayCountButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  dayCountButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2f95dc',
  },
  dayCountInputField: {
    flex: 1,
    height: 50,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  dayList: {
    gap: 8,
  },
  dayListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  dayListNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2f95dc',
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  dayListInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 4,
  },
  dayListRemove: {
    padding: 8,
    marginLeft: 8,
  },
  dayListRemoveText: {
    fontSize: 20,
    color: '#d32f2f',
    fontWeight: '600',
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
  stepFooter: {
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
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
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
});
