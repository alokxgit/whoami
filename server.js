/**
 * server.js — whoami production server (CommonJS)
 * Required directly by main.js in production mode.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 9999;
const DIST_DIR = process.env.WHOAMI_DIST || path.join(__dirname, 'dist');
const APP_DIR = process.env.WHOAMI_APP_DIR || __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
};

// Dynamically require API handlers from the app directory
function loadApiHandlers() {
    const { createRequire } = require('module');
    const requireFromApp = createRequire(path.join(APP_DIR, 'package.json'));

    try {
        // We need to use dynamic import for ES modules
        return null; // will use async loading below
    } catch (e) {
        console.error('Failed to load API handlers:', e);
        return null;
    }
}

function serveStaticFile(req, res) {
    const urlPath = req.url.split('?')[0];
    const filePath = urlPath === '/'
        ? path.join(DIST_DIR, 'app', 'index.html')
        : path.join(DIST_DIR, urlPath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            const htmlPath = filePath + '.html';
            fs.readFile(htmlPath, (err2, data2) => {
                if (err2) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end(`404 Not Found: ${urlPath}`);
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data2);
                }
            });
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

async function startServer() {
    // Dynamically import ES module API handlers
    const { handleSettingsApi } = await import(pathToFileURL(path.join(APP_DIR, 'app/api/settings.js')).href);
    const { handleJournalApi } = await import(pathToFileURL(path.join(APP_DIR, 'app/api/journal.js')).href);
    const { handleKbApi } = await import(pathToFileURL(path.join(APP_DIR, 'app/api/kb.js')).href);
    const { handleGoalsApi } = await import(pathToFileURL(path.join(APP_DIR, 'app/api/goals.js')).href);
    const { handleReflectionApi } = await import(pathToFileURL(path.join(APP_DIR, 'app/api/reflection.js')).href);

    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (handleSettingsApi(req, res, () => { })) return;
        if (handleJournalApi(req, res, () => { })) return;
        if (handleKbApi(req, res, () => { })) return;
        if (handleGoalsApi(req, res, () => { })) return;
        if (handleReflectionApi(req, res, () => { })) return;

        serveStaticFile(req, res);
    });

    server.listen(PORT, '127.0.0.1', () => {
        console.log(`whoami server running at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });
}

const { pathToFileURL } = require('url');
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});