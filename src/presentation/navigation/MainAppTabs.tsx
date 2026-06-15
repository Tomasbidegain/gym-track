import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainAppTabParamList } from "./types";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { ExerciseStack } from "./ExerciseStack";
import { RoutineStack } from "./RoutineStack";
import { TrainStack } from "./TrainStack";
import { ProgressScreen } from "../screens/progress/ProgressScreen";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator<MainAppTabParamList>();

export function MainAppTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Progress"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Exercises"
        component={ExerciseStack}
        options={{
          title: "Ejercicios",
          tabBarLabel: "Ejercicios",
          headerShown: false,
          tabBarIcon(props) {
            return (
              <FontAwesome5 name="dumbbell" size={22} color={props.color} />
            );
          },
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutineStack}
        options={{
          title: "Rutinas",
          tabBarLabel: "Rutinas",
          headerShown: false,
          tabBarIcon(props) {
            return <FontAwesome5 name="list" size={22} color={props.color} />;
          },
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: "Progreso",
          tabBarLabel: "Progreso",
          tabBarIcon(props) {
            return (
              <FontAwesome name="line-chart" size={22} color={props.color} />
            );
          },
        }}
      />
      <Tab.Screen
        name="Train"
        component={TrainStack}
        options={{
          title: "Entrenar",
          tabBarLabel: "Entrenar",
          headerShown: false,
          tabBarIcon(props) {
            return (
              <FontAwesome5 name="running" size={22} color={props.color} />
            );
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon(props) {
            return <FontAwesome name="user" size={22} color={props.color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}
