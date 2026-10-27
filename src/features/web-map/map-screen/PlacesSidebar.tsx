import type { Ref, RefObject } from 'react';
import { Archi2goLogo } from '../Archi2goLogo';
import { Time2mapMark } from '../Time2mapMark';
import {
  CATEGORY_META,
  placeByline,
  type CitySummary,
  type CuratedCity,
  type CuratedPlace
} from '../places';
import { AppMenu } from './AppMenu';
import { CitySelect } from './CitySelect';
import {
  FILTERS,
  SHORTCUT_MODIFIER,
  SHOW_SEARCH,
  type CategoryFilter,
  type SheetLevel
} from './config';
import { listPhotoUrl } from './photoUtils';
import { PlaceDetail } from './PlaceDetail';
import { Icon, PhotoCredit, PlaceListSkeleton, V2Image } from './ui';
import type { MobileSheetApi } from './useMobileSheet';

export function PlacesSidebar({
  cities,
  activeCity,
  detailPlace,
  freezeList,
  cityPending,
  previewLoading,
  loadingMode,
  visiblePlaces,
  availableFilters,
  activeCategory,
  query,
  selectedPlaceId,
  highlightedPlaceId,
  previewPlaceId,
  searchRef,
  isMobileSheet,
  sheetLevel,
  sheet,
  onSelectCity,
  onSelectPlace,
  onClearSelection,
  onChangeCategory,
  onSetQuery,
  onOpenPhoto,
  onOpenAbout,
  onSetHighlightedPlaceId
}: {
  cities: CitySummary[];
  activeCity: CuratedCity;
  detailPlace: CuratedPlace | null;
  freezeList: boolean;
  cityPending: boolean;
  previewLoading: boolean;
  loadingMode: 'cities' | 'photos' | 'list' | 'all' | 'off';
  visiblePlaces: CuratedPlace[];
  availableFilters: typeof FILTERS;
  activeCategory: CategoryFilter;
  query: string;
  selectedPlaceId: string | null;
  highlightedPlaceId: string | null;
  previewPlaceId: string | null;
  searchRef: RefObject<HTMLInputElement | null>;
  isMobileSheet: boolean;
  sheetLevel: SheetLevel;
  sheet: MobileSheetApi;
  onSelectCity: (cityId: string) => void;
  onSelectPlace: (place: CuratedPlace) => void;
  onClearSelection: (replaceHistory?: boolean) => void;
  onChangeCategory: (category: CategoryFilter) => void;
  onSetQuery: (query: string) => void;
  onOpenPhoto: (index: number) => void;
  onOpenAbout: () => void;
  onSetHighlightedPlaceId: (updater: string | null | ((current: string | null) => string | null)) => void;
}) {
  return (
    <aside
      ref={sheet.asideRef as Ref<HTMLElement>}
      className={`v2-sidebar${!freezeList && detailPlace ? ' is-detail' : ''}`}
      aria-label={!freezeList && detailPlace ? detailPlace.title : `${activeCity.name} places`}
      onPointerDown={isMobileSheet ? sheet.onSheetMouseDown : undefined}
      onClickCapture={sheet.onAsideClickCapture}>
      {isMobileSheet ? (
        <button
          type="button"
          className="v2-sheet-handle"
          onClick={sheet.cycleSheet}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            sheet.stepSheet(event.key === 'ArrowUp' ? 1 : -1);
          }}
          aria-label={sheet.sheetHandleLabel}
          aria-expanded={sheetLevel !== 'peek'}>
          <span />
        </button>
      ) : null}
      {!freezeList && detailPlace ? (
        <PlaceDetail
          key={detailPlace.id}
          place={detailPlace}
          city={activeCity}
          onBack={() => {
            if (isMobileSheet) sheet.changeSheetLevel('half');
            onClearSelection();
          }}
          onOpenPhoto={onOpenPhoto}
          onOpenMenu={() => {
            if (isMobileSheet && sheetLevel === 'peek') sheet.changeSheetLevel('half');
          }}
          onOpenAbout={onOpenAbout}
        />
      ) : (
        <>
          <header className="v2-sidebar-header">
            <div className="v2-brand">
              <Archi2goLogo />
              <span className="v2-edition">City guide</span>
            </div>

            <CitySelect
              cities={cities}
              city={activeCity}
              pending={cityPending}
              onSelect={onSelectCity}
              onOpen={() => {
                if (isMobileSheet && sheetLevel === 'peek') sheet.changeSheetLevel('half');
              }}
              forceOpen={loadingMode === 'cities'}
              forceLoading={previewLoading}
            />

            <AppMenu
              onOpen={() => {
                if (isMobileSheet && sheetLevel === 'peek') sheet.changeSheetLevel('half');
              }}
              onAbout={onOpenAbout}
            />

            {SHOW_SEARCH ? (
              <button
                className="v2-sheet-search"
                type="button"
                onClick={() => sheet.openMobileSearch(searchRef)}
                aria-label="Search places">
                <Icon name="search" />
              </button>
            ) : null}

            <div className={`v2-title-row${cityPending ? ' is-pending' : ''}`}>
              <div>
                {cityPending ? (
                  <>
                    <span className="v2-skel-line is-kicker" />
                    <span className="v2-skel-line is-title" />
                  </>
                ) : (
                  <>
                    <p>{activeCity.country}</p>
                    <h1>Places worth noticing</h1>
                  </>
                )}
              </div>
              <output
                className="v2-place-count"
                role="status"
                aria-atomic="true"
                aria-label={cityPending ? 'Loading places' : `${visiblePlaces.length} places shown`}>
                {cityPending ? (
                  <span className="v2-skel-line is-count" />
                ) : (
                  <strong aria-hidden="true">{visiblePlaces.length}</strong>
                )}
              </output>
            </div>

            {SHOW_SEARCH ? (
              <div
                className={`v2-search${query ? ' has-value' : ''}`}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget || (event.target as Element).closest('svg, kbd')) {
                    event.preventDefault();
                    searchRef.current?.focus();
                  }
                }}>
                <label
                  htmlFor="v2-search-input"
                  className="v2-visually-hidden">
                  Search places
                </label>
                <Icon name="search" />
                <input
                  id="v2-search-input"
                  ref={searchRef as Ref<HTMLInputElement>}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    onSetQuery(event.target.value);
                    if (selectedPlaceId) onClearSelection(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && query) {
                      event.preventDefault();
                      onSetQuery('');
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
                    onClick={() => {
                      onSetQuery('');
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search">
                    <Icon name="close" />
                  </button>
                ) : (
                  <kbd aria-hidden="true">
                    <span>{SHORTCUT_MODIFIER}</span>
                    <span>K</span>
                  </kbd>
                )}
              </div>
            ) : null}

            <div className="v2-filter-bar">
              <div
                className="v2-filters"
                role="group"
                aria-label="Filter places by category">
                {availableFilters.map((filter) => (
                  <button
                    key={filter.value}
                    className={activeCategory === filter.value ? 'is-active' : ''}
                    type="button"
                    onClick={() => onChangeCategory(filter.value)}
                    aria-pressed={activeCategory === filter.value}>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div
            className="v2-results"
            role="region"
            aria-label="Places list"
            aria-live="polite"
            aria-busy={cityPending}>
            {cityPending ? (
              <PlaceListSkeleton />
            ) : visiblePlaces.length === 0 ? (
              <div className="v2-empty">
                <strong>No matching places</strong>
                <span>{SHOW_SEARCH ? 'Try another category or a shorter search.' : 'Try another category.'}</span>
                <button
                  type="button"
                  onClick={() => {
                    onSetQuery('');
                    onChangeCategory('all');
                  }}>
                  Show all places
                </button>
              </div>
            ) : (
              visiblePlaces.map((place) => (
                <article
                  key={place.id}
                  id={`v2-place-${place.id}`}
                  className={`v2-place-row${highlightedPlaceId === place.id || previewPlaceId === place.id ? ' is-highlighted' : ''}`}
                  onMouseEnter={() => onSetHighlightedPlaceId(place.id)}
                  onMouseLeave={() =>
                    onSetHighlightedPlaceId((current) =>
                      current === place.id && previewPlaceId !== place.id ? null : current
                    )
                  }>
                  <span
                    className={`v2-place-thumb tone-${place.placeholderTone}`}
                    aria-hidden="true">
                    {place.photo ? <V2Image src={listPhotoUrl(place.photo)} /> : null}
                  </span>
                  <span className="v2-place-copy">
                    <span className="v2-place-type">{CATEGORY_META[place.category].label}</span>
                    <button
                      className="v2-place-hit"
                      type="button"
                      onClick={() => onSelectPlace(place)}>
                      <strong title={place.title}>{place.title}</strong>
                    </button>
                    {placeByline(place) ? <span className="v2-place-byline">{placeByline(place)}</span> : null}
                    <span
                      className="v2-place-description"
                      title={place.why}>
                      {place.why}
                    </span>
                    {place.photo ? <PhotoCredit photo={place.photo} /> : null}
                  </span>
                </article>
              ))
            )}
          </div>
        </>
      )}

      <footer className="v2-sidebar-footer">
        <a href="/privacy">Privacy policy</a>
        <a
          className="v2-time2map"
          href="https://time2map.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="time2map — Maps and GIS solutions">
          <span aria-hidden="true">by</span>
          <Time2mapMark className="v2-time2map-mark" />
          <span>time2map</span>
        </a>
      </footer>
    </aside>
  );
}
