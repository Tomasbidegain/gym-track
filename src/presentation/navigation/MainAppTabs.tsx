import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainAppTabParamList } from './types';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ExerciseStack } from './ExerciseStack';
import { RoutineStack } from './RoutineStack';
import { TrainStack } from './TrainStack';
import { ProgressScreen } from '../screens/progress/ProgressScreen';

const Tab = createBottomTabNavigator<MainAppTabParamList>();

export function MainAppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progreso',
          tabBarLabel: 'Progreso',
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExerciseStack}
        options={{
          title: 'Ejercicios',
          tabBarLabel: 'Ejercicios',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutineStack}
        options={{
          title: 'Rutinas',
          tabBarLabel: 'Rutinas',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Train"
        component={TrainStack}
        options={{
          title: 'Entrenar',
          tabBarLabel: 'Entrenar',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}
