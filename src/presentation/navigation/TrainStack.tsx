import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrainStackParamList } from './types';
import { TrainLobbyScreen } from '../screens/train/TrainLobbyScreen';
import { DaySelectionScreen } from '../screens/train/DaySelectionScreen';
import { WorkoutSessionScreen } from '../screens/workout/WorkoutSessionScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<TrainStackParamList>();

export function TrainStack() {
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
        name="TrainLobby"
        component={TrainLobbyScreen}
        options={{ title: 'Entrenar' }}
      />
      <Stack.Screen
        name="DaySelection"
        component={DaySelectionScreen}
        options={{ title: 'Seleccionar dia' }}
      />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ title: 'Entrenamiento', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
