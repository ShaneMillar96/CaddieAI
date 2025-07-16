import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AuthState,
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse
} from '../../types';
import authApi from '../../services/authApi';
import TokenStorage from '../../services/tokenStorage';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const hasTokens = await TokenStorage.hasTokens();
      if (hasTokens) {
        const userData = await TokenStorage.getUserData();
        const accessToken = await TokenStorage.getAccessToken();
        const refreshToken = await TokenStorage.getRefreshToken();
        
        if (userData && accessToken && refreshToken) {
          return {
            user: userData,
            accessToken,
            refreshToken,
          };
        }
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize auth');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const logoutAll = createAsyncThunk(
  'auth/logoutAll',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logoutAll();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout from all devices failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const newToken = await authApi.refreshToken();
      if (newToken) {
        const userData = await TokenStorage.getUserData();
        const refreshToken = await TokenStorage.getRefreshToken();
        
        return {
          user: userData,
          accessToken: newToken,
          refreshToken,
        };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getUserProfile();
      await TokenStorage.storeUserData(user);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

export const checkEmailAvailability = createAsyncThunk(
  'auth/checkEmailAvailability',
  async (email: string, { rejectWithValue }) => {
    try {
      const isAvailable = await authApi.checkEmailAvailability(email);
      return isAvailable;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check email availability');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await authApi.forgotPassword(email);
      return email;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, newPassword, confirmPassword }: { token: string; newPassword: string; confirmPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await authApi.resetPassword(token, newPassword, confirmPassword);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset password');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { currentPassword, newPassword, confirmPassword }: { currentPassword: string; newPassword: string; confirmPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      await authApi.verifyEmail(token);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify email');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder.addCase(initializeAuth.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(initializeAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout all
    builder.addCase(logoutAll.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutAll.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
    builder.addCase(logoutAll.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Refresh token
    builder.addCase(refreshToken.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      }
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });

    // Update user profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Forgot password
    builder.addCase(forgotPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Reset password
    builder.addCase(resetPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Change password
    builder.addCase(changePassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Verify email
    builder.addCase(verifyEmail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyEmail.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(verifyEmail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearAuth, setUser, setError } = authSlice.actions;
export default authSlice.reducer;