// Simple test to verify our authentication implementation
import { validateField, isValidEmail, isStrongPassword } from '../utils/validation';

// Test validation functions
console.log('Testing validation functions...');

// Test email validation
console.log('Email validation tests:');
console.log('test@example.com:', isValidEmail('test@example.com')); // Should be true
console.log('invalid-email:', isValidEmail('invalid-email')); // Should be false
console.log('user@domain.co.uk:', isValidEmail('user@domain.co.uk')); // Should be true

// Test password validation
console.log('\nPassword validation tests:');
console.log('TestPassword123!:', isStrongPassword('TestPassword123!')); // Should be true
console.log('weak:', isStrongPassword('weak')); // Should be false
console.log('NoSpecialChar123:', isStrongPassword('NoSpecialChar123')); // Should be false

// Test field validation
console.log('\nField validation tests:');
console.log('Required field with value:', validateField('test', { required: true })); // Should be null
console.log('Required field empty:', validateField('', { required: true })); // Should return error
console.log('Min length valid:', validateField('hello', { minLength: 3 })); // Should be null
console.log('Min length invalid:', validateField('hi', { minLength: 3 })); // Should return error

console.log('\nAll validation tests completed!');

export {};