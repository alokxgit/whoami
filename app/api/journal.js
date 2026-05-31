import fs from 'fs';
import path from 'path';
import { getDatabaseDir } from './db.js';

export function handleJournalApi(req, res, next) {
  const entriesDir = path.join(getDatabaseDir(), 'journal');
  if (!fs.existsSync(entriesDir)) {
    fs.mkdirSync(entriesDir, { recursive: true });
  }

  // ── API: Load entries ──
  if (req.url === '/api/journal' && req.method === 'GET') {
    const files = fs.readdirSync(entriesDir);
    const spreadsMap = {};

    files.forEach(file => {
      const match = file.match(/^(.+)_(left|right)\.md$/);
      if (match) {
        const id = match[1];
        const pageSide = match[2];
        const content = fs.readFileSync(path.join(entriesDir, file), 'utf-8');

        if (!spreadsMap[id]) {
          spreadsMap[id] = { id, left: '', right: '' };
        }
        spreadsMap[id][pageSide] = content;
      } else if (file.endsWith('.md')) {
        const id = file.replace(/\.md$/, '');
        if (id.endsWith('_left') || id.endsWith('_right')) return;

        const content = fs.readFileSync(path.join(entriesDir, file), 'utf-8');
        const parts = content.split('\n\n---\n\n');
        const left = parts[0] || '';
        const right = parts.slice(1).join('\n\n---\n\n') || '';
        spreadsMap[id] = { id, left, right };
      }
    });

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
    return true;
  }

  // ── API: Save a single entry ──
  if (req.url === '/api/journal/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, left, right } = JSON.parse(body);
        if (!id) throw new Error("Missing spread id");

        const leftPath = path.join(entriesDir, `${id}_left.md`);
        const rightPath = path.join(entriesDir, `${id}_right.md`);
        if (fs.existsSync(leftPath)) fs.unlinkSync(leftPath);
        if (fs.existsSync(rightPath)) fs.unlinkSync(rightPath);

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
    return true;
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
    return true;
  }

  return false;
}
