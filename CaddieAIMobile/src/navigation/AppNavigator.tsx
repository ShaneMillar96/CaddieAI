import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { initializeAuth } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { LoadingSpinner } from '../components/auth';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Initialize authentication state when app starts
    dispatch(initializeAuth());
  }, [dispatch]);

  // Debug authentication state
  useEffect(() => {
    console.log('🔍 AppNavigator: Auth state changed:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      error
    });
  }, [isAuthenticated, isLoading, user, error]);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  console.log('🚀 AppNavigator: Rendering navigator, isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default AppNavigator;