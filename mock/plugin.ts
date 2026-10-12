// Mock API server — ทำงานใน Node ผ่าน dev server ของ Vite
// GET /mock-api/<provider>/... จะตอบ JSON จำลองของระบบนั้น พร้อมหน่วงเวลาให้เหมือนเรียกผ่านเครือข่ายจริง
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { buildPayload, MOCK_LATENCY } from './data.ts';
import { PROVIDER_IDS, type ProviderId } from './types.ts';

type Next = (err?: unknown) => void;

function handle(req: IncomingMessage, res: ServerResponse, next: Next) {
  // เมื่อผูกกับ '/mock-api' แล้ว req.url จะเหลือ '/<provider>/...'
  const segment = (req.url ?? '').split('?')[0].split('/')[1] ?? '';
  if (!PROVIDER_IDS.includes(segment as ProviderId)) {
    next();
    return;
  }
  const provider = segment as ProviderId;
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }
  setTimeout(() => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Mock-Provider', provider);
    res.end(JSON.stringify(buildPayload(provider)));
  }, MOCK_LATENCY[provider]);
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'taskdock-mock-api',
    configureServer(server) {
      server.middlewares.use('/mock-api', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/mock-api', handle);
    },
  };
}
