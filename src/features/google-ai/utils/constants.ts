import { env } from "@shared/config/env";

export const DEFAULT_PLACES_TYPES = [
  "tourist_attraction",
  "point_of_interest",
  "park",
  "natural_feature",
  "museum",
  "art_gallery",
  "library",
  "landmark",
  "historical_landmark",
  "place_of_worship",
  "city_hall",
  "courthouse",
  "embassy",
  "square",
  "plaza",
  "town_square",
  "fountain",
  "sculpture",
  "monument",
  "memorial",
  "bridge",
  "arch",
  "tower",
  "castle",
  "fort",
  "trailhead",
  "hiking_area",
  "viewpoint",
  "beach",
  "lake",
  "river",
  "harbor",
  "marina",
  "stadium",
  "amusement_park",
  "aquarium",
  "zoo",
  "neighborhood",
  "premise"
];
export const WHAT_IS_HERE_PLACES_TYPES = [
  "tourist_attraction",
  "park",
  "museum",
  "art_gallery",
  "library",
  "historical_landmark",
  "city_hall",
  "courthouse",
  "embassy",
  "plaza",
  "sculpture",
  "monument",
  "hiking_area",
  "beach",
  "marina",
  "stadium",
  "amusement_park",
  "aquarium",
  "zoo",
  "national_park",
  "state_park",
  "botanical_garden",
  "cultural_landmark",
  "historical_place",
  "observation_deck",
];

export const OPENAI_MODELS = [
  { value: 'gpt-5', label: 'gpt-5' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'gpt-5-nano', label: 'gpt-5-nano' },
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'gpt-4.1', label: 'gpt-4.1' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
  { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano' },
  { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
  { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' }
] as const;

export const ACHETUT_BACK_URL = env.achetutBackUrl;
export const AUTOCOMPLETE_URL = `${ACHETUT_BACK_URL}/photon/api`;
export const REVERSE_GEOCODE_URL = `${ACHETUT_BACK_URL}/photon/reverse`;
export const GOOGLE_PLACES_URL = `${ACHETUT_BACK_URL}/google-places/v1`;
export const SEARCH_NEARBY_URL = `${GOOGLE_PLACES_URL}/places:searchNearby`;
export const PLACES_DETAILS_URL = `${GOOGLE_PLACES_URL}/places`;
export const PLACES_SEARCH_TEXT_URL = `${GOOGLE_PLACES_URL}/places:searchText`;
export const AI_COMPLETION_URL = `${ACHETUT_BACK_URL}/openai/v1/chat/completions`;