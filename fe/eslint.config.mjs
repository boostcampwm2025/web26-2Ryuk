import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', '*.config.{js,ts,mjs}'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2023,          
        RequestInit: 'readonly',
        NodeJS: 'readonly',
        React: true,
        MediaTrackConstraints: 'readonly', 
        MediaStream: 'readonly',
        MediaStreamTrack: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ESLint 기본 추천 규칙
      'no-unused-vars': 'off', // TypeScript 규칙 사용
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-extra-semi': 'error',
      'no-func-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-unexpected-multiline': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // TypeScript ESLint 추천 규칙
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React 추천 규칙
      'react/jsx-key': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'warn',

      // React Hooks 추천 규칙
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX A11y 추천 규칙 (접근성)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      /* --------------------------------------------------
       * 코드 안정성
       * -------------------------------------------------- */

      // console.log 허용하되 warn 처리
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      /* --------------------------------------------------
       * if / block 컨벤션
       * -------------------------------------------------- */

      // 한 줄 if 허용 (중괄호 선택)
      // 예: if (isReady) run();
      curly: ['error', 'multi-line'],

      // 한 줄 statement 위치 제한 해제
      'nonblock-statement-body-position': 'off',

      /* --------------------------------------------------
       * 가독성
       * -------------------------------------------------- */

      // 중첩 삼항 연산자 금지
      'no-nested-ternary': 'error',

      // else return 패턴 정리
      'no-else-return': 'error',
    },
  },
  // Prettier와 충돌하는 규칙 비활성화
  prettier,
];
