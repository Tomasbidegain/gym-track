import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthContextProvider } from './src/presentation/context/AuthContext';
import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthContextProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthContextProvider>
    </GestureHandlerRootView>
  );
}
