import Constants from "expo-constants";

type Extra = {
  ACHETUT_BACK_URL?: string;
  X_USER_ID?: string;
};

const extra = (Constants?.expoConfig?.extra ?? {}) as Extra;

export const env = {
  achetutBackUrl: extra.ACHETUT_BACK_URL,
  xUserId: extra.X_USER_ID,
} as const;
