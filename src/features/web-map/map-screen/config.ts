import { env } from '@shared/config/env';
import type { PlaceCategory } from '../places';

export const MAPBOX_TOKEN = env.mapboxAccessToken;
export const MAPBOX_STYLE = env.mapboxStyle;

export const CITY_ZOOM = 12.35;
export const PLACE_ZOOM = 14.6;
export const PLACE_3D_ZOOM = 18;
export const PLACE_3D_ZOOM_MOBILE = 16.5;
export const PLACE_3D_PITCH = 62;
export const PLACE_3D_BEARING = -20;
export const COMPACT_PIN_ZOOM = 13;
export const HOVER_PREVIEW_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 820px)';
export const BUILDINGS_3D_MIN_ZOOM = 15.2;
export const BUILDINGS_3D_STORAGE_KEY = 'achetut-3d-v2';
export const MOBILE_QUERY_WIDTH = 820;
export const LIGHTBOX_WIDTH = 1920;
export const SHORTCUT_MODIFIER =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
// Temporarily hidden after the product review. Keep the implementation ready to restore.
export const SHOW_SEARCH = false;

export type CategoryFilter = 'all' | PlaceCategory;
export type MapViewportBounds = { west: number; south: number; east: number; north: number };
export type SheetLevel = 'peek' | 'half' | 'full';
export type SheetHeights = Record<SheetLevel, number>;
export type IconName =
  | 'arrow-left'
  | 'arrow-up-right'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'external'
  | 'location'
  | 'search';

export const SHEET_LEVELS: SheetLevel[] = ['peek', 'half', 'full'];

export const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'city-core', label: 'City core' },
  { value: 'housing', label: 'Housing' },
  { value: 'parks', label: 'Parks' },
  { value: 'unusual', label: 'Unusual' }
];

export function readPreviewLoading() {
  const value = new URLSearchParams(window.location.search).get('loading');
  return value !== null && value !== '0' && value !== 'false' && value !== 'off';
}
