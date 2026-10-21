import type { CuratedCity, CuratedPlace, PlacePhoto, PlaceSource } from '../places';
import { LIGHTBOX_WIDTH } from './config';

export function uniqueSources(sources: PlaceSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.publisher.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Commons only renders a fixed set of thumbnail widths; 1920 is one of them.
export function largePhotoUrl(photo: PlacePhoto) {
  const file = photo.page.split('/wiki/File:')[1];
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${LIGHTBOX_WIDTH}` : null;
}

// List thumbs are about 128px. A large file scaled into that box looks noisy.
// 250px is the next smaller width Wikimedia actually serves.
export function listPhotoUrl(photo: PlacePhoto) {
  const source = photo.src || photo.thumb;
  return source.replace(/\/\d+px-([^/?#]+)$/, '/250px-$1');
}

export function googleMapsUrl(place: CuratedPlace) {
  return `https://www.google.com/maps/search/?api=1&query=${place.coordinates[1]},${place.coordinates[0]}`;
}

export function commonsSearchUrl(place: CuratedPlace, city: CuratedCity) {
  return `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(`${place.title} ${city.name}`)}&title=Special:MediaSearch&type=image`;
}
