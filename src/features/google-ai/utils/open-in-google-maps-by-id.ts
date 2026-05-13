import { Linking } from 'react-native';

export async function openInGoogleMapsById({ placeId }: { placeId: string }) {
  const pid = encodeURIComponent(placeId);

  // `query` is required — without it Google ignores the other params and just opens plain Maps.
  const url = `https://www.google.com/maps/search/?api=1` + `&query=place_id:${pid}` + `&query_place_id=${pid}`;

  await Linking.openURL(url);
  return;
}
