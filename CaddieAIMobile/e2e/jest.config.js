/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    'detox/runners/jest/streamlineReporter'
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  bail: false,
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js']
};