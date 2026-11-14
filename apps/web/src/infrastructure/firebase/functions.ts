import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/infrastructure/firebase/client';

export const KUDAPKITA_FUNCTION_REGION = 'asia-southeast2';

function sessionStore(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

function requestFingerprint(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function newRequestId(): string {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* Use a session-scoped fallback below. */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function callKudapKita<TRequest extends object, TResponse>(
  functionName: string,
  payload: TRequest,
): Promise<TResponse> {
  if (!app) throw new Error('Firebase belum dikonfigurasi.');
  const functions = getFunctions(app, KUDAPKITA_FUNCTION_REGION);
  const callable = httpsCallable<TRequest, TResponse>(functions, functionName);
  try {
    const response = await callable(payload);
    return response.data;
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    if (code === 'functions/not-found' || code === 'functions/unavailable') {
      throw new Error('Backend transaksi KudapKita belum tersedia. Deploy Firebase Cloud Functions sebelum menggunakan operasi ini.');
    }
    throw error;
  }
}

/**
 * Reuses the same request ID after a transport error. Server-side writes use the
 * request ID as a deterministic document key, so retrying cannot double-apply stock.
 */
export async function callIdempotentKudapKita<TRequest extends object, TResponse>(
  functionName: string,
  payload: TRequest,
): Promise<TResponse> {
  const key = `kudapkita.callable.${functionName}.${requestFingerprint(payload)}`;
  const storage = sessionStore();
  let clientRequestId = '';
  try { clientRequestId = storage?.getItem(key) ?? ''; } catch { /* In-memory attempt fallback. */ }

  if (!clientRequestId) {
    clientRequestId = newRequestId();
    try { storage?.setItem(key, clientRequestId); } catch { /* The current attempt still carries the key. */ }
  }

  const result = await callKudapKita<
    TRequest & { clientRequestId: string },
    TResponse
  >(functionName, { ...payload, clientRequestId });

  try { storage?.removeItem(key); } catch { /* Nothing else to clear. */ }
  return result;
}
