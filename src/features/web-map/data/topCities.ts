import barcelona from '../../../top/barcelona.json';
import bordeaux from '../../../top/bordeaux.json';
import copenhagen from '../../../top/copenhagen.json';
import hamburg from '../../../top/hamburg.json';
import cityIndex from '../../../top/index.json';
import madrid from '../../../top/madrid.json';
import paris from '../../../top/paris.json';
import rotterdam from '../../../top/rotterdam.json';
import valencia from '../../../top/valencia.json';
import type { CuratedCity, CuratedPlace, PlacePhoto } from '../places';
import { buildCity, buildPlace, type ContentPhoto, type ContentSource } from './adapt';

type TopPoint = {
  name: string | null;
  lat: number | null;
  lng: number | null;
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
  points?: TopPoint[];
  photos?: ContentPhoto[];
};

type TopCityFile = {
  id: string;
  name: string;
  updated: string;
  cover?: string | null;
  sources: Record<string, ContentSource>;
  places: TopPlace[];
};

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

function firstPoint(place: TopPlace): [number, number] | null {
  for (const point of place.points ?? []) {
    if (Number.isFinite(point.lng) && Number.isFinite(point.lat)) {
      return [point.lng as number, point.lat as number];
    }
  }
  return null;
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
    .map((place, index) => buildPlace({ ...place, coordinates: firstPoint(place) }, file.sources, index))
    .filter((place): place is CuratedPlace => place !== null);
  const cover = file.cover ? coverFromPlaces(file.cover, places) ?? commonsCover(file.cover) : undefined;
  return buildCity({ id: file.id, name: file.name, updated: file.updated, cover }, places);
}

export const CITIES: CuratedCity[] = (cityIndex as { id: string; name: string }[])
  .map((entry) => CITY_FILES[entry.id])
  .filter(Boolean)
  .map(adaptCity);

export const CITY_BY_ID = Object.fromEntries(CITIES.map((city) => [city.id, city])) as Record<string, CuratedCity>;

export const DEFAULT_CITY_ID = CITY_BY_ID.barcelona ? 'barcelona' : CITIES[0]?.id ?? 'barcelona';
