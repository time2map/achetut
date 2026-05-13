import type { Region } from 'react-native-maps';
import { DEFAULT_REGION } from '@shared/config/map';
import { Coords } from '@shared/styles/map';

export const createInitialRegion = (coords: Coords | null, fallbackRegion: Region): Region =>
  coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }
    : fallbackRegion;

export const getInitialRegion = (coords: Coords | null): Region => createInitialRegion(coords, DEFAULT_REGION);

export const MIN_RADIUS = 150;
export const MAX_RADIUS = 3000;
export const PULSE_SIZE = 22;
