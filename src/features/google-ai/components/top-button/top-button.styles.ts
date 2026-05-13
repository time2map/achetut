import { spacing } from '@shared/styles';
import { StyleSheet } from 'react-native';

export const topButtonStyles = StyleSheet.create({
  buttonOverlay: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 0,
    paddingHorizontal: spacing.xl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingLeft: 12,
    paddingRight: 6,
    height: 50,
    width: '100%',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    marginRight: 6,
    color: '#111'
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginRight: 4
  },
  searchBtnText: { fontSize: 16 },
});
