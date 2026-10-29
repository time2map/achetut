import type { Map as MapboxMap } from 'mapbox-gl';
import surveyMapLutDataUrl from './assets/survey-map-lut.png?inline';
import { MAPBOX_STYLE } from './config';

const surveyMapLut = surveyMapLutDataUrl.replace(/^data:image\/png;base64,/, '');
const ROAD_LABEL_SOURCE_ID = 'archi2go-streets';
const ROAD_LABEL_LAYER_ID = 'archi2go-road-labels';

const standardChrome = {
  font: 'DIN Pro',
  colorModePointOfInterestLabels: 'single',
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

export const SURVEY_MAP_DESIGN = {
  id: 'survey',
  label: 'Survey',
  style: MAPBOX_STYLE,
  basemap: {
    ...standardChrome,
    lightPreset: 'dawn',
    theme: 'custom',
    'theme-data': surveyMapLut,
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
    colorBuildings: 'rgb(109, 109, 109)',
    colorPlaceLabels: 'rgba(255, 255, 255, 0.58)',
    colorRoadLabels: 'rgba(255, 255, 255, 0.43)',
    colorPointOfInterestLabels: 'rgba(255, 255, 255, 0.7)'
  }
} as const;

export function ensureCustomRoadLabels(map: MapboxMap) {
  if (!map.getSource(ROAD_LABEL_SOURCE_ID)) {
    map.addSource(ROAD_LABEL_SOURCE_ID, {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8'
    });
  }

  if (map.getLayer(ROAD_LABEL_LAYER_ID)) return;
  map.addLayer({
    id: ROAD_LABEL_LAYER_ID,
    type: 'symbol',
    source: ROAD_LABEL_SOURCE_ID,
    'source-layer': 'road',
    slot: 'top',
    minzoom: 11.5,
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['has', 'name'],
      [
        'any',
        [
          'match',
          ['get', 'class'],
          ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
          true,
          false
        ],
        ['>=', ['coalesce', ['get', 'len'], 0], 140]
      ]
    ],
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 720,
      'text-field': ['get', 'name'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 11.5, 10, 15, 12, 18, 14],
      'text-letter-spacing': 0.025,
      'text-max-angle': 35,
      'text-padding': 28,
      'text-keep-upright': true,
      'text-pitch-alignment': 'viewport',
      'text-rotation-alignment': 'map'
    },
    paint: {
      'text-color': SURVEY_MAP_DESIGN.basemap.colorRoadLabels,
      'text-halo-color': 'rgba(24, 24, 24, 0.82)',
      'text-halo-width': 0.8,
      'text-halo-blur': 0.6
    }
  });
}
