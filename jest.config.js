/**
 * Jest Configuration
 * Testing framework configuration for ES modules
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Coverage settings
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Transform files
  transform: {},
  
  // ES modules support
  extensionsToTreatAsEsm: ['.js'],
  
  // Globals
  globals: {
    'NODE_ENV': 'test'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Force exit
  forceExit: true,
  
  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
