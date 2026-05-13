import { IPhotonReverse } from '../types/photon-reverse';
import { REVERSE_GEOCODE_URL } from '../utils/constants';
import { env } from '@shared/config/env';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';

export async function fetchPhotonReversePlace(lat: number, lon: number, limit: number = 1): Promise<IPhotonReverse> {
  const url = `${REVERSE_GEOCODE_URL}/?lat=${lat}&lon=${lon}&lang=en&limit=${limit}`;
  const xUserId = env.xUserId ?? await getOrCreateInstallationId();
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': xUserId
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let body: unknown;
      try {
        body = text ? JSON.parse(text) : text;
      } catch {
        body = text;
      }
      const error = new Error(`Photon reverse failed: ${res.status}`, { cause: res });
      (error as Error & { status?: number; body?: unknown }).status = res.status;
      (error as Error & { status?: number; body?: unknown }).body = body;
      throw error;
    }
    return res.json();
  } catch (error) {
    const err = error as Error & { status?: number; body?: unknown };
    const wrapped = new Error('Photon reverse failed', { cause: err });
    (wrapped as Error & { status?: number; body?: unknown }).status = err?.status;
    (wrapped as Error & { status?: number; body?: unknown }).body = err?.body;
    throw wrapped;
  }
}
