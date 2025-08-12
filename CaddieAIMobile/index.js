/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, NativeModules, LogBox } from 'react-native';

// Enhanced polyfill for native modules to fix EventTypes null reference errors
try {
  // Specific polyfill for Voice module
  const { Voice } = NativeModules;
  if (Voice) {
    if (typeof Voice.addListener !== 'function') {
      Voice.addListener = () => {};
    }
    if (typeof Voice.removeListeners !== 'function') {
      Voice.removeListeners = () => {};
    }
    if (!Voice.EventTypes) {
      Voice.EventTypes = {};
    }
  }

  // Comprehensive polyfill for all native modules to prevent EventTypes null errors
  Object.keys(NativeModules).forEach(moduleName => {
    const module = NativeModules[moduleName];
    if (module && typeof module === 'object') {
      // Add missing EventEmitter methods
      if (typeof module.addListener !== 'function') {
        module.addListener = () => {
          console.debug(`Polyfill: addListener called on ${moduleName}`);
          return { remove: () => {} };
        };
      }
      if (typeof module.removeListeners !== 'function') {
        module.removeListeners = () => {
          console.debug(`Polyfill: removeListeners called on ${moduleName}`);
        };
      }
      
      // Add EventTypes property if missing - this is the key fix for the error
      if (!module.EventTypes) {
        module.EventTypes = {};
        console.debug(`Polyfill: Added EventTypes to ${moduleName}`);
      }
    }
  });
} catch (error) {
  console.warn('Error setting up native module polyfills:', error);
}

// Optionally silence known warning noise from NativeEventEmitter in third-party libs
LogBox.ignoreLogs([
  /new NativeEventEmitter\(\) was called with a non-null argument/, // RN warning for legacy modules
]);
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
