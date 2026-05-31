import fs from 'fs';
import path from 'path';

export function getDatabaseDir() {
  const rootDir = process.cwd();
  const configPath = path.resolve(rootDir, 'whoami.config.json');
  let dbDir = path.resolve(rootDir, 'database');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.databasePath) {
        dbDir = path.resolve(cfg.databasePath);
      }
    } catch (e) {
      console.error("Error reading whoami.config.json:", e);
    }
  }
  return dbDir;
}
