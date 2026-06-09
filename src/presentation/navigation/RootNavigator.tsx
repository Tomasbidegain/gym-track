import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { RoutineContextProvider } from '../context/RoutineContext';
import { WorkoutSessionContextProvider } from '../context/WorkoutSessionContext';
import { ExercisePickerProvider } from '../context/ExercisePickerContext';
import { AuthStack } from './AuthStack';
import { MainAppTabs } from './MainAppTabs';

export function RootNavigator() {
  const { user, isInitializing } = useAuthContext();

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <RoutineContextProvider>
          <WorkoutSessionContextProvider>
            <ExercisePickerProvider>
              <MainAppTabs />
            </ExercisePickerProvider>
          </WorkoutSessionContextProvider>
        </RoutineContextProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
