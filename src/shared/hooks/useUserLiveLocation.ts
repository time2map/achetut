import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type LatLng = {
  latitude: number;
  longitude: number;
};

type UseLiveUserLocationOptions = {
  minDistanceMeters?: number; // minimum displacement before an update is delivered
  accuracy?: Location.LocationAccuracy;
};

function getDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useLiveUserLocation({
  minDistanceMeters = 50,
  accuracy = Location.LocationAccuracy.Balanced,
}: UseLiveUserLocationOptions = {}) {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const lastCoordsRef = useRef<LatLng | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[useLiveUserLocationExpo] Permission denied');
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy,
          distanceInterval: minDistanceMeters,
        },
        (location) => {
          if (!isMounted) return;

          const next = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const prev = lastCoordsRef.current;

          if (!prev) {
            lastCoordsRef.current = next;
            setCoords(next);
            return;
          }

          const distance = getDistanceMeters(prev, next);
          if (distance >= minDistanceMeters) {
            lastCoordsRef.current = next;
            setCoords(next);
          }
        }
      );
    })();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [minDistanceMeters, accuracy]);

  return coords;
}