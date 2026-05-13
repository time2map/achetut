import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@shared/styles';
export const placeInfoStyles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
    position: 'relative'
  },
  nameLabel: {
    flex: 1,
    fontSize: 22,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary
  },
  descriptionText: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted
  },
  block: {
    marginTop: spacing.xxxl - spacing.sm,
    alignItems: 'center'
  },
  photosContainer: {
    flexDirection: 'row',
    gap: spacing.md
  },
  heroImageWrapper: {
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSubtle
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSubtle
  },
  backButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 2
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});
