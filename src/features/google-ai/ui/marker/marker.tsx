import React, { useEffect, useState } from 'react';
import { LatLng, Marker } from 'react-native-maps';
import { colors } from '@shared/styles';
import { View, Text } from 'react-native';
import { markerStyles } from './marker.styles';
import MarkerIcon from '@features/google-ai/components/icons/marker-icon';

type PlaceMarkerProps = {
  readonly id: string;
  readonly coordinate: LatLng;
  readonly zIndex?: number;
  readonly isSelected?: boolean;
  readonly title?: string;
  readonly isPressed?: boolean;
  readonly isTrackViewChanges?: boolean;
  readonly onPress?: () => void;
};

const MarkerComponent = ({
  id,
  coordinate,
  title,
  zIndex = 1000,
  isSelected = false,
  isPressed = false,
  isTrackViewChanges = false,
  onPress
}: PlaceMarkerProps) => {
  const size = 100;
  const [tracks, setTracks] = useState(false);

useEffect(() => {
  // включаем трекинг на момент обновления title
  if (isTrackViewChanges) {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 250);
    return () => clearTimeout(t);
  };
}, [title]);

  return (
    <Marker
      key={id}
      opacity={isPressed ? 0 : 1}
      // identifier={id}
      onPress={onPress}
      coordinate={coordinate}
      zIndex={zIndex}
      tracksViewChanges={tracks}
      // tracksViewChanges={false}
      // flat={false}
      anchor={{ x: 0.5, y: 0.95 }}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={[
            markerStyles.markerBubble,
            { backgroundColor: isSelected ? colors.pulseColorSelectedText : colors.textMutedMarker }
          ]}>
          <Text
            numberOfLines={2}
            style={[markerStyles.title]}>
            {title}
          </Text>
        </View>

        <View
          style={[
            markerStyles.iconContainer,
            {
              width: size,
              height: size
            }
          ]}>
          <MarkerIcon
            size={69}
            isSelected={isSelected}
          />
        </View>
      </View>
    </Marker>
  );
};

export default MarkerComponent;
