import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import Map, { AttributionControl, Marker } from 'react-map-gl/mapbox';
import './desktop-map.css';

import { env } from '@shared/config/env';
import { Archi2goLogo } from './Archi2goLogo';
import { CITIES, CITY_BY_ID, DEFAULT_CITY_ID } from './data/topCities';
import {
  CATEGORY_META,
  EUROPE_OVERVIEW,
  cityGuideCopy,
  type CuratedCity,
  type CuratedPlace,
  type PlaceCategory
} from './places';

const MAPBOX_TOKEN = env.mapboxAccessToken;
const MAPBOX_STYLE = env.mapboxStyle;
const DESKTOP_PANEL_PADDING = 492;
const CITY_ZOOM = 12.4;
const PIN_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>';
const CHEVRON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>';

type DesktopMapScreenProps = {
  routeBase?: string;
};

type PanelMode = 'cities' | 'list' | 'detail';
type SheetLevel = 'collapsed' | 'half' | 'full';
type Modal = 'about' | 'photo' | null;
type IconName = 'arrow-left' | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'chevron-up' | 'close' | 'external' | 'image' | 'info' | 'list' | 'pin' | 'search';
type CategoryFilter = 'all' | PlaceCategory;

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'city-core', label: 'City core' },
  { value: 'housing', label: 'Housing' },
  { value: 'parks', label: 'Parks' },
  { value: 'unusual', label: 'Unusual' }
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    'arrow-left': <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    'chevron-up': <path d="m18 15-6-6-6 6" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    external: <><path d="M14 5h5v5" /><path d="m10 14 9-9" /><path d="M19 13v6H5V5h6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-5-5L5 20" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>
  };

  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function getMapPadding(panelOpen: boolean) {
  if (window.innerWidth < 1024) {
    return { top: 80, right: 16, bottom: panelOpen ? Math.round(window.innerHeight * 0.44) : 112, left: 16 };
  }
  return { top: 32, right: 32, bottom: 32, left: panelOpen ? DESKTOP_PANEL_PADDING : 32 };
}

function googleMapsUrl(place: CuratedPlace) {
  return `https://www.google.com/maps/search/?api=1&query=${place.coordinates[1]},${place.coordinates[0]}`;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function normalizeRouteBase(routeBase: string) {
  if (!routeBase || routeBase === '/') return '';
  return `/${routeBase.split('/').filter(Boolean).join('/')}`;
}

function citiesPath(routeBase: string) {
  return `${routeBase}/cities`;
}

function cityPath(routeBase: string, cityId: string) {
  return `${routeBase}/${cityId}`;
}

function placePath(routeBase: string, cityId: string, placeId: string) {
  return `${cityPath(routeBase, cityId)}/${placeId}`;
}

function routeSegments(routeBase: string) {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const baseSegments = routeBase.split('/').filter(Boolean);
  return pathSegments.slice(baseSegments.length);
}

function parseRoute(routeBase: string) {
  const segments = routeSegments(routeBase);
  if (segments[0] === 'cities') return { mode: 'cities' as const };
  const cityId = segments[0] && CITY_BY_ID[segments[0]] ? segments[0] : null;
  if (!cityId) return { mode: 'default' as const };
  const placeId = segments[1] && CITY_BY_ID[cityId].places.some((place) => place.id === segments[1])
    ? segments[1]
    : null;
  return { mode: placeId ? 'detail' as const : 'list' as const, cityId, placeId };
}

function cityCamera(city: CuratedCity) {
  return { center: city.center, zoom: CITY_ZOOM, pitch: 44, bearing: -11 };
}

function createElement(tag: string, className: string, text?: string) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createPlacePin(place: CuratedPlace, rank: number) {
  const category = CATEGORY_META[place.category];
  const button = createElement('button', 'map-pin') as HTMLButtonElement;
  button.type = 'button';
  button.style.setProperty('--pin-color', category.color);
  button.style.setProperty('--pin-index', String(Math.min(rank - 1, 12)));
  button.setAttribute('aria-label', `${rank}. ${place.title}, ${category.label}`);
  button.setAttribute('aria-pressed', 'false');

  const photo = createElement('span', `map-pin-photo tone-${place.placeholderTone}`);
  photo.append(createElement('span', 'map-pin-initial', place.title.charAt(0)));
  if (place.photo) {
    const image = document.createElement('img');
    image.src = place.photo.marker;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => photo.classList.add('has-image'));
    image.addEventListener('error', () => image.remove());
    photo.append(image);
  }
  const frame = createElement('span', 'map-pin-frame');
  frame.append(photo);

  const body = createElement('span', 'map-pin-body');
  body.append(createElement('span', 'map-pin-tail'), frame, createElement('span', 'map-pin-rank', String(rank)));

  const label = createElement('span', 'map-pin-label');
  label.setAttribute('aria-hidden', 'true');
  label.append(createElement('small', '', category.label), createElement('strong', '', place.title));

  button.append(createElement('span', 'map-pin-ground'), body, label);
  return button;
}

function createCityMarker(city: CuratedCity) {
  const button = createElement('button', 'map-city') as HTMLButtonElement;
  button.type = 'button';
  button.dataset.cityId = city.id;
  button.setAttribute('aria-label', `Open the ${city.name} guide, ${city.places.length} curated places`);

  const dot = createElement('span', 'map-city-dot');
  dot.innerHTML = PIN_ICON_SVG;

  const card = createElement('span', 'map-city-card');
  card.setAttribute('aria-hidden', 'true');
  const copy = createElement('span', 'map-city-copy');
  copy.append(
    createElement('strong', '', city.name),
    createElement('small', '', `${city.places.length} curated places`)
  );
  const arrow = createElement('span', 'map-city-arrow');
  arrow.innerHTML = CHEVRON_SVG;
  card.append(copy, arrow);

  button.append(createElement('span', 'map-city-pulse'), dot, card);
  return button;
}

function PlaceMarker({ place, rank, selected, dimmed, onSelect }: {
  place: CuratedPlace;
  rank: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const category = CATEGORY_META[place.category];
  return (
    <button
      type="button"
      className={`map-pin${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
      style={{ '--pin-color': category.color, '--pin-index': String(Math.min(rank - 1, 12)) } as CSSProperties}
      aria-label={`${rank}. ${place.title}, ${category.label}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="map-pin-ground" />
      <span className="map-pin-body">
        <span className="map-pin-tail" />
        <span className="map-pin-frame">
          <span className={`map-pin-photo tone-${place.placeholderTone}`}>
            <span className="map-pin-initial">{place.title.charAt(0)}</span>
            {place.photo ? (
              <img
                src={place.photo.marker}
                alt=""
                loading="lazy"
                decoding="async"
                onLoad={(event) => event.currentTarget.parentElement?.classList.add('has-image')}
                onError={(event) => event.currentTarget.remove()}
              />
            ) : null}
          </span>
        </span>
        <span className="map-pin-rank">{rank}</span>
      </span>
      <span className="map-pin-label" aria-hidden="true">
        <small>{category.label}</small>
        <strong>{place.title}</strong>
      </span>
    </button>
  );
}

function CityMarker({ city, onSelect }: { city: CuratedCity; onSelect: () => void }) {
  return (
    <button type="button" className="map-city" aria-label={`Open the ${city.name} guide, ${city.places.length} curated places`} onClick={onSelect}>
      <span className="map-city-pulse" />
      <span className="map-city-dot"><Icon name="pin" /></span>
      <span className="map-city-card" aria-hidden="true">
        <span className="map-city-copy"><strong>{city.name}</strong><small>{city.places.length} curated places</small></span>
        <span className="map-city-arrow"><Icon name="chevron-right" /></span>
      </span>
    </button>
  );
}

function PlaceVisual({
  place,
  cityName,
  detail = false,
  photoIndex = 0,
  onOpen
}: {
  place: CuratedPlace;
  cityName: string;
  detail?: boolean;
  photoIndex?: number;
  onOpen?: () => void;
}) {
  const photo = place.photos[photoIndex] ?? place.photo;
  const photoCount = place.photos.length;
  const content = photo ? (
    <>
      <span className="photo-placeholder-copy photo-fallback" aria-hidden="true">
        <Icon name="image" />
        {detail && <span>Photo unavailable</span>}
      </span>
      <img
        key={photo.src}
        src={detail ? photo.src : photo.thumb}
        alt={detail ? `${place.title} in ${cityName}` : ''}
        loading={detail ? 'eager' : 'lazy'}
        onError={(event) => { event.currentTarget.hidden = true; }}
      />
    </>
  ) : (
    <span className="photo-placeholder-copy">
      <Icon name="image" />
      {detail && <span>Photo coming soon</span>}
    </span>
  );

  if (detail && photo && onOpen) {
    return (
      <button className={`place-visual detail-visual tone-${place.placeholderTone}`} type="button" onClick={onOpen} aria-label={`Open photo ${photoIndex + 1} of ${photoCount} of ${place.title} full screen`}>
        {content}
        <span className="photo-expand-label">{photoCount > 1 ? `${photoIndex + 1} / ${photoCount} — View photos` : 'View photo'}</span>
      </button>
    );
  }

  return <span className={`place-visual ${detail ? 'detail-visual' : ''} tone-${place.placeholderTone}`}>{content}</span>;
}

function PhotoCarousel({
  place,
  cityName,
  index,
  onIndexChange,
  onOpen
}: {
  place: CuratedPlace;
  cityName: string;
  index: number;
  onIndexChange: (index: number) => void;
  onOpen: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; axis: 'x' | 'y' | null } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const count = place.photos.length;

  const step = (delta: number) => onIndexChange((index + delta + count) % count);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: null };
    suppressClickRef.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'x') event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.axis !== 'x') return;
    suppressClickRef.current = true;
    const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    setDragOffset(atEdge ? dx / 3 : dx);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.axis !== 'x') return;
    const width = viewportRef.current?.clientWidth ?? 1;
    const dx = event.clientX - drag.startX;
    const threshold = Math.min(width * 0.18, 70);
    if (dx < -threshold && index < count - 1) onIndexChange(index + 1);
    else if (dx > threshold && index > 0) onIndexChange(index - 1);
    setDragOffset(0);
  };

  return (
    <div
      className="detail-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Photos of ${place.title}`}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      }}
    >
      <div
        ref={viewportRef}
        className="carousel-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          suppressClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div
          className={`carousel-track ${dragOffset ? 'is-dragging' : ''}`}
          style={{ transform: `translate3d(calc(${-index * 100}% + ${dragOffset}px), 0, 0)` }}
        >
          {place.photos.map((photo, photoIndex) => (
            <div
              key={photo.page || photo.src}
              className="carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${photoIndex + 1} of ${count}`}
              aria-hidden={photoIndex !== index}
            >
              <PlaceVisual place={place} cityName={cityName} detail photoIndex={photoIndex} onOpen={photoIndex === index ? onOpen : undefined} />
            </div>
          ))}
        </div>
      </div>
      <button className="carousel-nav is-prev" type="button" onClick={() => step(-1)} aria-label="Previous photo"><Icon name="chevron-left" /></button>
      <button className="carousel-nav is-next" type="button" onClick={() => step(1)} aria-label="Next photo"><Icon name="chevron-right" /></button>
      <div className="carousel-dots" aria-hidden="true">
        {place.photos.map((photo, photoIndex) => (
          <i key={photo.page || photo.src} className={photoIndex === index ? 'is-active' : ''} />
        ))}
      </div>
    </div>
  );
}

export function DesktopMapScreen({ routeBase: routeBaseProp = '' }: DesktopMapScreenProps) {
  const inferredRouteBase = window.location.pathname === '/design-1' || window.location.pathname.startsWith('/design-1/')
    ? '/design-1'
    : '';
  const routeBase = normalizeRouteBase(routeBaseProp || inferredRouteBase);
  const mapRef = useRef<MapboxMap | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelMode, setPanelMode] = useState<PanelMode>('list');
  const [sheetLevel, setSheetLevel] = useState<SheetLevel>('half');
  const [activeCityId, setActiveCityId] = useState(DEFAULT_CITY_ID);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [isOnline, setIsOnline] = useState(true);

  const activeCity = CITY_BY_ID[activeCityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
  const places = activeCity?.places ?? [];

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );
  const [photoIndex, setPhotoIndex] = useState(0);
  const selectedPhotos = selectedPlace?.photos ?? [];
  const selectedPhoto = selectedPhotos[photoIndex] ?? selectedPlace?.photo;
  const stepPhoto = useCallback((delta: number) => {
    setPhotoIndex((current) => (selectedPhotos.length ? (current + delta + selectedPhotos.length) % selectedPhotos.length : 0));
  }, [selectedPhotos.length]);

  useEffect(() => { setPhotoIndex(0); }, [selectedPlaceId]);

  const normalizedPlaceQuery = normalizeSearch(placeQuery.trim());
  const queryMatchIds = useMemo(() => {
    if (!normalizedPlaceQuery) return null;
    return new Set(places
      .filter((place) => normalizeSearch([place.title, place.area, place.architect, CATEGORY_META[place.category].label].filter(Boolean).join(' ')).includes(normalizedPlaceQuery))
      .map((place) => place.id));
  }, [normalizedPlaceQuery, places]);

  const visiblePlaces = useMemo(
    () => places.filter((place) => (activeCategory === 'all' || place.category === activeCategory) && (!queryMatchIds || queryMatchIds.has(place.id))),
    [activeCategory, places, queryMatchIds]
  );

  const availableFilters = useMemo(
    () => CATEGORY_FILTERS.filter((filter) => filter.value === 'all' || places.some((place) => place.category === filter.value)),
    [places]
  );

  const guideCopy = useMemo(
    () => activeCity ? cityGuideCopy(activeCity, activeCategory) : { eyebrow: '', title: '', summary: '' },
    [activeCategory, activeCity]
  );

  const showCities = useCallback(() => {
    setPanelMode('cities');
    setSelectedPlaceId(null);
    setIsPanelOpen(true);
    setSheetLevel(window.innerWidth < 1024 ? 'full' : 'half');
    const nextPath = citiesPath(routeBase);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    mapRef.current?.easeTo({ ...EUROPE_OVERVIEW, padding: getMapPadding(true), duration: 650 });
  }, [routeBase]);

  const showList = useCallback(() => {
    setPanelMode('list');
    setSelectedPlaceId(null);
    const city = CITY_BY_ID[activeCityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
    const nextPath = cityPath(routeBase, city.id);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    mapRef.current?.easeTo({ ...cityCamera(city), padding: getMapPadding(true), duration: 520 });
  }, [activeCityId, routeBase]);

  const selectCity = useCallback((city: CuratedCity) => {
    localStorage.setItem('archi2go-city', city.id);
    setActiveCityId(city.id);
    setPanelMode('list');
    setSelectedPlaceId(null);
    setIsPanelOpen(true);
    setSheetLevel('half');
    setPlaceQuery('');
    setActiveCategory('all');
    const nextPath = cityPath(routeBase, city.id);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    mapRef.current?.easeTo({ ...cityCamera(city), padding: getMapPadding(true), duration: 900 });
  }, [routeBase]);

  const selectPlace = useCallback((place: CuratedPlace) => {
    const map = mapRef.current;
    const city = CITY_BY_ID[activeCityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
    setSelectedPlaceId(place.id);
    setPanelMode('detail');
    setIsPanelOpen(true);
    setSheetLevel('half');
    const nextPath = placePath(routeBase, city.id, place.id);
    if (window.location.pathname !== nextPath) window.history.pushState({ placeId: place.id }, '', nextPath);
    map?.easeTo({
      center: place.coordinates,
      zoom: Math.max(map.getZoom(), 15.1),
      pitch: window.innerWidth < 1024 ? 38 : 54,
      duration: 650,
      padding: getMapPadding(true)
    });
  }, [activeCityId, routeBase]);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    const applyPath = () => {
      const route = parseRoute(routeBase);

      if (route.mode === 'cities') {
        setSelectedPlaceId(null);
        setPanelMode('cities');
        setIsPanelOpen(true);
        setSheetLevel(window.innerWidth < 1024 ? 'full' : 'half');
        mapRef.current?.easeTo({ ...EUROPE_OVERVIEW, padding: getMapPadding(true), duration: 650 });
        return;
      }

      if (route.mode === 'detail' && route.cityId && route.placeId) {
        setActiveCityId(route.cityId);
        setSelectedPlaceId(route.placeId);
        setPanelMode('detail');
        setIsPanelOpen(true);
        return;
      }

      if (route.mode === 'list' && route.cityId) {
        setActiveCityId(route.cityId);
        setSelectedPlaceId(null);
        setPanelMode('list');
        const city = CITY_BY_ID[route.cityId];
        const map = mapRef.current;
        if (city && map && map.getZoom() < 9) {
          map.easeTo({ ...cityCamera(city), padding: getMapPadding(true), duration: 900 });
        }
        return;
      }

      const savedCityId = localStorage.getItem('archi2go-city');
      const fallbackId = savedCityId && CITY_BY_ID[savedCityId] ? savedCityId : DEFAULT_CITY_ID;
      setActiveCityId(fallbackId);
      setSelectedPlaceId(null);
      setPanelMode('list');
      const baseLandingPath = routeBase || '/';
      if (window.location.pathname === baseLandingPath) {
        window.history.replaceState({}, '', cityPath(routeBase, fallbackId));
      }
    };

    applyPath();
    window.addEventListener('popstate', applyPath);
    return () => window.removeEventListener('popstate', applyPath);
  }, [routeBase]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (modal === 'photo' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault();
        stepPhoto(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => {
      modalCloseRef.current?.focus();
    });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, stepPhoto]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.easeTo({ padding: getMapPadding(isPanelOpen), duration: 320 });
  }, [isPanelOpen, mapReady, sheetLevel]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024 && !isPanelOpen) setIsPanelOpen(true);
      mapRef.current?.setPadding(getMapPadding(isPanelOpen));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isPanelOpen]);

  const cycleSheet = () => {
    setSheetLevel((current) => current === 'collapsed' ? 'half' : current === 'half' ? 'full' : 'half');
  };

  const closePanel = () => {
    if (window.innerWidth < 1024) setSheetLevel('collapsed');
    else setIsPanelOpen(false);
  };

  const isListFiltered = activeCategory !== 'all' || Boolean(queryMatchIds);
  const resetListFilters = () => {
    setActiveCategory('all');
    setPlaceQuery('');
  };
  const categoryCount = (category: CategoryFilter) => category === 'all'
    ? places.length
    : places.filter((place) => place.category === category).length;
  const initialRoute = parseRoute(routeBase);
  const initialCity = CITY_BY_ID[initialRoute.cityId ?? DEFAULT_CITY_ID] ?? CITY_BY_ID[DEFAULT_CITY_ID];

  if (!activeCity) {
    return (
      <main className="map-app-shell design-variant-one">
        <div className="map-state-card" role="alert">
          <strong>No city guides found</strong>
          <span>Add city JSON files under <code>src/top</code>.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="map-app-shell design-variant-one">
      <div className="map-canvas" role="region" aria-label={`Map of curated places in ${activeCity.name}`}>
        {MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAPBOX_STYLE}
            initialViewState={{
              longitude: initialRoute.mode === 'cities' ? EUROPE_OVERVIEW.center[0] : initialCity.center[0],
              latitude: initialRoute.mode === 'cities' ? EUROPE_OVERVIEW.center[1] : initialCity.center[1],
              zoom: initialRoute.mode === 'cities' ? EUROPE_OVERVIEW.zoom : CITY_ZOOM,
              pitch: initialRoute.mode === 'cities' ? 0 : 44,
              bearing: initialRoute.mode === 'cities' ? 0 : -11,
              padding: getMapPadding(true)
            }}
            attributionControl={false}
            logoPosition="bottom-right"
            antialias={false}
            failIfMajorPerformanceCaveat={false}
            maxPitch={70}
            reuseMaps
            config={{
              basemap: {
                lightPreset: 'day',
                showPointOfInterestLabels: false,
                showPlaceLabels: true,
                showRoadLabels: true,
                showTransitLabels: true
              }
            }}
            onLoad={(event) => {
              mapRef.current = event.target;
              event.target.setPadding(getMapPadding(true));
              setMapReady(true);
              setMapError(null);
            }}
            onError={(event) => {
              if (!mapRef.current) setMapError(event.error?.message ?? 'The map could not be loaded.');
              else console.warn('Mapbox error', event.error);
            }}
          >
            <AttributionControl compact={false} position="bottom-right" />
            {panelMode === 'cities'
              ? CITIES.map((city) => (
                  <Marker key={city.id} longitude={city.center[0]} latitude={city.center[1]} anchor="center" occludedOpacity={1} style={{ zIndex: 2 }}>
                    <CityMarker city={city} onSelect={() => selectCity(city)} />
                  </Marker>
                ))
              : places.map((place, index) => {
                  const selected = place.id === selectedPlaceId;
                  const filtered = (activeCategory !== 'all' && place.category !== activeCategory) || Boolean(queryMatchIds && !queryMatchIds.has(place.id));
                  if (filtered && !selected) return null;
                  return (
                    <Marker key={place.id} longitude={place.coordinates[0]} latitude={place.coordinates[1]} anchor="bottom" occludedOpacity={1} style={{ zIndex: selected ? 4 : 1 }}>
                      <PlaceMarker place={place} rank={index + 1} selected={selected} dimmed={Boolean(selectedPlaceId) && !selected} onSelect={() => selectPlace(place)} />
                    </Marker>
                  );
                })}
          </Map>
        ) : null}
      </div>

      <header className="mobile-map-header">
        <Archi2goLogo />
        <button className="mobile-city-button" type="button" onClick={showCities} aria-label="Choose a city">
          <Icon name="pin" />
          {panelMode === 'cities' ? 'All cities' : activeCity.name}
          <Icon name="chevron-down" />
        </button>
      </header>

      {!MAPBOX_TOKEN && (
        <div className="map-state-card" role="status">
          <strong>Map preview is unavailable</strong>
          <span>Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to <code>.env</code>. The curated list remains available.</span>
        </div>
      )}
      {MAPBOX_TOKEN && !mapReady && !mapError && (
        <div className="map-loading" role="status"><span /> Loading {activeCity.name} map…</div>
      )}
      {mapError && MAPBOX_TOKEN && (
        <div className="map-state-card map-state-error" role="alert">
          <strong>The map could not be loaded</strong>
          <span>{mapError}</span>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      {!isOnline && <div className="offline-banner" role="status">You are offline — showing saved content</div>}

      <aside
        className={`places-panel ${isPanelOpen ? 'is-open' : 'is-closed'}`}
        data-sheet-level={sheetLevel}
        aria-label={panelMode === 'cities' ? 'Choose a city' : panelMode === 'list' ? `Places in ${activeCity.name}` : selectedPlace?.title ?? 'Place details'}
      >
        <button className="collapsed-panel-card" type="button" onClick={() => setIsPanelOpen(true)} aria-label="Open Archi2go places panel" aria-expanded={isPanelOpen}>
          <span className="collapsed-brand-mark"><Archi2goLogo /></span>
          <span className="collapsed-panel-copy">
            <small>{panelMode === 'cities' ? 'Archi2go guides' : `${activeCity.name} guide`}</small>
            <strong>{panelMode === 'cities' ? 'Choose your next city' : `${places.length} curated places`}</strong>
          </span>
          <span className="collapsed-panel-arrow" aria-hidden="true"><Icon name="chevron-right" /></span>
        </button>

        <div
          className="expanded-panel-content"
          ref={(element) => { if (element) element.inert = !isPanelOpen; }}
          aria-hidden={!isPanelOpen}
        >
          <button
            className="sheet-handle-button"
            type="button"
            onClick={cycleSheet}
            aria-label={sheetLevel === 'collapsed' ? 'Expand places panel' : sheetLevel === 'full' ? 'Reduce places panel' : 'Expand places panel fully'}
            aria-expanded={sheetLevel !== 'collapsed'}
          >
            <span className="sheet-handle" />
            <span className="sheet-summary">
              <strong>{panelMode === 'cities' ? 'Choose a city' : panelMode === 'detail' && selectedPlace ? selectedPlace.title : `${places.length} places worth a detour`}</strong>
              <small>{panelMode === 'cities' ? 'Independent city guides' : panelMode === 'detail' && selectedPlace ? CATEGORY_META[selectedPlace.category].label : `Curated for ${activeCity.name}`}</small>
            </span>
            <Icon name={sheetLevel === 'full' ? 'chevron-down' : 'chevron-up'} />
          </button>

          <div className="desktop-panel-header">
            <Archi2goLogo />
            <div className="panel-header-actions">
              <button className="icon-button" type="button" onClick={() => setModal('about')} aria-label="About Archi2go"><Icon name="info" /></button>
              <button className="quiet-button" type="button" onClick={closePanel} aria-label="Collapse places panel" aria-expanded={isPanelOpen}>
                <Icon name="chevron-left" />
                Hide
              </button>
            </div>
          </div>

          <div className="panel-scroll">
            {panelMode === 'cities' && (
              <section className="cities-view" aria-labelledby="cities-title">
                <button className="back-button cities-back" type="button" onClick={showList}>
                  <Icon name="arrow-left" />
                  Back to {activeCity.name}
                </button>

                <div className="cities-heading">
                  <span className="eyebrow">Independent city guides</span>
                  <h1 id="cities-title">Where do you want to look?</h1>
                  <p>Pick one of the cities we have researched. Every place is selected and written by hand.</p>
                </div>

                <div className="city-catalog" aria-label="Available cities">
                  {CITIES.map((city) => (
                    <button key={city.id} className="city-guide-card is-available" type="button" onClick={() => selectCity(city)}>
                      <span className="city-guide-art" style={{ background: city.art }} aria-hidden="true">
                        {city.cover ? <img src={city.cover.thumb} alt="" loading="lazy" /> : <span className="city-guide-letter">{city.name.charAt(0)}</span>}
                        <span className="city-guide-pin"><Icon name="pin" /></span>
                      </span>
                      <span className="city-guide-copy">
                        <span className="city-guide-kicker"><i /> Available now</span>
                        <strong>{city.name}</strong>
                        <span>{city.country}, {city.places.length} curated places</span>
                        <small>Architecture, gardens and city stories</small>
                      </span>
                      <span className="city-guide-arrow" aria-hidden="true"><Icon name="chevron-right" /></span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {panelMode === 'list' && (
              <div className="list-view">
              <button className="back-button list-back" type="button" onClick={showCities}>
                <Icon name="arrow-left" />
                All cities
              </button>

              <div className="panel-heading">
                <span className="eyebrow">{guideCopy.eyebrow}</span>
                <h1>{guideCopy.title}</h1>
                {guideCopy.summary ? <p>{guideCopy.summary}</p> : null}
              </div>

              <label className="place-search">
                <span className="sr-only">Search places in {activeCity.name}</span>
                <Icon name="search" />
                <input
                  type="search"
                  value={placeQuery}
                  onChange={(event) => setPlaceQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Escape' && placeQuery) { event.stopPropagation(); setPlaceQuery(''); } }}
                  placeholder={`Search ${places.length} places in ${activeCity.name}`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {placeQuery && (
                  <button className="place-search-clear" type="button" onClick={() => setPlaceQuery('')} aria-label="Clear search">
                    <Icon name="close" />
                  </button>
                )}
              </label>

              <section className="category-filter-block" aria-labelledby="category-filter-title">
                <div className="category-filter-head">
                  <h2 id="category-filter-title">Categories</h2>
                  <p role="status" aria-atomic="true">
                    {isListFiltered
                      ? `${visiblePlaces.length} of ${places.length} places`
                      : `All ${places.length} places`}
                  </p>
                  <button
                    className={`category-reset${isListFiltered ? ' is-visible' : ''}`}
                    type="button"
                    onClick={resetListFilters}
                    tabIndex={isListFiltered ? 0 : -1}
                    aria-hidden={!isListFiltered}
                  >
                    Show all
                  </button>
                </div>

                <div className="category-share" role="group" aria-label="Filter by category share">
                  {availableFilters.filter((filter) => filter.value !== 'all').map((filter) => {
                    const count = categoryCount(filter.value);
                    const isActive = activeCategory === filter.value;
                    const color = CATEGORY_META[filter.value as PlaceCategory].color;
                    return (
                      <button
                        key={filter.value}
                        type="button"
                        className={activeCategory !== 'all' && !isActive ? 'is-muted' : isActive ? 'is-active' : ''}
                        style={{ flexGrow: Math.max(count, 1), '--share-color': color } as CSSProperties}
                        aria-pressed={isActive}
                        aria-label={`${filter.label}, ${count} places`}
                        onClick={() => setActiveCategory(isActive ? 'all' : filter.value)}
                      >
                        <span className="category-share-fill" />
                        <span className="category-share-tip">
                          <small>{filter.label}</small>
                          <strong>{count}</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="category-filters" role="group" aria-labelledby="category-filter-title">
                  {availableFilters.map((filter) => {
                    const isActive = activeCategory === filter.value;
                    const color = filter.value === 'all' ? 'var(--ink)' : CATEGORY_META[filter.value].color;
                    return (
                      <button
                        key={filter.value}
                        className={`${isActive ? 'is-active' : ''} ${filter.value === 'all' ? 'is-all' : ''}`}
                        style={{ '--chip-color': color } as CSSProperties}
                        type="button"
                        onClick={() => setActiveCategory(filter.value)}
                        aria-pressed={isActive}
                      >
                        {filter.value !== 'all' && <i aria-hidden="true" />}
                        <b>{filter.label}</b>
                        <span>{categoryCount(filter.value)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <ol className="place-list">
                {visiblePlaces.map((place) => {
                  const rank = places.findIndex((item) => item.id === place.id) + 1;
                  return (
                    <li key={place.id}>
                      <button
                        className="place-card"
                        onClick={() => selectPlace(place)}
                        type="button"
                        aria-label={`Open ${place.title}, ${CATEGORY_META[place.category].label}`}
                      >
                        <PlaceVisual place={place} cityName={activeCity.name} />
                        <span className="place-copy">
                          <span className="place-index">{String(rank).padStart(2, '0')}</span>
                          <span className="place-category">
                            <i style={{ backgroundColor: CATEGORY_META[place.category].color }} />
                            {CATEGORY_META[place.category].label}
                          </span>
                          <strong>{place.title}</strong>
                          <span className="place-meta">{[place.architect, place.year, place.area].filter(Boolean).join(', ')}</span>
                          <span className="place-why">{place.why}</span>
                        </span>
                        <span className="card-arrow" aria-hidden="true"><Icon name="chevron-right" /></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {visiblePlaces.length === 0 ? (
                <div className="place-search-empty" role="status">
                  <strong>No places match “{placeQuery.trim()}”</strong>
                  <span>Try a place name, an architect or a neighbourhood.</span>
                  <button type="button" onClick={resetListFilters}>Show all places</button>
                </div>
              ) : (
                <p className="list-end">
                  {queryMatchIds
                    ? `${visiblePlaces.length} ${visiblePlaces.length === 1 ? 'place matches' : 'places match'} your search.`
                    : activeCategory === 'all'
                      ? `That’s the complete ${activeCity.name} selection for now.`
                      : `${visiblePlaces.length} ${visiblePlaces.length === 1 ? 'place' : 'places'} in this category.`}
                </p>
              )}
              </div>
            )}

            {panelMode === 'detail' && selectedPlace && (
              <article className="detail-view">
              <div className="detail-toolbar">
                <button className="back-button" type="button" onClick={showList}>
                  <Icon name="arrow-left" />
                  All places
                </button>
                <button className="icon-button mobile-close-sheet" type="button" onClick={closePanel} aria-label="Collapse place details"><Icon name="chevron-down" /></button>
              </div>

              {selectedPhotos.length > 1 ? (
                <PhotoCarousel
                  key={selectedPlace.id}
                  place={selectedPlace}
                  cityName={activeCity.name}
                  index={photoIndex}
                  onIndexChange={setPhotoIndex}
                  onOpen={() => setModal('photo')}
                />
              ) : (
                <PlaceVisual place={selectedPlace} cityName={activeCity.name} detail onOpen={() => setModal('photo')} />
              )}
              {selectedPhoto && (
                <p className="photo-credit">
                  Photo: <a href={selectedPhoto.page} target="_blank" rel="noreferrer">{selectedPhoto.author}</a>
                  {', '}
                  <a href={selectedPhoto.licenseUrl} target="_blank" rel="noreferrer">{selectedPhoto.license}</a>
                </p>
              )}

              <div className="detail-copy">
                <span className="place-category detail-category">
                  <i style={{ backgroundColor: CATEGORY_META[selectedPlace.category].color }} />
                  {CATEGORY_META[selectedPlace.category].label}
                </span>
                <h1>{selectedPlace.title}</h1>
                <dl className="place-facts">
                  {selectedPlace.architect && <div><dt>Architect</dt><dd>{selectedPlace.architect}</dd></div>}
                  {selectedPlace.year && <div><dt>Year</dt><dd>{selectedPlace.year}</dd></div>}
                  {selectedPlace.area && <div><dt>Area</dt><dd>{selectedPlace.area}</dd></div>}
                </dl>
                <p className="place-story">{selectedPlace.why}</p>
                <a className="primary-action" href={googleMapsUrl(selectedPlace)} target="_blank" rel="noreferrer">
                  <Icon name="external" />
                  Open in Google Maps
                </a>
              </div>

              {selectedPlace.sources.length > 0 && (
                <div className="read-more">
                  <h2>Read more</h2>
                  <ul>
                    {selectedPlace.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noreferrer">{source.label}<Icon name="external" /></a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </article>
            )}
          </div>

          <footer className="panel-legal">
            <a href="/privacy">Privacy policy</a>
            <span>© Archi2go</span>
          </footer>
        </div>
      </aside>

      {modal === 'about' && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section className="app-modal about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <div className="modal-header">
              <Archi2goLogo />
              <button ref={modalCloseRef} className="icon-button" type="button" onClick={() => setModal(null)} aria-label="Close about Archi2go"><Icon name="close" /></button>
            </div>
            <span className="eyebrow">Independent city guides</span>
            <h2 id="about-title">Good places, with a reason to go.</h2>
            <p>Archi2go gathers architecture, public spaces and unusual city stories into one concise map. Every place is thoughtfully selected, researched and presented with a clear reason to visit.</p>
            <div className="about-links"><button type="button" disabled>Contact us</button><a href="/privacy">Privacy policy</a><a href="#credits">Photo credits & sources</a></div>
            <small>Version 1.0 — Map data © OpenStreetMap contributors</small>
          </section>
        </div>
      )}

      {modal === 'photo' && selectedPlace && selectedPhoto && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Photos of ${selectedPlace.title}`}>
          <button ref={modalCloseRef} className="lightbox-close" type="button" onClick={() => setModal(null)} aria-label="Close full-screen photo"><Icon name="close" /></button>
          {selectedPhotos.length > 1 && (
            <>
              <button className="lightbox-nav is-prev" type="button" onClick={() => stepPhoto(-1)} aria-label="Previous photo"><Icon name="chevron-left" /></button>
              <button className="lightbox-nav is-next" type="button" onClick={() => stepPhoto(1)} aria-label="Next photo"><Icon name="chevron-right" /></button>
            </>
          )}
          <img key={selectedPhoto.src} src={selectedPhoto.src} alt={`${selectedPlace.title} in ${activeCity.name}, photo ${photoIndex + 1} of ${selectedPhotos.length}`} />
          <div className="lightbox-footer">
            {selectedPhotos.length > 1 && (
              <div className="lightbox-thumbs" role="group" aria-label="Photos">
                {selectedPhotos.map((photo, index) => (
                  <button
                    key={photo.page || photo.src}
                    className={index === photoIndex ? 'is-active' : ''}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-current={index === photoIndex ? 'true' : undefined}
                  >
                    <img src={photo.marker} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
            <p>
              {selectedPhotos.length > 1 && <span aria-live="polite">{photoIndex + 1} / {selectedPhotos.length} — </span>}
              {selectedPlace.title} — {selectedPhoto.author} — {selectedPhoto.license}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
