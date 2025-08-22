import { Platform } from 'react-native';

// Safe Mapbox module wrapper to suppress NativeEventEmitter warnings
let MapboxModule: any = null;
let mapboxInitialized = false;

// Suppress console warnings for NativeEventEmitter during Mapbox module initialization
const originalConsoleWarn = console.warn;

const initializeMapboxModule = () => {
  if (mapboxInitialized) {
    return MapboxModule;
  }

  try {
    // Temporarily suppress NativeEventEmitter warnings
    console.warn = (message: string, ...args: any[]) => {
      if (typeof message === 'string' && 
          message.includes('NativeEventEmitter') && 
          (message.includes('addListener') || message.includes('removeListeners'))) {
        // Suppress the specific NativeEventEmitter warnings
        return;
      }
      originalConsoleWarn(message, ...args);
    };

    // Import Mapbox module
    const Mapbox = require('@rnmapbox/maps').default;
    MapboxModule = Mapbox;
    mapboxInitialized = true;

    // Restore original console.warn after a brief delay
    setTimeout(() => {
      console.warn = originalConsoleWarn;
    }, 1000);

    console.log('Mapbox module initialized successfully with warning suppression');
    return MapboxModule;
  } catch (error) {
    // Restore console.warn on error
    console.warn = originalConsoleWarn;
    console.error('Failed to initialize Mapbox module:', error);
    return null;
  }
};

// Export safe Mapbox module access
export const safeMapbox = {
  get module() {
    return initializeMapboxModule();
  },
  
  isAvailable() {
    const mapbox = initializeMapboxModule();
    return mapbox !== null;
  },
  
  setAccessToken(token: string) {
    const mapbox = initializeMapboxModule();
    if (mapbox && typeof mapbox.setAccessToken === 'function') {
      mapbox.setAccessToken(token);
    }
  }
};

// Re-export Mapbox components with safe initialization
export const getMapboxComponents = () => {
  const mapbox = initializeMapboxModule();
  if (!mapbox) {
    throw new Error('Mapbox module not available');
  }
  
  return {
    MapView: mapbox.MapView,
    Camera: mapbox.Camera,
    PointAnnotation: mapbox.PointAnnotation,
    CircleLayer: mapbox.CircleLayer,
    LineLayer: mapbox.LineLayer,
    ShapeSource: mapbox.ShapeSource,
    UserLocation: mapbox.UserLocation,
    Images: mapbox.Images,
    Image: mapbox.Image,
  };
};