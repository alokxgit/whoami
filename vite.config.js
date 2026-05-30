import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        reflection: resolve(__dirname, 'reflection/reflection.html'),
        goals:      resolve(__dirname, 'goals/goals.html'),
        journal:    resolve(__dirname, 'journal/journal.html'),
        settings:   resolve(__dirname, 'settings/settings.html'),
      }
    }
  }
});
