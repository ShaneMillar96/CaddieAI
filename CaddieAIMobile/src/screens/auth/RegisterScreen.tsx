import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { register, clearError, checkEmailAvailability } from '../../store/slices/authSlice';
import { AuthStackParamList, RegisterRequest, SkillLevel } from '../../types';
import {
  TextInput,
  Button,
  LoadingSpinner,
  ErrorMessage,
  SkillLevelPicker,
} from '../../components/auth';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    handicap: undefined,
    skillLevel: SkillLevel.Beginner,
  });

  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    handicap?: string;
  }>({});

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to home screen or main app
      // navigation.navigate('Home');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Clear error when component mounts
    if (error) {
      dispatch(clearError());
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Handicap validation
    if (formData.handicap !== undefined) {
      if (formData.handicap < 0 || formData.handicap > 54) {
        errors.handicap = 'Handicap must be between 0 and 54';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(register(formData)).unwrap();
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleInputChange = (field: keyof RegisterRequest, value: string | number | SkillLevel) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
      setEmailCheckLoading(true);
      try {
        const isAvailable = await dispatch(checkEmailAvailability(formData.email)).unwrap();
        if (!isAvailable) {
          setFormErrors(prev => ({
            ...prev,
            email: 'This email is already registered',
          }));
        }
      } catch (error) {
        console.error('Email check error:', error);
      } finally {
        setEmailCheckLoading(false);
      }
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
  };

  if (isLoading) {
    return <LoadingSpinner message="Creating your account..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CaddieAI and improve your golf game</Text>
        </View>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
          />
        )}

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              error={formErrors.firstName}
              placeholder="First name"
              containerStyle={styles.nameInput}
              required
            />
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              error={formErrors.lastName}
              placeholder="Last name"
              containerStyle={styles.nameInput}
              required
            />
          </View>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            onBlur={handleEmailBlur}
            error={formErrors.email}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            required
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            error={formErrors.password}
            placeholder="Create a password"
            secureTextEntry
            required
          />

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            error={formErrors.confirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            required
          />

          <TextInput
            label="Golf Handicap (Optional)"
            value={formData.handicap?.toString() || ''}
            onChangeText={(text) => {
              const handicap = text.trim() ? parseFloat(text) : undefined;
              setFormData(prev => ({ ...prev, handicap }));
            }}
            error={formErrors.handicap}
            placeholder="Enter your handicap (0-54)"
            keyboardType="numeric"
          />

          <SkillLevelPicker
            label="Skill Level"
            selectedLevel={formData.skillLevel}
            onLevelChange={(level) => handleInputChange('skillLevel', level)}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;