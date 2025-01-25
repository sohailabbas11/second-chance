module.exports = {
env: {
    node: true,
    es2022: true
},
extends: [
    'eslint:recommended',
    'plugin:react/recommended'
],
parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
},
plugins: [
    'react'
],
settings: {
    react: {
    version: 'detect'
    }
}
};

