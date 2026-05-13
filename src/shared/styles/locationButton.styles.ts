import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "./tokens";

export type LocationButtonStyles = {
  container: ViewStyle;
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  label: TextStyle;
};

export const locationButtonStyles = StyleSheet.create<LocationButtonStyles>({
  container: {
    position: "absolute",
    right: spacing.xl,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: radii.circle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
  },
});


