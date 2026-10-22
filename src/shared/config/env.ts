export const env = {
  archi2goBackUrl: import.meta.env.VITE_ARCHI2GO_BACK_URL,
  xUserId: import.meta.env.VITE_X_USER_ID,
  mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? import.meta.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  mapboxStyle: import.meta.env.VITE_MAPBOX_STYLE ?? import.meta.env.EXPO_PUBLIC_MAPBOX_STYLE ?? "mapbox://styles/mapbox/standard",
} as const;
