import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaView, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingSpinner } from './src/components/auth';
import ApiConnectionTest from './src/components/debug/ApiConnectionTest';

// Safely import store with error handling
let store: any = null;
let persistor: any = null;

try {
  const storeModule = require('./src/store');
  store = storeModule.store;
  persistor = storeModule.persistor;
} catch (error) {
  console.error('Failed to import store:', error);
}

// TEMPORARY: Set to true to show API connection test, false for normal app
const SHOW_API_DEBUG = false;

const App: React.FC = () => {
  if (SHOW_API_DEBUG) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ApiConnectionTest />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Handle store initialization errors
  if (!store || !persistor) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, color: '#ff4444', textAlign: 'center', marginBottom: 10 }}>
              App Initialization Error
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              Failed to initialize the app store. Please restart the app.
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Safely import AppNavigator to avoid circular dependencies
  let AppNavigator: any = null;
  try {
    AppNavigator = require('./src/navigation/AppNavigator').default;
  } catch (error) {
    console.error('Failed to import AppNavigator:', error);
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, color: '#ff4444', textAlign: 'center', marginBottom: 10 }}>
              Navigation Error
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              Failed to load app navigation. Please restart the app.
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner message="Loading..." />} persistor={persistor}>
          <AppNavigator />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
