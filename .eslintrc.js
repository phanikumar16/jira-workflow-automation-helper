module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  rules: {
  },
  overrides: [
    {
      files: ['src/frontend/**/*.js'],
      env: {
        browser: true,
      },
    },
  ],
};