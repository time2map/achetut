import { env } from '@shared/config/env';

// const toRad = (deg: number) => (deg * Math.PI) / 180;

// const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
//   const R = 6371000;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

//   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// export const radiusFromBox = (
//   center: { lat: number; lng: number },
//   box?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } }
// ) => {
//   if (!box?.northeast || !box?.southwest) return null;

//   const { northeast: ne, southwest: sw } = box;
//   const nw = { lat: ne.lat, lng: sw.lng };
//   const se = { lat: sw.lat, lng: ne.lng };

//   return Math.max(
//     haversine(center.lat, center.lng, ne.lat, ne.lng),
//     haversine(center.lat, center.lng, sw.lat, sw.lng),
//     haversine(center.lat, center.lng, nw.lat, nw.lng),
//     haversine(center.lat, center.lng, se.lat, se.lng)
//   );
// };

// export const geocodeAddress = async (text: string) => {
//   if (!text.trim()) return null;

//   const url =
//     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}` +
//     `&language=en&`;

//   const res = await fetch(url);
//   if (!res.ok) return null;

//   const data = await res.json();
//   const first = data?.results?.[0];
//   const location = first?.geometry?.location;
//   if (!location) return null;

//   const components = first.address_components ?? [];
//   const country = components.find((c: any) => c.types?.includes('country'));
//   const region = components.find((c: any) => c.types?.includes('administrative_area_level_1'));

//   const box = first?.geometry?.bounds ?? first?.geometry?.viewport;

//   const center = { lat: location.lat, lng: location.lng };
//   const computed = radiusFromBox(center, box);

//   // Clamp only for the location bias — not because "the city can't be larger".
//   const radiusMeters = computed ? Math.max(1000, Math.min(50000, Math.round(computed))) : 3000;

//   return {
//     center: { latitude: center.lat, longitude: center.lng },
//     radiusMeters,
//     countryName: country?.long_name ?? '',
//     regionCode: country?.short_name ?? region?.short_name ?? '' // usually "RU", not "Leningrad Oblast"
//   };
// };
