import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { initializeAuth } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import { LoadingSpinner } from '../components/auth';

const Stack = createStackNavigator<RootStackParamList>();

// Placeholder for the main app screens
const HomeScreen: React.FC = () => {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.welcomeTitle}>Welcome to CaddieAI!</Text>
      <Text style={styles.welcomeSubtitle}>You are successfully logged in.</Text>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize authentication state when app starts
    dispatch(initializeAuth());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default AppNavigator;