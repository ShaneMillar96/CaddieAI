import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TestModeSettings } from '../../components/testMode';

export const ProfileScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Personalize your experience</Text>
      </View>
      
      <View style={styles.settingsContainer}>
        <Text style={styles.description}>
          Manage your golf profile, preferences, handicap information, and 
          customize your CaddieAI settings for the best experience.
        </Text>
        
        {/* Test Mode Settings - Only visible in development */}
        {__DEV__ && (
          <View style={styles.developmentSection}>
            <Text style={styles.sectionTitle}>Development Settings</Text>
            <TestModeSettings />
          </View>
        )}
        
        {/* Placeholder for other profile settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              User profile settings will be implemented here
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Golf Preferences</Text>
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Golf preferences and handicap settings will be implemented here
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  settingsContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  developmentSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ProfileScreen;