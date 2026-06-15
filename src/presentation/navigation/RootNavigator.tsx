import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { RoutineContextProvider } from '../context/RoutineContext';
import { WorkoutSessionContextProvider } from '../context/WorkoutSessionContext';
import { ExercisePickerProvider } from '../context/ExercisePickerContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthStack } from './AuthStack';
import { MainAppTabs } from './MainAppTabs';

function RootNavigatorContent() {
  const { user, isInitializing } = useAuthContext();
  const { theme } = useTheme();

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

export function RootNavigator() {
  return (
    <ThemeProvider>
      <RootNavigatorContent />
    </ThemeProvider>
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
