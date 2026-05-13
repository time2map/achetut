import React, { forwardRef, memo, useCallback } from "react";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Platform, StyleSheet } from "react-native";
import { useGoogleMapIosPerfFix } from "../hooks/useGoogleMapIosPerfFix.ios";
import { env } from "@shared/config/env";

type Props = {
  initialRegion: Region;
  coords?: { latitude: number; longitude: number } | null;
  onMapPress: (e: any) => void;
  onPoiClick?: (e: any) => void;
  children?: React.ReactNode;
  mapPadding: { top: number; right: number; bottom: number; left: number };
};

export const MapMemo = memo(
  forwardRef<MapView, Props>(function MapMemo(props, ref) {
  const onMapPress = props.onMapPress;
  const hasGoogleMapsKey = Boolean(env.googleMapsApiKey);
  const mapProvider = Platform.OS === "ios" && !hasGoogleMapsKey ? undefined : PROVIDER_GOOGLE;

  // IMPORTANT: keep the callbacks stable so MapView doesn't reconcile on every render
  const handlePress = useCallback(
    (event: any) => {
      if (event?.nativeEvent?.action === "marker-press") return;
      onMapPress(event);
    },
    [onMapPress]
  );

  useGoogleMapIosPerfFix(mapProvider === PROVIDER_GOOGLE);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={props.initialRegion}
      provider={mapProvider}
      onPanDrag={() => {}} 
      showsBuildings={false}
      showsPointsOfInterest={true}
      showsUserLocation={Boolean(props.coords)}
      mapPadding={props.mapPadding}
      onPress={handlePress}
      onPoiClick={props.onPoiClick}
    >
      {props.children}
    </MapView>
  );
  })
);

MapMemo.displayName = "MapMemo";