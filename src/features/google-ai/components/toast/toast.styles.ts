import { spacing } from "@shared/styles";
import { StyleSheet } from "react-native";

export const toastStyles = StyleSheet.create({
  errorPopup: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  errorTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  errorDismiss: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12
  },
  errorBody: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    flexDirection: 'column',
    // justifyContent: 'center',
    // alignItems: 'center',
    // textAlign: 'center',
    // textAlignVertical: 'center',
  }
});