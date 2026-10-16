import barcelona from '../../top/barcelona.json';
import bordeaux from '../../top/bordeaux.json';
import copenhagen from '../../top/copenhagen.json';
import hamburg from '../../top/hamburg.json';
import cityIndex from '../../top/index.json';
import madrid from '../../top/madrid.json';
import paris from '../../top/paris.json';
import rotterdam from '../../top/rotterdam.json';
import valencia from '../../top/valencia.json';

export type PlaceCategory = 'architecture' | 'city-core' | 'housing' | 'parks' | 'unusual';

export type PlacePhoto = {
  src: string;
  thumb: string;
  marker: string;
  page: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export type PlaceSource = {
  label: string;
  publisher: string;
  url: string;
};

export type CuratedPlace = {
  id: string;
  title: string;
  type: string;
  category: PlaceCategory;
  architect?: string;
  year?: string;
  area?: string;
  why: string;
  coordinates: [longitude: number, latitude: number];
  placeholderTone: string;
  photo?: PlacePhoto;
  photos: PlacePhoto[];
  sources: PlaceSource[];
};

export type CuratedCity = {
  id: string;
  name: string;
  country: string;
  updated: string;
  center: [longitude: number, latitude: number];
  cover?: PlacePhoto;
  places: CuratedPlace[];
  art: string;
};

const CATEGORY_BLURB: Record<PlaceCategory, string> = {
  architecture: 'Buildings chosen for how they change a street, a skyline or a room.',
  'city-core': 'Civic and historic places that still organise the city.',
  parks: 'Gardens, waterfronts and public ground worth leaving the street for.',
  unusual: 'Experiments, leftovers and city curiosities that do not fit a type.',
  housing: 'Places that show how people actually live here.'
};

type TopSource = {
  publisher: string;
  author: string | null;
  title: string;
  url: string;
  date: string | null;
  type: string;
};

type TopPhoto = {
  file: string;
  src: string;
  thumb: string;
  page: string;
  author: string;
  license: string;
  licenseUrl: string;
};

type TopPoint = {
  name: string | null;
  lat: number | null;
  lng: number | null;
  refs?: Record<string, string>;
  verifiedBy?: string[];
};

type TopPlace = {
  id: string;
  title: string;
  architect?: string | null;
  year?: string | null;
  area?: string | null;
  group?: string | null;
  sources?: string[];
  why?: string | null;
  note?: string | null;
  points?: TopPoint[];
  photos?: TopPhoto[];
};

type TopCityFile = {
  id: string;
  name: string;
  updated: string;
  cover?: string | null;
  sources: Record<string, TopSource>;
  places: TopPlace[];
};

export const CATEGORY_META: Record<PlaceCategory, { label: string; color: string }> = {
  architecture: { label: 'Architecture', color: '#2f6d74' },
  'city-core': { label: 'City core', color: '#bd4039' },
  housing: { label: 'Housing', color: '#9b5f2b' },
  parks: { label: 'Parks', color: '#477353' },
  unusual: { label: 'Unusual', color: '#715579' }
};

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

const CITY_FILES: Record<string, TopCityFile> = {
  madrid: madrid as TopCityFile,
  barcelona: barcelona as TopCityFile,
  bordeaux: bordeaux as TopCityFile,
  valencia: valencia as TopCityFile,
  paris: paris as TopCityFile,
  copenhagen: copenhagen as TopCityFile,
  rotterdam: rotterdam as TopCityFile,
  hamburg: hamburg as TopCityFile
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isCategory(value: string | null | undefined): value is PlaceCategory {
  return Boolean(value && value in CATEGORY_META);
}

function commonsCover(file: string): PlacePhoto {
  const encoded = encodeURIComponent(file);
  return {
    src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=1280`,
    thumb: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=420`,
    marker: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=160`,
    page: `https://commons.wikimedia.org/wiki/File:${encoded}`,
    author: 'Wikimedia Commons',
    license: 'See file page',
    licenseUrl: `https://commons.wikimedia.org/wiki/File:${encoded}`
  };
}

function adaptPhoto(photo: TopPhoto): PlacePhoto {
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

function firstPoint(place: TopPlace): [number, number] | null {
  for (const point of place.points ?? []) {
    if (Number.isFinite(point.lng) && Number.isFinite(point.lat)) {
      return [point.lng as number, point.lat as number];
    }
  }
  return null;
}

function adaptPlace(place: TopPlace, citySources: Record<string, TopSource>, index: number): CuratedPlace | null {
  const coordinates = firstPoint(place);
  if (!coordinates) return null;

  const category = isCategory(place.group) ? place.group : 'architecture';
  const photos = (place.photos ?? []).filter((item) => item.src || item.thumb).map(adaptPhoto);
  const photo = photos[0];
  const sources = (place.sources ?? [])
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
    why: place.why?.trim() || 'A curated stop from the Achetut city guide.',
    coordinates,
    placeholderTone: PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length],
    photo,
    photos,
    sources
  };
}

function coverFromPlaces(file: string, places: CuratedPlace[]): PlacePhoto | undefined {
  const key = file.replace(/ /g, '_').toLocaleLowerCase();
  for (const place of places) {
    const match = place.photos.find((photo) => decodeURIComponent(photo.page).replace(/ /g, '_').toLocaleLowerCase().includes(key));
    if (match) return match;
  }
  return undefined;
}

function adaptCity(file: TopCityFile): CuratedCity {
  const places = file.places
    .map((place, index) => adaptPlace(place, file.sources, index))
    .filter((place): place is CuratedPlace => place !== null);

  const lngs = places.map((place) => place.coordinates[0]);
  const lats = places.map((place) => place.coordinates[1]);

  return {
    id: file.id,
    name: file.name,
    country: CITY_COUNTRY[file.id] ?? 'Europe',
    updated: file.updated,
    center: [median(lngs), median(lats)],
    cover: file.cover ? coverFromPlaces(file.cover, places) ?? commonsCover(file.cover) : undefined,
    places,
    art: CITY_ART[file.id] ?? '#d98c62'
  };
}

export const CITIES: CuratedCity[] = (cityIndex as { id: string; name: string }[])
  .map((entry) => CITY_FILES[entry.id])
  .filter(Boolean)
  .map(adaptCity);

export const CITY_BY_ID = Object.fromEntries(CITIES.map((city) => [city.id, city])) as Record<string, CuratedCity>;

export const DEFAULT_CITY_ID = CITY_BY_ID.barcelona ? 'barcelona' : CITIES[0]?.id ?? 'barcelona';

/** @deprecated Prefer CITIES / active city places. Kept for any leftover single-city imports. */
export const CURATED_PLACES = CITY_BY_ID[DEFAULT_CITY_ID]?.places ?? [];

export const EUROPE_OVERVIEW = {
  center: [4.2, 48.2] as [number, number],
  zoom: 4.15,
  pitch: 0,
  bearing: 0
};

export function cityGuideCopy(city: CuratedCity, category: 'all' | PlaceCategory = 'all') {
  if (category !== 'all') {
    return {
      eyebrow: `${city.name}, ${city.country}`,
      title: CATEGORY_META[category].label,
      summary: CATEGORY_BLURB[category]
    };
  }

  return {
    eyebrow: city.country,
    title: city.name,
    summary: ''
  };
}
