module.exports = {
  root: true,
  extends: ['@deephaven/eslint-config'],
  overrides: [
    {
      files: ['**/*.@(ts|tsx)'],
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    {
      // *TestUtils files are only imported by tests, so devDependencies are expected
      files: ['**/*TestUtils.@(js|jsx|ts|tsx)'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
  ],
};
