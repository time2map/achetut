import type { MutableRefObject } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import Map, { AttributionControl, NavigationControl, Popup } from 'react-map-gl/mapbox';
import type { CuratedCity, CuratedPlace } from '../places';
import {
  CITY_ZOOM,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  PLACE_3D_BEARING,
  PLACE_3D_PITCH,
  PLACE_ZOOM,
  BUILDINGS_3D_MIN_ZOOM,
  type MapViewportBounds,
  type SheetLevel
} from './config';
import {
  applied3dObjects,
  getBufferedMapBounds,
  getMapPadding,
  getPlace3dZoom
} from './mapCamera';
import { Buildings3DControl, HoverPreview, MapPlaceMarker } from './MapMarkers';

export function MapCanvas({
  activeCity,
  selectedPlace,
  selectedPlaceId,
  renderedMapPlaces,
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
  changeSheetLevel
}: {
  activeCity: CuratedCity;
  selectedPlace: CuratedPlace | null;
  selectedPlaceId: string | null;
  renderedMapPlaces: CuratedPlace[];
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
}) {
  return (
    <div
      className={`v2-map-canvas${isCompactPins ? ' is-compact-pins' : ''}${selectedPlaceId ? ' has-selection' : ''}`}
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
          maxPitch={65}
          dragRotate={!isMobileSheet}
          touchPitch={false}
          fadeDuration={isMobileSheet ? 0 : 150}
          attributionControl={false}
          logoPosition="bottom-right"
          antialias={false}
          failIfMajorPerformanceCaveat={false}
          reuseMaps
          config={{
            basemap: {
              lightPreset: 'day',
              theme: 'faded',
              font: 'Inter',
              colorLand: '#edf1ee',
              colorWater: '#c9dcda',
              colorGreenspace: '#d9e6dd',
              colorCommercial: '#ebe9e4',
              colorEducation: '#e7ebe8',
              colorMedical: '#efe6e4',
              colorIndustrial: '#dfe4e1',
              colorRoads: '#f8faf8',
              colorTrunks: '#f2f5f2',
              colorMotorways: '#e8ece9',
              colorBuildings: '#c9c0b7',
              colorPlaceLabels: '#17201e',
              colorRoadLabels: '#626e6a',
              // Basemap POIs stay sparse so curated pins keep the visual lead.
              showPointOfInterestLabels: true,
              densityPointOfInterestLabels: 1,
              showPlaceLabels: false,
              showRoadLabels: true,
              showPedestrianRoads: true,
              showTransitLabels: false,
              showAdminBoundaries: false,
              showLandmarkIcons: false,
              showLandmarkIconLabels: false,
              showIndoor: false,
              showIndoorLabels: false,
              show3dObjects: buildings3d,
              show3dBuildings: true,
              show3dLandmarks: true,
              show3dTrees: false,
              show3dFacades: false
            }
          }}
          onLoad={(event) => {
            mapRef.current = event.target;
            event.target.setPadding(getMapPadding());
            const zoom = event.target.getZoom();
            updateZoomModes(zoom);
            applied3dObjects.set(event.target, buildings3dRef.current);
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
            if (map.getPitch() > 0.5) {
              map.stop();
              map.easeTo({ pitch: 0, duration: 180 });
            }
          }}
          onDragStart={() => {
            onDragStart();
            if (isMobileSheet && sheetLevel === 'half' && !selectedPlaceId) changeSheetLevel('peek');
          }}
          onError={(event) => {
            if (!mapRef.current?.loaded()) onMapError(event.error?.message ?? 'The map could not be loaded.');
          }}>
          <NavigationControl
            position="top-right"
            showCompass={false}
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
              offset={isCompactPins ? 58 : 74}>
              <HoverPreview place={previewPlace} />
            </Popup>
          ) : null}
        </Map>
      ) : null}
    </div>
  );
}
