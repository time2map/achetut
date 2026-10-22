import {
  CATEGORY_META,
  type CuratedCity,
  type CuratedPlace,
  type PlaceCategory,
  type PlacePhoto,
  type PlaceSource
} from '../places';

/** Photo and source shapes shared by the content files and the API. */
export type ContentPhoto = {
  file?: string;
  src: string;
  thumb: string;
  page: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export type ContentSource = {
  publisher: string;
  author?: string | null;
  title: string;
  url: string;
  date?: string | null;
  type?: string;
};

export type ContentPlace = {
  id: string;
  title: string;
  architect?: string | null;
  year?: string | null;
  area?: string | null;
  group?: string | null;
  why?: string | null;
  sources?: string[];
  photos?: ContentPhoto[];
  coordinates: [number, number] | null;
};

export class CityNotFoundError extends Error {
  constructor(cityId: string) {
    super(`City "${cityId}" was not found.`);
    this.name = 'CityNotFoundError';
  }
}

const CITY_COUNTRY: Record<string, string> = {
  madrid: 'Spain',
  barcelona: 'Spain',
  bordeaux: 'France',
  valencia: 'Spain',
  paris: 'France',
  copenhagen: 'Denmark',
  rotterdam: 'Netherlands',
  hamburg: 'Germany'
};

const CITY_ART: Record<string, string> = {
  madrid: '#c28164',
  barcelona: '#d98c62',
  bordeaux: '#8a624b',
  valencia: '#e4b059',
  paris: '#7f879e',
  copenhagen: '#477353',
  rotterdam: '#2f6d74',
  hamburg: '#715579'
};

const PLACEHOLDER_TONES = ['ochre', 'timber', 'stone', 'garden', 'concrete', 'brick', 'sand', 'red'] as const;

export function cityCountry(cityId: string) {
  return CITY_COUNTRY[cityId] ?? 'Europe';
}

export function cityArt(cityId: string) {
  return CITY_ART[cityId] ?? '#d98c62';
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isCategory(value: string | null | undefined): value is PlaceCategory {
  return Boolean(value && value in CATEGORY_META);
}

export function adaptPhoto(photo: ContentPhoto): PlacePhoto {
  // Wikimedia only serves certain thumb widths. Inventing sizes like 160/420 often 400s.
  // Prefer the JSON URLs as-is: `thumb` (~120px) for markers, `src` (~960px) for cards/detail.
  return {
    src: photo.src,
    thumb: photo.src || photo.thumb,
    marker: photo.thumb || photo.src,
    page: photo.page,
    author: photo.author,
    license: photo.license,
    licenseUrl: photo.licenseUrl
  };
}

export function buildPlace(
  place: ContentPlace,
  citySources: Record<string, ContentSource>,
  index: number
): CuratedPlace | null {
  if (!place.coordinates) return null;

  const category = isCategory(place.group) ? place.group : 'architecture';
  const photos = (place.photos ?? []).filter((item) => item.src || item.thumb).map(adaptPhoto);
  const sources: PlaceSource[] = (place.sources ?? [])
    .map((sourceId) => citySources[sourceId])
    .filter(Boolean)
    .map((source) => ({
      label: source.title || source.publisher,
      publisher: source.publisher || source.title,
      url: source.url
    }));

  return {
    id: place.id,
    title: place.title,
    type: CATEGORY_META[category].label,
    category,
    architect: place.architect ?? undefined,
    year: place.year ?? undefined,
    area: place.area ?? undefined,
    why: place.why?.trim() || 'A curated stop from the Archi2go city guide.',
    coordinates: place.coordinates,
    placeholderTone: PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length],
    photo: photos[0],
    photos,
    sources
  };
}

export function buildCity(
  city: { id: string; name: string; updated: string; cover?: PlacePhoto },
  places: CuratedPlace[]
): CuratedCity {
  return {
    id: city.id,
    name: city.name,
    country: cityCountry(city.id),
    updated: city.updated,
    placeCount: places.length,
    cover: city.cover,
    art: cityArt(city.id),
    center: [median(places.map((place) => place.coordinates[0])), median(places.map((place) => place.coordinates[1]))],
    places
  };
}
