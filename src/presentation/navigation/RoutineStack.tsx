import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RoutineStackParamList } from './types';
import { RoutineListScreen } from '../screens/routines/RoutineListScreen';
import { RoutineDetailScreen } from '../screens/routines/RoutineDetailScreen';
import { RoutineCreateScreen } from '../screens/routines/RoutineCreateScreen';
import { RoutineEditScreen } from '../screens/routines/RoutineEditScreen';
import { ExercisePickerScreen } from '../screens/exercises/ExercisePickerScreen';
import { WorkoutSessionScreen } from '../screens/workout/WorkoutSessionScreen';

const Stack = createNativeStackNavigator<RoutineStackParamList>();

export function RoutineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RoutineList"
        component={RoutineListScreen}
        options={{ title: 'Rutinas' }}
      />
      <Stack.Screen
        name="RoutineDetail"
        component={RoutineDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <Stack.Screen
        name="RoutineCreate"
        component={RoutineCreateScreen}
        options={{ title: 'Nueva rutina' }}
      />
      <Stack.Screen
        name="RoutineEdit"
        component={RoutineEditScreen}
        options={{ title: 'Editar rutina' }}
      />
      <Stack.Screen
        name="ExercisePicker"
        component={ExercisePickerScreen}
        options={{ title: 'Seleccionar ejercicios', presentation: 'modal' }}
      />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ title: 'Entrenamiento', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
