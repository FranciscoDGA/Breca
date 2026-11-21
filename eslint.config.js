import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Nenhum log pode vazar dado sensível: o Anonimizador é a única porta de saída.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // REGRAS DO MOTOR (docs/adr/0004-privacidade-on-device.md)
    // O motor é Kotlin/TS puro: sem DOM, sem rede, sem storage, sem Date.now().
    files: ['src/core/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Motor puro: injete o Clock.' },
        { name: 'document', message: 'Motor puro: sem DOM.' },
        { name: 'fetch', message: 'Motor puro: sem rede.' },
        { name: 'localStorage', message: 'Motor puro: persistência fica fora.' },
        { name: 'Date', message: 'Motor puro: use o Clock injetado.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message: 'Motor puro: use o Clock injetado (determinismo).',
        },
        {
          object: 'Math',
          property: 'random',
          message: 'Motor puro: nada de aleatoriedade fora do salt local.',
        },
      ],
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**'],
    rules: {
      'no-console': 'off',
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
)
