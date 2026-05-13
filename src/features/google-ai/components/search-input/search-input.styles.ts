import { spacing } from '@shared/styles/tokens';
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
    // top: 35 + spacing.xxxl,
    paddingHorizontal: spacing.xxxl
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#fff',
    // padding: 4,
    paddingLeft: 20,
    height: 56,
    width: '100%',
    gap: spacing.md
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    padding: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    marginRight: 6,
    color: '#111'
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 4
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  suggestionText: {
    fontSize: 14,
    color: '#111'
  }
});
