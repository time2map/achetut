import { colors, spacing } from '@shared/styles/tokens';
import { StyleSheet } from 'react-native';

export const searchInputStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  container: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: spacing.xxxl,
  },
  dropdown: {
    backgroundColor: colors.background,
    borderRadius: 28,
    width: '100%',
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.30), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',

  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8
  },
  headerCollapsed: {
    paddingLeft: 20,
    paddingRight: 4
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: colors.textPrimary
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineColor
  },
  suggestions: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 15
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 8,
    gap: 16,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary
  }
});
