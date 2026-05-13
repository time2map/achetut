import { spacing, radii, colors } from '@shared/styles';
import { StyleSheet } from 'react-native';

export const menuButtonStyles = StyleSheet.create({
  buttonOverlay: {
    position: 'absolute',
    left: spacing.xxxl,
    right: spacing.xxxl,
    alignItems: 'stretch',
    zIndex: 20,
    top: 35 + spacing.xxxl
  },
  menuButtonWrapper: {
    alignSelf: 'flex-end'
  },
  buttonContainer: {
    position: 'relative',
    width: 50,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.pulseColorSelected,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationText: {
    color: colors.dangerOn,
    fontSize: 11,
    fontWeight: '700'
  }
});
