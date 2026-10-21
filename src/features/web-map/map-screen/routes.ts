import { CITY_BY_ID, DEFAULT_CITY_ID } from '../places';

export function cityPath(cityId: string) {
  return `/${cityId}`;
}

export function placePath(cityId: string, placeId: string) {
  return `${cityPath(cityId)}/${placeId}`;
}

export function parseRoute() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const routeCityId = segments[0] && CITY_BY_ID[segments[0]] ? segments[0] : null;
  const savedCityId = localStorage.getItem('achetut-city-v2');
  const cityId = routeCityId ?? (savedCityId && CITY_BY_ID[savedCityId] ? savedCityId : DEFAULT_CITY_ID);
  const placeId =
    segments[1] && CITY_BY_ID[cityId].places.some((place) => place.id === segments[1])
      ? segments[1]
      : null;
  return { cityId, placeId };
}
