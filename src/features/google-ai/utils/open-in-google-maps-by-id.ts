import { Linking } from 'react-native';

export async function openInGoogleMapsById({ placeId }: { placeId: string }) {
  const pid = encodeURIComponent(placeId);

  // query обязателен, иначе параметры игнорируются и откроется “просто карты”
  const url = `https://www.google.com/maps/search/?api=1` + `&query=place_id:${pid}` + `&query_place_id=${pid}`;

  await Linking.openURL(url);
  return;
}
