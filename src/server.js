import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DEFAULT_INQUIRIES_FILE = path.resolve(__dirname, '../data/inquiries.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Anfrage ist zu groß.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Ungültiges JSON-Format.'), { statusCode: 400 }));
      }
    });

    req.on('error', reject);
  });
}

function serveStatic(reqPath, res) {
  const target = reqPath === '/' ? '/index.html' : reqPath;
  const resolved = path.resolve(PUBLIC_DIR, `.${target}`);

  if (
    !resolved.startsWith(PUBLIC_DIR + path.sep) &&
    resolved !== path.join(PUBLIC_DIR, 'index.html')
  ) {
    sendJson(res, 403, { error: 'Zugriff verweigert.' });
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { error: 'Datei nicht gefunden.' });
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(resolved).pipe(res);
  });
}

export function createAppServer({
  store = new CatalogStore({ inquiriesFile: DEFAULT_INQUIRIES_FILE })
} = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const { pathname } = url;
      const method = req.method || 'GET';

      if (pathname === '/api/health' && method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          service: 'yamals-stickers-aux',
          region: 'Augsburg (AUX / 0821)',
          preismodell: 'VB (Verhandlungsbasis)'
        });
        return;
      }

      if (pathname === '/api/catalog' && method === 'GET') {
        sendJson(res, 200, store.getCatalog());
        return;
      }

      if (pathname === '/api/inquiries' && method === 'GET') {
        sendJson(res, 200, { inquiries: store.listInquiries() });
        return;
      }

      if (pathname === '/api/inquiries' && method === 'POST') {
        const body = await readJsonBody(req);
        const inquiry = store.createInquiry(body);
        sendJson(res, 201, {
          message: 'Dein Preisvorschlag wurde erfolgreich gespeichert!',
          inquiry
        });
        return;
      }

      if (pathname.startsWith('/api/')) {
        sendJson(res, 404, { error: 'API-Endpunkt nicht gefunden.' });
        return;
      }

      if (method === 'GET' || method === 'HEAD') {
        serveStatic(pathname, res);
        return;
      }

      sendJson(res, 405, { error: 'Methode nicht erlaubt.' });
    } catch (err) {
      sendJson(res, err.statusCode || 400, {
        error: err.message || 'Ungültige Anfrage.'
      });
    }
  });
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const server = createAppServer();

  server.listen(port, host, () => {
    console.log(
      `Yamal's Stickers AUX (Augsburg FCA Sticker-Verkauf) läuft auf http://${host}:${port}`
    );
  });
}
