import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrainStackParamList } from './types';
import { TrainLobbyScreen } from '../screens/train/TrainLobbyScreen';
import { DaySelectionScreen } from '../screens/train/DaySelectionScreen';
import { WorkoutSessionScreen } from '../screens/workout/WorkoutSessionScreen';

const Stack = createNativeStackNavigator<TrainStackParamList>();

export function TrainStack() {
  return (
    <Stack.Navigator>
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
