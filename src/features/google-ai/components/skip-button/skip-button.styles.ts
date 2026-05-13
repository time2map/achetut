import { spacing } from "@shared/styles/tokens";
import { StyleSheet } from "react-native";

export const skipButtonStyles = StyleSheet.create({
  buttonOverlay: {
    position: "absolute",
    alignItems: "stretch",
    bottom: spacing.xxxl,
    left: spacing.xxxl
  },
  skipButtonWrapper: {
    alignSelf: "flex-end",
  },
});
