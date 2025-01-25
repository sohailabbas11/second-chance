module.exports = {
env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
},
extends: [
    'eslint:recommended'
],
parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
    jsx: true
    }
},
rules: {
    // Enforce consistent indentation
    'indent': ['error', 2],
    // Require semicolons
    'semi': ['error', 'always'],
    // Use single quotes
    'quotes': ['error', 'single'],
    // No unused variables
    'no-unused-vars': 'warn',
    // No console statements in production
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
}
};

