#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockHostDir = path.join(__dirname, '..', 'mock-host');

const args = process.argv.slice(2);
const wizardDir = path.resolve(args[0] ?? '.');
const PORT = parseInt(process.env.PORT ?? '9999', 10);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
};

function serveFile(res, filePath, extraHeaders = {}) {
    let data;
    try { data = fs.readFileSync(filePath); }
    catch { res.writeHead(404); res.end('Not found'); return; }
    const mime = MIME[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, ...extraHeaders });
    res.end(data);
}

const server = http.createServer((req, res) => {
    const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;

    // Mock host index
    if (urlPath === '/' || urlPath === '/mock-host') {
        serveFile(res, path.join(mockHostDir, 'index.html'));
        return;
    }

    // Mock host assets (JS, CSS) — no CORS needed, same origin as host page
    if (urlPath.startsWith('/mock-host/')) {
        const rel = urlPath.slice('/mock-host/'.length);
        const target = path.join(mockHostDir, rel);
        if (!target.startsWith(mockHostDir + path.sep)) {
            res.writeHead(403); res.end('Forbidden'); return;
        }
        serveFile(res, target);
        return;
    }

    // Wizard files — sandboxed iframe needs CORS to load subresources
    const target = path.resolve(wizardDir, '.' + urlPath);
    const rel = path.relative(wizardDir, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }
    serveFile(res, target, { 'Access-Control-Allow-Origin': '*' });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use. Set PORT=<n> env var to change it.\n`);
    } else {
        console.error(err.message);
    }
    process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\nFastEdge wizard mock host`);
    console.log(`  Open:   http://localhost:${PORT}/mock-host`);
    console.log(`  Wizard: ${wizardDir}`);
    console.log('\nPress Ctrl+C to stop.\n');
});
