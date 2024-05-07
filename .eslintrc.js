module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  rules: {
    'prettier/prettier': ['error', {singleQuote: true, printWidth: 80}],
    'global-require': 0,
    'no-console': 0,
    'no-undef': 0,
    'eol-last': 2,
    'semi': ['error', 'always'],
    'no-trailing-spaces': 'error',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
};
