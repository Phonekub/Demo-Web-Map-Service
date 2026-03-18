/**
 * sls-alm-slmap-web/babel.config.cjs
 *
 * Babel configuration used by `babel-jest` to transform JS/JSX files during tests.
 * - Uses `@babel/preset-env` targeting the current Node to keep transforms minimal in CI.
 * - Uses `@babel/preset-react` with the automatic runtime to support JSX (React 17+ JSX transform).
 * - In the `test` env we transform ES modules to CommonJS so Jest can run transforms reliably.
 *
 * If you later want Babel to also handle TypeScript files instead of `ts-jest`,
 * add `@babel/preset-typescript` to `presets`.
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Target the current Node version (Jest runs in Node) to avoid unnecessary transforms.
        targets: { node: 'current' },
        // Keep assumptions minimal; adjust if you want smaller output for older environments.
        bugfixes: true,
      },
    ],
    [
      '@babel/preset-react',
      {
        // Use the automatic runtime (JSX transform) used by modern React setups (react-jsx).
        runtime: 'automatic',
      },
    ],
    // If you want Babel to compile TypeScript files instead of ts-jest, uncomment:
    // '@babel/preset-typescript',
  ],

  plugins: [
    // Optional: include runtime transform if you rely on helpers/regenerator in runtime code.
    // ['@babel/plugin-transform-runtime', { regenerator: true }],
  ],

  env: {
    test: {
      // Ensure ES modules are transformed to CommonJS for Jest's environment
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};
