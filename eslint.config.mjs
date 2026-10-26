import nextConfig from 'eslint-config-next/core-web-vitals';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'public/**'] },
  ...nextConfig,
  {
    rules: {
      // These React Compiler heuristics flag long-standing, intentional bridge
      // refs between React and the imperative Three.js game loop.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;

