// useGoogleMapIosPerfFix.ios.ts
import { useEffect } from "react";
import { Platform } from "react-native";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function useGoogleMapIosPerfFix(enabled: boolean) {
  const tick = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "ios" || !enabled) return;

    // Light heartbeat on the UI thread to keep Reanimated awake on iOS
    tick.value = withRepeat(
      withTiming(5, { duration: 2000, easing: Easing.linear }),
      -1,
      true
    );

    return () => {
      cancelAnimation(tick);
      tick.value = 0;
    };
  }, [enabled]);
}