/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARCHI2GO_BACK_URL?: string;
  readonly VITE_X_USER_ID?: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_MAPBOX_STYLE?: string;
  readonly EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
  readonly EXPO_PUBLIC_MAPBOX_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
