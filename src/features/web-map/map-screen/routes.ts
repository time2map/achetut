import { CITY_STORAGE_KEY } from './config';

export function cityPath(cityId: string) {
  return `/${cityId}`;
}

export function placePath(cityId: string, placeId: string) {
  return `${cityPath(cityId)}/${placeId}`;
}

/** The city the URL or the last visit points at, before the city list is known. */
export function requestedCityId() {
  return window.location.pathname.split('/').filter(Boolean)[0] ?? localStorage.getItem(CITY_STORAGE_KEY);
}

/** The place id is not checked here: it needs the city's places, which may still be loading. */
export function parseRoute(cityIds: readonly string[], fallbackCityId: string) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const routeCityId = segments[0] && cityIds.includes(segments[0]) ? segments[0] : null;
  const savedCityId = localStorage.getItem(CITY_STORAGE_KEY);
  const cityId = routeCityId ?? (savedCityId && cityIds.includes(savedCityId) ? savedCityId : fallbackCityId);
  return { cityId, placeId: routeCityId ? (segments[1] ?? null) : null };
}
