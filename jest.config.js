module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Use JSDOM for content script tests
  projects: [
    {
      displayName: 'content',
      testMatch: ['<rootDir>/test/content/**/*.test.[jt]s?(x)'],
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json'
        }]
      },
      setupFilesAfterEnv: ['./jest.setup.js']
    },
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/test/!(content|selenium)/**/*.test.[jt]s?(x)'
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json'
        }]
      },
      setupFilesAfterEnv: ['./jest.setup.js']
    }
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  testTimeout: 30000, // Increased timeout for Puppeteer tests
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  testEnvironmentOptions: {
    'jest-environment-node': {
      // Required for Puppeteer
      globals: {
        Uint8Array: Uint8Array,
        Uint16Array: Uint16Array,
        Uint32Array: Uint32Array,
        Int8Array: Int8Array,
        Int16Array: Int16Array,
        Int32Array: Int32Array,
        Float32Array: Float32Array,
        Float64Array: Float64Array,
        Uint8ClampedArray: Uint8ClampedArray,
        ArrayBuffer: ArrayBuffer,
        DataView: DataView,
      }
    }
  }
};
