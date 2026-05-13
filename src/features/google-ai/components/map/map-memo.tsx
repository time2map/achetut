import React, { forwardRef, memo, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { useGoogleMapIosPerfFix } from '../../hooks/useGoogleMapIosPerfFix.ios';

type Props = {
  initialRegion: Region;
  coords?: { latitude: number; longitude: number } | null;
  onMapPress: (e: any) => void;
  onPoiClick?: (e: any) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
  mapPadding: { top: number; right: number; bottom: number; left: number };
};

const MapMemoInner = forwardRef<MapView, Props>(function MapMemoInner(props, ref) {
  const { initialRegion, coords, mapPadding, onMapPress, onPoiClick, onRegionChangeComplete, children } = props;

  // ВАЖНО: стабилизировать колбэки
  const handlePress = useCallback(
    (event: any) => {
      if (event?.nativeEvent?.action === 'marker-press') return;
      onMapPress(event);
    },
    [onMapPress]
  );

  useGoogleMapIosPerfFix(true);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      provider={PROVIDER_GOOGLE}
      onPanDrag={() => {}} 
      showsBuildings={false}
      showsPointsOfInterest={true}
      showsUserLocation={Boolean(coords)}
      mapPadding={mapPadding}
      onPress={handlePress}
      onPoiClick={onPoiClick}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {children}
    </MapView>
  );
});

export const MapMemo = memo(MapMemoInner);

MapMemo.displayName = 'MapMemo';