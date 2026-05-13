import { spacing } from '@shared/styles/tokens';
import { StyleSheet } from 'react-native';

export const whatButtonStyles = StyleSheet.create({
  buttonOverlay: {
    alignItems: 'center'
  },
  button: {
    height: 56
  },
  wrapper: {
    alignSelf: 'center'
  },
  hint: {
    position: 'absolute',
    left: -30,
    bottom: 10,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    width: 300,
    height: 90,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  hintText: {
    color: '#fff',
    fontSize: 14,
    width: '80%'
  },
  hintArrow: {
    position: 'absolute',
    bottom: -10,
    left: '10%',
    // right: '10%',
    transform: [{ translateX: 5 }],
    // right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.85)'
  }
});
