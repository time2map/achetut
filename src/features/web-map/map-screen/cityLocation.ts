import type { CitySummary } from '../places';

const CITY_MATCH_RADIUS_KM = 50;
const EARTH_RADIUS_KM = 6371;

function distanceInKm(
  [leftLongitude, leftLatitude]: readonly [number, number],
  [rightLongitude, rightLatitude]: readonly [number, number]
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(rightLatitude - leftLatitude);
  const longitudeDelta = toRadians(rightLongitude - leftLongitude);
  const leftLatitudeRadians = toRadians(leftLatitude);
  const rightLatitudeRadians = toRadians(rightLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitudeRadians) * Math.cos(rightLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function nearestCityId(
  cities: readonly CitySummary[],
  coordinates: readonly [longitude: number, latitude: number]
) {
  let nearest: { id: string; distance: number } | null = null;
  for (const city of cities) {
    const distance = distanceInKm(coordinates, city.center);
    if (!nearest || distance < nearest.distance) nearest = { id: city.id, distance };
  }
  return nearest && nearest.distance <= CITY_MATCH_RADIUS_KM ? nearest.id : null;
}

/** Resolves to the fallback on denied, unavailable or imprecise geolocation. */
export function detectInitialCityId(cities: readonly CitySummary[], fallbackCityId: string) {
  return new Promise<string>((resolve) => {
    if (!navigator.geolocation) {
      resolve(fallbackCityId);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve(nearestCityId(cities, [coords.longitude, coords.latitude]) ?? fallbackCityId);
      },
      () => resolve(fallbackCityId),
      {
        enableHighAccuracy: false,
        maximumAge: 15 * 60 * 1000,
        timeout: 5000
      }
    );
  });
}
