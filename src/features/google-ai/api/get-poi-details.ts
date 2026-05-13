import { PLACES_DETAILS_URL } from '../utils/constants';
import { env } from '@shared/config/env';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';

const FIELDS_MASK = ['displayName', 'photos.name'].join(',');

export async function getPoiDetails(
  placeId: string
): Promise<{ displayName: { languageCode: string; text: string }; photos: { name: string }[] } | null> {
  const url =
    `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}` +
    `?fields=${encodeURIComponent(FIELDS_MASK)}` +
    `&languageCode=en`;
  const xUserId = env.xUserId ?? (await getOrCreateInstallationId());

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-user-id': xUserId
    }
  });

  if (!res.ok) {
    const bodyText = await res.text();
    const error = new Error(bodyText || res.statusText || 'Places details request failed');
    (error as Error & { status?: number; statusText?: string }).status = res.status;
    (error as Error & { status?: number; statusText?: string }).statusText = res.statusText;
    throw error;
  }

  const data = await res.json();
  return data;
}
