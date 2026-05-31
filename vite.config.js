import { defineConfig } from 'vite';
import { resolve } from 'path';

import { handleSettingsApi } from './app/api/settings.js';
import { handleJournalApi } from './app/api/journal.js';
import { handleKbApi } from './app/api/kb.js';
import { handleGoalsApi } from './app/api/goals.js';
import { handleReflectionApi } from './app/api/reflection.js';

// A local server-side middleware plugin to delegate to the modular api files
const localJournalPlugin = () => ({
  name: 'local-journal-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // 1. Settings Endpoints
      if (handleSettingsApi(req, res, next)) return;

      // 2. Journal Endpoints
      if (handleJournalApi(req, res, next)) return;

      // 3. Knowledge Base Endpoints
      if (handleKbApi(req, res, next)) return;

      // 4. Goals Endpoints
      if (handleGoalsApi(req, res, next)) return;

      // 5. Reflection Endpoints
      if (handleReflectionApi(req, res, next)) return;

      next();
    });
  }
});

export default defineConfig({
  plugins: [localJournalPlugin()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html'),
        reflection: resolve(__dirname, 'app/pages/reflection/reflection.html'),
        goals: resolve(__dirname, 'app/pages/goals/goals.html'),
        journal: resolve(__dirname, 'app/pages/journal/journal.html'),
        kb: resolve(__dirname, 'app/pages/knowledge_base/kb.html'),
        settings: resolve(__dirname, 'app/pages/settings/settings.html'),
        shortcuts: resolve(__dirname, 'app/pages/shortcuts/shortcuts.html'),
      }
    }
  }
});
