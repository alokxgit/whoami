import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// A local server-side middleware plugin to manage markdown files under entries/
const localJournalPlugin = () => ({
  name: 'local-journal-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const entriesDir = path.resolve(__dirname, 'database/journal');
      if (!fs.existsSync(entriesDir)) {
        fs.mkdirSync(entriesDir, { recursive: true });
      }

      const settingsDir = path.resolve(__dirname, 'database/settings');
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
        return;
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
        return;
      }

      // ── API: Load entries ──
      if (req.url === '/api/journal' && req.method === 'GET') {
        const files = fs.readdirSync(entriesDir);
        const spreadsMap = {};

        files.forEach(file => {
          // Backward compatibility: load both old-style _left/_right files and new-style unified files
          const match = file.match(/^(.+)_(left|right)\.md$/);
          if (match) {
            const id = match[1]; // e.g. 30_May_2026-1
            const pageSide = match[2]; // 'left' or 'right'
            const content = fs.readFileSync(path.join(entriesDir, file), 'utf-8');

            if (!spreadsMap[id]) {
              spreadsMap[id] = { id, left: '', right: '' };
            }
            spreadsMap[id][pageSide] = content;
          } else if (file.endsWith('.md')) {
            const id = file.replace(/\.md$/, '');
            // Skip scanning the individual left/right ones since we match them above
            if (id.endsWith('_left') || id.endsWith('_right')) return;

            const content = fs.readFileSync(path.join(entriesDir, file), 'utf-8');
            const parts = content.split('\n\n---\n\n');
            const left = parts[0] || '';
            const right = parts.slice(1).join('\n\n---\n\n') || '';
            spreadsMap[id] = { id, left, right };
          }
        });

        // Convert the map to an array and sort it chronologically
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const spreadsArray = Object.values(spreadsMap).sort((a, b) => {
          const parseId = (id) => {
            const m = id.match(/^(\d+)_([a-zA-Z]+)_(\d+)-(\d+)$/);
            if (!m) return 0;
            const day = parseInt(m[1], 10);
            const monthIdx = months.indexOf(m[2]);
            const year = parseInt(m[3], 10);
            const counter = parseInt(m[4], 10);
            return (year * 1000000) + (monthIdx * 50000) + (day * 1000) + counter;
          };
          return parseId(a.id) - parseId(b.id);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ spreads: spreadsArray }));
        return;
      }

      // ── API: Save a single entry ──
      if (req.url === '/api/journal/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { id, left, right } = JSON.parse(body);
            if (!id) throw new Error("Missing spread id");

            // Clean up legacy old-format separate files if they exist
            const leftPath = path.join(entriesDir, `${id}_left.md`);
            const rightPath = path.join(entriesDir, `${id}_right.md`);
            if (fs.existsSync(leftPath)) fs.unlinkSync(leftPath);
            if (fs.existsSync(rightPath)) fs.unlinkSync(rightPath);

            // Write unified combined file
            const filePath = path.join(entriesDir, `${id}.md`);
            const combinedContent = (left || '') + '\n\n---\n\n' + (right || '');
            fs.writeFileSync(filePath, combinedContent, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // ── API: Delete a single entry ──
      if (req.url === '/api/journal/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { id } = JSON.parse(body);
            if (!id) throw new Error("Missing spread id");

            const filePath = path.join(entriesDir, `${id}.md`);
            const leftPath = path.join(entriesDir, `${id}_left.md`);
            const rightPath = path.join(entriesDir, `${id}_right.md`);

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(leftPath)) fs.unlinkSync(leftPath);
            if (fs.existsSync(rightPath)) fs.unlinkSync(rightPath);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // ── API: Load Knowledge Base entries ──
      const kbDir = path.resolve(__dirname, 'database/knowledge_base');
      if (!fs.existsSync(kbDir)) {
        fs.mkdirSync(kbDir, { recursive: true });
      }

      if (req.url === '/api/kb' && req.method === 'GET') {
        const articlesMap = {};
        const projectsList = [];

        // Scan General (root) articles and Projects (subdirectories)
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
            if (proj === 'projects') return; // Skip legacy projects directory if it exists
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
        return;
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

            // Determine target directory
            let targetDir = kbDir;
            if (proj !== 'General' && proj !== 'projects') {
              targetDir = path.join(kbDir, proj);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
            }

            // Proactively clean up any old files starting with this id from ALL folders
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
                if (item !== 'projects') {
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

            // Write target file
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
        return;
      }

      // ── API: Delete Knowledge Base entry ──
      if (req.url === '/api/kb/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { id } = JSON.parse(body);
            if (!id) throw new Error("Missing article id");

            // Clean General and all project subfolders
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
                if (item !== 'projects') {
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
        return;
      }

      // ── API: Upload an image for the Knowledge Base ──
      const uploadsDir = path.resolve(__dirname, 'database/knowledge_base/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      if (req.url === '/api/kb/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { filename, data } = JSON.parse(body);
            if (!filename || !data) throw new Error("Missing filename or base64 data");

            // Extract the base64 content
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
        return;
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
        return;
      }

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

            // Allowed categories/subfolders
            const allowedCategories = ['daily', 'weekly', 'longterm', 'inner_desire', 'active_commitments'];
            if (!allowedCategories.includes(category)) {
              throw new Error("Invalid category: " + category);
            }

            const targetDir = category === 'active_commitments'
              ? path.resolve(__dirname, `database/reflection/${category}`)
              : path.resolve(__dirname, `database/goals/${category}`);
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
        return;
      }

      // ── API: Save and Load Reflection Commitments & Check-ins ──
      if (req.url === '/api/reflection/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { type, data } = JSON.parse(body);
            if (!type || !data) {
              throw new Error("Missing type or data");
            }
            if (type !== 'commitments' && type !== 'checkins') {
              throw new Error("Invalid reflection data type: " + type);
            }

            const targetDir = path.resolve(__dirname, 'database/reflection');
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
        return;
      }

      if (req.url.startsWith('/api/reflection/load') && req.method === 'GET') {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const type = urlObj.searchParams.get('type');
          if (type !== 'commitments' && type !== 'checkins') {
            throw new Error("Invalid reflection data type: " + type);
          }

          const targetPath = path.resolve(__dirname, `database/reflection/${type}.json`);
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
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [localJournalPlugin()],
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        reflection: resolve(__dirname, 'reflection/reflection.html'),
        goals:      resolve(__dirname, 'goals/goals.html'),
        journal:    resolve(__dirname, 'journal/journal.html'),
        kb:         resolve(__dirname, 'knowledge_base/kb.html'),
        settings:   resolve(__dirname, 'settings/settings.html'),
      }
    }
  }
});
