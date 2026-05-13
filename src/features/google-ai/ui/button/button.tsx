import type { FC, ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { colors } from '@shared/styles';
import { buttonStyles } from './button.styles';

const BUTTON_SIZES = {
  small: 35,
  medium: 56
} as const;

type ButtonSize = keyof typeof BUTTON_SIZES;
type ButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
};

const ButtonPrimary: FC<ButtonProps> = ({ icon, onPress, disabled = false, color = 'rgba(0,0,0,0.85)', size = 'medium', style }) => {
  const buttonSize = BUTTON_SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled) {
          opacity = 0.65;
        } else if (pressed) {
          opacity = 0.95;
        }

        return [
          buttonStyles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: disabled ? colors.backgroundSubtle : color,
            opacity,
            transform: pressed ? [{ scale: 0.975 }] : []
          },
          style
        ];
      }}>
      {icon}
    </Pressable>
  );
};

export default ButtonPrimary;
