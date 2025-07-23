import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CoursesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Golf Courses</Text>
      <Text style={styles.subtitle}>Discover and explore courses</Text>
      <Text style={styles.description}>
        Search for nearby golf courses, view course details, and get detailed 
        hole-by-hole information to plan your next round.
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

export default CoursesScreen;