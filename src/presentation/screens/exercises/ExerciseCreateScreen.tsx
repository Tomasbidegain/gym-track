import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { ExerciseScreenProps } from '../../navigation/types';
import { useExercises } from '../../hooks/useExercises';
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

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  labels: Record<string, string>;
  selected: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function PickerModal({ visible, title, options, labels, selected, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, selected === option && styles.modalOptionSelected]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selected === option && styles.modalOptionTextSelected,
                  ]}
                >
                  {labels[option] ?? option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export function ExerciseCreateScreen({ navigation }: ExerciseScreenProps<'ExerciseCreate'>) {
  const { createExercise, isLoading, error, clearError } = useExercises();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showMuscleGroupPicker, setShowMuscleGroupPicker] = useState(false);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('El nombre es obligatorio');
    } else if (name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (name.trim().length > 100) {
      errors.push('El nombre debe tener como máximo 100 caracteres');
    }
    if (!muscleGroup) {
      errors.push('Seleccioná un grupo muscular');
    }
    if (!equipment) {
      errors.push('Seleccioná un equipamiento');
    }
    if (errors.length > 0) {
      setLocalError(errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    clearError();
    setLocalError(null);
    if (!validate()) return;
    if (!muscleGroup || !equipment) return;

    const created = await createExercise({
      name: name.trim(),
      muscleGroup,
      equipment,
    });

    if (created) {
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    clearError();
    setLocalError(null);
    navigation.goBack();
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Nuevo ejercicio</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del ejercicio"
              value={name}
              onChangeText={(text) => {
                setLocalError(null);
                setName(text);
              }}
              autoCapitalize="words"
              editable={!isLoading}
              maxLength={100}
            />
          </View>

          <View>
            <Text style={styles.label}>Grupo muscular</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowMuscleGroupPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={muscleGroup ? styles.pickerValue : styles.pickerPlaceholder}>
                {muscleGroup ? muscleGroupLabels[muscleGroup] : 'Seleccionar grupo muscular'}
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.label}>Equipamiento</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEquipmentPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={equipment ? styles.pickerValue : styles.pickerPlaceholder}>
                {equipment ? equipmentLabels[equipment] : 'Seleccionar equipamiento'}
              </Text>
            </TouchableOpacity>
          </View>

          {displayError ? (
            <Text style={styles.errorText}>{displayError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PickerModal
        visible={showMuscleGroupPicker}
        title="Grupo muscular"
        options={MUSCLE_GROUPS as unknown as string[]}
        labels={muscleGroupLabels}
        selected={muscleGroup}
        onSelect={(value) => {
          setLocalError(null);
          setMuscleGroup(value as MuscleGroup);
        }}
        onClose={() => setShowMuscleGroupPicker(false)}
      />

      <PickerModal
        visible={showEquipmentPicker}
        title="Equipamiento"
        options={EQUIPMENT_TYPES as unknown as string[]}
        labels={equipmentLabels}
        selected={equipment}
        onSelect={(value) => {
          setLocalError(null);
          setEquipment(value as Equipment);
        }}
        onClose={() => setShowEquipmentPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  pickerValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#aaa',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    height: 52,
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 52,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  modalOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#2f95dc',
    fontWeight: '600',
  },
  modalCloseButton: {
    height: 52,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
});
