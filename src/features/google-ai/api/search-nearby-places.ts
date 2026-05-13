import { chatComplete } from '@shared/api/openai';
import { env } from '@shared/config/env';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';
import { DEFAULT_PLACES_TYPES, SEARCH_NEARBY_URL } from '../utils/constants';
import { INearbyPlace } from '../types/nearby-place';

const systemPrompt =
  'You are a ranking assistant. From up to 20 Google Places items, choose the 5 best to visit. ' +
  'Prioritize higher rating, more user ratings, and overall appeal. ' +
  'Respond ONLY in JSON as an array. Each item must be an object with field "syntheticId". ' +
  'Do not invent syntheticId or names. No extra text.';

const buildPrompt = (places: INearbyPlace[]) => {
  const prompt = [
    'Here is a list of places from Google Places API (at most 20).',
    'Select the 5 best and return their ids and names.',
    'Respond with JSON array of objects: [{ "syntheticId": "id-0" }, ...].',
    'Input JSON:',
    JSON.stringify(places, null, 2)
  ].join('\n');

  return { prompt };
};

const parseIds = (response: string, places: Array<{ syntheticId: string }>): string[] => {
  try {
    // Strip markdown code fences and BOM that GPT sometimes wraps the JSON in.
    let cleanResponse = response.trim();

    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.substring(7).trim();
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.substring(3).trim();
    }

    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3).trim();
    }

    cleanResponse = cleanResponse.replace(/^\uFEFF/, '');

    const json = JSON.parse(cleanResponse);

    if (!Array.isArray(json)) {
      console.warn('Response is not an array');
      return [];
    }

    // Accept either { syntheticId } or { id } — GPT isn't always consistent.
    const ids = json
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        if ('syntheticId' in item && typeof item.syntheticId === 'string') {
          return item.syntheticId;
        }
        if ('id' in item && typeof item.id === 'string') {
          return item.id;
        }
        return null;
      })
      .filter((id): id is string => id !== null);

    // Drop any ids GPT hallucinated that aren't in the original places list.
    const validIds = ids.filter((id) => places.some((p) => p.syntheticId === id));

    return validIds;
  } catch (error) {
    console.error('parseIds failed:', error);
    return [];
  }
};

// Pick places by id, preserving the order in `ids` and stripping the syntheticId helper field.
const pickByIds = (ids: string[], places: Array<{ syntheticId: string } & INearbyPlace>): INearbyPlace[] => {
  const result: INearbyPlace[] = [];

  for (const id of ids) {
    const place = places.find((p) => p.syntheticId === id);
    if (place) {
      const { syntheticId, ...rest } = place;
      result.push(rest as INearbyPlace);
    }
  }

  return result;
};

export type NearbyPlaceResponse = {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  displayName: { text: string; languageCode: string };
  primaryType: 'historical_landmark';
  photos: { name: string }[];
  types: string[];
};

const toNearbyPlace = (place: NearbyPlaceResponse): INearbyPlace => ({
  id: place.id,
  placeId: place.id,
  displayName: place.displayName?.text ?? '',
  primaryType: place.primaryType,
  types: place.types ?? [],
  location: place.location,
  photos: place.photos ?? []
});

interface INearbyRequest {
  location: { lat: number; lng: number };
  includedTypes?: string[];
  radius?: number;
  maxResultCount?: number;
}

const fieldsMask = [
  'places.id',
  'places.displayName',
  'places.primaryType',
  'places.types',
  'places.location',
  'places.photos.name'
];

export const searchNearbyPlaces = async (params: INearbyRequest): Promise<NearbyPlaceResponse[] | null> => {
  try {
    const center = {
      latitude: params.location.lat,
      longitude: params.location.lng
    };
    const xUserId = env.xUserId ?? (await getOrCreateInstallationId());

    const res = await fetch(`${SEARCH_NEARBY_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': xUserId,
        'X-Goog-FieldMask': fieldsMask.join(',')
      },
      body: JSON.stringify({
        includedTypes: params.includedTypes ?? DEFAULT_PLACES_TYPES,
        maxResultCount: params.maxResultCount ?? 20,
        rankPreference: 'POPULARITY',
        languageCode: 'en',
        locationRestriction: {
          circle: {
            center,
            radius: params.radius ?? 500
          }
        }
      })
    });
    if (!res.ok) {
      const rawText = await res.text();
      let message = rawText;
      try {
        const parsed = JSON.parse(rawText);
        message = parsed?.error ?? parsed?.message ?? rawText;
      } catch {
        // keep rawText
      }
      throw { status: res.status, message };
    }
    const data = await res.json();
    return data?.places ?? [];
  } catch (error) {
    throw new Error('Error in the request to the Google api', { cause: error });
  }
};

export const searchAIPlaces = async (params: INearbyRequest): Promise<INearbyPlace[] | null> => {
  const { location, radius, includedTypes, maxResultCount } = params;

  const googlePlaces = await searchNearbyPlaces({
    location: { lat: location.lat, lng: location.lng },
    radius: radius ?? 300,
    includedTypes: includedTypes ?? DEFAULT_PLACES_TYPES,
    maxResultCount: Math.min(maxResultCount ?? 20, 20)
  });

  if (!googlePlaces?.length) return null;

  // Filter by the place types we actually care about.
  const wantedTags = new Set(DEFAULT_PLACES_TYPES);
  const filteredPlaces = googlePlaces
    .map(toNearbyPlace)
    .filter(
      (p) => wantedTags.has(p.primaryType ?? '') || (p.types ?? []).some((t: string) => wantedTags.has(t ?? ''))
    );

  if (!filteredPlaces.length) return [];

  // Attach a stable syntheticId so GPT can reference each candidate.
  const placesWithSyntheticIds: Array<INearbyPlace & { syntheticId: string }> = filteredPlaces.map((p, index) => ({
    ...p,
    syntheticId: `id-${index}`
  }));

  // 5 or fewer — skip ranking and return as-is.
  if (placesWithSyntheticIds.length <= 5) {
    return filteredPlaces;
  }

  try {
    const { prompt } = buildPrompt(placesWithSyntheticIds);

    const response = await chatComplete({ prompt, systemPrompt });

    if (!response) {
      console.warn('GPT returned empty response, returning first 5 filtered places');
      return filteredPlaces.slice(0, 5);
    }

    const foundIds = parseIds(response, placesWithSyntheticIds);

    if (foundIds.length > 0) {
      // Return places in the order GPT picked them, capped at 5.
      const result = pickByIds(foundIds, placesWithSyntheticIds);
      return result.slice(0, 5);
    } else {
      console.warn('No valid IDs parsed from GPT response, returning first 5 filtered places');
      return filteredPlaces.slice(0, 5);
    }
  } catch (error) {
    console.error('GPT ranking failed', error);
    // Fall back to the first 5 filtered places.
    return filteredPlaces.slice(0, 5);
  }
};
