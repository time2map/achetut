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

/** What the city picker needs; available before a city's places are loaded. */
export type CitySummary = {
  id: string;
  name: string;
  country: string;
  updated: string;
  placeCount: number;
  cover?: PlacePhoto;
  art: string;
};

export type CuratedCity = CitySummary & {
  center: [longitude: number, latitude: number];
  places: CuratedPlace[];
};

const CATEGORY_BLURB: Record<PlaceCategory, string> = {
  architecture: 'Buildings chosen for how they change a street, a skyline or a room.',
  'city-core': 'Civic and historic places that still organise the city.',
  parks: 'Gardens, waterfronts and public ground worth leaving the street for.',
  unusual: 'Experiments, leftovers and city curiosities that do not fit a type.',
  housing: 'Places that show how people actually live here.'
};

export const CATEGORY_META: Record<PlaceCategory, { label: string; color: string }> = {
  architecture: { label: 'Architecture', color: '#176b87' },
  'city-core': { label: 'City core', color: '#bd4039' },
  housing: { label: 'Housing', color: '#9b5f2b' },
  parks: { label: 'Parks', color: '#477353' },
  unusual: { label: 'Unusual', color: '#715579' }
};

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
