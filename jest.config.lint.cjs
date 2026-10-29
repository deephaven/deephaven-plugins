module.exports = {
  maxWorkers: '50%',
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
      testMatch: ['<rootDir>/plugins/*/src/js/src/**/*.css'],
      moduleFileExtensions: ['css'],
      testEnvironment: 'node',
    },
  ],
};
