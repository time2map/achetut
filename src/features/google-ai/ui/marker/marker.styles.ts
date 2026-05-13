import { StyleSheet } from 'react-native';

export const markerStyles = StyleSheet.create({
  markerBubble: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: -20,
    width: 150,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
