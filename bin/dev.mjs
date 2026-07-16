#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockHostDir = path.join(__dirname, '..', 'mock-host');

const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const wizardDir = path.resolve(positional[0] ?? '.');
const PORT = parseInt(process.env.PORT ?? '9999', 10);
const VALIDATE_ONLY = flags.has('--validate-only');

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

// ── Fixture loading ───────────────────────────────────────────────────────────

async function loadFixtures() {
    const fixturesDir = path.join(wizardDir, 'fixtures');
    if (!fs.existsSync(fixturesDir)) return { fixtures: {}, hasErrors: false };

    let fixtureSchemas;
    try {
        ({ fixtureSchemas } = await import(path.join(__dirname, '..', 'dist', 'schemas.js')));
    } catch (e) {
        console.warn(`  Warning: could not load schemas — ${e.message}`);
        return { fixtures: {}, hasErrors: false };
    }

    const fixtures = {};
    let hasErrors = false;

    for (const [key, schema] of Object.entries(fixtureSchemas)) {
        const filePath = path.join(fixturesDir, `${key}.json`);
        if (!fs.existsSync(filePath)) continue;

        let raw;
        try {
            raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`  ✗ fixtures/${key}.json: invalid JSON — ${e.message}`);
            hasErrors = true;
            continue;
        }

        const result = schema.safeParse(raw);
        if (!result.success) {
            console.error(`  ✗ fixtures/${key}.json:`);
            for (const issue of result.error.issues) {
                const p = issue.path.length ? issue.path.join('.') : '(root)';
                console.error(`      [${p}] ${issue.message}`);
            }
            hasErrors = true;
        } else {
            fixtures[key] = result.data;
            console.log(`  ✓ fixtures/${key}.json`);
        }
    }

    return { fixtures, hasErrors };
}

// ── Startup ───────────────────────────────────────────────────────────────────

console.log(`\nFastEdge wizard mock host`);
console.log(`  Wizard: ${wizardDir}`);

let loadedFixtures = {};

if (fs.existsSync(path.join(wizardDir, 'fixtures'))) {
    console.log('\nValidating fixtures...');
    const { fixtures, hasErrors } = await loadFixtures();
    loadedFixtures = fixtures;

    if (VALIDATE_ONLY) {
        console.log(hasErrors ? '\nFixture validation failed.' : '\nAll fixtures valid.');
        process.exit(hasErrors ? 1 : 0);
    }

    if (hasErrors) {
        console.warn('\n  Warning: fixture errors above — defaults will be used.');
    }
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;

    if (urlPath === '/' || urlPath === '/mock-host') {
        serveFile(res, path.join(mockHostDir, 'index.html'));
        return;
    }

    // Fixture data for host.js to override stubs
    if (urlPath === '/mock-host/fixtures.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(loadedFixtures));
        return;
    }

    // Mock host assets (JS, CSS) — same origin, no CORS needed
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
    console.log(`\n  Open:   http://localhost:${PORT}/mock-host`);
    console.log('\nPress Ctrl+C to stop.\n');
});
