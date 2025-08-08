/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry, NativeModules, LogBox } from 'react-native';

// Polyfill addListener/removeListeners for certain native modules to satisfy NativeEventEmitter
try {
  const { Voice } = NativeModules;
  if (Voice) {
    if (typeof Voice.addListener !== 'function') {
      Voice.addListener = () => {};
    }
    if (typeof Voice.removeListeners !== 'function') {
      Voice.removeListeners = () => {};
    }
  }
} catch {}

// Optionally silence known warning noise from NativeEventEmitter in third-party libs
LogBox.ignoreLogs([
  /new NativeEventEmitter\(\) was called with a non-null argument/, // RN warning for legacy modules
]);
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
