import { env } from '@shared/config/env';

// type GeocodeResponse = {
//   status: string;
//   results: Array<{
//     address_components: Array<{
//       long_name: string;
//       short_name: string;
//       types: string[];
//     }>;
//   }>;
// };

// const pickCity = (components: GeocodeResponse['results'][number]['address_components']) => {
//   const priorities = [
//     'locality',
//     'postal_town',
//     'administrative_area_level_2',
//     'administrative_area_level_1',
//     'sublocality',
//     'sublocality_level_1'
//   ];

//   for (const t of priorities) {
//     const c = components.find((x) => x.types.includes(t));
//     if (c) return c.long_name;
//   }
//   return null;
// };

// const toRad = (deg: number) => (deg * Math.PI) / 180;

// const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
//   const R = 6371000; // Earth radius in meters
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

//   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// function getCityRadiusMeters(cityResult: GeocodeResponse['results'][number]) {
//   const center = cityResult.geometry?.location;
//   if (!center) return null;

//   const box = cityResult.geometry.bounds ?? cityResult.geometry.viewport;

//   if (!box) return null;

//   const points = [
//     box.northeast,
//     box.southwest,
//     { lat: box.northeast.lat, lng: box.southwest.lng },
//     { lat: box.southwest.lat, lng: box.northeast.lng }
//   ];

//   const distances = points.map((p) => haversine(center.lat, center.lng, p.lat, p.lng));

//   return Math.max(...distances); // meters
// }

// export async function getCityByCoords(lat: number, lng: number) {
//   const url =
//     `https://maps.googleapis.com/maps/api/geocode/json` +
//     `?latlng=${lat},${lng}` +
//     `&language=en` +
//     `&result_type=locality` +
//     `&key=${encodeURIComponent(googleApiKey)}`;

//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

//   const data = (await res.json()) as GeocodeResponse;
//   if (data.status !== 'OK' || !data.results?.length) return null;

//   const isLocalityPoliticalOnly = (types?: string[]) =>
//     !!types && types.includes('locality') && types.includes('political');

//   const cityResult =
//     data.results.find((r) => isLocalityPoliticalOnly(r.types)) ??
//     data.results.find((r) => (r.types ?? []).includes('locality')) ??
//     data.results[0];

//   const city = pickCity(cityResult.address_components ?? []);
//   const address = cityResult.formatted_address ?? null;
//   const radiusMeters = getCityRadiusMeters(cityResult);

//   return {
//     city,
//     address,
//     center: cityResult.geometry.location,
//     radiusMeters
//   };
// }
