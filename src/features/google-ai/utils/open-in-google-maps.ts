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
    // TEXT SEARCH NEAR: Текстовый поиск рядом с точкой (центр bbox / центр города)
    // Пример: https://www.google.com/maps/search/?api=1&query=coffee%20near%2055.751244,37.618423
    if (label && typeof latitude === 'number' && typeof longitude === 'number') {
      const qParts = [label.trim()];
      if (city?.trim()) qParts.push(city.trim());

      // "coffee Moscow near 55.75,37.61"
      // const q = `${qParts.join(' ')} near ${latitude},${longitude}`;
      const q = `${qParts.join(', ')}`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

      await Linking.openURL(webUrl);
      return;
    }
  }

  // 3) Старое поведение: координаты места (если есть)
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const coords = hasCoords ? `${latitude},${longitude}` : '';

  const encodedLabel = label ? encodeURIComponent(label) : '';

  // Deep link в приложение Google Maps (только если есть coords)
  const googleMapsAppUrl = hasCoords
    ? Platform.select({
        ios: `comgooglemaps://?q=${coords}${label ? `(${encodedLabel})` : ''}`,
        android: `geo:${coords}?q=${coords}${label ? `(${encodedLabel})` : ''}`
      })
    : null;

  // Web fallback:
  // - если есть coords: открываем точку/поиск по координатам
  // - если нет coords, но есть label: делаем текстовый поиск
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
