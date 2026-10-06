import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import handler from '../api/qr-payment.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4179);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/qr-payment') {
    let body = '';
    try {
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16384) { res.writeHead(413); res.end(); return; }
      }
      req.body = body || {};
      await handler(req, res);
    } catch { res.writeHead(400); res.end(); }
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end(); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, relative);
  const allowed = !relative.split(/[\\/]/).some(part => part.startsWith('.') || ['api', 'server', 'scripts', 'tests'].includes(part));
  if (!allowed || !file.startsWith(root + path.sep) || !mime[path.extname(file)] || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404); res.end(); return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end(); }
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Local demo: http://localhost:${port}`);
  for (const adapter of Object.values(networkInterfaces()).flat()) {
    if (adapter.family === 'IPv4' && !adapter.internal) console.log(`Same-Wi-Fi URL: http://${adapter.address}:${port}`);
  }
  console.log('Stateless demo payment API enabled. No database or payment credentials required.');
});
