import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ExerciseStackParamList = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: string };
  ExerciseCreate: undefined;
  ExerciseEdit: { exerciseId: string };
};

export type RoutineStackParamList = {
  RoutineList: undefined;
  RoutineDetail: { routineId: string };
  RoutineCreate: undefined;
  RoutineEdit: { routineId: string };
  ExercisePicker: { dayIndex?: number };
};

export type TrainStackParamList = {
  TrainLobby: undefined;
  DaySelection: { routineId: string };
  WorkoutSession: { routineId: string; dayId: string };
};

export type MainAppTabParamList = {
  Progress: undefined;
  Exercises: undefined;
  Routines: undefined;
  Train: undefined;
  Profile: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type ExerciseScreenProps<T extends keyof ExerciseStackParamList> = NativeStackScreenProps<
  ExerciseStackParamList,
  T
>;

export type RoutineScreenProps<T extends keyof RoutineStackParamList> = NativeStackScreenProps<
  RoutineStackParamList,
  T
>;

export type TrainScreenProps<T extends keyof TrainStackParamList> = NativeStackScreenProps<
  TrainStackParamList,
  T
>;

export type MainAppTabScreenProps<T extends keyof MainAppTabParamList> = BottomTabScreenProps<
  MainAppTabParamList,
  T
>;
