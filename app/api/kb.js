import fs from 'fs';
import path from 'path';
import { getDatabaseDir } from './db.js';

export function handleKbApi(req, res, next) {
  const kbDir = path.join(getDatabaseDir(), 'knowledge_base');
  const uploadsDir = path.join(kbDir, 'uploads');

  if (!fs.existsSync(kbDir)) {
    fs.mkdirSync(kbDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // ── API: Load Knowledge Base entries ──
  if (req.url === '/api/kb' && req.method === 'GET') {
    const articlesMap = {};
    const projectsList = [];

    const rootItems = fs.readdirSync(kbDir);
    rootItems.forEach(item => {
      const itemPath = path.join(kbDir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        const match = item.match(/^((?:kb_)?\d+_[a-zA-Z]+_\d+-\d+)_(.*)\.md$/);
        if (match) {
          const id = match[1];
          const title = match[2];
          const content = fs.readFileSync(itemPath, 'utf-8');
          const parts = content.split('\n\n---\n\n');
          const left = parts[0] || '';
          const right = parts.slice(1).join('\n\n---\n\n') || '';
          articlesMap[id] = { id, title, left, right, project: 'General' };
        }
      } else if (stats.isDirectory()) {
        const proj = item;
        if (proj === 'projects' || proj === 'uploads') return;
        projectsList.push(proj);
        const projFiles = fs.readdirSync(itemPath);
        projFiles.forEach(file => {
          const filePath = path.join(itemPath, file);
          if (fs.statSync(filePath).isFile()) {
            const match = file.match(/^((?:kb_)?\d+_[a-zA-Z]+_\d+-\d+)_(.*)\.md$/);
            if (match) {
              const id = match[1];
              const title = match[2];
              const content = fs.readFileSync(filePath, 'utf-8');
              const parts = content.split('\n\n---\n\n');
              const left = parts[0] || '';
              const right = parts.slice(1).join('\n\n---\n\n') || '';
              articlesMap[id] = { id, title, left, right, project: proj };
            }
          }
        });
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ spreads: Object.values(articlesMap), projects: projectsList }));
    return true;
  }

  // ── API: Save Knowledge Base entry ──
  if (req.url === '/api/kb/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, title, left, right, project } = JSON.parse(body);
        if (!id) throw new Error("Missing article id");

        const sanitizedTitle = (title || 'Untitled').trim().replace(/[^a-zA-Z0-9_\-\s]+/g, '').replace(/\s+/g, '_').substring(0, 30) || 'Untitled';
        const proj = (project || 'General').trim();

        let targetDir = kbDir;
        if (proj !== 'General' && proj !== 'projects') {
          targetDir = path.join(kbDir, proj);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
        }

        fs.readdirSync(kbDir).forEach(item => {
          const itemPath = path.join(kbDir, item);
          const stats = fs.statSync(itemPath);
          if (stats.isFile()) {
            if (item.startsWith(id + '_') && item.endsWith('.md')) {
              if (fs.existsSync(itemPath)) {
                fs.unlinkSync(itemPath);
              }
            }
          } else if (stats.isDirectory()) {
            if (item !== 'projects' && item !== 'uploads') {
              fs.readdirSync(itemPath).forEach(file => {
                if (file.startsWith(id + '_') && file.endsWith('.md')) {
                  const filePath = path.join(itemPath, file);
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                }
              });
            }
          }
        });

        const filePath = path.join(targetDir, `${id}_${sanitizedTitle}.md`);
        const combinedContent = (left || '') + '\n\n---\n\n' + (right || '');
        fs.writeFileSync(filePath, combinedContent, 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // ── API: Delete Knowledge Base entry ──
  if (req.url === '/api/kb/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        if (!id) throw new Error("Missing article id");

        fs.readdirSync(kbDir).forEach(item => {
          const itemPath = path.join(kbDir, item);
          const stats = fs.statSync(itemPath);
          if (stats.isFile()) {
            if (item.startsWith(id + '_') && item.endsWith('.md')) {
              if (fs.existsSync(itemPath)) {
                fs.unlinkSync(itemPath);
              }
            }
          } else if (stats.isDirectory()) {
            if (item !== 'projects' && item !== 'uploads') {
              fs.readdirSync(itemPath).forEach(file => {
                if (file.startsWith(id + '_') && file.endsWith('.md')) {
                  const filePath = path.join(itemPath, file);
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                }
              });
            }
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // ── API: Upload an image for the Knowledge Base ──
  if (req.url === '/api/kb/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, data } = JSON.parse(body);
        if (!filename || !data) throw new Error("Missing filename or base64 data");

        const base64Content = data.split(';base64,').pop();
        const uniqueFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_\.\-]+/g, '_')}`;
        const targetPath = path.join(uploadsDir, uniqueFilename);

        fs.writeFileSync(targetPath, base64Content, 'base64');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: `/api/kb/uploads/${uniqueFilename}` }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // ── API: Serve uploaded Knowledge Base images ──
  if (req.url.startsWith('/api/kb/uploads/') && req.method === 'GET') {
    const parts = req.url.split('/api/kb/uploads/');
    const filename = parts[1] ? decodeURIComponent(parts[1]) : '';
    const targetPath = path.join(uploadsDir, filename);

    if (filename && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.webp') contentType = 'image/webp';

      const content = fs.readFileSync(targetPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
    return true;
  }

  return false;
}
