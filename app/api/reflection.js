import fs from 'fs';
import path from 'path';
import { getDatabaseDir } from './db.js';

export function handleReflectionApi(req, res, next) {
  // ── API: Save Reflection Commitments, Check-ins & Who I Am ──
  if (req.url === '/api/reflection/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { type, data } = JSON.parse(body);
        if (!type || !data) {
          throw new Error("Missing type or data");
        }
        if (type !== 'commitments' && type !== 'checkins' && type !== 'whoami') {
          throw new Error("Invalid reflection data type: " + type);
        }

        const targetDir = path.join(getDatabaseDir(), 'reflection');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetPath = path.join(targetDir, `${type}.json`);
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

  // ── API: Load Reflection Commitments, Check-ins & Who I Am ──
  if (req.url.startsWith('/api/reflection/load') && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const type = urlObj.searchParams.get('type');
      if (type !== 'commitments' && type !== 'checkins' && type !== 'whoami') {
        throw new Error("Invalid reflection data type: " + type);
      }

      const targetPath = path.join(getDatabaseDir(), `reflection/${type}.json`);
      if (fs.existsSync(targetPath)) {
        const content = fs.readFileSync(targetPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([])); // Return empty array if file does not exist yet
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}
