import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CaddieAI Dashboard</Text>
      <Text style={styles.subtitle}>Your golf companion is ready</Text>
      <Text style={styles.description}>
        Welcome to your personalized golf dashboard. Here you'll find your recent rounds, 
        upcoming tee times, and quick access to AI-powered golf assistance.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4a7c59',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
});

export default HomeScreen;