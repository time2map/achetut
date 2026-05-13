try {
  // optional: load .env when running locally; on EAS Cloud variables come from
  // the Expo environment and dotenv is not required.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv/config');
} catch {
  // dotenv is not installed (e.g. minimal CI image) — ignore.
}
import type { ExpoConfig } from '@expo/config-types';

const ACHETUT_BACK_URL = process.env.ACHETUT_BACK_URL;
const X_USER_ID = process.env.X_USER_ID;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const APP_VERSION = '1.0.8';
const ANDROID_VERSION_CODE = 9;
// Non-standard format kept intentionally to match the Play Console app that
// was registered first. Changing it later requires recreating the Play listing.
const ANDROID_PACKAGE = 'achetut.time2map';
// iOS bundle is independent and can stay reverse-DNS.
const IOS_BUNDLE_ID = 'com.time2map.achetut';

export default (): ExpoConfig => ({
  name: 'Achetut',
  owner: 'time2map',
  slug: 'achetut',
  scheme: 'achetut',
  version: APP_VERSION,
  newArchEnabled: true,
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  experiments: {
    typedRoutes: true
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-location',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: '#FFFFFF',
        resizeMode: 'contain'
      }
    ],
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          buildToolsVersion: '35.0.0'
        },
        ios: {
          deploymentTarget: '15.1'
        }
      }
    ]
  ],
  extra: {
    ACHETUT_BACK_URL,
    X_USER_ID,
    GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: 'dedb01ec-f4af-4c99-98f4-366c5bcb539e'
    }
  },
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    supportsTablet: true,
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Achetut uses your location to center the map on you and to find nearby places of interest.',
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: ANDROID_PACKAGE,
    versionCode: ANDROID_VERSION_CODE,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'INTERNET'
    ],
    blockedPermissions: [
      'ACCESS_BACKGROUND_LOCATION'
    ],
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY
      }
    }
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
    name: 'Achetut',
    shortName: 'Achetut',
    description: 'AI-подсказки о любых местах на карте мира',
    themeColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    lang: 'ru',
    display: 'standalone',
    orientation: 'portrait'
  }
});
