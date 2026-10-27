import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CATEGORY_META, type CuratedCity, type CuratedPlace, type PlacePhoto } from '../places';
import { largePhotoUrl } from './photoUtils';
import { Icon, PhotoCredit, PreviewLoadingContext, V2Image } from './ui';

export function PhotoLightbox({
  place,
  city,
  initialIndex = 0,
  onClose
}: {
  place: CuratedPlace;
  city: CuratedCity;
  initialIndex?: number;
  onClose: () => void;
}) {
  const previewLoading = useContext(PreviewLoadingContext);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const photos = place.photos;
  const [index, setIndex] = useState(() => Math.min(initialIndex, photos.length - 1));
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const photo = photos[index] as PlacePhoto;
  const src = largePhotoUrl(photo) ?? photo.src ?? photo.thumb;
  const hasMany = photos.length > 1;

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    [photos[index + 1], photos[index - 1]].forEach((neighbour) => {
      if (!neighbour) return;
      new Image().src = largePhotoUrl(neighbour) ?? neighbour.src ?? neighbour.thumb;
    });
  }, [index, photos]);

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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
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
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <button
        ref={closeRef}
        className="v2-lightbox-close"
        type="button"
        onClick={onClose}
        aria-label="Close photo">
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
          }}>
          <img
            key={src}
            src={src}
            alt={`${place.title} in ${city.name}, photo ${index + 1} of ${photos.length}`}
            decoding="async"
            onLoad={() => setLoaded((current) => ({ ...current, [src]: true }))}
            onClick={(event) => event.stopPropagation()}
          />
          {hasMany ? (
            <span
              className="v2-lightbox-counter"
              aria-live="polite">
              {index + 1} / {photos.length}
            </span>
          ) : null}
        </div>
        {hasMany ? (
          <div className="v2-lightbox-controls">
            <button
              className="v2-lightbox-nav is-prev"
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo">
              <Icon name="chevron-down" />
            </button>
            <div
              className="v2-lightbox-thumbs"
              role="group"
              aria-label="Photos">
              {photos.map((item, itemIndex) => (
                <button
                  key={item.page || item.src}
                  className={itemIndex === index ? 'is-active' : ''}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`Photo ${itemIndex + 1}`}
                  aria-current={itemIndex === index}>
                  <V2Image src={item.marker} />
                </button>
              ))}
            </div>
            <button
              className="v2-lightbox-nav is-next"
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo">
              <Icon name="chevron-down" />
            </button>
          </div>
        ) : null}
        <figcaption>
          <span className="v2-lightbox-kicker">
            {CATEGORY_META[place.category].label} — {city.name}
          </span>
          <strong id="v2-lightbox-title">{place.title}</strong>
          <PhotoCredit photo={photo} />
          {photo.page ? (
            <a
              className="v2-lightbox-link"
              href={photo.page}
              target="_blank"
              rel="noreferrer">
              Wikimedia Commons <Icon name="external" />
            </a>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
