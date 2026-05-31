import fs from 'fs';
import path from 'path';
import { getDatabaseDir } from './db.js';

export function handleGoalsApi(req, res, next) {
  // ── API: Save and Reset Goals & Tasks ──
  if (req.url === '/api/goals/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { category, filename, data } = JSON.parse(body);
        if (!category || !filename || !data) {
          throw new Error("Missing category, filename, or data");
        }

        const allowedCategories = ['daily', 'weekly', 'longterm', 'inner_desire', 'active_commitments'];
        if (!allowedCategories.includes(category)) {
          throw new Error("Invalid category: " + category);
        }

        const targetDir = category === 'active_commitments'
          ? path.join(getDatabaseDir(), `reflection/${category}`)
          : path.join(getDatabaseDir(), `goals/${category}`);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const targetPath = path.join(targetDir, sanitizedFilename);
        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  return false;
}
