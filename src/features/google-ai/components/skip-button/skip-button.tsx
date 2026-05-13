import ButtonPrimary from '@features/google-ai/ui/button/button';
import { View } from 'react-native';
import { skipButtonStyles } from './skip-button.styles';
import CrossIcon from '../icons/cross-icon';

const SkipButton = ({ disabled, onPress }: { disabled: boolean; onPress: () => void }) => {
  return (
    <View
      style={[skipButtonStyles.buttonOverlay]}
      pointerEvents="box-none">
      <View
        style={skipButtonStyles.skipButtonWrapper}
        pointerEvents="auto">
        <ButtonPrimary
          icon={<CrossIcon />}
          onPress={onPress}
          size="medium"
          disabled={disabled}
        />
      </View>
    </View>
  );
};

export default SkipButton;
