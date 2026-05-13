import type { FC, ReactNode } from 'react';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors } from '@shared/styles';
import { buttonStyles } from './button.styles';

const BUTTON_SIZES = {
  small: 35,
  medium: 56
} as const;

type ButtonSize = keyof typeof BUTTON_SIZES;
type ButtonProps = {
  icon?: ReactNode;
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  backgroundColor?: string;
  border?: boolean;
  borderColor?: string;
  size?: ButtonSize;
  textSize?: number;
  fullWidth?: boolean;
  width?: number;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const ButtonPrimary: FC<ButtonProps> = ({
  icon,
  label,
  children,
  disabled = false,
  color,
  backgroundColor,
  border = false,
  borderColor = colors.borderColorSecondary,
  size = 'medium',
  textSize = 16,
  fullWidth = false,
  width,
  shadow = false,
  style,
  contentStyle,
  labelStyle,
  onPress
}) => {
  const minHeight = BUTTON_SIZES[size];
  const resolvedBackgroundColor = backgroundColor ?? color ?? colors.background;
  const hasContent = Boolean(label) || Boolean(children);
  const iconOnly = Boolean(icon) && !hasContent && !fullWidth && width == null;
  const resolvedWidth = fullWidth ? '100%' : width;
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
          border ? [buttonStyles.border, { borderColor }] : null,
          shadow ? buttonStyles.shadow : null,
          {
            borderRadius: 100,
            backgroundColor: disabled ? colors.backgroundSubtle : resolvedBackgroundColor,
            opacity,
            transform: pressed ? [{ scale: 0.975 }] : []
          },
          style
        ];
      }}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: icon && hasContent ? 8 : 0,
            width: resolvedWidth,
            height: BUTTON_SIZES[size] ?? undefined,
            paddingHorizontal: iconOnly ? 0 : 18,
            paddingVertical: iconOnly ? 0 : 12
          },
          contentStyle
        ]}>
        {icon ?? null}
        {children ??
          (label ? (
            <Text style={[{ color: colors.textPrimary, fontSize: textSize, fontWeight: '600' }, labelStyle]}>
              {label}
            </Text>
          ) : null)}
      </View>
    </Pressable>
  );
};

export default ButtonPrimary;
