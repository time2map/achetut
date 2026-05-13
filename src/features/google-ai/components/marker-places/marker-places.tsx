import MarkerComponent from '@features/google-ai/ui/marker/marker';

import { memo, useMemo } from 'react';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { IGooglePlace } from '@features/google-ai/types/google-place';

type MarkerPlacesProps = {
  markerPlaces: INearbyPlace[] | IGooglePlace[];
  selectedPlaceId: string | null;
  onPress: (place: INearbyPlace | IGooglePlace) => void;
};

const MarkerPlaces = memo(function MarkerPlaces({ markerPlaces, selectedPlaceId, onPress }: MarkerPlacesProps) {
  const markers = useMemo(() => {
    if (!markerPlaces?.length) return null;

    return markerPlaces.map((place, index) => (
      <MarkerComponent
        isPressed={selectedPlaceId === place.placeId}
        id={place.placeId}
        key={place.placeId}
        coordinate={{ latitude: place.location?.latitude ?? 0, longitude: place.location?.longitude ?? 0 }}
        zIndex={index + 1}
        title={place.displayName}
        onPress={() => {
          onPress(place);
        }}
      />
    ));
  }, [markerPlaces, selectedPlaceId, onPress]);

  return <>{markers}</>;
});

export default MarkerPlaces;
