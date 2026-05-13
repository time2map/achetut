import { View, Animated, PanResponder, Dimensions, ActivityIndicator, Text, Pressable, Keyboard } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EdgeInsets } from 'react-native-safe-area-context';

import { panelStyles } from './panel.styles';
import PlaceInfo from '@features/google-ai/components/place-info/place-info';
import Places from '../places/places';

import { useInfoPlaceStore } from '@features/google-ai/store/info-place';
import { useStreetPlaceStore } from '@features/google-ai/store/street-place';
import { useTopsStore } from '@features/google-ai/store/top';
import { useWhatIsHereStore } from '@features/google-ai/store/what-is-here';
import { useAiSettingsStore } from '@features/google-ai/store/ai-settings';

import { IGooglePlace } from '@features/google-ai/types/google-place';
import { IStreetPlace } from '@features/google-ai/types/street-place';
import { TCurrentPlace } from '@features/google-ai/types/map';

import { askAI } from '@features/google-ai/api/ask-AI';
import { buildGPTPromptAboutPlaces } from '@features/google-ai/utils/prompts';

import { colors } from '@shared/styles/tokens';
import CrossIcon from '../icons/cross-icon';
import { PanelMode } from '@features/google-ai/page/map-screen';

type PanelProps = {
  insets: EdgeInsets;
  isShowMenu: boolean;
  startCollapsed: boolean;
  openNonce: number;
  onHidden?: () => void;
  onClose: () => void;
  handleCenterOnGeo: (center: { latitude: number; longitude: number }, zoom: number) => void;
  isLoading: boolean;
  panelMode: PanelMode;
};

const Panel = ({
  insets,
  isShowMenu,
  startCollapsed,
  openNonce,
  onHidden,
  onClose,
  handleCenterOnGeo,
  isLoading,
  panelMode
}: PanelProps) => {
  const dragY = useRef(new Animated.Value(0)).current;

  const { clearPlace, place, setPlace } = useInfoPlaceStore();
  const { clear: clearStreet, streetPlace } = useStreetPlaceStore();
  const { selectedTopPlace, clearSelectedPlace, topPlacesAI, topPlacesGoogle } = useTopsStore();
  const { selectedWhatIsHerePlaces, whatIsHerePlaces } = useWhatIsHereStore();
  const { openAiModel } = useAiSettingsStore();

  const [placeDescription, setPlaceDescription] = useState('');
  const [isFullyOpen, setIsFullyOpen] = useState(false); // fully open = step3
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isShowButtonBack, setIsShowButtonBack] = useState(false);

  const [currentPlace, setCurrentPlace] = useState<TCurrentPlace>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const listScrollYRef = useRef(0);
  const lastDescKeyRef = useRef<string | null>(null);

  const windowH = Dimensions.get('window').height;

  const TOP_GAP = 8;
  const topOffset = insets.top + TOP_GAP;

  // VISIBLE panel height (content area), in px
  const SNAP_VISIBLE = {
    closed: 0,
    small: 151,
    step2: 394,
    step3: 795
  } as const;

  // visibleHeight(px) -> translateY offset.
  // We add insets.bottom so the panel never overlaps the iOS home indicator.
  const offsetFromVisible = (visiblePx: number) => Math.max(topOffset, windowH - (visiblePx + insets.bottom));

  const smallOffset = useMemo(() => offsetFromVisible(SNAP_VISIBLE.small), [windowH, insets.bottom, topOffset]);
  const step2Offset = useMemo(() => offsetFromVisible(SNAP_VISIBLE.step2), [windowH, insets.bottom, topOffset]);
  const step3Offset = useMemo(() => offsetFromVisible(SNAP_VISIBLE.step3), [windowH, insets.bottom, topOffset]);

  // Closed state — fully below the screen, with a small extra margin.
  const closedOffset = windowH + insets.bottom + 40;

  // Top-to-bottom order: step3 -> step2 -> small -> closed.
  const SNAP_POINTS = useMemo(
    () => [step3Offset, step2Offset, smallOffset, closedOffset] as const,
    [step3Offset, step2Offset, smallOffset, closedOffset]
  );

  // Current panel position (translateY).
  const dragOffsetRef = useRef(step2Offset);

  const nearestSnap = (value: number) => {
    let best = SNAP_POINTS[0];
    let bestDist = Math.abs(value - best);
    for (const p of SNAP_POINTS) {
      const d = Math.abs(value - p);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  };

  const nextSnap = (from: number, direction: 'up' | 'down') => {
    const idx = SNAP_POINTS.findIndex((p) => p === from);
    if (idx === -1) return nearestSnap(from);
    if (direction === 'up') return SNAP_POINTS[Math.max(0, idx - 1)];
    return SNAP_POINTS[Math.min(SNAP_POINTS.length - 1, idx + 1)];
  };

  const animateTo = useCallback(
    (target: number, onEnd?: () => void) => {
      Animated.spring(dragY, {
        toValue: target,
        useNativeDriver: true,
        damping: 14,
        stiffness: 150,
        overshootClamping: true
      }).start(() => {
        if (onEnd) onEnd();
      });
    },
    [dragY]
  );

  const closePanel = useCallback(() => {
    dragOffsetRef.current = closedOffset;
    setIsFullyOpen(false);
    animateTo(closedOffset, onClose);
  }, [animateTo, closedOffset, onClose]);

  // Open/close the menu.
  useEffect(() => {
    // isShowMenu=true:  start at step2 when startCollapsed, otherwise at step3.
    // isShowMenu=false: animate to closed.
    const initialOffset = isShowMenu ? (startCollapsed ? step2Offset : step3Offset) : closedOffset;

    dragOffsetRef.current = initialOffset;
    dragY.setValue(initialOffset);

    setIsFullyOpen(initialOffset === step3Offset);
    listScrollYRef.current = 0;

    animateTo(initialOffset);
  }, [isShowMenu, startCollapsed, step2Offset, step3Offset, closedOffset, animateTo, openNonce]);

  // Sync currentPlace with whichever store currently holds the active place.
  useEffect(() => {
    if (place || streetPlace || selectedTopPlace || selectedWhatIsHerePlaces) {
      setPhotos([]);
      setCurrentPlace(place ?? streetPlace ?? selectedTopPlace ?? selectedWhatIsHerePlaces);
    } else {
      setCurrentPlace(null);
    }
  }, [place, streetPlace, selectedTopPlace, selectedWhatIsHerePlaces]);

  // Show the "Back" button whenever a list is available behind the current place.
  useEffect(() => {
    const hasPlaces =
      (whatIsHerePlaces.length > 0 || topPlacesGoogle.length > 0 || topPlacesAI.length > 0) && Boolean(currentPlace);
    setIsShowButtonBack(hasPlaces);
  }, [whatIsHerePlaces, topPlacesGoogle, topPlacesAI, currentPlace]);

  const hasAnyPlaces = topPlacesAI.length > 0 || topPlacesGoogle.length > 0 || whatIsHerePlaces.length > 0;

  const handleListScroll = (e: any) => {
    listScrollYRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
  };

  const handleBack = () => {
    clearPlace();
    clearStreet();
    clearSelectedPlace();

    setCurrentPlace(null);
    setPhotos([]);
    setPlaceDescription('');
    lastDescKeyRef.current = null;

    listScrollYRef.current = 0;
  };

  const handlePressPlace = (p: TCurrentPlace) => {
    setPlaceDescription('');
    lastDescKeyRef.current = null;

    const isGooglePlace = p && (p as IGooglePlace);
    setPhotos(isGooglePlace ? (p as any)?.photos?.map((ph: any) => ph.url) ?? [] : []);

    if (p && 'placeId' in p) {
      setPlace(p);
      handleCenterOnGeo((p as any)?.location, 0.01);
    }
    setCurrentPlace(p);
  };

  // Panel drag gestures.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontal) return false;

        const isSwipeDown = gestureState.dy > 1;
        const isSwipeUp = gestureState.dy < -1;

        const isPanelTop = dragOffsetRef.current === step3Offset;

        // If a place detail is open, allow swipe-down so the user can drag the panel back down.
        if (currentPlace && isSwipeDown) return true;

        // When the panel is at the top and the inner list isn't at the top, let the list scroll.
        if (isPanelTop) {
          const listAtTop = listScrollYRef.current <= 0;
          return isSwipeDown && listAtTop;
        }

        // Otherwise vertical swipes move the panel.
        return Math.abs(gestureState.dy) > 1 || isSwipeUp;
      },

      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontal) return false;

        const isSwipeDown = gestureState.dy > 1;
        const isPanelTop = dragOffsetRef.current === step3Offset;

        if (currentPlace && isSwipeDown) return true;

        if (isPanelTop) {
          const listAtTop = listScrollYRef.current <= 0;
          return isSwipeDown && listAtTop;
        }

        return Math.abs(gestureState.dy) > 1;
      },

      onPanResponderMove: (_, gestureState) => {
        const base = dragOffsetRef.current + gestureState.dy;

        // Clamp between the top (step3) and the closed position (bottom).
        const next = Math.min(Math.max(step3Offset, base), closedOffset);
        dragY.setValue(next);
      },

      onPanResponderRelease: (_, gestureState) => {
        dragY.stopAnimation();

        const current = dragOffsetRef.current + gestureState.dy;
        const clamped = Math.min(Math.max(step3Offset, current), closedOffset);

        const swipeUp = gestureState.dy < -50;
        const swipeDown = gestureState.dy > 50;

        let target: number;

        if (swipeUp) {
          target = nextSnap(dragOffsetRef.current, 'up');
        } else if (swipeDown) {
          target = nextSnap(dragOffsetRef.current, 'down');
        } else {
          target = nearestSnap(clamped);
        }

        dragOffsetRef.current = target;
        setIsFullyOpen(target === step3Offset);

        if (target === closedOffset) {
          setIsFullyOpen(false);
          animateTo(target);
          onHidden?.();
          return;
        }

        animateTo(target);
      }
    })
  ).current;

  // Load the AI-generated description for the current place.
  useEffect(() => {
    setPlaceDescription('');
    setIsLoadingPrompt(true);

    if (!currentPlace || (!currentPlace?.id && !(currentPlace as IGooglePlace)?.placeId)) {
      setIsLoadingPrompt(false);
      return;
    }

    const name = (currentPlace as any).displayName;
    const city = (currentPlace as IStreetPlace).city;
    const coords = (currentPlace as IStreetPlace).location;
    const country = (currentPlace as IStreetPlace).country;

    const key = `${(currentPlace as any).id ?? (currentPlace as any).placeId}-${(currentPlace as any).displayName}`;

    if (lastDescKeyRef.current === key) {
      setIsLoadingPrompt(false);
      return;
    }
    lastDescKeyRef.current = key;

    const loadDescription = async () => {
      try {
        const { system, user } = buildGPTPromptAboutPlaces({ name, coords, city, country });
        const response = await askAI<{ description?: string }>({
          prompt: user,
          systemPrompt: system,
          model: openAiModel
        });

        if (response) {
          const desc = typeof response === 'string' ? response : response.description ?? '';
          setPlaceDescription(desc);
        }
      } catch {
        setPlaceDescription('');
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    loadDescription();
  }, [currentPlace?.id, (currentPlace as any)?.placeId, (currentPlace as any)?.displayName]);

  const animatedPanelStyle = {
    transform: [{ translateY: dragY }]
  };

  let title = 'Place';
  if (currentPlace?.displayName) {
    title = currentPlace.displayName;
  } else if (panelMode === PanelMode.TopSpots) {
    title = 'Top Spots';
  } else if (panelMode === PanelMode.WhatIsHere) {
    title = 'What’s interesting here?';
  }

  return (
    <Animated.View
      style={[panelStyles.panelFloating, animatedPanelStyle]}
      pointerEvents={isShowMenu ? 'box-none' : 'none'}
      {...panResponder.panHandlers}>
      <View style={panelStyles.backdrop}>
        <View
          style={[panelStyles.wrapper]}
          onTouchStart={Keyboard.dismiss}>
          <View style={panelStyles.shutterWrapper}>
            <View style={panelStyles.shutter} />
          </View>
          <View style={panelStyles.header}>
            <Text style={panelStyles.headerTitle}>{title}</Text>

            <Pressable
              style={panelStyles.closeButton}
              onPress={() => {
                if (isShowButtonBack) {
                  handleBack();
                } else {
                  closePanel();
                }
              }}
              hitSlop={10}>
              <CrossIcon
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={panelStyles.loading}>
              <ActivityIndicator
                size="large"
                color={colors.textPrimary}
              />
              <Text>Loading...</Text>
            </View>
          ) : (
            <>
              {currentPlace ? (
                <PlaceInfo
                  place={currentPlace}
                  isLoadingPrompt={isLoadingPrompt}
                  placeDescription={placeDescription}
                  photos={photos}
                  isScrollEnabled={isFullyOpen}
                  onScroll={handleListScroll}
                />
              ) : null}

              {!currentPlace && (
                <View style={{ marginTop: 20 }}>
                  {topPlacesAI.length > 0 && (
                    <Places
                      places={topPlacesAI}
                      onPressPlace={(p) => setCurrentPlace(p)}
                      isAiPlace={true}
                      isScrollEnabled={isFullyOpen}
                      onScroll={handleListScroll}
                    />
                  )}

                  {topPlacesGoogle.length > 0 && (
                    <Places
                      places={topPlacesGoogle}
                      onPressPlace={handlePressPlace}
                      isAiPlace={false}
                      isScrollEnabled={isFullyOpen}
                      onScroll={handleListScroll}
                    />
                  )}

                  {whatIsHerePlaces.length > 0 && (
                    <Places
                      places={whatIsHerePlaces}
                      onPressPlace={handlePressPlace}
                      isAiPlace={false}
                      isScrollEnabled={isFullyOpen}
                      onScroll={handleListScroll}
                    />
                  )}

                  {!hasAnyPlaces && (
                    <View style={panelStyles.block}>
                      <Text style={panelStyles.descriptionText}>No places found</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default Panel;
