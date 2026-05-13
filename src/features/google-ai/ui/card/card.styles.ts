import { StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '@shared/styles';

export const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    // minHeight: 128,
    // minHeight: '18.2%',
    height: 140,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderColor,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14
  },

  thumb: {
    width: 130,
    height: '100%',
    maxHeight: 140
  },
  thumbFallback: {
    backgroundColor: colors.backgroundSubtle
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    justifyContent: 'center'
  },

  title: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted
  },
  rating: {
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeightSemiBold
  },
  noPhotoText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeightSemiBold,
    textAlign: 'center',
  },
  noPhotoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  }

});
