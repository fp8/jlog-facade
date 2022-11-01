module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        "@typescript-eslint/no-empty-function": ["error", { "allow": ["constructors"] }],
        "@typescript-eslint/no-unused-vars": [
            "warn", // or "error"
            { 
              "argsIgnorePattern": "^_",
              "varsIgnorePattern": "^_",
              "caughtErrorsIgnorePattern": "^_"
            }
          ]
    }
};
