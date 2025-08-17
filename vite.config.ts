// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isCI = process.env.GITHUB_ACTIONS === 'true';
const base = isCI ? '/countdown-timer-ts/' : '/';

export default defineConfig({
  plugins: [react()],
  base,
});
