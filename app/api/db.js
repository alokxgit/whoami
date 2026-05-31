import fs from 'fs';
import path from 'path';

export function getDatabaseDir() {
  // In production (AppImage), main.js passes the config path via env variable
  // In dev, fall back to process.cwd() as before
  const configPath = process.env.WHOAMI_CONFIG
    || path.resolve(process.cwd(), 'whoami.config.json');

  let dbDir = path.resolve(path.dirname(configPath), 'database');

  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.databasePath) {
        dbDir = path.resolve(cfg.databasePath);
      }
    } catch (e) {
      console.error('Error reading whoami.config.json:', e);
    }
  }

  return dbDir;
}

