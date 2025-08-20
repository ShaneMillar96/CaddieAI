// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  errors?: string[];
  timestamp: string;
}

// User enums
export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

export enum SkillLevel {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Professional = 4
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  handicap?: number;
  skillLevelId: SkillLevel;
  preferences?: Record<string, any>;
  playingStyle?: Record<string, any>;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
}

// Authentication request types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  handicap?: number;
  skillLevelId: SkillLevel;
  preferences?: Record<string, any>;
  playingStyle?: Record<string, any>;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// Authentication response types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// Redux state types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Form validation types
export interface FormErrors {
  [key: string]: string[];
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  ActiveRound: undefined;
  AIChat: undefined; // Keep same key for navigation compatibility, but now shows AI Caddie
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

// Paginated response wrapper interface (shared)
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Re-export all golf domain types
export * from './golf';