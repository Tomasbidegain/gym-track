import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RoutineCreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nueva rutina</Text>
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
