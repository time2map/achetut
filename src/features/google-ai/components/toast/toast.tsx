import { Pressable, Text, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import CrossIcon from '../icons/cross-icon';
import { toastStyles } from './toast.styles';
import { colors } from '@shared/styles';

interface ToastProps {
  title: string;
  status?: number | string;
  message?: string;
  close: () => void;
}

const Toast = ({ title, status, message, close }: ToastProps) => {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => close()}
      style={[toastStyles.errorPopup, { top: insets.top + 90 }]}>
      <View style={toastStyles.errorHeader}>
        <Text style={toastStyles.errorTitle}>{title}</Text>
        <CrossIcon size={16} color={colors.background} />
      </View>
      <Text style={toastStyles.errorBody}>
        {status && <Text style={toastStyles.errorBody}>{`Status: ${status ?? 'unknown'}`}</Text>}
        {'\n'}
        {message && <Text style={toastStyles.errorBody}>{message}</Text>}
      </Text>
    </Pressable>
  );
};

export default Toast;
