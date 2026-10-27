import type { Map as MapboxMap } from 'mapbox-gl';
import architecturalMapLutDataUrl from './assets/architectural-map-lut.png?inline';
import { MAPBOX_STYLE, POI_LABELS_MIN_ZOOM } from './config';
import { applied3dObjects, setShow3dObjects } from './mapCamera';

const architecturalMapLut = architecturalMapLutDataUrl.replace(/^data:image\/png;base64,/, '');

// Shared Standard-basemap flags so a preset switch doesn't bring back labels the guide hides.
const standardChrome = {
  font: 'DIN Pro',
  colorModePointOfInterestLabels: 'single',
  // colorModePlaceLabels: 'single',
  // colorModeRoadLabels: 'single',
  showPointOfInterestLabels: false,
  densityPointOfInterestLabels: 1,
  showPlaceLabels: false,
  showRoadLabels: false,
  showPedestrianRoads: false,
  showHdRoads: false,
  showTransitLabels: false,
  showAdminBoundaries: false,
  showLandmarkIcons: false,
  showLandmarkIconLabels: false,
  showIndoor: true,
  showIndoorLabels: true,
  show3dBuildings: true,
  show3dLandmarks: true,
  show3dTrees: false,
  show3dFacades: true
} as const;

export type MapDesignId =
  | 'current'
  | 'survey'
  | 'day'
  | 'dusk'
  | 'white'
  | 'classic'
  | 'night'
  | 'monochrome'
  | 'faded'
  | 'streets'
  | 'light'
  | 'dark'
  | 'satellite';

export type MapDesign = {
  id: MapDesignId;
  label: string;
  style: string;
  basemap?: Record<string, string | number | boolean>;
  configureStyle?: (map: MapboxMap) => void;
};

function makeClassicRoadShieldsMonochrome(map: MapboxMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== 'symbol') continue;
    const iconImage = layer.layout?.['icon-image'];
    const shieldSignature = `${layer.id} ${JSON.stringify(iconImage ?? '')}`;
    if (!/shield|road-number/i.test(shieldSignature)) continue;

    // Classic road shields are regular sprite images, so desaturate the icon
    // instead of trying to tint it with the SDF-only `icon-color` property.
    map.setPaintProperty(layer.id, 'icon-color-saturation', -1);
    map.setPaintProperty(layer.id, 'icon-color-contrast', 0.08);
    map.setPaintProperty(layer.id, 'icon-color-brightness-min', 0.04);
  }
}

// Temporary design switcher. `current` is the palette wired into the map today.
export const MAP_DESIGNS: MapDesign[] = [
  {
    id: 'current',
    label: 'Current',
    style: MAPBOX_STYLE,
    basemap: {
      ...standardChrome,
      lightPreset: 'dawn',
      theme: 'custom',
      'theme-data': architecturalMapLut,
      colorLand: '#4a4a4a',
      // colorWater: '#7696ad', //rgb(98, 121, 137)
      colorWater: 'rgb(56, 92, 120)', //rgb(98, 121, 137)
      colorGreenspace: '#394d2a',
      colorCommercial: '#3a3a3a',
      colorEducation: 'rgb(57, 57, 57)', //rgb(57, 57, 57)
      colorMedical: '#4b4b4b',
      colorIndustrial: 'rgb(76, 76, 76)', //rgb(76, 76, 76)
      colorRoads: '#444444',
      colorTrunks: '#444444',
      colorMotorways: '#444444',
      colorHdRoads: '#444444',
      colorBuildings: 'rgba(139, 139, 139, 0.96)',
      colorPlaceLabels: 'rgba(255, 255, 255, 0.6)', // #ffffff
      // colorRoadLabels: '#000000', //rgb(247, 247, 247)
      colorRoadLabels: 'rgba(247, 247, 247, 0.42)', //rgb(247, 247, 247)
      colorPointOfInterestLabels: 'rgba(230, 230, 230, 0.51)' //rgb(230, 230, 230)
    }
  },
  {
    id: 'survey',
    label: 'Survey',
    style: MAPBOX_STYLE,
    basemap: {
      ...standardChrome,
      lightPreset: 'dawn', // 'day', 'dusk', 'night', 'dawn'
      theme: 'custom',
      'theme-data': architecturalMapLut,
      colorLand: '#242424',
      colorWater: '#171717',
      colorGreenspace: '#2c2c2c',
      colorCommercial: '#242424',
      colorEducation: '#242424',
      colorMedical: '#242424',
      colorIndustrial: '#242424',
      colorRoads: '#444444',
      colorTrunks: '#444444',
      colorMotorways: '#444444',
      colorHdRoads: '#444444',
      colorBuildings: 'rgb(129, 129, 129)', //rgb(89, 88, 88)
      colorPlaceLabels: 'rgba(255, 255, 255, 0.58)', //rgb(255, 255, 255)
      colorRoadLabels: 'rgba(255, 255, 255, 0.43)', //rgb(255, 255, 255)
      colorPointOfInterestLabels: 'rgba(255, 255, 255, 0.7)'
    },
  },
  {
    id: 'dusk',
    label: 'Dusk',
    style: MAPBOX_STYLE,
    basemap: {
      ...standardChrome,
      lightPreset: 'dusk', // 'day', 'dusk', 'night'
      theme: 'custom',
      'theme-data': architecturalMapLut,
      colorLand: 'rgb(94, 94, 94)', //rgb(57, 57, 57)
      colorWater: 'rgb(183, 183, 183)', //rgb(183, 183, 183)
      colorGreenspace: '#2c2c2c',
      colorCommercial: '#242424',
      colorEducation: '#242424',
      colorMedical: '#242424',
      colorIndustrial: '#242424',
      colorRoads: 'rgb(118, 118, 118)', //rgb(118, 118, 118)
      colorTrunks: '#444444',
      colorMotorways: '#444444',
      colorHdRoads: '#444444',
      colorBuildings: 'rgb(108, 108, 108)', //rgb(89, 88, 88)
      colorPlaceLabels: 'rgba(255, 255, 255, 0.67)', //rgb(255, 255, 255)
      colorRoadLabels: 'rgba(255, 255, 255, 0.63)',
      colorPointOfInterestLabels: 'rgba(176, 176, 176, 0.5)' //rgb(96, 96, 96)
    }
  },
  {
    id: 'white',
    label: 'White',
    style: MAPBOX_STYLE,
    basemap: {
      ...standardChrome,
      // High-key architectural model: small tonal steps keep geometry legible without adding colour noise.
      showRoadLabels: true,
      lightPreset: 'day',
      theme: 'monochrome', // 'monochrome', 'faded' , 'white' 
      colorLand: 'rgb(211, 211, 211)', //rgb(241, 242, 242)
      colorWater: 'rgb(188, 190, 191)',//rgb(188, 190, 191)
      colorGreenspace: '#edf0ee',
      colorCommercial: 'rgb(206, 206, 206)', // rgb(223, 225, 226)
      colorEducation: '#eff0f0',
      colorMedical: '#eff0f0',
      colorIndustrial: '#eceeee',
      colorRoads: '#fafafa',
      colorTrunks: '#f7f8f8',
      colorMotorways: '#f4f5f5',
      colorHdRoads: '#ffffff',
      colorBuildings: 'rgba(167, 167, 167, 0.83)', // rgb(223, 225, 226)
      colorPlaceLabels: 'rgb(0, 0, 0)',
      colorRoadLabels: 'rgb(0, 0, 0)',
      colorPointOfInterestLabels: 'rgb(255, 255, 255)' // rgb(36, 36, 36)
    }
  },
];

export function getMapDesign(id: MapDesignId) {
  return MAP_DESIGNS.find((design) => design.id === id) ?? MAP_DESIGNS[0];
}

// Reloads the style so colour overrides from the previous preset don't linger, then camera stays put.
export function applyMapDesign(map: MapboxMap, id: MapDesignId, buildings3d: boolean) {
  const design = getMapDesign(id);
  const run = () => {
    if (design.basemap) {
      for (const [key, value] of Object.entries(design.basemap)) {
        try {
          map.setConfigProperty('basemap', key, value);
        } catch {
          // Styles without the Standard basemap import don't expose this config.
        }
      }
    }
    design.configureStyle?.(map);
    applied3dObjects.delete(map);
    setShow3dObjects(map, buildings3d);
    try {
      const visible = map.getZoom() >= POI_LABELS_MIN_ZOOM;
      if (map.getConfigProperty('basemap', 'showPointOfInterestLabels') !== visible) {
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', visible);
      }
    } catch {
      // Classic styles have no POI-label config.
    }
  };
  map.once('style.load', run);
  map.setStyle(design.style);
}
