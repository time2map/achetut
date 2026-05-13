import React from 'react';
import { View } from 'react-native';
import { Marker, type LatLng } from 'react-native-maps';
import { markerStyles } from '../marker.styles';
import MarkerTypePoiIcon from '@features/google-ai/components/icons/marker-poi-icon';

type MarkerTypePoiProps = {
  readonly id: string;
  readonly coordinate: LatLng;
  readonly zIndex?: number;
  readonly isTrackViewChanges?: boolean;
  readonly onPress?: () => void;
};

const MarkerTypePoi = ({
  id,
  coordinate,
  zIndex = 1000,
  isTrackViewChanges = false,
  onPress
}: MarkerTypePoiProps) => {
  const containerSize = 100;

  return (
    <Marker
      key={id}
      onPress={onPress}
      coordinate={coordinate}
      zIndex={zIndex}
      tracksViewChanges={isTrackViewChanges}
      anchor={{ x: 0.757, y: 1 }}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={[
            markerStyles.iconContainer,
            {
              width: containerSize,
              height: containerSize
            }
          ]}>
          <MarkerTypePoiIcon />
        </View>
      </View>
    </Marker>
  );
};

export default MarkerTypePoi;