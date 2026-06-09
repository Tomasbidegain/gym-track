import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthContextProvider } from './src/presentation/context/AuthContext';
import { WorkoutSessionContextProvider } from './src/presentation/context/WorkoutSessionContext';
import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthContextProvider>
        <WorkoutSessionContextProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </WorkoutSessionContextProvider>
      </AuthContextProvider>
    </GestureHandlerRootView>
  );
}
