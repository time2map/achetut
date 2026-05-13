import type { FC } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { locationButtonStyles } from "@shared/styles/locationButton.styles";

type LocationButtonProps = {
  bottomOffset: number;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export const LocationButton: FC<LocationButtonProps> = ({
  bottomOffset,
  disabled = false,
  onPress,
  accessibilityLabel = "Center on my location",
}) => {
  return (
    <View style={[locationButtonStyles.container, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={[
          locationButtonStyles.button,
          disabled && locationButtonStyles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={locationButtonStyles.label}>◎</Text>
      </TouchableOpacity>
    </View>
  );
};
