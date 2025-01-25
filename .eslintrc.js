module.exports = {
    env: {
      browser: true,
      node: true,
      es6: true,
      jest: true,
    },
    extends: [
      'eslint:recommended'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      // Enforce consistent indentation
      'indent': ['error', 2],
      // Require semicolons
      'semi': ['error', 'always'],
      // Allow both single and double quotes
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true, 'avoidEscape': true }],
      // No unused variables
      'no-unused-vars': 'warn',
      // Allow console statements in all environments
      'no-console': 'off',
    },
  };
  
