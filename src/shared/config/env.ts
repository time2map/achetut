import Constants from "expo-constants";

type Extra = {
  ACHETUT_BACK_URL?: string;
  X_USER_ID?: string;
  GOOGLE_MAPS_API_KEY?: string;
};

const constantsAny = Constants as any;
const extra = (
  constantsAny?.expoConfig?.extra ??
  constantsAny?.manifest2?.extra ??
  constantsAny?.manifest?.extra ??
  {}
) as Extra;
const achetutBackUrl = extra.ACHETUT_BACK_URL?.trim();
const googleMapsApiKey = extra.GOOGLE_MAPS_API_KEY?.trim();

if (!achetutBackUrl) {
  const message =
    "Missing ACHETUT_BACK_URL in Expo extra config. Set ACHETUT_BACK_URL for the active build profile.";
  if (__DEV__) {
    throw new Error(message);
  }
  // Keep app alive in release to avoid startup aborts; API calls will fail with clear logs.
  console.error(message);
}

export const env = {
  achetutBackUrl: achetutBackUrl ?? "",
  xUserId: extra.X_USER_ID,
  googleMapsApiKey: googleMapsApiKey ?? "",
} as const;
