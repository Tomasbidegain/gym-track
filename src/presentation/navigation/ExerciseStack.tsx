import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ExerciseStackParamList } from './types';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { ExerciseDetailScreen } from '../screens/exercises/ExerciseDetailScreen';
import { ExerciseCreateScreen } from '../screens/exercises/ExerciseCreateScreen';
import { ExerciseEditScreen } from '../screens/exercises/ExerciseEditScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<ExerciseStackParamList>();

export function ExerciseStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          color: theme.colors.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: 'Ejercicios' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <Stack.Screen
        name="ExerciseCreate"
        component={ExerciseCreateScreen}
        options={{ title: 'Nuevo ejercicio' }}
      />
      <Stack.Screen
        name="ExerciseEdit"
        component={ExerciseEditScreen}
        options={{ title: 'Editar ejercicio' }}
      />
    </Stack.Navigator>
  );
}
