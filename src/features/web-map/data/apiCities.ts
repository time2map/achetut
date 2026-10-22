import { env } from '@shared/config/env';
import type { CitySummary, CuratedCity, CuratedPlace } from '../places';
import {
  CityNotFoundError,
  adaptPhoto,
  buildCity,
  buildPlace,
  cityArt,
  cityCountry,
  type ContentPhoto,
  type ContentSource
} from './adapt';

type ApiMarker = {
  lat: number;
  lng: number;
  kind: 'point' | 'area' | 'line';
  name: string | null;
  approximate: boolean;
};

type ApiPhoto = ContentPhoto & { source?: string };

type ApiCity = {
  id: string;
  name: string;
  updated: string;
  places: number;
  bbox: [west: number, south: number, east: number, north: number];
  cover?: (ApiPhoto & { placeId?: string; placeTitle?: string }) | null;
};

type ApiPlace = {
  id: string;
  rank: number;
  votes: number;
  title: string;
  architect?: string | null;
  year?: string | null;
  area?: string | null;
  group?: string | null;
  sources?: string[];
  why?: string | null;
  note?: string | null;
  marker?: ApiMarker | null;
  markers?: (ApiMarker | null)[];
  photos?: ApiPhoto[];
};

type ApiCityPlaces = {
  city: ApiCity;
  sources: Record<string, ContentSource>;
  places: ApiPlace[];
};

// In dev the Vite server proxies /api to the backend, which doesn't allow CORS from localhost.
const API_BASE = import.meta.env.DEV
  ? ''
  : (env.archi2goBackUrl || 'https://achetut-back.time2map.com').replace(/\/+$/, '');

async function getJson<T>(path: string, notFound?: () => Error): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (response.status === 404 && notFound) throw notFound();
  if (!response.ok) throw new Error(`${path} responded with ${response.status}`);
  return (await response.json()) as T;
}

function markerCoordinates(place: ApiPlace): [number, number] | null {
  const marker = place.marker ?? place.markers?.find(Boolean);
  if (!marker || !Number.isFinite(marker.lng) || !Number.isFinite(marker.lat)) return null;
  return [marker.lng, marker.lat];
}

export async function fetchApiCitySummaries(): Promise<CitySummary[]> {
  const { cities } = await getJson<{ cities: ApiCity[] }>('/api/cities');
  return cities.map((city) => ({
    id: city.id,
    name: city.name,
    country: cityCountry(city.id),
    updated: city.updated,
    placeCount: city.places,
    cover: city.cover ? adaptPhoto(city.cover) : undefined,
    art: cityArt(city.id)
  }));
}

export async function fetchApiCity(cityId: string): Promise<CuratedCity> {
  const data = await getJson<ApiCityPlaces>(
    `/api/cities/${encodeURIComponent(cityId)}/places`,
    () => new CityNotFoundError(cityId)
  );
  // The API already returns places ordered by rank.
  const places = data.places
    .map((place, index) => buildPlace({ ...place, coordinates: markerCoordinates(place) }, data.sources, index))
    .filter((place): place is CuratedPlace => place !== null);
  return buildCity(
    {
      id: data.city.id,
      name: data.city.name,
      updated: data.city.updated,
      cover: data.city.cover ? adaptPhoto(data.city.cover) : undefined
    },
    places
  );
}
