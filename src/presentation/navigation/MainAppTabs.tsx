import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainAppTabParamList } from './types';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainAppTabParamList>();

function ExercisesPlaceholder() {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Ejercicios</Text>
      <Text style={styles.placeholderSubtext}>Próximamente en Slice 3</Text>
    </View>
  );
}

export function MainAppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Exercises"
        component={ExercisesPlaceholder}
        options={{
          title: 'Ejercicios',
          tabBarLabel: 'Ejercicios',
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

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#888',
  },
});
