import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AIChatScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Golf Assistant</Text>
      <Text style={styles.subtitle}>Get expert advice anytime</Text>
      <Text style={styles.description}>
        Chat with your AI golf companion for personalized club recommendations, 
        course strategy, and playing tips tailored to your skill level.
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

export default AIChatScreen;