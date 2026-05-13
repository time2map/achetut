import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@shared/styles';

export const buttonSecondaryStyles = StyleSheet.create({
  button: {
    // minHeight: 60,
    // width: ,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  label: {
    color: colors.background,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemiBold
  }
});

