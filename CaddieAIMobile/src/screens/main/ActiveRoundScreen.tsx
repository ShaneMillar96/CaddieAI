import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ActiveRoundScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Round</Text>
      <Text style={styles.subtitle}>Track your game in real-time</Text>
      <Text style={styles.description}>
        Start a new round or continue tracking your current game with GPS 
        location tracking, score keeping, and AI-powered recommendationss.
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

export default ActiveRoundScreen;