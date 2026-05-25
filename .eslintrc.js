module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true,
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    '*.js',
    '!**/*.config.js',
    '.eslintrc.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.base.json', './services/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'security',
    'no-secrets',
    'sonarjs',
    'unicorn',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.base.json',
          './services/*/tsconfig.json',
          './apps/*/tsconfig.json',
        ],
      },
    },
    react: {
      version: 'detect',
    },
  },
  rules: {
    // === TypeScript ===
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
    ],

    // === Security ===
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-unsafe-regex': 'error',
    'no-secrets/no-secrets': [
      'error',
      {
        tolerance: 3.5,
        additionalRegex: {
          'private-key': '(-----BEGIN.*PRIVATE KEY-----)',
          'aws-key': '(AKIA[0-9A-Z]{16})',
          'jwt-secret': '(jwt.?secret|jwt_secret|JWT_SECRET)',
        },
      },
    ],

    // === Import ===
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        pathGroups: [
          {
            pattern: '@nestjs/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@nexapay/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'warn',
    'import/no-deprecated': 'warn',
    'import/no-relative-parent-imports': 'off',

    // === SonarJS ===
    'sonarjs/cognitive-complexity': ['warn', 15],
    'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    'sonarjs/no-collapsible-if': 'error',
    'sonarjs/no-collection-size-mischeck': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-unused-collection': 'warn',

    // === Unicorn ===
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/filename-case': [
      'warn',
      {
        cases: {
          kebabCase: true,
          pascalCase: true,
        },
      },
    ],
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/consistent-function-scoping': 'warn',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/no-process-exit': 'warn',
    'unicorn/custom-error-definition': 'warn',
    'unicorn/throw-new-error': 'error',

    // === General ===
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'no-unreachable-loop': 'error',
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'complexity': ['warn', { max: 15 }],
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts', '*.e2e-spec.ts'],
      rules: {
        'max-lines': 'off',
        'max-nested-callbacks': 'off',
        'sonarjs/no-duplicate-string': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'security/detect-object-injection': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-child-process': 'off',
        'import/no-cycle': 'off',
        'unicorn/consistent-function-scoping': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
    {
      files: ['*.config.ts', '*.config.js', '*.setup.ts'],
      rules: {
        'no-console': 'off',
        'security/detect-object-injection': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
    {
      files: ['apps/react-admin/**', 'apps/vue-portal/**', 'apps/ionic-mobile/**'],
      rules: {
        'unicorn/filename-case': [
          'warn',
          {
            cases: {
              kebabCase: true,
              pascalCase: true,
              camelCase: true,
            },
          },
        ],
      },
    },
  ],
};
