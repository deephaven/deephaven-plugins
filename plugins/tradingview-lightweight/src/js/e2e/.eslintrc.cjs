// The Playwright e2e suite uses test idioms the plugin's src/ rules forbid
// (sequential awaits in loops, non-null assertions on locator results) and
// imports @playwright/test, which is a repo-root devDependency rather than a
// plugin dependency. Relax those here, scoped to e2e/.
module.exports = {
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
