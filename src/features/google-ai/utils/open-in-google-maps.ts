import { Linking, Platform } from 'react-native';

export async function openInGoogleMaps({
  placeId,
  latitude,
  longitude,
  bbox,
  label,
  city,
  isAiPlace = false
}: {
  placeId?: string | null;
  latitude?: number;
  longitude?: number;
  bbox?: number[];
  label?: string;
  city?: string;
  isAiPlace?: boolean;
}) {
  if ((isAiPlace)) {
    // TEXT SEARCH NEAR: text query anchored to a point (bbox center / city center).
    // Example: https://www.google.com/maps/search/?api=1&query=coffee%20near%2055.751244,37.618423
    if (label && typeof latitude === 'number' && typeof longitude === 'number') {
      const qParts = [label.trim()];
      if (city?.trim()) qParts.push(city.trim());

      // e.g. "coffee Moscow near 55.75,37.61"
      // const q = `${qParts.join(' ')} near ${latitude},${longitude}`;
      const q = `${qParts.join(', ')}`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

      await Linking.openURL(webUrl);
      return;
    }
  }

  // Legacy behavior: use the place coordinates if we have them.
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const coords = hasCoords ? `${latitude},${longitude}` : '';

  const encodedLabel = label ? encodeURIComponent(label) : '';

  // Deep link into the Google Maps app — only when coordinates are available.
  const googleMapsAppUrl = hasCoords
    ? Platform.select({
        ios: `comgooglemaps://?q=${coords}${label ? `(${encodedLabel})` : ''}`,
        android: `geo:${coords}?q=${coords}${label ? `(${encodedLabel})` : ''}`
      })
    : null;

  // Web fallback:
  // - with coords: open the point / coordinate search
  // - without coords but with a label: do a text search
  const webUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${coords}`
    : label
    ? `https://www.google.com/maps/search/?api=1&query=${encodedLabel}`
    : `https://www.google.com/maps`;

  if (googleMapsAppUrl) {
    const supported = await Linking.canOpenURL(googleMapsAppUrl);
    if (supported) {
      await Linking.openURL(googleMapsAppUrl);
      return;
    }
  }

  await Linking.openURL(webUrl);
}
