import { StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '@shared/styles';

export const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxHeight: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.secondaryBlack
  },

  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center'
  },

  thumb: {
    width: '22.66%',
    height: '100%',
    backgroundColor: colors.backgroundSubtle
  },
  thumbPlaceholder: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryBlack
  },

  title: {
    fontSize: 16,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: typography.fontWeightRegular,
    color: colors.textTertiary
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium
  }
});
