import { colors, radii, spacing, typography } from '@shared/styles';
import { StyleSheet } from 'react-native';

export const promptInputStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.xl
  },
  input: {
    minHeight: 120,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderColorSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top'
  },
  inputFocused: {
    borderColor: colors.primaryBlack
  },
  clearText: {
    marginTop: spacing.lg,
    marginLeft: spacing.xl,
    color: colors.primaryRed,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: typography.fontWeightMedium
  }
});
