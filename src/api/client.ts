import { buildPayload, MOCK_LATENCY } from '../../mock/data';
import type { RawPayloadMap } from '../../mock/types';
import type { ProviderId } from '../types';
import { PROVIDERS } from './providers';

export interface FetchResult<P extends ProviderId> {
  payload: RawPayloadMap[P];
  /** http = เรียก mock API server จริง, local = สร้างข้อมูลในเบราว์เซอร์ (กรณีเปิดแบบไฟล์ static ไม่มี server) */
  via: 'http' | 'local';
  ms: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProvider<P extends ProviderId>(id: P): Promise<FetchResult<P>> {
  const started = performance.now();
  try {
    const res = await fetch(`/mock-api${PROVIDERS[id].endpoint}`, { headers: { Accept: 'application/json' } });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(`HTTP ${res.status}`);
    const payload = (await res.json()) as RawPayloadMap[P];
    return { payload, via: 'http', ms: Math.round(performance.now() - started) };
  } catch {
    await sleep(MOCK_LATENCY[id]);
    return { payload: buildPayload(id), via: 'local', ms: Math.round(performance.now() - started) };
  }
}
