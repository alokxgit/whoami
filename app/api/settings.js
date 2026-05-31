import fs from 'fs';
import path from 'path';
import { getDatabaseDir } from './db.js';

export function handleSettingsApi(req, res, next) {
  const dbDir = getDatabaseDir();
  const settingsDir = path.join(dbDir, 'settings');
  const settingsPath = path.join(settingsDir, 'config.json');

  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  // ── API: Load settings ──
  if (req.url === '/api/settings' && req.method === 'GET') {
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch (e) {
        settings = {};
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(settings));
    return true;
  }

  // ── API: Save settings ──
  if (req.url === '/api/settings/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        let current = {};
        if (fs.existsSync(settingsPath)) {
          try { current = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); } catch (e) {}
        }
        const updated = { ...current, ...data };
        fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, settings: updated }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // ── API: Get current database path setting ──
  if (req.url === '/api/settings/database-path' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, databasePath: dbDir }));
    return true;
  }

  // ── API: Update database path setting ──
  if (req.url === '/api/settings/database-path' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { databasePath } = JSON.parse(body);
        if (!databasePath) {
          throw new Error("Missing databasePath parameter");
        }
        const targetPath = path.resolve(databasePath);
        
        // Function to recursively copy folders
        function copyFolderRecursiveSync(source, target) {
          if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
          }
          if (fs.lstatSync(source).isDirectory()) {
            const files = fs.readdirSync(source);
            files.forEach(file => {
              const curSource = path.join(source, file);
              const curTarget = path.join(target, file);
              if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
              } else {
                fs.writeFileSync(curTarget, fs.readFileSync(curSource));
              }
            });
          }
        }

        // Migrating existing database contents if target is empty/new
        const currentDbDir = getDatabaseDir();
        if (fs.existsSync(currentDbDir) && currentDbDir !== targetPath) {
          const subdirs = ['journal', 'settings', 'knowledge_base', 'reflection', 'goals'];
          for (const subdir of subdirs) {
            const oldSubDir = path.join(currentDbDir, subdir);
            const newSubDir = path.join(targetPath, subdir);
            if (fs.existsSync(oldSubDir) && !fs.existsSync(newSubDir)) {
              copyFolderRecursiveSync(oldSubDir, newSubDir);
            }
          }
        }

        // Create target database structure (fallback in case some folders were missing)
        const subdirs = ['journal', 'settings', 'knowledge_base', 'reflection', 'goals'];
        for (const subdir of subdirs) {
          const fullSubdirPath = path.join(targetPath, subdir);
          if (!fs.existsSync(fullSubdirPath)) {
            fs.mkdirSync(fullSubdirPath, { recursive: true });
          }
        }

        // Write to config file
        const configPath = path.resolve(process.cwd(), 'whoami.config.json');
        fs.writeFileSync(configPath, JSON.stringify({ databasePath: targetPath }, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, databasePath: targetPath }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  return false;
}
