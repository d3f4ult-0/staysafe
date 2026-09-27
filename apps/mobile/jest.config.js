module.exports = {
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(zustand|lucide-react-native|expo-sqlite|expo)/)',
  ],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/tests/__mocks__/expo-sqlite.js',
  },
};
