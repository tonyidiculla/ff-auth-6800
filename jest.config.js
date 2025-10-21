module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.(js|ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};