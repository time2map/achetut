import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react';
import { MOBILE_QUERY_WIDTH, SHEET_LEVELS, type SheetHeights, type SheetLevel } from './config';
import { getSheetHeights, setMobileSheetPadding, sheetMapPadding } from './mapCamera';

const SHEET_GRIP_SELECTOR = '.v2-sheet-handle, .v2-sidebar-header, .v2-detail-bar';
const SHEET_SCROLL_SELECTOR = '.v2-results, .v2-detail';
const SHEET_IGNORE_SELECTOR = '.v2-city-menu, input, textarea, select';
const SHEET_FLICK_VELOCITY = 0.45;

type SheetGesture = {
  zone: 'grip' | 'content';
  scroller: HTMLElement | null;
  startX: number;
  startY: number;
  startHeight: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  mode: 'pending' | 'drag' | 'ignore';
};

function nearestSheetLevel(heights: SheetHeights, height: number, velocity: number): SheetLevel {
  if (velocity > SHEET_FLICK_VELOCITY) return SHEET_LEVELS.find((level) => heights[level] > height + 8) ?? 'full';
  if (velocity < -SHEET_FLICK_VELOCITY)
    return [...SHEET_LEVELS].reverse().find((level) => heights[level] < height - 8) ?? 'peek';
  return SHEET_LEVELS.reduce(
    (best, level) => (Math.abs(heights[level] - height) < Math.abs(heights[best] - height) ? level : best),
    'half' as SheetLevel
  );
}

// Past the snap points the sheet follows the finger with resistance instead of stopping dead.
function rubberBandSheet(heights: SheetHeights, height: number) {
  if (height > heights.full) return heights.full + (height - heights.full) * 0.2;
  if (height < heights.peek) return Math.max(heights.peek - 48, heights.peek - (heights.peek - height) * 0.2);
  return height;
}

export type MobileSheetApi = {
  isMobileSheet: boolean;
  sheetLevel: SheetLevel;
  sheetHeights: SheetHeights;
  sheetHeightsRef: MutableRefObject<SheetHeights>;
  isMobileSheetRef: MutableRefObject<boolean>;
  sheetLevelRef: MutableRefObject<SheetLevel>;
  mainRef: MutableRefObject<HTMLElement | null>;
  asideRef: MutableRefObject<HTMLElement | null>;
  viewport: { width: number; height: number };
  mainStyle: CSSProperties | undefined;
  changeSheetLevel: (level: SheetLevel) => void;
  cycleSheet: () => void;
  stepSheet: (direction: 1 | -1) => void;
  openMobileSearch: (searchRef: RefObject<HTMLInputElement | null>) => void;
  onSheetMouseDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onAsideClickCapture: (event: React.MouseEvent<HTMLElement>) => void;
  sheetHandleLabel: string;
  focusSearchOnFullRef: MutableRefObject<boolean>;
};

export function useMobileSheet(): MobileSheetApi {
  const mainRef = useRef<HTMLElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const isMobileSheet = viewport.width < MOBILE_QUERY_WIDTH;
  const [sheetLevel, setSheetLevel] = useState<SheetLevel>('half');
  const sheetHeights = useMemo(() => getSheetHeights(viewport.height), [viewport.height]);
  const sheetHeightsRef = useRef(sheetHeights);
  sheetHeightsRef.current = sheetHeights;
  const isMobileSheetRef = useRef(isMobileSheet);
  isMobileSheetRef.current = isMobileSheet;
  setMobileSheetPadding(isMobileSheet ? sheetMapPadding(sheetLevel, sheetHeights) : null);
  const sheetLevelRef = useRef(sheetLevel);
  sheetLevelRef.current = sheetLevel;
  const sheetGestureRef = useRef<SheetGesture | null>(null);
  const sheetFrameRef = useRef(0);
  const suppressSheetClickRef = useRef(false);
  const focusSearchOnFullRef = useRef(false);

  const changeSheetLevel = useCallback((level: SheetLevel) => {
    if (isMobileSheetRef.current) setMobileSheetPadding(sheetMapPadding(level, sheetHeightsRef.current));
    setSheetLevel(level);
  }, []);

  useEffect(() => {
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        setViewport((current) =>
          current.width === window.innerWidth && current.height === window.innerHeight
            ? current
            : { width: window.innerWidth, height: window.innerHeight }
        );
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const cycleSheet = useCallback(() => {
    changeSheetLevel(sheetLevel === 'peek' ? 'half' : sheetLevel === 'half' ? 'full' : 'half');
  }, [changeSheetLevel, sheetLevel]);

  const stepSheet = useCallback(
    (direction: 1 | -1) => {
      const index = SHEET_LEVELS.indexOf(sheetLevel) + direction;
      changeSheetLevel(SHEET_LEVELS[Math.min(SHEET_LEVELS.length - 1, Math.max(0, index))]);
    },
    [changeSheetLevel, sheetLevel]
  );

  // Gesture state lives in refs and DOM styles so dragging never re-renders the list.
  const sheetGesture = useMemo(() => {
    const visibleSheetHeight = () => {
      const main = mainRef.current;
      const aside = asideRef.current;
      if (!main || !aside) return sheetHeightsRef.current[sheetLevelRef.current];
      return main.getBoundingClientRect().bottom - aside.getBoundingClientRect().top;
    };

    const writeHeight = (height: number) => {
      cancelAnimationFrame(sheetFrameRef.current);
      sheetFrameRef.current = requestAnimationFrame(() => {
        mainRef.current?.style.setProperty('--v2-mobile-panel-height', `${Math.round(height)}px`);
      });
    };

    const begin = (target: EventTarget | null, x: number, y: number, time: number) => {
      sheetGestureRef.current = null;
      if (!isMobileSheetRef.current || !(target instanceof Element) || target.closest(SHEET_IGNORE_SELECTOR)) return;
      const grip = target.closest(SHEET_GRIP_SELECTOR);
      const scroller = grip ? null : target.closest<HTMLElement>(SHEET_SCROLL_SELECTOR);
      if (!grip && !scroller) return;
      sheetGestureRef.current = {
        zone: grip ? 'grip' : 'content',
        scroller,
        startX: x,
        startY: y,
        startHeight: visibleSheetHeight(),
        lastY: y,
        lastTime: time,
        velocity: 0,
        mode: 'pending'
      };
    };

    // Returns true while the sheet owns the gesture, so the caller can block native scrolling.
    const move = (x: number, y: number, time: number) => {
      const gesture = sheetGestureRef.current;
      if (!gesture || gesture.mode === 'ignore') return false;
      const dx = x - gesture.startX;
      const dy = gesture.startY - y;
      if (gesture.mode === 'pending') {
        // Blocking the first moves would also kill horizontal scrolling in the filter bar.
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return false;
        const vertical = Math.abs(dy) > Math.abs(dx);
        const level = sheetLevelRef.current;
        const atTop = !gesture.scroller || gesture.scroller.scrollTop <= 0;
        const takes =
          vertical &&
          (gesture.zone === 'grip' || (dy > 0 && level !== 'full') || (dy < 0 && atTop && level !== 'peek'));
        if (!takes) {
          gesture.mode = 'ignore';
          return false;
        }
        gesture.mode = 'drag';
        gesture.startY = y;
        gesture.startHeight = visibleSheetHeight();
        mainRef.current?.classList.add('is-sheet-dragging');
      }
      const elapsed = Math.max(1, time - gesture.lastTime);
      gesture.velocity = gesture.velocity * 0.2 + ((gesture.lastY - y) / elapsed) * 0.8;
      gesture.lastY = y;
      gesture.lastTime = time;
      writeHeight(rubberBandSheet(sheetHeightsRef.current, gesture.startHeight + (gesture.startY - y)));
      return true;
    };

    const end = (y: number, time: number) => {
      const gesture = sheetGestureRef.current;
      sheetGestureRef.current = null;
      if (!gesture || gesture.mode !== 'drag') return;
      cancelAnimationFrame(sheetFrameRef.current);
      // A finger that stopped before lifting shouldn't count as a flick.
      const velocity = time - gesture.lastTime > 90 ? 0 : gesture.velocity;
      const heights = sheetHeightsRef.current;
      const next = nearestSheetLevel(heights, gesture.startHeight + (gesture.startY - y), velocity);
      const main = mainRef.current;
      main?.classList.remove('is-sheet-dragging');
      main?.style.setProperty('--v2-mobile-panel-height', `${heights[next]}px`);
      suppressSheetClickRef.current = true;
      window.setTimeout(() => {
        suppressSheetClickRef.current = false;
      }, 0);
      changeSheetLevel(next);
    };

    return { begin, move, end };
  }, [changeSheetLevel]);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside || !isMobileSheet) return;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        sheetGesture.end(sheetGestureRef.current?.lastY ?? 0, event.timeStamp);
        return;
      }
      const touch = event.touches[0];
      sheetGesture.begin(event.target, touch.clientX, touch.clientY, event.timeStamp);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (sheetGesture.move(touch.clientX, touch.clientY, event.timeStamp) && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      sheetGesture.end(touch?.clientY ?? sheetGestureRef.current?.lastY ?? 0, event.timeStamp);
    };
    aside.addEventListener('touchstart', onTouchStart, { passive: true });
    aside.addEventListener('touchmove', onTouchMove, { passive: false });
    aside.addEventListener('touchend', onTouchEnd);
    aside.addEventListener('touchcancel', onTouchEnd);
    return () => {
      aside.removeEventListener('touchstart', onTouchStart);
      aside.removeEventListener('touchmove', onTouchMove);
      aside.removeEventListener('touchend', onTouchEnd);
      aside.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isMobileSheet, sheetGesture]);

  // Mouse drags (narrow desktop windows) reuse the touch logic, limited to the grip areas.
  const onSheetMouseDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !(event.target as Element).closest(SHEET_GRIP_SELECTOR))
        return;
      sheetGesture.begin(event.target, event.clientX, event.clientY, event.timeStamp);
      if (!sheetGestureRef.current) return;
      const onMove = (moveEvent: PointerEvent) => {
        if (sheetGesture.move(moveEvent.clientX, moveEvent.clientY, moveEvent.timeStamp)) moveEvent.preventDefault();
      };
      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        sheetGesture.end(upEvent.clientY, upEvent.timeStamp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [sheetGesture]
  );

  const onAsideClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressSheetClickRef.current) return;
    suppressSheetClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const openMobileSearch = useCallback(
    (searchRef: RefObject<HTMLInputElement | null>) => {
      focusSearchOnFullRef.current = true;
      if (sheetLevel === 'full') {
        focusSearchOnFullRef.current = false;
        searchRef.current?.focus({ preventScroll: true });
        return;
      }
      changeSheetLevel('full');
    },
    [changeSheetLevel, sheetLevel]
  );

  const mainStyle = isMobileSheet
    ? ({
        '--v2-mobile-panel-height': `${sheetHeights[sheetLevel]}px`,
        '--v2-sheet-full': `${sheetHeights.full}px`,
        '--v2-sheet-settled': `${sheetHeights[sheetLevel]}px`
      } as CSSProperties)
    : undefined;

  return {
    isMobileSheet,
    sheetLevel,
    sheetHeights,
    sheetHeightsRef,
    isMobileSheetRef,
    sheetLevelRef,
    mainRef,
    asideRef,
    viewport,
    mainStyle,
    changeSheetLevel,
    cycleSheet,
    stepSheet,
    openMobileSearch,
    onSheetMouseDown,
    onAsideClickCapture,
    sheetHandleLabel: sheetLevel === 'full' ? 'Collapse panel' : 'Expand panel',
    focusSearchOnFullRef
  };
}
