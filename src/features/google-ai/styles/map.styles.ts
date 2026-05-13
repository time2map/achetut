import { colors, radii, spacing, typography } from '@shared/styles';
import { StyleSheet } from 'react-native';

export const mapContainer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  panelOverlay: {
    position: 'absolute',
    left: spacing.xxxl,
    right: spacing.xxxl,
    alignItems: 'stretch',
    zIndex: 20
  },
  menuButtonWrapper: {
    alignSelf: 'flex-end'
  },
  bottomButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modelButtonWrapper: {
    height: 56,
    position: 'absolute',
    right: spacing.xxxl,
    zIndex: 0
  },
  modelButton: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modelButtonText: {
    color: colors.background,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemiBold,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start'
  },
  sheet: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg
  },
  sheetTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  sheetLabel: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    backgroundColor: colors.background
  },
  sheetHint: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.borderColor,
    marginVertical: spacing.md
  },
  sheetOption: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md
  },
  sheetOptionSelected: {
    backgroundColor: colors.backgroundSubtle
  },
  sheetOptionText: {
    fontSize: typography.fontSizeMd,
    color: colors.textPrimary
  },
  versionBadge: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.21)'
  },
  versionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  }
});
