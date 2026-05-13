import { ActivityIndicator, View } from 'react-native';
import { locationButtonStyles } from './location-button.styles';
import LocationIcon from '../icons/location-icon';
import ButtonPrimary from '../../ui/button/button';
import { colors } from '@shared/styles';

const LocationButton = ({ disabled, isLoading, onPress }: { disabled: boolean; isLoading: boolean; onPress: () => void }) => {
  return (
    <View
      style={[locationButtonStyles.buttonOverlay]}
      pointerEvents="box-none">
      <View
        style={locationButtonStyles.locationButtonWrapper}
        pointerEvents="auto">
        <ButtonPrimary
          icon={isLoading ? <ActivityIndicator size="small" color={colors.background} /> : <LocationIcon />}
          onPress={onPress}
          size="medium"
          // disabled={disabled}
        />
      </View>
    </View>
  );
};

export default LocationButton;
