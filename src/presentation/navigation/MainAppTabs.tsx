import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainAppTabParamList } from "./types";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { ExerciseStack } from "./ExerciseStack";
import { RoutineStack } from "./RoutineStack";
import { TrainStack } from "./TrainStack";
import { ProgressScreen } from "../screens/progress/ProgressScreen";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";

const Tab = createBottomTabNavigator<MainAppTabParamList>();

export function MainAppTabs() {
  return (
    <Tab.Navigator initialRouteName="Progress">
      <Tab.Screen
        name="Exercises"
        component={ExerciseStack}
        options={{
          title: "Ejercicios",
          tabBarLabel: "Ejercicios",
          headerShown: false,
          tabBarIcon(props) {
            return (
              <FontAwesome5 name="dumbbell" size={20} color={props.color} />
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
            return <FontAwesome5 name="list" size={20} color={props.color} />;
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
              <FontAwesome name="line-chart" size={20} color={props.color} />
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
              <FontAwesome5 name="running" size={20} color={props.color} />
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
            return <FontAwesome name="user" size={20} color={props.color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}
