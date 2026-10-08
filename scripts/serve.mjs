// Local gallery server. AGPL-3.0-only; see LICENSE.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.xml': 'application/xml; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      const relativeTarget = relative(root, target);
      if (relativeTarget.startsWith('..') || isAbsolute(relativeTarget)) { res.writeHead(403); return res.end('Forbidden'); }
      const data = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Gallery: http://127.0.0.1:${port}`));
}
