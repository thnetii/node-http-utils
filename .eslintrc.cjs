module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    'node',
    'prettier',
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript',
    'plugin:prettier/recommended',
  ],
};
