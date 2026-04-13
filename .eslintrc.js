module.exports = {
  root: true,
  extends: ['@deephaven/eslint-config'],
  overrides: [
    {
      files: ['**/*.@(ts|tsx)'],
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
