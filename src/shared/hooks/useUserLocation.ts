import { useEffect, useState } from "react";
import * as Location from "expo-location";

type Coords = {
  latitude: number;
  longitude: number;
};

type UserLocationState = {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
};

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    coords: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          if (!isMounted) return;
          setState({
            coords: null,
            loading: false,
            error: "Location permission denied",
          });
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Location fetch failed:", error);
        if (!isMounted) return;
        setState({
          coords: null,
          loading: false,
          error: (error as Error)?.message ?? "Failed to fetch location",
        });
      }
    }

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

