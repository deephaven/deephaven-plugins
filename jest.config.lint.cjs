module.exports = {
  watchPlugins: ['jest-runner-eslint/watch-fix'],
  projects: [
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/plugins/*/src/js/src/**/*.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
    },
    {
      displayName: 'stylelint',
      runner: 'jest-runner-stylelint',
      testMatch: [
        '<rootDir>/packages/*/src/js/src/**/*.scss',
        '<rootDir>/packages/*/src/js/scss/**/*.scss',
      ],
      moduleFileExtensions: ['scss'],
      testEnvironment: 'node',
    },
  ],
};
