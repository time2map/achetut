import { USE_BACKEND } from '../map-screen/config';
import type { CitySummary, CuratedCity } from '../places';
import { CityNotFoundError } from './adapt';
import { fetchApiCity, fetchApiCitySummaries } from './apiCities';

export { CityNotFoundError };

// The bundled content is only fetched as a separate chunk when the backend is switched off.
const loadTopCities = () => import('./topCities');

let summariesRequest: Promise<CitySummary[]> | null = null;
const cityRequests = new Map<string, Promise<CuratedCity>>();

export function loadCitySummaries(): Promise<CitySummary[]> {
  if (!summariesRequest) {
    summariesRequest = USE_BACKEND ? fetchApiCitySummaries() : loadTopCities().then((module) => module.CITIES);
    // A failed request is dropped so the next call retries instead of replaying the error.
    summariesRequest.catch(() => {
      summariesRequest = null;
    });
  }
  return summariesRequest;
}

export function loadCity(cityId: string): Promise<CuratedCity> {
  let request = cityRequests.get(cityId);
  if (!request) {
    request = USE_BACKEND
      ? fetchApiCity(cityId)
      : loadTopCities().then((module) => {
          const city = module.CITY_BY_ID[cityId];
          if (!city) throw new CityNotFoundError(cityId);
          return city;
        });
    cityRequests.set(cityId, request);
    request.catch(() => cityRequests.delete(cityId));
  }
  return request;
}

export function defaultCityId(cities: CitySummary[]) {
  return cities.some((city) => city.id === 'barcelona') ? 'barcelona' : (cities[0]?.id ?? null);
}
