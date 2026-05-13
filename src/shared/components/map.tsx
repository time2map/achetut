import { Coords } from '@shared/styles/map';
import { type ReactNode, type RefObject } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type MapViewProps, type Region } from 'react-native-maps';
import { env } from '@shared/config/env';

type GoogleBasedMapProps = {
  mapRef: RefObject<MapView | null>;
  initialRegion: Region;
  coords: Coords | null;
  mapId?: string | null;
  children?: ReactNode;
  onPress?: MapView['props']['onPress'];
  onLongPress?: MapView['props']['onLongPress'];
  onPanDrag?: MapView['props']['onPanDrag'];
  onPoiClick?: MapView['props']['onPoiClick'];
  mapProps?: Partial<MapViewProps>;
};

export const GoogleBasedMap = ({
  mapRef,
  initialRegion,
  coords,
  mapId,
  children,
  onPress,
  onLongPress,
  onPanDrag,
  mapProps,
  onPoiClick
}: GoogleBasedMapProps) => {
  const hasGoogleMapsKey = Boolean(env.googleMapsApiKey);
  const mapProvider = Platform.OS === 'ios' && !hasGoogleMapsKey ? undefined : PROVIDER_GOOGLE;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      provider={mapProvider}
      showsUserLocation={Boolean(coords)}
      {...(mapId ? { mapId } : {})}
      onPress={onPress}
      onLongPress={onLongPress}
      onPanDrag={onPanDrag}
      onPoiClick={onPoiClick}
      {...mapProps}>
      {children}
    </MapView>
  );
};
