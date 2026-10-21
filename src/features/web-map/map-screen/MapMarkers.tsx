import { memo, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marker, useControl } from 'react-map-gl/mapbox';
import { CATEGORY_META, type CuratedPlace } from '../places';
import { PhotoCredit, V2Image } from './ui';

export function Buildings3DControl({
  enabled,
  active,
  onToggle
}: {
  enabled: boolean;
  active: boolean;
  onToggle: () => void;
}) {
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
      aria-label={enabled ? 'Disable 3D buildings' : 'Enable 3D buildings'}
      title={
        !enabled
          ? 'Show 3D buildings'
          : active
            ? 'Hide 3D buildings'
            : '3D buildings will appear when you zoom in closer'
      }>
      3D
    </button>,
    container
  );
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
      className={`v2-pin is-${place.category}${selected ? ' is-selected' : ''}${highlighted ? ' is-highlighted' : ''}`}
      style={{ '--pin-color': category.color } as React.CSSProperties}
      aria-label={
        place.photo
          ? `${place.title}, ${category.label}. Photo by ${place.photo.author || 'unknown author'}${place.photo.license ? `, ${place.photo.license}` : ''}`
          : `${place.title}, ${category.label}`
      }
      title={
        place.photo
          ? `Photo ${place.photo.author || 'Unknown author'}${place.photo.license ? `, ${place.photo.license}` : ''}`
          : undefined
      }
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}>
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

export const MapPlaceMarker = memo(function MapPlaceMarker({
  place,
  selected,
  highlighted,
  onSelect,
  onHoverChange
}: {
  place: CuratedPlace;
  selected: boolean;
  highlighted: boolean;
  onSelect: (place: CuratedPlace) => void;
  onHoverChange: (placeId: string, hovered: boolean) => void;
}) {
  const selectMarker = useCallback(() => onSelect(place), [onSelect, place]);
  const changeMarkerHover = useCallback(
    (hovered: boolean) => onHoverChange(place.id, hovered),
    [onHoverChange, place.id]
  );

  return (
    <Marker
      longitude={place.coordinates[0]}
      latitude={place.coordinates[1]}
      anchor="bottom"
      style={{ zIndex: selected ? 3 : highlighted ? 2 : 1 }}>
      <V2PlaceMarker
        place={place}
        selected={selected}
        highlighted={highlighted}
        onSelect={selectMarker}
        onHoverChange={changeMarkerHover}
      />
    </Marker>
  );
});

export function HoverPreview({ place }: { place: CuratedPlace }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const category = CATEGORY_META[place.category];
  const meta = [place.architect, place.year].filter(Boolean).join(', ');
  return (
    <div className="v2-hover-card">
      <span
        className={`v2-hover-thumb tone-${place.placeholderTone}`}
        aria-hidden="true">
        {place.photo && !photoFailed ? (
          <V2Image
            src={place.photo.thumb || place.photo.marker}
            onFail={() => setPhotoFailed(true)}
          />
        ) : (
          place.title.charAt(0)
        )}
      </span>
      <span className="v2-hover-copy">
        <small>
          <i style={{ backgroundColor: category.color }} />
          {category.label}
        </small>
        <strong>{place.title}</strong>
        {meta ? <span>{meta}</span> : null}
        {place.photo && !photoFailed ? <PhotoCredit photo={place.photo} /> : null}
      </span>
    </div>
  );
}
