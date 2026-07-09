import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // Rebuild dist/styles.css after every JS build so class names added to
  // components are picked up in both `build` and `--watch` runs.
  onSuccess: 'tailwindcss -i src/styles/chat-kit.css -o dist/styles.css --minify',
});
