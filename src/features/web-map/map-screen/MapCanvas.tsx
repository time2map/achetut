import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import Map, { AttributionControl, NavigationControl, Popup } from 'react-map-gl/mapbox';
import type { CuratedCity, CuratedPlace } from '../places';
import {
  CITY_ZOOM,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  PLACE_3D_BEARING,
  MAP_MAX_PITCH,
  PLACE_3D_PITCH,
  PLACE_ZOOM,
  BUILDINGS_3D_MIN_ZOOM,
  POI_LABELS_MIN_ZOOM,
  type MapViewportBounds,
  type SheetLevel
} from './config';
import {
  applied3dObjects,
  bindCompassReset,
  getBufferedMapBounds,
  getMapPadding,
  getPlace3dZoom
} from './mapCamera';
import { applyMapDesign, getMapDesign, type MapDesignId } from './mapDesigns';
import { Buildings3DControl, HoverPreview, MapPlaceMarker } from './MapMarkers';

const currentBasemap = getMapDesign('current').basemap;

function syncPoiVisibility(map: MapboxMap) {
  try {
    const visible = map.getZoom() >= POI_LABELS_MIN_ZOOM;
    if (map.getConfigProperty('basemap', 'showPointOfInterestLabels') !== visible) {
      map.setConfigProperty('basemap', 'showPointOfInterestLabels', visible);
    }
  } catch {
    // Classic styles have no POI-label config.
  }
}

export function MapCanvas({
  activeCity,
  selectedPlace,
  selectedPlaceId,
  renderedMapPlaces,
  photoPlaceIds,
  previewPlace,
  previewPlaceId,
  highlightedPlaceId,
  buildings3d,
  buildings3dRef,
  effectiveBuildings3d,
  isCompactPins,
  isMobileSheet,
  sheetLevel,
  mapRef,
  isUserZoomingRef,
  updateZoomModes,
  onMapReady,
  onMapError,
  onViewportBounds,
  onSelectPlace,
  onPreviewHover,
  onToggleBuildings3d,
  onMapClick,
  onDragStart,
  changeSheetLevel,
  mapDesignId
}: {
  activeCity: CuratedCity;
  selectedPlace: CuratedPlace | null;
  selectedPlaceId: string | null;
  renderedMapPlaces: CuratedPlace[];
  photoPlaceIds: ReadonlySet<string>;
  previewPlace: CuratedPlace | null;
  previewPlaceId: string | null;
  highlightedPlaceId: string | null;
  buildings3d: boolean;
  buildings3dRef: MutableRefObject<boolean>;
  effectiveBuildings3d: boolean;
  isCompactPins: boolean;
  isMobileSheet: boolean;
  sheetLevel: SheetLevel;
  mapRef: MutableRefObject<MapboxMap | null>;
  isUserZoomingRef: MutableRefObject<boolean>;
  updateZoomModes: (zoom: number) => void;
  onMapReady: () => void;
  onMapError: (message: string | null) => void;
  onViewportBounds: (bounds: MapViewportBounds | null) => void;
  onSelectPlace: (place: CuratedPlace) => void;
  onPreviewHover: (placeId: string, hovered: boolean) => void;
  onToggleBuildings3d: () => void;
  onMapClick: () => void;
  onDragStart: () => void;
  changeSheetLevel: (level: SheetLevel) => void;
  mapDesignId: MapDesignId;
}) {
  const mapDesignIdRef = useRef(mapDesignId);
  const appliedDesignRef = useRef<MapDesignId | null>(null);
  mapDesignIdRef.current = mapDesignId;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedDesignRef.current === null || appliedDesignRef.current === mapDesignId) return;
    appliedDesignRef.current = mapDesignId;
    applyMapDesign(map, mapDesignId, buildings3dRef.current);
  }, [buildings3dRef, mapDesignId, mapRef]);
  // A list hover lifts a dot into a photo pin; a map hover keeps the dot so the target doesn't move under the cursor.
  const isDotPlace = (placeId: string) =>
    placeId !== selectedPlaceId &&
    !photoPlaceIds.has(placeId) &&
    !(highlightedPlaceId === placeId && previewPlaceId !== placeId);
  return (
    <div
      className={`v2-map-canvas${mapDesignId === 'white' || mapDesignId === 'classic' ? ' is-map-design-white' : ''}${isCompactPins ? ' is-compact-pins' : ''}${selectedPlaceId ? ' has-selection' : ''}`}
      role="region"
      aria-label={`Map of curated places in ${activeCity.name}`}>
      {MAPBOX_TOKEN ? (
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAPBOX_STYLE}
          initialViewState={{
            longitude: selectedPlace?.coordinates[0] ?? activeCity.center[0],
            latitude: selectedPlace?.coordinates[1] ?? activeCity.center[1],
            zoom: selectedPlace && buildings3d ? getPlace3dZoom() : selectedPlace ? PLACE_ZOOM : CITY_ZOOM,
            pitch: selectedPlace && buildings3d ? PLACE_3D_PITCH : 0,
            bearing: selectedPlace && buildings3d ? PLACE_3D_BEARING : 0,
            padding: getMapPadding()
          }}
          minZoom={9}
          maxZoom={19}
          maxPitch={MAP_MAX_PITCH}
          dragRotate
          touchPitch={isMobileSheet}
          fadeDuration={isMobileSheet ? 0 : 150}
          attributionControl={false}
          logoPosition="bottom-right"
          antialias={false}
          failIfMajorPerformanceCaveat={false}
          reuseMaps
          config={{
            basemap: {
              ...currentBasemap,
              show3dObjects: buildings3d
            }
          }}

          onLoad={(event) => {
            mapRef.current = event.target;
            bindCompassReset(event.target);
            event.target.setPadding(getMapPadding());
            const zoom = event.target.getZoom();
            updateZoomModes(zoom);
            applied3dObjects.set(event.target, buildings3dRef.current);
            syncPoiVisibility(event.target);
            if (appliedDesignRef.current !== mapDesignIdRef.current) {
              appliedDesignRef.current = mapDesignIdRef.current;
              if (mapDesignIdRef.current !== 'current') {
                applyMapDesign(event.target, mapDesignIdRef.current, buildings3dRef.current);
              }
            }
            onViewportBounds(getBufferedMapBounds(event.target));
            onMapReady();
            onMapError(null);
          }}
          onMoveEnd={(event) => {
            onViewportBounds(getBufferedMapBounds(event.target));
          }}
          onClick={() => {
            if (isMobileSheet) changeSheetLevel('peek');
            onMapClick();
          }}
          onZoomStart={(event) => {
            if ('originalEvent' in event && event.originalEvent) isUserZoomingRef.current = true;
          }}
          onZoom={(event) => {
            updateZoomModes(event.viewState.zoom);
          }}
          onZoomEnd={(event) => {
            syncPoiVisibility(event.target);
            updateZoomModes(event.viewState.zoom);
            if (!isUserZoomingRef.current) return;
            isUserZoomingRef.current = false;
            const map = mapRef.current;
            if (!map) return;
            if (buildings3dRef.current && event.viewState.zoom >= BUILDINGS_3D_MIN_ZOOM) {
              // Keep a tilt the user set by hand; only lift a flat map into 3D.
              if (map.getPitch() > 20) return;
              map.stop();
              map.easeTo({
                pitch: PLACE_3D_PITCH,
                bearing: Math.abs(map.getBearing()) < 1 ? PLACE_3D_BEARING : map.getBearing(),
                duration: 520
              });
              return;
            }
            // On the phone a hand-set tilt stays; the desktop overview drops back to top-down.
            if (!isMobileSheet && map.getPitch() > 0.5) {
              map.stop();
              map.easeTo({ pitch: 0, duration: 180 });
            }
          }}
          onDragStart={() => {
            onDragStart();
            if (isMobileSheet && sheetLevel === 'half' && !selectedPlaceId) changeSheetLevel('peek');
          }}
          onError={(event) => {
            // loaded() is false whenever tiles are in flight, so only errors before the first load are fatal.
            if (!mapRef.current) onMapError(event.error?.message ?? 'The map could not be loaded.');
            else console.warn('Mapbox error', event.error);
          }}>
          <NavigationControl
            position="top-right"
            showCompass
            visualizePitch
          />
          <Buildings3DControl
            enabled={buildings3d}
            active={effectiveBuildings3d}
            onToggle={onToggleBuildings3d}
          />
          <AttributionControl position="bottom-right" />
          {renderedMapPlaces.map((place) => {
            const selected = selectedPlaceId === place.id;
            const highlighted = highlightedPlaceId === place.id || previewPlaceId === place.id;
            return (
              <MapPlaceMarker
                key={place.id}
                place={place}
                selected={selected}
                highlighted={highlighted}
                dot={isDotPlace(place.id)}
                onSelect={onSelectPlace}
                onHoverChange={onPreviewHover}
              />
            );
          })}
          {previewPlace ? (
            <Popup
              key={previewPlace.id}
              className="v2-map-popup v2-hover-popup"
              anchor="bottom"
              longitude={previewPlace.coordinates[0]}
              latitude={previewPlace.coordinates[1]}
              closeButton={false}
              closeOnClick={false}
              focusAfterOpen={false}
              maxWidth="320px"
              offset={isDotPlace(previewPlace.id) ? 26 : isCompactPins ? 72 : 90}>
              <HoverPreview place={previewPlace} />
            </Popup>
          ) : null}
        </Map>
      ) : null}
    </div>
  );
}
