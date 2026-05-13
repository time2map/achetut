import { View } from 'react-native';
import { locationButtonStyles } from './location-button.styles';
import LocationIcon from '../icons/location-icon';
import ButtonPrimary from '../../ui/button/button';

const LocationButton = ({
  disabled,
  onPress
}: {
  disabled: boolean;
  onPress: () => void;
}) => {
  return (
    <View
      style={[locationButtonStyles.buttonOverlay]}
      pointerEvents="box-none">
      <View
        style={locationButtonStyles.locationButtonWrapper}
        pointerEvents="auto">
        <ButtonPrimary
          icon={<LocationIcon />}
          onPress={onPress}
          size="medium"
          shadow
          width={56}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

export default LocationButton;
