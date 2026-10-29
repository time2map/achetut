import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Archi2goLogo } from '../Archi2goLogo';
import { Time2mapMark } from '../Time2mapMark';
import { APP_VERSION_LABEL, TIME2MAP_URL } from './config';
import { Icon } from './ui';

export function AppMenu({ onOpen, onAbout }: { onOpen?: () => void; onAbout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === 'Tab') {
      close(false);
      return;
    }
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === 'ArrowDown' ? index + 1
      : event.key === 'ArrowUp' ? index - 1
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : null;
    if (next === null || !items.length) return;
    event.preventDefault();
    items[(next + items.length) % items.length].focus();
  };

  return (
    <div
      ref={rootRef}
      className={`v2-app-menu${isOpen ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="v2-app-menu-trigger"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) return close(false);
          setIsOpen(true);
          onOpen?.();
        }}>
        <Icon name="menu" />
      </button>
      {isOpen ? (
        <div
          ref={menuRef}
          className="v2-app-menu-list"
          role="menu"
          aria-label="Archi2go"
          onKeyDown={onMenuKeyDown}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onAbout();
            }}>
            About Archi2go
          </button>
          <button
            type="button"
            role="menuitem"
            disabled>
            Contact us
          </button>
          <a
            role="menuitem"
            href="/privacy">
            Privacy policy
          </a>
          <a
            role="menuitem"
            href={TIME2MAP_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => close(false)}>
            time2map.com
            <Icon name="external" />
          </a>
          <p className="v2-app-menu-version">{APP_VERSION_LABEL}</p>
        </div>
      ) : null}
    </div>
  );
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="v2-about"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section
        className="v2-about-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v2-about-title">
        <button
          ref={closeRef}
          type="button"
          className="v2-about-close"
          aria-label="Close"
          onClick={onClose}>
          <Icon name="close" />
        </button>
        <Archi2goLogo />
        <p className="v2-about-eyebrow">Independent city guides</p>
        <h2 id="v2-about-title">Good places, with a reason to go.</h2>
        <p>
          Archi2go gathers architecture, public spaces and unusual city stories into one concise map. Every place is
          thoughtfully selected, researched and presented with a clear reason to visit.
        </p>
        <dl className="v2-about-facts">
          <div>
            <dt>Photos</dt>
            <dd>Wikimedia Commons, credited on each photo</dd>
          </div>
          <div>
            <dt>Map</dt>
            <dd>© Mapbox © OpenStreetMap contributors</dd>
          </div>
        </dl>
        <div className="v2-about-actions">
          <button
            type="button"
            className="v2-about-primary"
            disabled>
            <Icon name="message" />
            Contact us
          </button>
          <a href="/privacy">Privacy policy</a>
        </div>
        <footer className="v2-about-footer">
          <a
            className="v2-time2map"
            href={TIME2MAP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="time2map — Maps and GIS solutions">
            <span aria-hidden="true">by</span>
            <Time2mapMark className="v2-time2map-mark" />
            <span>time2map</span>
          </a>
        </footer>
      </section>
    </div>
  );
}
