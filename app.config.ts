import 'dotenv/config';
import type { ExpoConfig } from '@expo/config-types';

const ACHETUT_BACK_URL = process.env.ACHETUT_BACK_URL;
const X_USER_ID = process.env.X_USER_ID;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
export default (): ExpoConfig => ({
  name: 'Achetut',
  owner: 'time2map',
  slug: 'achetut',
  scheme: 'mobile',
  version: '1.0.8',
  newArchEnabled: true,
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  experiments: {
    typedRoutes: true
  },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    ACHETUT_BACK_URL,
    X_USER_ID,
    GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: 'dedb01ec-f4af-4c99-98f4-366c5bcb539e'
    }
  },
  ios: {
    bundleIdentifier: 'com.time2map.achetut',
    supportsTablet: true,
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Your location is used to center the map around you.'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    permissions: ['ACCESS_FINE_LOCATION'],
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY
      }
    }
  },
  web: {
    bundler: 'metro'
  }
});
