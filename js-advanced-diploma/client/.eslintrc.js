// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    // 'jest/globals': true,
  },
  // plugins: ['prettier', 'jest'],
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-var': 'error'
  },
};
