import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from 'react';
import type { CitySummary } from '../places';
import { CityListSkeleton, Icon, V2Image } from './ui';

function CityThumb({ city }: { city: CitySummary }) {
  const [coverReady, setCoverReady] = useState(false);
  return (
    <span
      className={`v2-city-thumb${coverReady ? ' has-image' : ''}`}
      style={{ backgroundColor: city.art }}
      aria-hidden="true">
      <span>{city.name.charAt(0)}</span>
      <V2Image
        src={city.cover?.thumb}
        onReady={() => setCoverReady(true)}
        onFail={() => setCoverReady(false)}
      />
    </span>
  );
}

export function CitySelect({
  cities,
  city,
  onSelect,
  onOpen,
  pending = false,
  forceOpen = false,
  forceLoading = false
}: {
  cities: CitySummary[];
  city: CitySummary;
  onSelect: (cityId: string) => void;
  onOpen?: () => void;
  pending?: boolean;
  forceOpen?: boolean;
  forceLoading?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [menuReady, setMenuReady] = useState(!forceLoading && !forceOpen);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      cities.findIndex((item) => item.id === city.id)
    )
  );
  const selectedIndex = cities.findIndex((item) => item.id === city.id);

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
    const next = cities[index];
    if (next && next.id !== city.id) onSelect(next.id);
    close();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (forceLoading) {
      setMenuReady(false);
      return;
    }
    const urls = cities.map((item) => item.cover?.thumb).filter((url): url is string => Boolean(url));
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
    const last = cities.length - 1;
    const moveActive = (index: number) => {
      setActiveIndex(index);
      scrollOptionIntoMenu(index);
    };
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(Math.min(last, activeIndex + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(Math.max(0, activeIndex - 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      moveActive(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      moveActive(last);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(activeIndex);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      setIsOpen(false);
      return;
    }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLocaleLowerCase();
      const start = activeIndex + 1;
      const ordered = [...cities.slice(start), ...cities.slice(0, start)];
      const match = ordered.find((item) => item.name.toLocaleLowerCase().startsWith(letter));
      if (match) moveActive(cities.indexOf(match));
    }
  };

  return (
    <div
      ref={rootRef}
      className={`v2-city-select${isOpen ? ' is-open' : ''}`}>
      <span
        className="v2-visually-hidden"
        id="v2-city-select-label">
        City
      </span>
      <button
        ref={triggerRef}
        className={`v2-city-trigger${pending ? ' is-pending' : ''}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-busy={pending}
        aria-labelledby={pending ? undefined : 'v2-city-select-label v2-city-select-value'}
        aria-label={pending ? 'Loading city' : undefined}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={onTriggerKeyDown}>
        {pending ? (
          <span
            className="v2-city-thumb"
            aria-hidden="true">
            <span className="v2-skeleton" />
          </span>
        ) : (
          <CityThumb city={city} />
        )}
        <span
          className="v2-city-trigger-copy"
          id="v2-city-select-value">
          {pending ? (
            <>
              <span className="v2-skel-line is-meta" />
              <span className="v2-skel-line is-title" />
            </>
          ) : (
            <>
              <small>
                {city.country}, {city.placeCount} places
              </small>
              <strong>{city.name}</strong>
            </>
          )}
        </span>
        <Icon name="chevron-down" />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="v2-city-menu"
          role="listbox"
          tabIndex={-1}
          aria-labelledby="v2-city-select-label"
          aria-busy={!menuReady || forceLoading}
          aria-activedescendant={menuReady ? `v2-city-option-${cities[activeIndex]?.id}` : undefined}
          onKeyDown={onListKeyDown}>
          {forceLoading || !menuReady ? (
            <CityListSkeleton count={cities.length} />
          ) : (
            cities.map((item, index) => {
              const isSelected = item.id === city.id;
              return (
                <li
                  key={item.id}
                  id={`v2-city-option-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`${index === activeIndex ? 'is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}>
                  <CityThumb city={item} />
                  <span className="v2-city-option-copy">
                    <strong>{item.name}</strong>
                    <small>{item.country}</small>
                  </span>
                  <span
                    className="v2-city-option-count"
                    aria-label={`${item.placeCount} places`}>
                    {item.placeCount}
                  </span>
                  <span className="v2-city-option-check">{isSelected ? <Icon name="check" /> : null}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
