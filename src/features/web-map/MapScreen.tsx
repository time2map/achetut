import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Ref
} from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import './design-two.css';

import { CITY_BY_ID, DEFAULT_CITY_ID, type CuratedPlace } from './places';
import {
  BUILDINGS_3D_MIN_ZOOM,
  BUILDINGS_3D_STORAGE_KEY,
  CITY_ZOOM,
  COMPACT_PIN_ZOOM,
  FILTERS,
  HOVER_PREVIEW_QUERY,
  MAPBOX_TOKEN,
  PLACE_ZOOM,
  SHOW_SEARCH,
  readPreviewLoading,
  type CategoryFilter,
  type MapViewportBounds
} from './map-screen/config';
import { MapCanvas } from './map-screen/MapCanvas';
import {
  focusCityCamera,
  focusPlaceCamera,
  getMapPadding,
  isPlaceInsideBounds,
  setPaddingKeepingView,
  setShow3dObjects
} from './map-screen/mapCamera';
import { PhotoLightbox } from './map-screen/PhotoLightbox';
import { PlacesSidebar } from './map-screen/PlacesSidebar';
import { cityPath, parseRoute, placePath } from './map-screen/routes';
import { PreviewLoadingContext } from './map-screen/ui';
import { useMobileSheet } from './map-screen/useMobileSheet';

export function MapScreen() {
  const previewLoading = useMemo(readPreviewLoading, []);
  const loadingMode = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('loading');
    if (value === 'cities') return 'cities' as const;
    if (value === 'photos') return 'photos' as const;
    if (value === 'list') return 'list' as const;
    return previewLoading ? ('all' as const) : ('off' as const);
  }, [previewLoading]);
  const initialRoute = useMemo(parseRoute, []);
  const mapRef = useRef<MapboxMap | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [activeCityId, setActiveCityId] = useState(initialRoute.cityId);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialRoute.placeId);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapViewportBounds, setMapViewportBounds] = useState<MapViewportBounds | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isCompactPins, setIsCompactPins] = useState(
    () => (initialRoute.placeId ? PLACE_ZOOM : CITY_ZOOM) < COMPACT_PIN_ZOOM
  );
  const [lightbox, setLightbox] = useState<{ place: CuratedPlace; index: number } | null>(null);
  const [isCityPending, startCityTransition] = useTransition();
  const [previewPlaceId, setPreviewPlaceId] = useState<string | null>(null);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [buildings3d, setBuildings3d] = useState(() => localStorage.getItem(BUILDINGS_3D_STORAGE_KEY) !== 'off');
  // Only the threshold matters for rendering; storing the raw zoom re-rendered every marker each frame.
  const [atBuildingsZoom, setAtBuildingsZoom] = useState(() => Boolean(initialRoute.placeId));
  const zoomModesRef = useRef({ buildings: atBuildingsZoom, compactPins: isCompactPins });
  const buildings3dRef = useRef(buildings3d);
  buildings3dRef.current = buildings3d;
  const isUserZoomingRef = useRef(false);
  const updateZoomModes = useCallback((zoom: number) => {
    const nextBuildings = zoom >= BUILDINGS_3D_MIN_ZOOM;
    const nextCompactPins = zoom < COMPACT_PIN_ZOOM;
    if (zoomModesRef.current.buildings !== nextBuildings) {
      zoomModesRef.current.buildings = nextBuildings;
      setAtBuildingsZoom(nextBuildings);
    }
    if (zoomModesRef.current.compactPins !== nextCompactPins) {
      zoomModesRef.current.compactPins = nextCompactPins;
      setIsCompactPins(nextCompactPins);
    }
  }, []);
  const selectedPlaceRef = useRef<CuratedPlace | null>(null);
  const lastSelectedIdRef = useRef<string | null>(initialRoute.placeId);
  const effectiveBuildings3d = buildings3d && atBuildingsZoom;
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const sheet = useMobileSheet();
  const {
    isMobileSheet,
    sheetLevel,
    sheetHeightsRef,
    isMobileSheetRef,
    sheetLevelRef,
    mainRef,
    asideRef,
    viewport,
    mainStyle,
    changeSheetLevel,
    focusSearchOnFullRef
  } = sheet;

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
  const visiblePlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return places.filter((place) => {
      const matchesCategory = activeCategory === 'all' || place.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        [place.title, place.architect, place.area, place.year]
          .filter(Boolean)
          .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, places, query]);
  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );
  const renderedMapPlaces = useMemo(
    () =>
      mapViewportBounds
        ? visiblePlaces.filter((place) => place.id === selectedPlaceId || isPlaceInsideBounds(place, mapViewportBounds))
        : visiblePlaces,
    [mapViewportBounds, selectedPlaceId, visiblePlaces]
  );
  selectedPlaceRef.current = selectedPlace;
  const previewPlace =
    previewPlaceId && previewPlaceId !== selectedPlaceId
      ? (visiblePlaces.find((place) => place.id === previewPlaceId) ?? null)
      : null;

  const clearSelection = useCallback(
    (replaceHistory = false) => {
      setSelectedPlaceId(null);
      const method = replaceHistory ? 'replaceState' : 'pushState';
      if (window.location.pathname !== cityPath(activeCityId)) {
        window.history[method]({}, '', cityPath(activeCityId));
      }
    },
    [activeCityId]
  );

  const selectPlace = useCallback(
    (place: CuratedPlace, moveCamera = true) => {
      setSelectedPlaceId(place.id);
      setPreviewPlaceId(null);
      setHighlightedPlaceId(null);
      if (isMobileSheetRef.current) changeSheetLevel('half');
      lastSelectedIdRef.current = place.id;
      const nextPath = placePath(activeCityId, place.id);
      if (window.location.pathname !== nextPath) window.history.pushState({ placeId: place.id }, '', nextPath);
      if (moveCamera && mapRef.current) focusPlaceCamera(mapRef.current, place, buildings3dRef.current);
    },
    [activeCityId, changeSheetLevel, isMobileSheetRef]
  );

  const toggleBuildings3d = useCallback(() => {
    setBuildings3d((current) => {
      const next = !current;
      localStorage.setItem(BUILDINGS_3D_STORAGE_KEY, next ? 'on' : 'off');
      return next;
    });
  }, []);

  const selectCity = useCallback(
    (cityId: string, replaceHistory = false) => {
      const city = CITY_BY_ID[cityId] ?? CITY_BY_ID[DEFAULT_CITY_ID];
      localStorage.setItem('achetut-city-v2', city.id);
      startCityTransition(() => {
        setActiveCityId(city.id);
        setSelectedPlaceId(null);
        setActiveCategory('all');
        setQuery('');
      });
      const method = replaceHistory ? 'replaceState' : 'pushState';
      if (window.location.pathname !== cityPath(city.id)) window.history[method]({}, '', cityPath(city.id));
      if (mapRef.current) focusCityCamera(mapRef.current, city.center, 650);
    },
    [startCityTransition]
  );

  useEffect(() => {
    const applyRoute = () => {
      const route = parseRoute();
      startCityTransition(() => {
        setActiveCityId(route.cityId);
        setSelectedPlaceId(route.placeId);
        setActiveCategory('all');
        setQuery('');
      });
      setAtBuildingsZoom(Boolean(route.placeId && buildings3dRef.current));
      const city = CITY_BY_ID[route.cityId];
      const place = route.placeId ? city.places.find((candidate) => candidate.id === route.placeId) : null;
      if (route.placeId) lastSelectedIdRef.current = route.placeId;
      if (place && mapRef.current) {
        focusPlaceCamera(mapRef.current, place, buildings3dRef.current);
        return;
      }
      if (mapRef.current) focusCityCamera(mapRef.current, city.center, 420);
    };

    if (window.location.pathname === '/') {
      const savedCity = localStorage.getItem('achetut-city-v2');
      const cityId = savedCity && CITY_BY_ID[savedCity] ? savedCity : DEFAULT_CITY_ID;
      selectCity(cityId, true);
    } else {
      const route = parseRoute();
      const canonicalPath = route.placeId ? placePath(route.cityId, route.placeId) : cityPath(route.cityId);
      if (window.location.pathname !== canonicalPath) window.history.replaceState({}, '', canonicalPath);
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
    if (!SHOW_SEARCH) return;
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
    const map = mapRef.current;
    if (!mapReady || !map) return;
    // Sheet level changes don't touch the camera: every camera move passes the current padding itself.
    if (map.isMoving()) return;
    setPaddingKeepingView(map, getMapPadding());
  }, [mapReady, viewport]);

  useEffect(() => {
    if (sheetLevel !== 'full' || !focusSearchOnFullRef.current) return;
    focusSearchOnFullRef.current = false;
    searchRef.current?.focus({ preventScroll: true });
  }, [focusSearchOnFullRef, sheetLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (!map.isMoving()) {
      setShow3dObjects(map, buildings3d);
      return;
    }
    const applyWhenSettled = () => setShow3dObjects(map, buildings3dRef.current);
    map.once('moveend', applyWhenSettled);
    return () => {
      map.off('moveend', applyWhenSettled);
    };
  }, [buildings3d, mapReady]);

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
    if (selectedPlaceRef.current && map.getZoom() >= BUILDINGS_3D_MIN_ZOOM) {
      focusPlaceCamera(map, selectedPlaceRef.current, true);
    }
  }, [buildings3d, mapReady]);

  useEffect(() => {
    if (selectedPlaceId || !lastSelectedIdRef.current) return;
    const row = document.getElementById(`v2-place-${lastSelectedIdRef.current}`);
    const list = row?.closest<HTMLElement>('.v2-results');
    if (!row || !list) return;
    // scrollIntoView would also scroll the clipped page and shove the map off screen.
    const listRect = list.getBoundingClientRect();
    const sheetTop = asideRef.current?.getBoundingClientRect().top ?? listRect.top;
    // On mobile the lower part of the list sits below the screen; centre within the settled sheet.
    const visibleHeight = isMobileSheetRef.current
      ? sheetHeightsRef.current[sheetLevelRef.current]! - (listRect.top - sheetTop)
      : list.clientHeight;
    list.scrollTop += row.getBoundingClientRect().top - listRect.top - (visibleHeight - row.offsetHeight) / 2;
    if (!document.activeElement || document.activeElement === document.body) {
      row.querySelector<HTMLButtonElement>('.v2-place-hit')?.focus({ preventScroll: true });
    }
  }, [asideRef, isMobileSheetRef, selectedPlaceId, sheetHeightsRef, sheetLevelRef]);

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

  const freezeList =
    previewLoading &&
    (loadingMode === 'list' || loadingMode === 'cities' || (loadingMode === 'all' && !selectedPlaceId));
  const cityPending = isCityPending || freezeList;
  const detailPlace = selectedPlace ?? (loadingMode === 'photos' ? (places[0] ?? null) : null);

  if (!activeCity) {
    return (
      <main className="design-variant-two">
        <div
          className="v2-state-card"
          role="alert">
          No city guides found.
        </div>
      </main>
    );
  }

  return (
    <PreviewLoadingContext.Provider value={previewLoading}>
      <main
        ref={mainRef as Ref<HTMLElement>}
        className="design-variant-two"
        data-sheet={isMobileSheet ? sheetLevel : undefined}
        style={mainStyle}>
        <MapCanvas
          activeCity={activeCity}
          selectedPlace={selectedPlace}
          selectedPlaceId={selectedPlaceId}
          renderedMapPlaces={renderedMapPlaces}
          previewPlace={previewPlace}
          previewPlaceId={previewPlaceId}
          highlightedPlaceId={highlightedPlaceId}
          buildings3d={buildings3d}
          buildings3dRef={buildings3dRef}
          effectiveBuildings3d={effectiveBuildings3d}
          isCompactPins={isCompactPins}
          isMobileSheet={isMobileSheet}
          sheetLevel={sheetLevel}
          mapRef={mapRef}
          isUserZoomingRef={isUserZoomingRef}
          updateZoomModes={updateZoomModes}
          onMapReady={() => setMapReady(true)}
          onMapError={setMapError}
          onViewportBounds={setMapViewportBounds}
          onSelectPlace={selectPlace}
          onPreviewHover={previewOnHover}
          onToggleBuildings3d={toggleBuildings3d}
          onMapClick={() => {
            if (!selectedPlaceId) return;
            setPreviewPlaceId(null);
            setHighlightedPlaceId(null);
            clearSelection();
          }}
          onDragStart={() => setPreviewPlaceId(null)}
          changeSheetLevel={changeSheetLevel}
        />

        <PlacesSidebar
          activeCity={activeCity}
          detailPlace={detailPlace}
          freezeList={freezeList}
          cityPending={cityPending}
          previewLoading={previewLoading}
          loadingMode={loadingMode}
          visiblePlaces={visiblePlaces}
          availableFilters={availableFilters}
          activeCategory={activeCategory}
          query={query}
          selectedPlaceId={selectedPlaceId}
          highlightedPlaceId={highlightedPlaceId}
          previewPlaceId={previewPlaceId}
          searchRef={searchRef}
          isMobileSheet={isMobileSheet}
          sheetLevel={sheetLevel}
          sheet={sheet}
          onSelectCity={selectCity}
          onSelectPlace={selectPlace}
          onClearSelection={clearSelection}
          onChangeCategory={changeCategory}
          onSetQuery={setQuery}
          onOpenPhoto={(index) => detailPlace && setLightbox({ place: detailPlace, index })}
          onSetHighlightedPlaceId={setHighlightedPlaceId}
        />

        {!MAPBOX_TOKEN && (
          <div
            className="v2-state-card"
            role="status">
            <strong>Map preview is unavailable</strong>
            <span>
              Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to <code>.env</code>. The guide remains available.
            </span>
          </div>
        )}
        {MAPBOX_TOKEN && !mapError && (!mapReady || previewLoading) && (
          <div
            className="v2-loading"
            role="status">
            <span /> Loading map…
          </div>
        )}
        {mapError && MAPBOX_TOKEN && (
          <div
            className="v2-state-card"
            role="alert">
            <strong>The map could not be loaded</strong>
            <span>{mapError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}
        {!isOnline && (
          <div
            className="v2-offline"
            role="status">
            Offline — showing cached guide content
          </div>
        )}
        {lightbox?.place.photo ? (
          <PhotoLightbox
            place={lightbox.place}
            city={activeCity}
            initialIndex={lightbox.index}
            onClose={closeLightbox}
          />
        ) : null}
      </main>
    </PreviewLoadingContext.Provider>
  );
}
