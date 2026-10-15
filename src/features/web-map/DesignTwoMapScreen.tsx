import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Map as MapboxMap } from 'mapbox-gl';
import Map, { AttributionControl, Marker, NavigationControl, Popup, useControl } from 'react-map-gl/mapbox';
import './design-two.css';

import { env } from '@shared/config/env';
import { AchetutLogo } from './AchetutLogo';
import {
  CATEGORY_META,
  CITIES,
  CITY_BY_ID,
  DEFAULT_CITY_ID,
  type CuratedCity,
  type CuratedPlace,
  type PlaceCategory,
  type PlacePhoto,
  type PlaceSource
} from './places';

const MAPBOX_TOKEN = env.mapboxAccessToken;
const MAPBOX_STYLE = env.mapboxStyle;
const ROUTE_BASE = '/design-2';
const CITY_ZOOM = 12.35;
const PLACE_ZOOM = 14.6;
const PLACE_3D_ZOOM = 17;
const PLACE_3D_PITCH = 62;
const PLACE_3D_BEARING = -20;
const COMPACT_PIN_ZOOM = 13;
const HOVER_PREVIEW_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 820px)';
const BUILDINGS_3D_MIN_ZOOM = 15.2;
const BUILDINGS_3D_STORAGE_KEY = 'achetut-3d-v2';

const PreviewLoadingContext = createContext(false);

function readPreviewLoading() {
  const value = new URLSearchParams(window.location.search).get('loading');
  return value !== null && value !== '0' && value !== 'false' && value !== 'off';
}

type CategoryFilter = 'all' | PlaceCategory;
type IconName = 'arrow-left' | 'arrow-up-right' | 'check' | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'close' | 'external' | 'location' | 'search';

const SHORTCUT_MODIFIER = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
const LIGHTBOX_WIDTH = 1920;

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'city-core', label: 'City core' },
  { value: 'housing', label: 'Housing' },
  { value: 'parks', label: 'Parks' },
  { value: 'unusual', label: 'Unusual' }
];

const MENTION_FILTERS = [
  { value: 1, label: 'Any' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' }
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    'arrow-left': <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    'arrow-up-right': <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    'chevron-down': <path d="m7 10 5 5 5-5" />,
    'chevron-left': <path d="m15 6-6 6 6 6" />,
    'chevron-right': <path d="m9 6 6 6-6 6" />,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    external: <><path d="M14 5h5v5" /><path d="m10 14 9-9" /><path d="M19 13v6H5V5h6" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>
  };

  return <svg className="v2-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function V2Image({
  src,
  alt = '',
  className,
  loading = 'lazy',
  draggable,
  onReady,
  onFail
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  onReady?: () => void;
  onFail?: () => void;
}) {
  const previewLoading = useContext(PreviewLoadingContext);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    const node = imageRef.current;
    if (node?.complete && node.naturalWidth > 0) setStatus('ready');
  }, [src]);

  if (previewLoading) return <span className="v2-skeleton" aria-hidden="true" />;
  if (!src || status === 'error') return null;

  return (
    <>
      {status === 'loading' ? <span className="v2-skeleton" aria-hidden="true" /> : null}
      <img
        ref={imageRef}
        className={`v2-fade-img${status === 'ready' ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={draggable}
        onLoad={() => {
          setStatus('ready');
          onReady?.();
        }}
        onError={() => {
          setStatus('error');
          onFail?.();
        }}
      />
    </>
  );
}

function PhotoCredit({ photo }: { photo: PlacePhoto }) {
  return (
    <span className="v2-photo-credit" onClick={(event) => event.stopPropagation()}>
      Photo{' '}
      <a href={photo.page} target="_blank" rel="noreferrer">{photo.author || 'Unknown author'}</a>
      {photo.license ? (
        <>
          {' · '}
          {photo.licenseUrl
            ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>
            : photo.license}
        </>
      ) : null}
    </span>
  );
}

function PlaceListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="v2-results-skeleton" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="v2-place-row is-skeleton">
          <span className="v2-place-thumb"><span className="v2-skeleton" /></span>
          <span className="v2-place-copy">
            <span className="v2-skel-line is-kicker" />
            <span className="v2-skel-line is-title" />
            <span className="v2-skel-line is-text" />
            <span className="v2-skel-line is-meta" />
          </span>
        </article>
      ))}
    </div>
  );
}

function CityListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="is-skeleton" aria-hidden="true">
          <span className="v2-city-thumb"><span className="v2-skeleton" /></span>
          <span className="v2-city-option-copy">
            <span className="v2-skel-line is-title" />
            <span className="v2-skel-line is-meta" />
          </span>
          <span className="v2-skel-line is-count" />
        </li>
      ))}
    </>
  );
}

function uniqueSources(sources: PlaceSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.publisher.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Commons only renders a fixed set of thumbnail widths; 1920 is one of them.
function largePhotoUrl(photo: PlacePhoto) {
  const file = photo.page.split('/wiki/File:')[1];
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${LIGHTBOX_WIDTH}` : null;
}

function PhotoLightbox({ place, city, initialIndex = 0, onClose }: { place: CuratedPlace; city: CuratedCity; initialIndex?: number; onClose: () => void }) {
  const previewLoading = useContext(PreviewLoadingContext);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const photos = place.photos;
  const [index, setIndex] = useState(() => Math.min(initialIndex, photos.length - 1));
  const [largeSrc, setLargeSrc] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const photo = photos[index] as PlacePhoto;
  const src = largeSrc[index] ?? (photo.src || photo.thumb);
  const hasMany = photos.length > 1;

  const step = useCallback((delta: number) => {
    setIndex((current) => (current + delta + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const large = largePhotoUrl(photo);
    if (!large || largeSrc[index]) return;
    let cancelled = false;
    const preload = new Image();
    preload.onload = () => { if (!cancelled) setLargeSrc((current) => ({ ...current, [index]: large })); };
    preload.src = large;
    [photos[index + 1], photos[index - 1]].forEach((neighbour) => {
      if (neighbour) new Image().src = neighbour.src || neighbour.thumb;
    });
    return () => { cancelled = true; };
  }, [index, largeSrc, photo, photos]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    if (window.matchMedia('(pointer: coarse)').matches) dialogRef.current?.focus();
    else closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, step]);

  return (
    <div
      ref={dialogRef}
      className="v2-lightbox"
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby="v2-lightbox-title"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <button ref={closeRef} className="v2-lightbox-close" type="button" onClick={onClose} aria-label="Close photo">
        <Icon name="close" />
      </button>
      <figure>
        <div
          className={`v2-lightbox-frame${loaded[src] && !previewLoading ? ' is-loaded' : ''}`}
          onClick={() => {
            if (swipedRef.current) {
              swipedRef.current = false;
              return;
            }
            onClose();
          }}
          onPointerDown={(event) => {
            swipedRef.current = false;
            swipeStartRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = swipeStartRef.current;
            swipeStartRef.current = null;
            if (!start || !hasMany) return;
            const dx = event.clientX - start.x;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
              swipedRef.current = true;
              step(dx < 0 ? 1 : -1);
            }
          }}
        >
          <img
            key={src}
            src={src}
            alt={`${place.title} in ${city.name}, photo ${index + 1} of ${photos.length}`}
            decoding="async"
            onLoad={() => setLoaded((current) => ({ ...current, [src]: true }))}
            onClick={(event) => event.stopPropagation()}
          />
          {hasMany ? <span className="v2-lightbox-counter" aria-live="polite">{index + 1} / {photos.length}</span> : null}
        </div>
        {hasMany ? (
          <div className="v2-lightbox-controls">
            <button className="v2-lightbox-nav is-prev" type="button" onClick={() => step(-1)} aria-label="Previous photo">
              <Icon name="chevron-down" />
            </button>
            <div className="v2-lightbox-thumbs" role="group" aria-label="Photos">
              {photos.map((item, itemIndex) => (
                <button
                  key={item.page || item.src}
                  className={itemIndex === index ? 'is-active' : ''}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`Photo ${itemIndex + 1}`}
                  aria-current={itemIndex === index}
                >
                  <V2Image src={item.marker} />
                </button>
              ))}
            </div>
            <button className="v2-lightbox-nav is-next" type="button" onClick={() => step(1)} aria-label="Next photo">
              <Icon name="chevron-down" />
            </button>
          </div>
        ) : null}
        <figcaption>
          <span className="v2-lightbox-kicker">
            <i style={{ backgroundColor: CATEGORY_META[place.category].color }} />
            {CATEGORY_META[place.category].label} · {city.name}
          </span>
          <strong id="v2-lightbox-title">{place.title}</strong>
          <PhotoCredit photo={photo} />
          {photo.page ? (
            <a className="v2-lightbox-link" href={photo.page} target="_blank" rel="noreferrer">
              Wikimedia Commons <Icon name="external" />
            </a>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}

function CityThumb({ city }: { city: CuratedCity }) {
  const [coverReady, setCoverReady] = useState(false);
  return (
    <span className={`v2-city-thumb${coverReady ? ' has-image' : ''}`} style={{ backgroundColor: city.art }} aria-hidden="true">
      <span>{city.name.charAt(0)}</span>
      <V2Image
        src={city.cover?.thumb}
        onReady={() => setCoverReady(true)}
        onFail={() => setCoverReady(false)}
      />
    </span>
  );
}

function CitySelect({ city, onSelect, onOpen, forceOpen = false, forceLoading = false }: { city: CuratedCity; onSelect: (cityId: string) => void; onOpen?: () => void; forceOpen?: boolean; forceLoading?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [menuReady, setMenuReady] = useState(!forceLoading && !forceOpen);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, CITIES.findIndex((item) => item.id === city.id)));
  const selectedIndex = CITIES.findIndex((item) => item.id === city.id);

  const open = () => {
    setActiveIndex(Math.max(0, selectedIndex));
    setMenuReady(false);
    setIsOpen(true);
    onOpen?.();
  };

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    setMenuReady(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const next = CITIES[index];
    if (next && next.id !== city.id) onSelect(next.id);
    close();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (forceLoading) {
      setMenuReady(false);
      return;
    }
    const urls = CITIES.map((item) => item.cover?.thumb).filter((url): url is string => Boolean(url));
    if (urls.length === 0) {
      setMenuReady(true);
      return;
    }
    let remaining = urls.length;
    let settled = false;
    const finish = () => {
      remaining -= 1;
      if (!settled && remaining <= 0) {
        settled = true;
        setMenuReady(true);
      }
    };
    const images = urls.map((url) => {
      const image = new Image();
      image.onload = finish;
      image.onerror = finish;
      image.src = url;
      if (image.complete && image.naturalWidth > 0) {
        image.onload = null;
        image.onerror = null;
        finish();
      }
      return image;
    });
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        setMenuReady(true);
      }
    }, 900);
    return () => {
      window.clearTimeout(timeout);
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [forceLoading, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (forceLoading || forceOpen) return;
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [forceLoading, forceOpen, isOpen]);

  const scrollOptionIntoMenu = (index: number) => {
    const menu = listRef.current;
    const option = menu?.querySelectorAll<HTMLElement>(':scope > li')[index];
    if (!menu || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  };

  useEffect(() => {
    if (!isOpen || !menuReady) return;
    scrollOptionIntoMenu(selectedIndex);
  }, [isOpen, menuReady, selectedIndex]);

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      open();
    }
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const last = CITIES.length - 1;
    const moveActive = (index: number) => {
      setActiveIndex(index);
      scrollOptionIntoMenu(index);
    };
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(Math.min(last, activeIndex + 1)); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(Math.max(0, activeIndex - 1)); return; }
    if (event.key === 'Home') { event.preventDefault(); moveActive(0); return; }
    if (event.key === 'End') { event.preventDefault(); moveActive(last); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(activeIndex); return; }
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key === 'Tab') { setIsOpen(false); return; }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLocaleLowerCase();
      const start = activeIndex + 1;
      const ordered = [...CITIES.slice(start), ...CITIES.slice(0, start)];
      const match = ordered.find((item) => item.name.toLocaleLowerCase().startsWith(letter));
      if (match) moveActive(CITIES.indexOf(match));
    }
  };

  return (
    <div ref={rootRef} className={`v2-city-select${isOpen ? ' is-open' : ''}`}>
      <span className="v2-visually-hidden" id="v2-city-select-label">City</span>
      <button
        ref={triggerRef}
        className="v2-city-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="v2-city-select-label v2-city-select-value"
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={onTriggerKeyDown}
      >
        <CityThumb city={city} />
        <span className="v2-city-trigger-copy" id="v2-city-select-value">
          <small>{city.country} · {city.places.length} places</small>
          <strong>{city.name}</strong>
        </span>
        <Icon name="chevron-down" />
      </button>
      {city.cover ? <PhotoCredit photo={city.cover} /> : null}

      {isOpen && (
        <ul
          ref={listRef}
          className="v2-city-menu"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="v2-city-select-label"
          aria-busy={!menuReady || forceLoading}
          aria-activedescendant={menuReady ? `v2-city-option-${CITIES[activeIndex]?.id}` : undefined}
          onKeyDown={onListKeyDown}
        >
          {forceLoading || !menuReady ? <CityListSkeleton count={CITIES.length} /> : CITIES.map((item, index) => {
            const isSelected = item.id === city.id;
            return (
              <li
                key={item.id}
                id={`v2-city-option-${item.id}`}
                role="option"
                aria-selected={isSelected}
                className={`${index === activeIndex ? 'is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <CityThumb city={item} />
                <span className="v2-city-option-copy">
                  <strong>{item.name}</strong>
                  <small>{item.country}</small>
                  {item.cover ? <PhotoCredit photo={item.cover} /> : null}
                </span>
                <span className="v2-city-option-count" aria-label={`${item.places.length} places`}>{item.places.length}</span>
                <span className="v2-city-option-check">{isSelected ? <Icon name="check" /> : null}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function cityPath(cityId: string) {
  return `${ROUTE_BASE}/${cityId}`;
}

function placePath(cityId: string, placeId: string) {
  return `${cityPath(cityId)}/${placeId}`;
}

function parseRoute() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const baseIndex = segments.indexOf('design-2');
  const routeCityId = segments[baseIndex + 1] && CITY_BY_ID[segments[baseIndex + 1]]
    ? segments[baseIndex + 1]
    : null;
  const savedCityId = localStorage.getItem('achetut-city-v2');
  const cityId = routeCityId ?? (savedCityId && CITY_BY_ID[savedCityId] ? savedCityId : DEFAULT_CITY_ID);
  const placeId = segments[baseIndex + 2] && CITY_BY_ID[cityId].places.some((place) => place.id === segments[baseIndex + 2])
    ? segments[baseIndex + 2]
    : null;
  return { cityId, placeId };
}

type SheetLevel = 'peek' | 'half' | 'full';
type SheetHeights = Record<SheetLevel, number>;
const SHEET_LEVELS: SheetLevel[] = ['peek', 'half', 'full'];
const MOBILE_QUERY_WIDTH = 820;

function getSheetHeights(viewportHeight: number): SheetHeights {
  if (viewportHeight < 520) {
    return { peek: 124, half: Math.max(124, Math.min(220, viewportHeight - 120)), full: viewportHeight - 16 };
  }
  return {
    peek: 132,
    half: Math.min(520, Math.max(300, Math.round(viewportHeight * 0.5))),
    full: viewportHeight - 64
  };
}

// The map stays usable behind a full sheet, so camera padding never exceeds the half sheet.
function sheetMapPadding(level: SheetLevel, heights: SheetHeights) {
  return Math.min(heights[level], heights.half);
}

let mobileSheetPadding: number | null = null;

function getMapPadding() {
  if (window.innerWidth < MOBILE_QUERY_WIDTH) {
    return {
      top: 24,
      right: 16,
      bottom: mobileSheetPadding ?? sheetMapPadding('half', getSheetHeights(window.innerHeight)),
      left: 16
    };
  }
  return { top: 32, right: 32, bottom: 32, left: 464 };
}

function focusPlaceCamera(map: MapboxMap, place: CuratedPlace, buildings3d: boolean) {
  const padding = getMapPadding();
  if (!buildings3d) {
    map.easeTo({
      center: place.coordinates,
      zoom: Math.max(map.getZoom(), PLACE_ZOOM),
      pitch: 0,
      bearing: 0,
      padding,
      duration: 520
    });
    return;
  }
  const bearing = map.getPitch() > 20 ? map.getBearing() : PLACE_3D_BEARING;
  map.flyTo({
    center: place.coordinates,
    zoom: PLACE_3D_ZOOM,
    pitch: PLACE_3D_PITCH,
    bearing,
    // A tilted building rises above its anchor point, so leave headroom for the silhouette.
    padding: { ...padding, top: padding.top + Math.min(160, Math.round(window.innerHeight * 0.14)) },
    duration: 1400,
    curve: 1.2,
    essential: true
  });
}

function Buildings3DControl({ enabled, active, onToggle }: { enabled: boolean; active: boolean; onToggle: () => void }) {
  const [container] = useState(() => {
    const element = document.createElement('div');
    element.className = 'mapboxgl-ctrl mapboxgl-ctrl-group v2-3d-control';
    return element;
  });
  useControl(() => ({ onAdd: () => container, onRemove: () => container.remove() }), { position: 'top-right' });
  return createPortal(
    <button
      type="button"
      className={`v2-3d-toggle${enabled ? ' is-enabled' : ''}${active ? ' is-active' : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="3D buildings"
      title={!enabled ? 'Show 3D buildings' : active ? 'Hide 3D buildings' : '3D buildings will appear when you zoom in closer'}
    >
      3D
    </button>,
    container
  );
}

function googleMapsUrl(place: CuratedPlace) {
  return `https://www.google.com/maps/search/?api=1&query=${place.coordinates[1]},${place.coordinates[0]}`;
}

function appendTextElement(parent: HTMLElement, tag: string, className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function appendPopupMeta(parent: HTMLElement, label: string, value?: string) {
  if (!value) return;
  const item = document.createElement('div');
  appendTextElement(item, 'dt', '', label);
  appendTextElement(item, 'dd', '', value);
  parent.append(item);
}

const EXPAND_ICON = '<svg class="v2-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="m20 4-6.5 6.5"/><path d="m4 20 6.5-6.5"/></svg>';

const NO_PHOTO_ICON = '<svg class="v2-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M9.5 5H15l1.5 2H19a2 2 0 0 1 2 2v8.5"/><path d="M17 19H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/><path d="M9.9 10.9a3 3 0 0 0 4.2 4.2"/></svg>';

const LOCATION_ICON = '<svg class="v2-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const ARROW_ICON = '<svg class="v2-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

function commonsSearchUrl(place: CuratedPlace, city: CuratedCity) {
  return `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(`${place.title} ${city.name}`)}&title=Special:MediaSearch&type=image`;
}

function createPhotoPlaceholder(place: CuratedPlace, city: CuratedCity) {
  const media = document.createElement('div');
  media.className = 'v2-popup-media is-empty';
  media.style.setProperty('--ph-color', CATEGORY_META[place.category].color);

  const initial = place.title.match(/\p{L}/u)?.[0] ?? CATEGORY_META[place.category].label.charAt(0);
  const mark = appendTextElement(media, 'span', 'v2-popup-empty-mark', initial.toLocaleUpperCase());
  mark.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  copy.className = 'v2-popup-empty-copy';
  const icon = document.createElement('span');
  icon.className = 'v2-popup-empty-icon';
  icon.innerHTML = NO_PHOTO_ICON;
  const text = document.createElement('span');
  appendTextElement(text, 'strong', '', 'No photo yet');
  const link = document.createElement('a');
  link.href = commonsSearchUrl(place, city);
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = 'Search on Wikimedia Commons';
  text.append(link);
  copy.append(icon, text);
  media.append(copy);

  return media;
}

function createPopupContent(place: CuratedPlace, city: CuratedCity, onOpenPhoto: () => void) {
  const root = document.createElement('article');
  root.className = 'v2-popup-card';

  if (!place.photo) {
    root.append(createPhotoPlaceholder(place, city));
  } else {
    const media = document.createElement('button');
    media.className = `v2-popup-media tone-${place.placeholderTone}`;
    media.type = 'button';
    media.setAttribute('aria-label', `Open larger photo of ${place.title}`);
    media.addEventListener('click', onOpenPhoto);
    const image = document.createElement('img');
    image.src = place.photo.src || place.photo.thumb;
    image.alt = `${place.title} in ${city.name}`;
    image.decoding = 'async';
    image.addEventListener('error', () => media.replaceWith(createPhotoPlaceholder(place, city)));
    media.append(image);
    const zoom = document.createElement('span');
    const photoCount = place.photos.length;
    zoom.className = `v2-popup-zoom${photoCount > 1 ? ' has-count' : ''}`;
    zoom.dataset.label = photoCount > 1 ? `${photoCount} photos` : 'Expand';
    zoom.setAttribute('aria-hidden', 'true');
    if (photoCount > 1) media.setAttribute('aria-label', `Open ${photoCount} photos of ${place.title}`);
    zoom.innerHTML = EXPAND_ICON;
    media.append(zoom);
    root.append(media);
  }

  const body = document.createElement('div');
  body.className = 'v2-popup-body';
  const kicker = document.createElement('div');
  kicker.className = 'v2-popup-kicker';
  const dot = document.createElement('i');
  dot.style.backgroundColor = CATEGORY_META[place.category].color;
  kicker.append(dot, document.createTextNode(CATEGORY_META[place.category].label));
  body.append(kicker);
  appendTextElement(body, 'h2', '', place.title);

  const meta = document.createElement('dl');
  meta.className = 'v2-popup-meta';
  appendPopupMeta(meta, 'Architect', place.architect);
  appendPopupMeta(meta, 'Year', place.year);
  appendPopupMeta(meta, 'Area', place.area);
  if (meta.childElementCount) body.append(meta);

  appendTextElement(body, 'p', 'v2-popup-story', place.why);

  root.append(body);

  const mapsLink = document.createElement('a');
  mapsLink.className = 'v2-popup-directions';
  mapsLink.href = googleMapsUrl(place);
  mapsLink.target = '_blank';
  mapsLink.rel = 'noreferrer';
  mapsLink.setAttribute('aria-label', `Open ${place.title} in Google Maps`);
  const pinIcon = document.createElement('span');
  pinIcon.className = 'v2-popup-directions-icon';
  pinIcon.innerHTML = LOCATION_ICON;
  const copy = document.createElement('span');
  copy.className = 'v2-popup-directions-copy';
  appendTextElement(copy, 'strong', '', 'Open in Google Maps');
  appendTextElement(copy, 'small', '', place.area ? `${place.area}, ${city.name}` : city.name);
  const arrow = document.createElement('span');
  arrow.className = 'v2-popup-directions-arrow';
  arrow.innerHTML = ARROW_ICON;
  mapsLink.append(pinIcon, copy, arrow);
  root.append(mapsLink);
  return root;
}

function createPlacePin(place: CuratedPlace) {
  const category = CATEGORY_META[place.category];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'v2-pin';
  button.style.setProperty('--pin-color', category.color);
  button.setAttribute('aria-label', `${place.title}, ${category.label}`);
  button.setAttribute('aria-pressed', 'false');

  const body = document.createElement('span');
  body.className = 'v2-pin-body';
  const tail = document.createElement('span');
  tail.className = 'v2-pin-tail';
  const frame = document.createElement('span');
  frame.className = 'v2-pin-frame';
  const photo = document.createElement('span');
  photo.className = `v2-pin-photo tone-${place.placeholderTone}`;
  appendTextElement(photo, 'span', 'v2-pin-initial', place.title.charAt(0));
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
  frame.append(photo);
  body.append(tail, frame);
  const ground = document.createElement('span');
  ground.className = 'v2-pin-ground';
  button.append(ground, body);
  return button;
}

function V2PlaceMarker({
  place,
  selected,
  highlighted,
  onSelect,
  onHoverChange
}: {
  place: CuratedPlace;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const category = CATEGORY_META[place.category];
  return (
    <button
      type="button"
      className={`v2-pin${selected ? ' is-selected' : ''}${highlighted ? ' is-highlighted' : ''}`}
      style={{ '--pin-color': category.color } as React.CSSProperties}
      aria-label={place.photo
        ? `${place.title}, ${category.label}. Photo by ${place.photo.author || 'unknown author'}${place.photo.license ? `, ${place.photo.license}` : ''}`
        : `${place.title}, ${category.label}`}
      title={place.photo ? `Photo ${place.photo.author || 'Unknown author'}${place.photo.license ? ` · ${place.photo.license}` : ''}` : undefined}
      aria-pressed={selected}
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <span className="v2-pin-ground" />
      <span className="v2-pin-body">
        <span className="v2-pin-tail" />
        <span className="v2-pin-frame">
          <span className={`v2-pin-photo tone-${place.placeholderTone}`}>
            <span className="v2-pin-initial">{place.title.charAt(0)}</span>
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
      </span>
    </button>
  );
}

function PopupPlaceholder({ place, city }: { place: CuratedPlace; city: CuratedCity }) {
  const initial = place.title.match(/\p{L}/u)?.[0] ?? CATEGORY_META[place.category].label.charAt(0);
  return (
    <div className="v2-popup-media is-empty" style={{ '--ph-color': CATEGORY_META[place.category].color } as React.CSSProperties}>
      <span className="v2-popup-empty-mark" aria-hidden="true">{initial.toLocaleUpperCase()}</span>
      <div className="v2-popup-empty-copy">
        <span className="v2-popup-empty-icon"><Icon name="location" /></span>
        <span><strong>No photo yet</strong><a href={commonsSearchUrl(place, city)} target="_blank" rel="noreferrer">Search on Wikimedia Commons</a></span>
      </div>
    </div>
  );
}

function HoverPreview({ place }: { place: CuratedPlace }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const category = CATEGORY_META[place.category];
  const meta = [place.architect, place.year].filter(Boolean).join(' · ');
  return (
    <div className="v2-hover-card">
      <span className={`v2-hover-thumb tone-${place.placeholderTone}`} aria-hidden="true">
        {place.photo && !photoFailed
          ? <V2Image src={place.photo.thumb || place.photo.marker} onFail={() => setPhotoFailed(true)} />
          : place.title.charAt(0)}
      </span>
      <span className="v2-hover-copy">
        <small><i style={{ backgroundColor: category.color }} />{category.label}</small>
        <strong>{place.title}</strong>
        {meta ? <span>{meta}</span> : null}
        {place.photo && !photoFailed ? <PhotoCredit photo={place.photo} /> : null}
      </span>
    </div>
  );
}

function PlaceDetail({
  place,
  city,
  rank,
  onBack,
  onOpenPhoto
}: {
  place: CuratedPlace;
  city: CuratedCity;
  rank: number;
  onBack: () => void;
  onOpenPhoto: (index: number) => void;
}) {
  const backRef = useRef<HTMLButtonElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; axis: 'x' | 'y' | null } | null>(null);
  const suppressClickRef = useRef(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Record<number, boolean>>({});
  const [dragOffset, setDragOffset] = useState(0);
  const [thumbOverflow, setThumbOverflow] = useState({ start: false, end: false });
  const photos = place.photos;
  const photoCount = photos.length;
  const photo = photos[photoIndex];
  const showPhoto = Boolean(photo) && !failedPhotos[photoIndex];
  const hasGallery = photoCount > 1;
  const category = CATEGORY_META[place.category];
  const publishers = uniqueSources(place.sources);

  const updateThumbOverflow = useCallback(() => {
    const el = thumbsRef.current;
    if (!el) return;
    setThumbOverflow({
      start: el.scrollLeft > 6,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 6
    });
  }, []);

  const stepPhoto = useCallback((delta: number) => {
    setPhotoIndex((current) => Math.min(photoCount - 1, Math.max(0, current + delta)));
  }, [photoCount]);

  useEffect(() => {
    // A list click unmounts the clicked row; keep keyboard focus inside the panel.
    if (!document.activeElement || document.activeElement === document.body) backRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    updateThumbOverflow();
    const onScroll = () => updateThumbOverflow();
    el.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(updateThumbOverflow);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [photoCount, updateThumbOverflow]);

  useEffect(() => {
    thumbsRef.current?.querySelector<HTMLElement>('.is-active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    const frame = requestAnimationFrame(updateThumbOverflow);
    return () => cancelAnimationFrame(frame);
  }, [photoIndex, updateThumbOverflow]);

  return (
    <>
      <div className="v2-detail-bar">
        <button ref={backRef} className="v2-detail-back" type="button" onClick={onBack}>
          <Icon name="arrow-left" />
          <span>All places</span>
        </button>
        <span className="v2-detail-city">{city.name}</span>
      </div>

      <article className="v2-detail" aria-labelledby="v2-detail-title">
        {showPhoto && photo ? (
          hasGallery ? (
            <div
              className="v2-detail-carousel"
              role="region"
              aria-roledescription="carousel"
              aria-label={`Photos of ${place.title}`}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                stepPhoto(event.key === 'ArrowRight' ? 1 : -1);
              }}
            >
              <div
                ref={viewportRef}
                className="v2-detail-viewport"
                onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
                  if (event.pointerType === 'mouse' && event.button !== 0) return;
                  dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: null };
                  suppressClickRef.current = false;
                }}
                onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) => {
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
                  const atEdge = (photoIndex === 0 && dx > 0) || (photoIndex === photoCount - 1 && dx < 0);
                  setDragOffset(atEdge ? dx / 3 : dx);
                }}
                onPointerUp={(event: ReactPointerEvent<HTMLDivElement>) => {
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  dragRef.current = null;
                  if (drag.axis !== 'x') return;
                  const width = viewportRef.current?.clientWidth ?? 1;
                  const dx = event.clientX - drag.startX;
                  const threshold = Math.min(width * 0.18, 70);
                  if (dx < -threshold && photoIndex < photoCount - 1) stepPhoto(1);
                  else if (dx > threshold && photoIndex > 0) stepPhoto(-1);
                  setDragOffset(0);
                }}
                onPointerCancel={() => { dragRef.current = null; setDragOffset(0); }}
                onClickCapture={(event) => {
                  if (!suppressClickRef.current) return;
                  suppressClickRef.current = false;
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <div
                  className={`v2-detail-track${dragOffset ? ' is-dragging' : ''}`}
                  style={{ transform: `translate3d(calc(${-photoIndex * 100}% + ${dragOffset}px), 0, 0)` }}
                >
                  {photos.map((item, index) => (
                    <button
                      key={item.page || index}
                      className={`v2-detail-media v2-detail-slide tone-${place.placeholderTone}`}
                      type="button"
                      tabIndex={index === photoIndex ? 0 : -1}
                      onClick={() => onOpenPhoto(index)}
                      aria-label={`Open photo ${index + 1} of ${photoCount} of ${place.title}`}
                      aria-hidden={index !== photoIndex}
                    >
                      {failedPhotos[index] ? (
                        <span className="v2-detail-slide-fallback">{place.title.charAt(0)}</span>
                      ) : (
                        <V2Image
                          src={item.src || item.thumb}
                          alt={index === photoIndex ? `${place.title} in ${city.name}` : ''}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          draggable={false}
                          onFail={() => setFailedPhotos((current) => ({ ...current, [index]: true }))}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {photoIndex > 0 ? (
                <button className="v2-detail-nav is-prev" type="button" onClick={() => stepPhoto(-1)} aria-label="Previous photo">
                  <Icon name="chevron-left" />
                </button>
              ) : null}
              {photoIndex < photoCount - 1 ? (
                <button className="v2-detail-nav is-next" type="button" onClick={() => stepPhoto(1)} aria-label="Next photo">
                  <Icon name="chevron-right" />
                </button>
              ) : null}
              <span className="v2-popup-zoom has-count" data-label={`${photoIndex + 1} / ${photoCount}`} aria-hidden="true">
                <svg className="v2-icon" viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="m20 4-6.5 6.5"/><path d="m4 20 6.5-6.5"/></svg>
              </span>
            </div>
          ) : (
            <button
              className={`v2-detail-media tone-${place.placeholderTone}`}
              type="button"
              onClick={() => onOpenPhoto(photoIndex)}
              aria-label={`Open larger photo of ${place.title}`}
            >
              <V2Image
                src={photo.src || photo.thumb}
                alt={`${place.title} in ${city.name}`}
                loading="eager"
                onFail={() => setFailedPhotos((current) => ({ ...current, [photoIndex]: true }))}
              />
              <span className="v2-popup-zoom" data-label="Expand" aria-hidden="true">
                <svg className="v2-icon" viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="m20 4-6.5 6.5"/><path d="m4 20 6.5-6.5"/></svg>
              </span>
            </button>
          )
        ) : (
          <PopupPlaceholder place={place} city={city} />
        )}

        {hasGallery ? (
          <section className="v2-detail-gallery" aria-label="Photos">
            <div className={`v2-detail-thumbs-wrap${thumbOverflow.start ? ' has-start' : ''}${thumbOverflow.end ? ' has-end' : ''}`}>
              <div
                ref={thumbsRef}
                className="v2-detail-thumbs"
                role="group"
                aria-label="Choose a photo"
              >
                {photos.map((item, index) => (
                  <button
                    key={item.page || index}
                    type="button"
                    className={index === photoIndex ? 'is-active' : ''}
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Show photo ${index + 1} of ${photoCount}`}
                    aria-pressed={index === photoIndex}
                  >
                    <V2Image src={item.thumb || item.src} />
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showPhoto && photo ? (
          <p className="v2-detail-credit"><PhotoCredit photo={photo} /></p>
        ) : null}

        <div className="v2-detail-body">
          <div className="v2-popup-kicker">
            <i style={{ backgroundColor: category.color }} />
            {category.label}
            <span className="v2-detail-rank">No. {String(rank).padStart(2, '0')}</span>
          </div>
          <h2 id="v2-detail-title">{place.title}</h2>
          {(place.architect || place.year || place.area) ? (
            <dl className="v2-popup-meta">
              {place.architect ? <div><dt>Architect</dt><dd>{place.architect}</dd></div> : null}
              {place.year ? <div><dt>Year</dt><dd>{place.year}</dd></div> : null}
              {place.area ? <div><dt>Area</dt><dd>{place.area}</dd></div> : null}
            </dl>
          ) : null}
          <p className="v2-detail-story">{place.why}</p>

          <a className="v2-popup-directions v2-detail-directions" href={googleMapsUrl(place)} target="_blank" rel="noreferrer" aria-label={`Open ${place.title} in Google Maps`}>
            <span className="v2-popup-directions-icon"><Icon name="location" /></span>
            <span className="v2-popup-directions-copy"><strong>Open in Google Maps</strong><small>{place.area ? `${place.area}, ${city.name}` : city.name}</small></span>
            <span className="v2-popup-directions-arrow"><Icon name="arrow-up-right" /></span>
          </a>

          {publishers.length > 0 ? (
            <section className="v2-detail-sources" aria-labelledby="v2-detail-sources-title">
              <h3 id="v2-detail-sources-title">
                Mentioned in {publishers.length} {publishers.length === 1 ? 'source' : 'sources'}
              </h3>
              <ul>
                {publishers.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      <span>
                        <b>{source.publisher}</b>
                        {source.label !== source.publisher ? <small>{source.label}</small> : null}
                      </span>
                      <Icon name="external" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>
    </>
  );
}

export function DesignTwoMapScreen() {
  const previewLoading = useMemo(readPreviewLoading, []);
  const loadingMode = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('loading');
    if (value === 'cities') return 'cities' as const;
    if (value === 'photos') return 'photos' as const;
    if (value === 'list') return 'list' as const;
    return previewLoading ? 'all' as const : 'off' as const;
  }, [previewLoading]);
  const initialRoute = useMemo(parseRoute, []);
  const mapRef = useRef<MapboxMap | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [activeCityId, setActiveCityId] = useState(initialRoute.cityId);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialRoute.placeId);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [minMentions, setMinMentions] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isCompactPins, setIsCompactPins] = useState(false);
  const [lightbox, setLightbox] = useState<{ place: CuratedPlace; index: number } | null>(null);
  const [isCityPending, startCityTransition] = useTransition();
  const [previewPlaceId, setPreviewPlaceId] = useState<string | null>(null);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [buildings3d, setBuildings3d] = useState(() => localStorage.getItem(BUILDINGS_3D_STORAGE_KEY) !== 'off');
  const [currentZoom, setCurrentZoom] = useState(() => initialRoute.placeId ? PLACE_3D_ZOOM : CITY_ZOOM);
  const buildings3dRef = useRef(buildings3d);
  buildings3dRef.current = buildings3d;
  const isUserZoomingRef = useRef(false);
  const selectedPlaceRef = useRef<CuratedPlace | null>(null);
  const lastSelectedIdRef = useRef<string | null>(initialRoute.placeId);
  const effectiveBuildings3d = buildings3d && currentZoom >= BUILDINGS_3D_MIN_ZOOM;
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const mainRef = useRef<HTMLElement | null>(null);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const isMobileSheet = viewport.width < MOBILE_QUERY_WIDTH;
  const [sheetLevel, setSheetLevel] = useState<SheetLevel>('half');
  const sheetHeights = useMemo(() => getSheetHeights(viewport.height), [viewport.height]);
  const sheetHeightsRef = useRef(sheetHeights);
  sheetHeightsRef.current = sheetHeights;
  const isMobileSheetRef = useRef(isMobileSheet);
  isMobileSheetRef.current = isMobileSheet;
  mobileSheetPadding = isMobileSheet ? sheetMapPadding(sheetLevel, sheetHeights) : null;
  const sheetDragRef = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const suppressHandleClickRef = useRef(false);
  const focusSearchOnFullRef = useRef(false);

  const changeSheetLevel = useCallback((level: SheetLevel) => {
    if (isMobileSheetRef.current) mobileSheetPadding = sheetMapPadding(level, sheetHeightsRef.current);
    setSheetLevel(level);
  }, []);

  const previewOnHover = useCallback((placeId: string, hovered: boolean) => {
    if (hovered && !window.matchMedia(HOVER_PREVIEW_QUERY).matches) return;
    setPreviewPlaceId((current) => (hovered ? placeId : current === placeId ? null : current));
    setHighlightedPlaceId((current) => (hovered ? placeId : current === placeId ? null : current));
  }, []);

  const activeCity = CITY_BY_ID[activeCityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
  const places = activeCity?.places ?? [];
  const availableFilters = useMemo(
    () => FILTERS.filter((filter) => filter.value === 'all' || places.some((place) => place.category === filter.value)),
    [places]
  );
  const mentionsById = useMemo(
    () => new globalThis.Map(places.map((place) => [place.id, uniqueSources(place.sources).length])),
    [places]
  );
  const visiblePlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return places.filter((place) => {
      const matchesCategory = activeCategory === 'all' || place.category === activeCategory;
      const matchesMentions = (mentionsById.get(place.id) ?? 0) >= minMentions;
      const matchesQuery = !normalizedQuery || [place.title, place.architect, place.area, place.year]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesMentions && matchesQuery;
    });
  }, [activeCategory, mentionsById, minMentions, places, query]);
  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );
  selectedPlaceRef.current = selectedPlace;
  const previewPlace = previewPlaceId && previewPlaceId !== selectedPlaceId
    ? visiblePlaces.find((place) => place.id === previewPlaceId) ?? null
    : null;

  const clearSelection = useCallback((replaceHistory = false) => {
    setSelectedPlaceId(null);
    const method = replaceHistory ? 'replaceState' : 'pushState';
    if (window.location.pathname !== cityPath(activeCityId)) {
      window.history[method]({}, '', cityPath(activeCityId));
    }
  }, [activeCityId]);

  const selectPlace = useCallback((place: CuratedPlace, moveCamera = true) => {
    setSelectedPlaceId(place.id);
    setPreviewPlaceId(null);
    setHighlightedPlaceId(null);
    if (isMobileSheetRef.current) changeSheetLevel('half');
    lastSelectedIdRef.current = place.id;
    const nextPath = placePath(activeCityId, place.id);
    if (window.location.pathname !== nextPath) window.history.pushState({ placeId: place.id }, '', nextPath);
    if (moveCamera && mapRef.current) focusPlaceCamera(mapRef.current, place, buildings3dRef.current);
  }, [activeCityId, changeSheetLevel]);

  const toggleBuildings3d = useCallback(() => {
    setBuildings3d((current) => {
      const next = !current;
      localStorage.setItem(BUILDINGS_3D_STORAGE_KEY, next ? 'on' : 'off');
      return next;
    });
  }, []);

  const selectCity = useCallback((cityId: string, replaceHistory = false) => {
    const city = CITY_BY_ID[cityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
    localStorage.setItem('achetut-city-v2', city.id);
    startCityTransition(() => {
      setActiveCityId(city.id);
      setSelectedPlaceId(null);
      setActiveCategory('all');
      setMinMentions(1);
      setQuery('');
    });
    const method = replaceHistory ? 'replaceState' : 'pushState';
    if (window.location.pathname !== cityPath(city.id)) window.history[method]({}, '', cityPath(city.id));
    mapRef.current?.easeTo({
      center: city.center,
      zoom: CITY_ZOOM,
      pitch: 0,
      bearing: 0,
      padding: getMapPadding(),
      duration: 650
    });
  }, [startCityTransition]);

  useEffect(() => {
    const applyRoute = () => {
      const route = parseRoute();
      startCityTransition(() => {
        setActiveCityId(route.cityId);
        setSelectedPlaceId(route.placeId);
        setActiveCategory('all');
        setMinMentions(1);
        setQuery('');
      });
      setCurrentZoom(route.placeId && buildings3dRef.current ? PLACE_3D_ZOOM : CITY_ZOOM);
      const city = CITY_BY_ID[route.cityId];
      const place = route.placeId ? city.places.find((candidate) => candidate.id === route.placeId) : null;
      if (route.placeId) lastSelectedIdRef.current = route.placeId;
      if (place && mapRef.current) {
        focusPlaceCamera(mapRef.current, place, buildings3dRef.current);
        return;
      }
      mapRef.current?.easeTo({
        center: city.center,
        zoom: CITY_ZOOM,
        pitch: 0,
        bearing: 0,
        padding: getMapPadding(),
        duration: 420
      });
    };

    if (window.location.pathname === ROUTE_BASE || window.location.pathname === `${ROUTE_BASE}/`) {
      const savedCity = localStorage.getItem('achetut-city-v2');
      const cityId = savedCity && CITY_BY_ID[savedCity] ? savedCity : DEFAULT_CITY_ID;
      selectCity(cityId, true);
    }
    window.addEventListener('popstate', applyRoute);
    return () => window.removeEventListener('popstate', applyRoute);
  }, [selectCity]);

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
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        setViewport((current) => (
          current.width === window.innerWidth && current.height === window.innerHeight
            ? current
            : { width: window.innerWidth, height: window.innerHeight }
        ));
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    // A camera move started in the same tick already carries the new padding.
    if (map.isMoving()) return;
    map.easeTo({ padding: getMapPadding(), duration: 280 });
  }, [mapReady, sheetLevel, viewport]);

  useEffect(() => {
    if (sheetLevel !== 'full' || !focusSearchOnFullRef.current) return;
    focusSearchOnFullRef.current = false;
    searchRef.current?.focus({ preventScroll: true });
  }, [sheetLevel]);

  const sheetHandleLabel = sheetLevel === 'full' ? 'Collapse panel' : 'Expand panel';

  const cycleSheet = () => {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false;
      return;
    }
    changeSheetLevel(sheetLevel === 'peek' ? 'half' : sheetLevel === 'half' ? 'full' : 'half');
  };

  const clampSheetHeight = (height: number) => Math.min(sheetHeights.full, Math.max(sheetHeights.peek, height));

  const onSheetPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isMobileSheet || event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; the drag still works without it.
    }
    sheetDragRef.current = { startY: event.clientY, startHeight: sheetHeights[sheetLevel], moved: false };
  };

  const onSheetPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const delta = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(delta) < 6) return;
    drag.moved = true;
    const main = mainRef.current;
    main?.classList.add('is-sheet-dragging');
    main?.style.setProperty('--v2-mobile-panel-height', `${clampSheetHeight(drag.startHeight + delta)}px`);
  };

  const onSheetPointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = sheetDragRef.current;
    sheetDragRef.current = null;
    if (!drag?.moved) return;
    suppressHandleClickRef.current = true;
    const delta = drag.startY - event.clientY;
    const height = clampSheetHeight(drag.startHeight + delta);
    let next = SHEET_LEVELS.reduce((best, level) => (
      Math.abs(sheetHeights[level] - height) < Math.abs(sheetHeights[best] - height) ? level : best
    ), sheetLevel);
    if (next === sheetLevel && Math.abs(delta) > 48) {
      const step = SHEET_LEVELS.indexOf(sheetLevel) + (delta > 0 ? 1 : -1);
      next = SHEET_LEVELS[Math.min(SHEET_LEVELS.length - 1, Math.max(0, step))];
    }
    const main = mainRef.current;
    main?.classList.remove('is-sheet-dragging');
    main?.style.setProperty('--v2-mobile-panel-height', `${sheetHeights[next]}px`);
    changeSheetLevel(next);
  };

  const openMobileSearch = () => {
    focusSearchOnFullRef.current = true;
    if (sheetLevel === 'full') {
      focusSearchOnFullRef.current = false;
      searchRef.current?.focus({ preventScroll: true });
      return;
    }
    changeSheetLevel('full');
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    try {
      map.setConfigProperty('basemap', 'show3dObjects', effectiveBuildings3d);
    } catch {
      // Styles without the Standard basemap import don't expose this config.
    }
  }, [effectiveBuildings3d, mapReady]);

  const skipFirst3dToggleEffect = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (skipFirst3dToggleEffect.current) {
      skipFirst3dToggleEffect.current = false;
      return;
    }
    if (!buildings3d) {
      map.stop();
      map.easeTo({ pitch: 0, bearing: 0, duration: 320 });
      return;
    }
    if (selectedPlaceRef.current && currentZoom >= BUILDINGS_3D_MIN_ZOOM) {
      focusPlaceCamera(map, selectedPlaceRef.current, true);
    }
  }, [buildings3d, mapReady]);

  useEffect(() => {
    if (selectedPlaceId || !lastSelectedIdRef.current) return;
    const row = document.getElementById(`v2-place-${lastSelectedIdRef.current}`);
    if (!row) return;
    row.scrollIntoView({ block: 'center' });
    if (!document.activeElement || document.activeElement === document.body) {
      row.querySelector<HTMLButtonElement>('.v2-place-hit')?.focus({ preventScroll: true });
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    if (!selectedPlaceId || lightbox) return;
    const backOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) clearSelection();
    };
    window.addEventListener('keydown', backOnEscape);
    return () => window.removeEventListener('keydown', backOnEscape);
  }, [clearSelection, lightbox, selectedPlaceId]);

  const resetSelectionRoute = () => {
    setSelectedPlaceId(null);
    if (window.location.pathname !== cityPath(activeCity.id)) {
      window.history.replaceState({}, '', cityPath(activeCity.id));
    }
  };

  const changeCategory = (category: CategoryFilter) => {
    setActiveCategory(category);
    resetSelectionRoute();
  };

  const changeMentions = (value: number) => {
    setMinMentions(value);
    resetSelectionRoute();
  };

  const freezeList = previewLoading && (loadingMode === 'list' || loadingMode === 'cities' || (loadingMode === 'all' && !selectedPlaceId));
  const detailPlace = selectedPlace ?? (loadingMode === 'photos' ? places[0] ?? null : null);

  if (!activeCity) {
    return <main className="design-variant-two"><div className="v2-state-card" role="alert">No city guides found.</div></main>;
  }

  return (
    <PreviewLoadingContext.Provider value={previewLoading}>
    <main
      ref={mainRef}
      className="design-variant-two"
      data-sheet={isMobileSheet ? sheetLevel : undefined}
      style={isMobileSheet ? { '--v2-mobile-panel-height': `${sheetHeights[sheetLevel]}px` } as React.CSSProperties : undefined}
    >
      <div className={`v2-map-canvas${isCompactPins ? ' is-compact-pins' : ''}${selectedPlaceId ? ' has-selection' : ''}`} role="region" aria-label={`Map of curated places in ${activeCity.name}`}>
        {MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAPBOX_STYLE}
            initialViewState={{
              longitude: selectedPlace?.coordinates[0] ?? activeCity.center[0],
              latitude: selectedPlace?.coordinates[1] ?? activeCity.center[1],
              zoom: selectedPlace ? PLACE_ZOOM : CITY_ZOOM,
              pitch: 0,
              bearing: 0,
              padding: getMapPadding()
            }}
            attributionControl={false}
            logoPosition="bottom-right"
            antialias={false}
            failIfMajorPerformanceCaveat={false}
            reuseMaps
            config={{
              basemap: {
                lightPreset: 'day',
                showPointOfInterestLabels: false,
                showPlaceLabels: true,
                showRoadLabels: true,
                showTransitLabels: false,
                show3dObjects: effectiveBuildings3d
              }
            }}
            onLoad={(event) => {
              mapRef.current = event.target;
              event.target.setPadding(getMapPadding());
              setCurrentZoom(event.target.getZoom());
              setIsCompactPins(event.target.getZoom() < COMPACT_PIN_ZOOM);
              setMapReady(true);
              setMapError(null);
              if (selectedPlace) focusPlaceCamera(event.target, selectedPlace, buildings3dRef.current);
            }}
            onZoomStart={(event) => {
              if ('originalEvent' in event && event.originalEvent) isUserZoomingRef.current = true;
            }}
            onZoom={(event) => {
              setCurrentZoom(event.viewState.zoom);
              setIsCompactPins(event.viewState.zoom < COMPACT_PIN_ZOOM);
            }}
            onZoomEnd={(event) => {
              setCurrentZoom(event.viewState.zoom);
              setIsCompactPins(event.viewState.zoom < COMPACT_PIN_ZOOM);
              if (!isUserZoomingRef.current) return;
              isUserZoomingRef.current = false;
              const map = mapRef.current;
              if (!map) return;
              if (buildings3dRef.current && selectedPlace && event.viewState.zoom >= BUILDINGS_3D_MIN_ZOOM) {
                map.stop();
                map.easeTo({
                  pitch: PLACE_3D_PITCH,
                  bearing: Math.abs(map.getBearing()) < 1 ? PLACE_3D_BEARING : map.getBearing(),
                  duration: 260
                });
                return;
              }
              if (map.getPitch() > 0.5) {
                map.stop();
                map.easeTo({ pitch: 0, duration: 180 });
              }
            }}
            onDragStart={() => {
              setPreviewPlaceId(null);
              if (isMobileSheet && sheetLevel === 'half' && !selectedPlaceId) changeSheetLevel('peek');
            }}
            onError={(event) => {
              if (!mapRef.current?.loaded()) setMapError(event.error?.message ?? 'The map could not be loaded.');
            }}
          >
            <NavigationControl position="top-right" showCompass={false} />
            <Buildings3DControl enabled={buildings3d} active={effectiveBuildings3d} onToggle={toggleBuildings3d} />
            <AttributionControl position="bottom-right" />
            {visiblePlaces.map((place) => (
              <Marker
                key={place.id}
                longitude={place.coordinates[0]}
                latitude={place.coordinates[1]}
                anchor="bottom"
                style={{ zIndex: selectedPlaceId === place.id ? 3 : highlightedPlaceId === place.id || previewPlaceId === place.id ? 2 : 1 }}
              >
                <V2PlaceMarker
                  place={place}
                  selected={selectedPlaceId === place.id}
                  highlighted={highlightedPlaceId === place.id || previewPlaceId === place.id}
                  onSelect={() => selectPlace(place)}
                  onHoverChange={(hovered) => previewOnHover(place.id, hovered)}
                />
              </Marker>
            ))}
            {previewPlace ? (
              <Popup
                key={previewPlace.id}
                className="v2-map-popup v2-hover-popup"
                anchor="bottom"
                longitude={previewPlace.coordinates[0]}
                latitude={previewPlace.coordinates[1]}
                closeButton={false}
                closeOnClick={false}
                focusAfterOpen={false}
                maxWidth="320px"
                offset={isCompactPins ? 58 : 74}
              >
                <HoverPreview place={previewPlace} />
              </Popup>
            ) : null}
          </Map>
        ) : null}
      </div>

      <aside className={`v2-sidebar${!freezeList && detailPlace ? ' is-detail' : ''}`} aria-label={!freezeList && detailPlace ? detailPlace.title : `${activeCity.name} places`}>
        {isMobileSheet ? (
          <button
            type="button"
            className="v2-sheet-handle"
            onClick={cycleSheet}
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerEnd}
            onPointerCancel={onSheetPointerEnd}
            aria-label={sheetHandleLabel}
            aria-expanded={sheetLevel !== 'peek'}
          >
            <span />
          </button>
        ) : null}
        {!freezeList && detailPlace ? (
          <PlaceDetail
            key={detailPlace.id}
            place={detailPlace}
            city={activeCity}
            rank={places.indexOf(detailPlace) + 1}
            onBack={() => clearSelection()}
            onOpenPhoto={(index) => setLightbox({ place: detailPlace, index })}
          />
        ) : (
        <>
        <header className="v2-sidebar-header">
          <a className="v2-brand" href={cityPath(activeCity.id)} aria-label="Achetut home">
            <AchetutLogo />
            <span className="v2-edition">City guide</span>
          </a>

          <CitySelect
            city={activeCity}
            onSelect={selectCity}
            onOpen={() => { if (isMobileSheet && sheetLevel === 'peek') changeSheetLevel('half'); }}
            forceOpen={loadingMode === 'cities'}
            forceLoading={previewLoading}
          />

          <button className="v2-sheet-search" type="button" onClick={openMobileSearch} aria-label="Search places">
            <Icon name="search" />
          </button>

          <div className="v2-title-row">
            <div>
              <p>{activeCity.country}</p>
              <h1>Places worth noticing</h1>
            </div>
            <strong aria-label={`${visiblePlaces.length} places shown`}>{visiblePlaces.length}</strong>
          </div>

          <div
            className={`v2-search${query ? ' has-value' : ''}`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget || (event.target as Element).closest('svg, kbd')) {
                event.preventDefault();
                searchRef.current?.focus();
              }
            }}
          >
            <label htmlFor="v2-search-input" className="v2-visually-hidden">Search places</label>
            <Icon name="search" />
            <input
              id="v2-search-input"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (selectedPlaceId) clearSelection(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  setQuery('');
                }
              }}
              placeholder="Search a place or architect"
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button
                className="v2-search-clear"
                type="button"
                onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                aria-label="Clear search"
              >
                <Icon name="close" />
              </button>
            ) : (
              <kbd aria-hidden="true"><span>{SHORTCUT_MODIFIER}</span><span>K</span></kbd>
            )}
          </div>

          <div className="v2-filter-bar">
          <div className="v2-filters" role="group" aria-label="Filter places by category">
            {availableFilters.map((filter) => (
              <button
                key={filter.value}
                className={activeCategory === filter.value ? 'is-active' : ''}
                type="button"
                onClick={() => changeCategory(filter.value)}
                aria-pressed={activeCategory === filter.value}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="v2-mentions" role="group" aria-labelledby="v2-mentions-label">
            <span id="v2-mentions-label">Mentions</span>
            {MENTION_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={minMentions === filter.value ? 'is-active' : ''}
                type="button"
                onClick={() => changeMentions(filter.value)}
                aria-pressed={minMentions === filter.value}
                title={filter.value > 1 ? `Places mentioned by ${filter.value} or more sources` : 'Any number of sources'}
              >
                {filter.label}
              </button>
            ))}
          </div>
          </div>
        </header>

        <div className="v2-results" role="region" aria-label="Places list" aria-live="polite" aria-busy={isCityPending || freezeList}>
          {isCityPending || freezeList ? (
            <PlaceListSkeleton />
          ) : visiblePlaces.length === 0 ? (
            <div className="v2-empty">
              <strong>No matching places</strong>
              <span>Try another category or a shorter search.</span>
              <button type="button" onClick={() => { setQuery(''); setMinMentions(1); changeCategory('all'); }}>Show all places</button>
            </div>
          ) : visiblePlaces.map((place) => {
            const rank = places.indexOf(place) + 1;
            const sourceCount = mentionsById.get(place.id) ?? 0;
            return (
              <article
                key={place.id}
                id={`v2-place-${place.id}`}
                className={`v2-place-row${highlightedPlaceId === place.id || previewPlaceId === place.id ? ' is-highlighted' : ''}`}
                onMouseEnter={() => setHighlightedPlaceId(place.id)}
                onMouseLeave={() => setHighlightedPlaceId((current) => (current === place.id && previewPlaceId !== place.id ? null : current))}
              >
                <span className={`v2-place-thumb tone-${place.placeholderTone}`} aria-hidden="true">
                  {place.photo ? <V2Image src={place.photo.thumb} /> : null}
                  <span>{String(rank).padStart(2, '0')}</span>
                </span>
                <span className="v2-place-copy">
                  <span className="v2-place-type"><i style={{ backgroundColor: CATEGORY_META[place.category].color }} />{CATEGORY_META[place.category].label}</span>
                  <button className="v2-place-hit" type="button" onClick={() => selectPlace(place)}>
                    <strong title={place.title}>{place.title}</strong>
                  </button>
                  <span className="v2-place-description" title={place.why}>{place.why}</span>
                  {place.photo ? <PhotoCredit photo={place.photo} /> : null}
                  {sourceCount > 0 ? (
                    <span className="v2-place-sources">
                      {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                    </span>
                  ) : null}
                </span>
              </article>
            );
          })}
        </div>
        </>
        )}

        <footer className="v2-sidebar-footer">
          <span>Selected by hand</span>
          <a href="/privacy">Privacy policy</a>
          <span>{places.length} places in {activeCity.name}</span>
        </footer>
      </aside>

      {!MAPBOX_TOKEN && (
        <div className="v2-state-card" role="status">
          <strong>Map preview is unavailable</strong>
          <span>Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to <code>.env</code>. The guide remains available.</span>
        </div>
      )}
      {MAPBOX_TOKEN && !mapError && (!mapReady || previewLoading) && <div className="v2-loading" role="status"><span /> Loading map…</div>}
      {mapError && MAPBOX_TOKEN && (
        <div className="v2-state-card" role="alert">
          <strong>The map could not be loaded</strong>
          <span>{mapError}</span>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      {!isOnline && <div className="v2-offline" role="status">Offline · showing cached guide content</div>}
      {lightbox?.place.photo ? <PhotoLightbox place={lightbox.place} city={activeCity} initialIndex={lightbox.index} onClose={closeLightbox} /> : null}

    </main>
    </PreviewLoadingContext.Provider>
  );
}
