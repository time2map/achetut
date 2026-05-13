import type { FC, ReactNode } from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

import { colors } from '@shared/styles';
import { buttonSecondaryStyles } from './button-secondary.styles';

type ButtonSecondaryProps = {
  label?: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const ButtonSecondary: FC<ButtonSecondaryProps> = ({ label, icon, onPress, disabled = false, color = 'rgba(0,0,0,0.85)', style }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled) opacity = 0.80;
        else if (pressed) opacity = 0.95;

        return [
          buttonSecondaryStyles.button,
          {
            backgroundColor: disabled ? colors.backgroundSubtle : color,
            opacity
          },
          style
        ];
      }}>
      {icon ?? null}
      {label ? <Text style={[buttonSecondaryStyles.label, disabled && { color: colors.textMuted }]}>{label}</Text> : null}
    </Pressable>
  );
};

export default ButtonSecondary;
