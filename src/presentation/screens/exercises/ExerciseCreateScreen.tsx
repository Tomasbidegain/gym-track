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
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.shadow }]} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
          <ScrollView style={styles.modalScroll}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, selected === option && { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: theme.colors.text },
                    selected === option && { color: theme.colors.primary, fontWeight: '600' },
                  ]}
                >
                  {labels[option] ?? option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: theme.colors.background }]} onPress={onClose}>
            <Text style={[styles.modalCloseButtonText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export function ExerciseCreateScreen({ navigation }: ExerciseScreenProps<'ExerciseCreate'>) {
  const { theme } = useTheme();
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Nuevo ejercicio</Text>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Nombre del ejercicio"
              placeholderTextColor={theme.colors.textMuted}
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
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Grupo muscular</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={() => setShowMuscleGroupPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={muscleGroup ? { color: theme.colors.text } : { color: theme.colors.textMuted }}>
                {muscleGroup ? muscleGroupLabels[muscleGroup] : 'Seleccionar grupo muscular'}
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Equipamiento</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={() => setShowEquipmentPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={equipment ? { color: theme.colors.text } : { color: theme.colors.textMuted }}>
                {equipment ? equipmentLabels[equipment] : 'Seleccionar equipamiento'}
              </Text>
            </TouchableOpacity>
          </View>

          {displayError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{displayError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.colors.surface }]}>Guardar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.borderLight }, isLoading && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  pickerButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
