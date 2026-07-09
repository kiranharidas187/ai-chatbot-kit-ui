import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  // Never clean in watch mode: the demo's Vite server resolves dist/ live and
  // a momentarily-empty dist breaks its import analysis.
  clean: !options.watch,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // Rebuild dist/styles.css after every JS build so class names added to
  // components are picked up in both `build` and `--watch` runs.
  onSuccess: 'tailwindcss -i src/styles/chat-kit.css -o dist/styles.css --minify',
}));
