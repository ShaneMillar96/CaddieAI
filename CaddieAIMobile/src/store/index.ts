import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import roundReducer from './slices/roundSlice';
import voiceReducer from './slices/voiceSlice';
import shotPlacementReducer from './slices/shotPlacementSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  auth: authReducer,
  courses: courseReducer,
  rounds: roundReducer,
  voice: voiceReducer,
  shotPlacement: shotPlacementReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'rounds'], // Persist auth and rounds (for active round state)
  blacklist: ['courses', 'voice'], // Don't persist course data or voice state (real-time data)
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