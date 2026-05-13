import { PLACES_SEARCH_TEXT_URL } from '../utils/constants';
import { env } from '@shared/config/env';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';

type PlacesV1Response = {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode?: string } | string;
    location?: { latitude: number; longitude: number };
    photos?: Array<{ name: string }>;
  }>;
};

const displayNameText = (d?: string | { text: string; languageCode?: string } | null) =>
  typeof d === 'string' ? d : d?.text ?? null;

export type GeocodedPlace = {
  displayName: { text: string };
  placeId: string | null;
  resolvedName: string | null;
  location: { latitude: number; longitude: number } | null;
  address: string | null;
  photos?: { url: string }[];
  description?: string | null;
  rating?: number | null;
};

async function searchTextV1(
  textQuery: string,
  center: { latitude: number; longitude: number },
  radiusMeters: number
): Promise<PlacesV1Response> {
  const locationBiasRadius = Math.min(
    Math.max(radiusMeters * 1.1, 1000), // +10% safety margin
    50000
  );
  const xUserId = env.xUserId ?? (await getOrCreateInstallationId());

  const res = await fetch(`${PLACES_SEARCH_TEXT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': xUserId,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.photos.name'
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'en',
      maxResultCount: 1,
      locationBias: {
        circle: {
          center,
          radius: locationBiasRadius
        }
      }
    })
  });

  if (!res.ok) {
    const message = await res.text();
    const error = new Error('Places searchText failed');
    (error as { cause?: { message: string; status: number } }).cause = { message, status: res.status };
    throw error;
  }

  return (await res.json()) as PlacesV1Response;
}

const normalizeString = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’'".,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const matchScore = (inputName: string, resolvedName: string | null) => {
  if (!resolvedName) return 0;
  const a = normalizeString(inputName);
  const b = normalizeString(resolvedName);
  if (a === b) return 3;
  if (a.includes(b) || b.includes(a)) return 2;
  return 1;
};

const addressScore = (address: string | null) => {
  if (!address) return 0;
  // The longer / more specific the address, the higher the score.
  return Math.min(3, Math.ceil(address.length / 30));
};

export function dedupeByPlaceId<
  T extends {
    placeId: string | null;
    resolvedName: string | null;
    displayName?: { text: string };
    address: string | null;
  }
>(rows: T[]) {
  const map = new Map<string, T>();

  for (const r of rows) {
    const pid = r.placeId;
    if (!pid) continue;

    const curr = map.get(pid);
    if (!curr) {
      map.set(pid, r);
      continue;
    }

    const rScore = matchScore(r.displayName?.text ?? '', r.resolvedName) + addressScore(r.address);
    const cScore = matchScore(curr.displayName?.text ?? '', curr.resolvedName) + addressScore(curr.address);

    if (rScore > cScore) {
      map.set(pid, r);
    }
  }

  const noId = rows.filter((r) => !r.placeId);
  return [...map.values(), ...noId];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function geocodePoiList({
  items,
  city,
  countryName,
  center,
  radiusMeters
}: {
  items: { name: string; description: string }[];
  city: string;
  countryName: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
}) {
  const results: Array<{
    displayName: { text: string };
    placeId: string | null;
    resolvedName: string | null;
    location: { latitude: number; longitude: number } | null;
    address: string | null;
    photos?: { name: string }[];
    description?: string | null;
  }> = [];
  const errors: Array<{ message: string; status: number }> = [];

  // Batch searchText requests in groups of 5.
  const chunkSize = 5;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        const query = `${item.name}, ${city}, ${countryName}`;

        let searchCoordinates: PlacesV1Response;
        try {
          searchCoordinates = await searchTextV1(query, center, radiusMeters);
        } catch (error: any) {
          console.log('error', error);

          const status = error?.cause?.status ?? 500;
          const message = error?.cause?.message ?? error?.message ?? 'Places searchText failed';
          const wrapped = new Error('Places searchText failed');
          (wrapped as { cause?: { message: string; status: number } }).cause = { message, status };
          throw wrapped;
        }
        const place = searchCoordinates.places?.[0] ?? null;

        const location =
          place?.location && typeof place.location.latitude === 'number' && typeof place.location.longitude === 'number'
            ? { latitude: place.location.latitude, longitude: place.location.longitude }
            : null;

        const isWithinRadius =
          location &&
          haversineDistance(center.latitude, center.longitude, location.latitude, location.longitude) <= radiusMeters;

        if (!place || !isWithinRadius) {
          console.warn(`Not found POI "${item.name}" in radius ${radiusMeters} meters (lite).`);
          return null;
        }

        return {
          displayName: displayNameText(place.displayName) ?? '',
          placeId: place.id,
          resolvedName: displayNameText(place.displayName) ?? null,
          location,
          address: null,
          photos: place.photos?.map((p) => ({ name: p.name })),
          description: item.description ?? null
        };
      })
    );

    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        if (r.value) results.push(r.value as any);
      } else {
        const status = r.reason?.cause?.status ?? 500;
        const message = r.reason?.cause?.message ?? r.reason?.message ?? 'Places searchText failed';
        errors.push({ message, status });
      }
    }
  }

  return { results, errors };
}
