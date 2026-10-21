import type { Map as MapboxMap } from 'mapbox-gl';
import type { CuratedPlace } from '../places';
import {
  CITY_ZOOM,
  MOBILE_QUERY_WIDTH,
  PLACE_3D_BEARING,
  PLACE_3D_PITCH,
  PLACE_3D_ZOOM,
  PLACE_ZOOM,
  type MapViewportBounds,
  type SheetHeights,
  type SheetLevel
} from './config';

export function getSheetHeights(viewportHeight: number): SheetHeights {
  if (viewportHeight < 520) {
    return { peek: 124, half: Math.max(124, Math.min(220, viewportHeight - 120)), full: viewportHeight - 16 };
  }
  return {
    peek: 132,
    half: Math.min(520, Math.max(300, Math.round(viewportHeight * 0.5))),
    full: viewportHeight - 64
  };
}

// The map stays usable behind a full sheet, so camera padding never exceeds the half sheet.
export function sheetMapPadding(level: SheetLevel, heights: SheetHeights) {
  return Math.min(heights[level], heights.half);
}

let mobileSheetPadding: number | null = null;

export function setMobileSheetPadding(padding: number | null) {
  mobileSheetPadding = padding;
}

export function getMapPadding() {
  if (window.innerWidth < MOBILE_QUERY_WIDTH) {
    return {
      top: 24,
      right: 16,
      bottom: mobileSheetPadding ?? sheetMapPadding('half', getSheetHeights(window.innerHeight)),
      left: 16
    };
  }
  return { top: 32, right: 32, bottom: 32, left: 464 };
}

// Padding moves the camera's focal point; re-centre so whatever is on screen stays put.
export function setPaddingKeepingView(map: MapboxMap, padding: ReturnType<typeof getMapPadding>) {
  const container = map.getContainer();
  const x = (padding.left + container.clientWidth - padding.right) / 2;
  const y = (padding.top + container.clientHeight - padding.bottom) / 2;
  map.jumpTo({ center: map.unproject([x, y]), padding });
}

export function getBufferedMapBounds(map: MapboxMap): MapViewportBounds | null {
  const bounds = map.getBounds();
  if (!bounds) return null;
  const longitudePadding = (bounds.getEast() - bounds.getWest()) * 0.2;
  const latitudePadding = (bounds.getNorth() - bounds.getSouth()) * 0.2;
  return {
    west: bounds.getWest() - longitudePadding,
    south: bounds.getSouth() - latitudePadding,
    east: bounds.getEast() + longitudePadding,
    north: bounds.getNorth() + latitudePadding
  };
}

export function isPlaceInsideBounds(place: CuratedPlace, bounds: MapViewportBounds) {
  const [longitude, latitude] = place.coordinates;
  return longitude >= bounds.west && longitude <= bounds.east && latitude >= bounds.south && latitude <= bounds.north;
}

export const applied3dObjects = new WeakMap<MapboxMap, boolean>();

export function setShow3dObjects(map: MapboxMap, show: boolean) {
  if (applied3dObjects.get(map) === show) return;
  try {
    map.setConfigProperty('basemap', 'show3dObjects', show);
    applied3dObjects.set(map, show);
  } catch {
    // Styles without the Standard basemap import don't expose this config.
  }
}

export function focusPlaceCamera(map: MapboxMap, place: CuratedPlace, buildings3d: boolean) {
  const padding = getMapPadding();
  if (!buildings3d) {
    map.easeTo({
      center: place.coordinates,
      zoom: Math.max(map.getZoom(), PLACE_ZOOM),
      pitch: 0,
      bearing: 0,
      padding,
      duration: 520
    });
    return;
  }
  const bearing = map.getPitch() > 20 ? map.getBearing() : PLACE_3D_BEARING;
  // On desktop a tilted building gets headroom for its silhouette; on mobile the
  // place sits in the middle of the map strip above the sheet.
  const headroom = window.innerWidth < MOBILE_QUERY_WIDTH ? 0 : Math.min(160, Math.round(window.innerHeight * 0.14));
  map.flyTo({
    center: place.coordinates,
    // Keep a closer zoom if the user already zoomed in further than the place default.
    zoom: Math.max(map.getZoom(), PLACE_3D_ZOOM),
    pitch: PLACE_3D_PITCH,
    bearing,
    padding: { ...padding, top: padding.top + headroom },
    duration: 1400,
    curve: 1.2,
    essential: true
  });
}

export function focusCityCamera(map: MapboxMap, center: [number, number], duration = 650) {
  map.easeTo({
    center,
    zoom: CITY_ZOOM,
    pitch: 0,
    bearing: 0,
    padding: getMapPadding(),
    duration
  });
}
