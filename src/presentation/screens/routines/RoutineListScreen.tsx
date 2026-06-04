import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RoutineListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rutinas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});
