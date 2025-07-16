import { FormErrors } from '../types';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export const validateField = (value: any, rules: ValidationRule): string | null => {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return rules.message || 'This field is required';
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return rules.message || `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message || `Must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Invalid format';
    }
  }

  return null;
};

export const validateForm = (data: any, rules: ValidationRules): FormErrors => {
  const errors: FormErrors = {};

  Object.keys(rules).forEach(field => {
    const fieldError = validateField(data[field], rules[field]);
    if (fieldError) {
      errors[field] = [fieldError];
    }
  });

  return errors;
};

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /\S+@\S+\.\S+/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain uppercase, lowercase, number, and special character',
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'First name must be between 2 and 50 characters',
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Last name must be between 2 and 50 characters',
  },
  handicap: {
    pattern: /^([0-9]|[1-4][0-9]|5[0-4])(\.\d+)?$/,
    message: 'Handicap must be between 0 and 54',
  },
};

// Validation helper functions
export const isValidEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8 && 
         /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
};

export const isValidHandicap = (handicap: number): boolean => {
  return handicap >= 0 && handicap <= 54;
};

export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};