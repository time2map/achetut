import { colors, radii, spacing, typography } from '@shared/styles';
import { StyleSheet } from 'react-native';

export const panelStyles = StyleSheet.create({
  loading: {
    flex: 1,
    marginTop: 40,
    alignItems: 'center',
    gap: 10
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 100
  },
  wrapper: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.25,
    shadowRadius: 35,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
    overflow: 'hidden',
    paddingInline: spacing.xxl,
    paddingBottom: spacing.xxl,
    position: 'relative'
  },
  header: {
    width: '100%',
    minHeight: 32,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md
    // textAlign: 'center'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  shutterWrapper: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shutter: {
    width: 56,
    height: 5,
    borderRadius: 28,
    backgroundColor: colors.textMuted,
    paddingBottom: 5,
    opacity: 0.65,
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 1000
  },
  scrollView: {
    flexGrow: 1,
    // padding: spacing.md,
    minHeight: 60
  },

  carouselWrapper: {
    // marginTop: spacing.lg,
    height: 300
  },
  photoSlide: {
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.background
  },
  photo: {
    height: 300,
    borderRadius: radii.md,
    overflow: 'hidden'
  },
  photoCounter: {
    marginTop: spacing.md,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12
  },
  block: {
    paddingInline: spacing.md,
    alignItems: 'center'
  },
  descriptionText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'center'
  },
  modeWrap: {
    gap: 8,
    width: '60%',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignSelf: 'center'
  },
  modePill: {
    height: 38,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    padding: 3,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden'
  },
  modeIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    borderRadius: 999,
    backgroundColor: '#111827'
  },
  modeIndicatorLeft: { left: 3 },
  modeIndicatorRight: { left: '50%' },
  modeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    opacity: 0.6
  },
  modeTextActive: {
    color: '#FFFFFF',
    opacity: 1
  },
  modeHint: {
    fontSize: 12,
    color: '#6B7280'
  },
  modeHintStrong: {
    color: '#111827',
    fontWeight: '700'
  },
  panelFloating: {
    ...StyleSheet.absoluteFillObject
  },
  nearbyList: {
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.xxxl
  },
  detailsBlock: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  detailLabel: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    letterSpacing: 1
  },
  detailValue: {
    fontSize: typography.fontSizeMd,
    color: colors.textMuted
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  ratingValue: {
    fontSize: 22,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary
  },
  ratingCount: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted
  },
  reviewsBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm
  },
  reviewItem: {
    backgroundColor: colors.backgroundSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.4)'
  },
  reviewText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm
  },
  reviewMeta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.fontSizeSm
  },
  openInGoogleMapsButton: {
    width: 200,
    height: 40,
    alignSelf: 'center',
    marginBlock: spacing.sm
  }
});
