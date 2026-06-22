/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['../config/eslint.base.cjs'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.cjs'],
};
