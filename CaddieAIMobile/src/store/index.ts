import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import roundReducer from './slices/roundSlice';
import voiceReducer from './slices/voiceSlice';
import shotPlacementReducer from './slices/shotPlacementSlice';
import userCoursesReducer from './slices/userCoursesSlice';
import testModeReducer from './slices/testModeSlice';
import aiCaddieReducer from './slices/aiCaddieSlice';
import garminReducer from './slices/garminSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  auth: authReducer,
  courses: courseReducer,
  rounds: roundReducer,
  voice: voiceReducer,
  shotPlacement: shotPlacementReducer,
  userCourses: userCoursesReducer,
  testMode: testModeReducer,
  aiCaddie: aiCaddieReducer,
  garmin: garminReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'rounds', 'userCourses', 'testMode', 'garmin'], // Persist auth, rounds, user courses, test mode, and garmin preferences
  blacklist: ['courses', 'voice', 'aiCaddie'], // Don't persist course data, voice state, or AI caddie state (real-time data)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE', 
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/PURGE',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;