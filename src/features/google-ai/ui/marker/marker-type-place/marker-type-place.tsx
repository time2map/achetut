import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { markerTypePlaceStyles } from './marker-type-palce.styles';
import MapPlaceIcon from '@features/google-ai/components/icons/marker-place-icon';

type MarkerTypePlaceProps = {
  readonly markerPlaces: INearbyPlace[];
  readonly selectedPlaceId: string | null;
  readonly onPress: (place: INearbyPlace) => void;
};

const MarkerTypePlace = memo(function MarkerTypePlace({ markerPlaces, selectedPlaceId, onPress }: MarkerTypePlaceProps) {
  const markers = useMemo(() => {
    if (!markerPlaces?.length) return null;

    return markerPlaces.map((place, index) => {
      const isPressed = selectedPlaceId === place.placeId;
      return (
        <Marker
          key={place.placeId}
          opacity={isPressed ? 0 : 1}
          onPress={() => onPress(place)}
          tracksViewChanges={false}
          coordinate={{
            latitude: place.location?.latitude ?? 0,
            longitude: place.location?.longitude ?? 0
          }}
          zIndex={index + 1}
          anchor={{ x: 0.5, y: 0.8 }}>
          <View style={markerTypePlaceStyles.wrapper}>
            <MapPlaceIcon />
          </View>
        </Marker>
      );
    });
  }, [markerPlaces, onPress, selectedPlaceId]);

  return <>{markers}</>;
});

export default MarkerTypePlace;