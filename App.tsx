import { StatusBar } from 'expo-status-bar';
import { AuthContextProvider } from './src/presentation/context/AuthContext';
import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  return (
    <AuthContextProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthContextProvider>
  );
}
