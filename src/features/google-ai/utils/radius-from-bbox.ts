const toRad = (deg: number) => (deg * Math.PI) / 180;

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


export const radiusFromBox = (
  center: { lat: number; lng: number },
  box?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } }
) => {
  if (!box?.northeast || !box?.southwest) return null;

  const { northeast: ne, southwest: sw } = box;
  const nw = { lat: ne.lat, lng: sw.lng };
  const se = { lat: sw.lat, lng: ne.lng };

  return Math.max(
    haversine(center.lat, center.lng, ne.lat, ne.lng),
    haversine(center.lat, center.lng, sw.lat, sw.lng),
    haversine(center.lat, center.lng, nw.lat, nw.lng),
    haversine(center.lat, center.lng, se.lat, se.lng)
  );
};