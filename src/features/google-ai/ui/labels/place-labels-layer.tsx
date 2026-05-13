import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { placeLabelsLayerStyles } from './place-labels-layer.styles';
import type { INearbyPlace } from '@features/google-ai/types/nearby-place';

type PlaceLabelsLayerProps = Readonly<{
  places: INearbyPlace[];
  enabled: boolean;
  zoomLevel: number;
  centerLatitude: number;
  selectedPlaceId?: string | null;
}>;

const PIN_WIDTH = 42;
const LABEL_WIDTH = 136;
const LABEL_HEIGHT = 80;
const LABEL_GAP_X = 8;
const LABEL_OFFSET_X = PIN_WIDTH / 2 + LABEL_GAP_X;
const LABEL_CONTAINER_WIDTH = LABEL_OFFSET_X + LABEL_WIDTH;

const EARTH_RADIUS_M = 6378137;

function metersPerPixel(zoom: number, latitude: number) {
  const latRad = (latitude * Math.PI) / 180;
  return (Math.cos(latRad) * 2 * Math.PI * EARTH_RADIUS_M) / (256 * Math.pow(2, zoom));
}

function approxDxDyMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
  lat0: number
) {
  const lat0Rad = (lat0 * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const dy = dLat * EARTH_RADIUS_M;
  const dx = dLng * EARTH_RADIUS_M * Math.cos(lat0Rad);
  return { dx, dy };
}

function collides(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
  lat0: number,
  thresholdX: number,
  thresholdY: number
) {
  const { dx, dy } = approxDxDyMeters(a, b, lat0);
  return Math.abs(dx) < thresholdX && Math.abs(dy) < thresholdY;
}

export default function PlaceLabelsLayer({
  places,
  enabled,
  zoomLevel,
  centerLatitude,
  selectedPlaceId = null
}: PlaceLabelsLayerProps) {
  const [tracks, setTracks] = useState(false);
  const opacity = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  const [displayedCandidates, setDisplayedCandidates] = useState<INearbyPlace[]>([]);

  const candidates = useMemo(() => {
    return (places ?? []).filter((p) => {
      const loc = p?.location;
      return Boolean(p?.placeId) && Boolean(loc) && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude);
    });
  }, [places]);

  const visibleCandidates = useMemo(() => {
    if (!Number.isFinite(zoomLevel) || zoomLevel <= 0) return [];

    const mpp = metersPerPixel(zoomLevel, centerLatitude);
    const thresholdX = mpp * LABEL_CONTAINER_WIDTH;
    const thresholdY = mpp * LABEL_HEIGHT;

    const accepted: INearbyPlace[] = [];
    const acceptedLocs: Array<{ latitude: number; longitude: number }> = [];

    for (const p of candidates) {
      const loc = p.location;
      if (acceptedLocs.some((a) => collides(a, loc, centerLatitude, thresholdX, thresholdY))) continue;
      accepted.push(p);
      acceptedLocs.push(loc);
    }

    return accepted;
  }, [candidates, centerLatitude, zoomLevel]);

  // When enabled, take current visibleCandidates snapshot for rendering.
  // When disabled, keep previous snapshot so we can fade them out.
  useEffect(() => {
    if (!enabled) return;
    setDisplayedCandidates(visibleCandidates);
  }, [enabled, visibleCandidates]);

  const tracksKey = useMemo(() => {
    // Toggle marker view tracking briefly when label content changes.
    return displayedCandidates.map((p) => `${p.placeId}:${p.displayName}`).join('|');
  }, [displayedCandidates]);

  useEffect(() => {
    if (!enabled) {
      setTracks(false);
      return;
    }
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 150);
    return () => clearTimeout(t);
  }, [enabled, tracksKey]);

  // Opacity animation for label text when enabled changes.
  useEffect(() => {
    const toValue = enabled ? 1 : 0;
    Animated.timing(opacity, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [enabled, opacity]);

  if (!displayedCandidates.length && !enabled) return null;

  return (
    <>
      {displayedCandidates.map((p, index) => (
        <Marker
          key={p.placeId}
          opacity={enabled && p.placeId !== selectedPlaceId ? 1 : 0}
          coordinate={p.location}
          zIndex={p.placeId === selectedPlaceId ? 400 : 300 + index}
          anchor={{ x: -0.12, y: 0.7 }}
          tappable={false}
          tracksViewChanges={tracks}>
          <View
            pointerEvents="none"
            style={[
              placeLabelsLayerStyles.labelContainer,
              { width: LABEL_CONTAINER_WIDTH, height: LABEL_HEIGHT }
            ]}>
            <Animated.Text
              numberOfLines={4}
              ellipsizeMode="tail"
              style={[
                placeLabelsLayerStyles.labelText,
                {
                  opacity: p.placeId === selectedPlaceId ? 0 : opacity
                }
              ]}>
              {p.displayName}
            </Animated.Text>
          </View>
        </Marker>
      ))}
    </>
  );
}

