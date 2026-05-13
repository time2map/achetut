import { useUserLocation } from '@shared/hooks/useUserLocation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { MapPressEvent, type PoiClickEvent } from 'react-native-maps';
import { getInitialRegion } from '@shared/utils/region';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { spacing } from '@shared/styles/tokens';
import Constants from 'expo-constants';
import { mapContainer } from '@features/google-ai/styles/map.styles';
import Panel from '@features/google-ai/components/panel/panel';
import MenuButton from '@features/google-ai/components/menu-button/menu-button';
import SkipButton from '@features/google-ai/components/skip-button/skip-button';
import LocationButton from '@features/google-ai/components/location-button/location-button';
import WhatButton from '@features/google-ai/components/what-button/what-button';
import { useWhatIsHereStore } from '../store/what-is-here';
import { useInfoPlaceStore } from '../store/info-place';
import TopButton from '../components/top-button/top-button';
import { useTopsStore } from '../store/top';
import { useStreetPlaceStore } from '../store/street-place';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiveUserLocation } from '@shared/hooks/useUserLiveLocation';
import { LocationAccuracy } from 'expo-location';
import MarkerComponent from '../ui/marker/marker';
import { OPENAI_MODELS, WHAT_IS_HERE_PLACES_TYPES } from '../utils/constants';
import { TCitySuggestion } from '../store/autocomplete';
import { fetchPhotonReversePlace } from '../api/geocode-photon-place';
import { useModeStore } from '../store/mode';
import MarkerPlaces from '@features/google-ai/components/marker-places/marker-places';
import { INearbyPlace } from '../types/nearby-place';
import { IGooglePlace } from '../types/google-place';
import { IAIPlace } from '../types/ai-place';
import Toast from '../components/toast/toast';
import useCatchErrors from '../hooks/use-catch-errors';
import { MapMemo } from './map-memo';
import SearchInput from '../components/search-input/search-input';
import { DEFAULT_OPENAI_MODEL, useAiSettingsStore } from '../store/ai-settings';
import { env } from '@shared/config/env';
import { useInstallationIdStore } from '@shared/store/installation-id';

export enum PanelMode {
  TopSpots = 'top-spots',
  WhatIsHere = 'what-is-here',
  Place = 'place'
}

const MapScreen = () => {
  const mapRef = useRef<MapView | null>(null);
  const { coords } = useUserLocation();
  const initialRegion = useMemo(() => getInitialRegion(coords), [coords]);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [panelOpenNonce, setPanelOpenNonce] = useState(0);
  const [isPanelHidden, setIsPanelHidden] = useState(false);
  const insets = useSafeAreaInsets();
  const windowH = Dimensions.get('window').height;
  const modelButtonTop = insets.top + 90;
  const [mapPadding, setMapPadding] = useState({
    top: insets.top,
    right: insets.right + 16,
    bottom: insets.bottom + 20,
    left: insets.left + 16
  });
  const [panelStartCollapsed, setPanelStartCollapsed] = useState(true);
  const [hasNotification, setHasNotification] = useState(false);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [currentUserPlace, setCurrentUserPlace] = useState<{} | null>(null);
  const [cachedTopPlaces, setCachedTopPlaces] = useState<{ google: IGooglePlace[]; ai: IAIPlace[] }>({
    google: [],
    ai: []
  });
  const hasFetchedUserPlaceRef = useRef(false);
  const previousPlaceRef = useRef<typeof place | null>(null);
  const previousNearbyRef = useRef<typeof whatIsHerePlaces | null>(null);
  const previousTopRef = useRef<typeof topPlacesGoogle | null>(null);
  const previousStreetRef = useRef<typeof streetPlace | null>(null);
  const skipNextMapPressRef = useRef(false);
  const {
    clearWhatIsHerePlacesResults,
    searchWhatIsHerePlaces,
    whatIsHerePlaces,
    isLoading: isLoadingWhatIsHerePlaces,
    setSelectedWhatIsHerePlaces,
    selectedWhatIsHerePlaces
  } = useWhatIsHereStore();
  const { fetchPlace, place, clearPlace, isLoading: isLoadingInfoPlace, setPlace } = useInfoPlaceStore();
  const { mode } = useModeStore();
  const { openAiModel, setOpenAiModel, clearCache } = useAiSettingsStore();
  const { ensureInstallationId } = useInstallationIdStore();
  const {
    fetchTopPlaces,
    topPlacesGoogle,
    topPlacesAI,
    clearPlaces: clearTopPlaces,
    setPlaces: setTopPlaces,
    selectTopPlace,
    isLoading: isLoadingTopPlaces
  } = useTopsStore();
  const { fetchStreetPlace, streetPlace, isLoading: isLoadingStreet, clear: clearStreet } = useStreetPlaceStore();
  const { errorPopup, setErrorPopup } = useCatchErrors();
  const liveCoords = useLiveUserLocation({
    minDistanceMeters: 50,
    accuracy: LocationAccuracy.Balanced
  });
  const isSkipButtonVisible = useMemo(() => {
    return (
      place ||
      streetPlace ||
      whatIsHerePlaces.length > 0 ||
      topPlacesGoogle.length > 0 ||
      topPlacesAI.length > 0 ||
      selectedWhatIsHerePlaces
    );
  }, [place, streetPlace, whatIsHerePlaces, topPlacesGoogle, topPlacesAI, selectedWhatIsHerePlaces]);
  const isAdmin = Boolean(env.xUserId);
  const modelOptions = useMemo(() => OPENAI_MODELS, []);
  const cityZoomLevel = 0.2;
  const districtZoomLevel = 0.01;

  useEffect(() => {
    ensureInstallationId();
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    setOpenAiModel(DEFAULT_OPENAI_MODEL);
    clearCache();
  }, [isAdmin, setOpenAiModel, clearCache]);

  const handleLongPress = () => {};
  const handleDrag = () => {};

  const openPanel = useCallback((startCollapsed: boolean = true) => {
    setPanelStartCollapsed(startCollapsed);
    setIsShowMenu(true);
    setIsPanelHidden(false);
    setPanelOpenNonce((prev) => prev + 1);
  }, []);

  const handleMapPress = async (event: MapPressEvent) => {
    if (skipNextMapPressRef.current) {
      skipNextMapPressRef.current = false;
      return;
    }
    Keyboard.dismiss();
    openPanel(true);
    clearPlace();

    handleCenterOnGeo(event.nativeEvent.coordinate, districtZoomLevel);
    await fetchStreetPlace(
      {
        latitude: event.nativeEvent.coordinate.latitude,
        longitude: event.nativeEvent.coordinate.longitude
      },
      mode
    );
  };

  const handleCenterOnGeo = useCallback(
    (
      center: { latitude: number; longitude: number },
      zoomLevel: number = cityZoomLevel, // use small numbers!
      bottomOffset: number = Math.round(windowH / 2)
    ) => {
      if (!mapRef.current) return;
      const { width, height } = Dimensions.get('window');

      // Offset multiplier used to nudge the camera up so the panel doesn't cover the target.
      // Tune this value if the target ends up too high or too low under the panel.
      const OFFSET_MULTIPLIER = 0.000005;

      const latitudeOffset = bottomOffset * OFFSET_MULTIPLIER;
      const adjustedCenter = {
        ...center,
        latitude: center.latitude - latitudeOffset
      };

      const longitudeDelta = zoomLevel * (width / height);
      // zoomLevel reference (latitudeDelta):
      //   0.1   — city overview
      //   0.05  — district
      //   0.01  — streets
      //   0.005 — a few buildings
      //   0.001 — single building
      mapRef.current.animateToRegion(
        {
          ...adjustedCenter,
          latitudeDelta: zoomLevel,
          longitudeDelta
        },
        500
      );
    },
    [windowH]
  );

  useEffect(() => {
    if (coords && mapRef.current) {
      const region = getInitialRegion(coords);
      mapRef.current.animateToRegion(region, 500);
    }
    clearPlace();
    clearWhatIsHerePlacesResults();
  }, [coords]);

  const handlePoiClick = async (event: PoiClickEvent) => {
    skipNextMapPressRef.current = true;
    clearStreet();
    Keyboard.dismiss();
    handleCenterOnGeo(event.nativeEvent.coordinate, districtZoomLevel);
    await fetchPlace({
      placeId: event.nativeEvent.placeId,
      name: event.nativeEvent.name,
      coords: event.nativeEvent.coordinate
    });
    openPanel(true);
    setPanelMode(PanelMode.Place);
  };

  const handleClearMap = useCallback(() => {
    setHasNotification(false);
    clearWhatIsHerePlacesResults();
    clearPlace();
    clearTopPlaces();
    clearStreet();
  }, []);

  const handleSearchNearbyAIPlaces = useCallback(async () => {
    if (!liveCoords) return;

    const props = (currentUserPlace as any)?.features?.[0]?.properties ?? {};
    const cityName = props.city ?? props.town ?? props.village ?? '';

    const nearbyPlaces = await searchWhatIsHerePlaces({
      location: { lat: liveCoords?.latitude ?? 0, lng: liveCoords?.longitude ?? 0 },
      radius: 300,
      includedTypes: WHAT_IS_HERE_PLACES_TYPES,
      maxResultCount: 20,
      city: cityName
    });
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      handleCenterOnGeo(liveCoords, districtZoomLevel);
      openPanel(true);
      clearStreet();
      clearTopPlaces();
      clearPlace();
    }
  }, [searchWhatIsHerePlaces, liveCoords, currentUserPlace]);

  const handleSearchTopPlaces = useCallback(
    async (selectedPlace: TCitySuggestion) => {
      clearStreet();
      clearPlace();
      clearWhatIsHerePlacesResults();
      setSelectedWhatIsHerePlaces(null);
      selectTopPlace(null);

      const topPlaces = await fetchTopPlaces(selectedPlace, mode);
      if (topPlaces && topPlaces.length === 0) {
        setErrorPopup({
          title: 'No top places found',
          // status: 404,
          message: 'No top places found for the selected place'
        });
      } else if (topPlaces) {
        openPanel(true);
        handleCenterOnGeo(
          { latitude: selectedPlace.coords.latitude, longitude: selectedPlace.coords.longitude },
          cityZoomLevel
        );
      }
    },
    [fetchTopPlaces]
  );

  const handlePressMenuButton = () => {
    if (!isShowMenu) {
      setPanelStartCollapsed(false); // open the panel fully
      setIsShowMenu(true);
    } else {
      setIsShowMenu(false);
    }
    Keyboard.dismiss();
  };

  useEffect(() => {
    const placeChanged = place && place !== previousPlaceRef.current;
    const nearbyChanged = whatIsHerePlaces !== previousNearbyRef.current;
    const topChanged = topPlacesGoogle !== previousTopRef.current;
    const streetChanged = streetPlace && streetPlace !== previousStreetRef.current;

    if (placeChanged || nearbyChanged || topChanged || streetChanged) {
      if (
        !isShowMenu &&
        (place || streetPlace || whatIsHerePlaces.length > 0 || topPlacesGoogle.length > 0 || topPlacesAI.length > 0)
      ) {
        setHasNotification(true);
      }
      previousPlaceRef.current = place;
      previousNearbyRef.current = whatIsHerePlaces;
      previousTopRef.current = topPlacesGoogle;
      previousStreetRef.current = streetPlace;
    }
  }, [place, whatIsHerePlaces, topPlacesGoogle, topPlacesAI, streetPlace, isShowMenu]);

  useEffect(() => {
    if (isShowMenu) {
      setHasNotification(false);
    }
  }, [isShowMenu]);

  const streetMarker = useMemo(() => {
    if (!streetPlace) return null;
    return (
      <MarkerComponent
        id={streetPlace.id}
        isSelected={true}
        isTrackViewChanges={true}
        coordinate={{
          latitude: streetPlace.location.latitude,
          longitude: streetPlace.location.longitude
        }}
        title={streetPlace.displayName ?? 'Street'}
        zIndex={1000}
        onPress={() => {
          skipNextMapPressRef.current = true;
          openPanel(true);
        }}
      />
    );
  }, [streetPlace, openPanel]);

  const placeMarker = useMemo(() => {
    if (!place) return null;
    return (
      <MarkerComponent
        isTrackViewChanges={true}
        id={place.placeId}
        isSelected={true}
        coordinate={{
          latitude: place.location.latitude,
          longitude: place.location.longitude
        }}
        title={place.displayName ?? 'Place'}
        zIndex={1000}
        onPress={() => {
          skipNextMapPressRef.current = true;
          openPanel(true);
        }}
      />
    );
  }, [place, openPanel]);

  const [isCentering, setIsCentering] = useState(false);

  const canCenter = Boolean(liveCoords) && !isCentering;

  const onPressCenterToUser = useCallback(() => {
    if (!liveCoords || isCentering) return;

    setIsCentering(true);

    handleCenterOnGeo({ latitude: liveCoords.latitude, longitude: liveCoords.longitude }, districtZoomLevel, 20);

    // animateCamera doesn't return a promise, so we drop the loader on a timer.
    // Keep this duration in sync with the animateCamera `duration` argument.
    setTimeout(() => setIsCentering(false), 550);
  }, [liveCoords, isCentering, handleCenterOnGeo]);

  const isLocationButtonLoading = useMemo(() => {
    // No coords yet — show loading state.
    if (!liveCoords) return true;
    // Currently centering — also loading.
    return isCentering;
  }, [liveCoords, isCentering]);

  useEffect(() => {
    if (
      whatIsHerePlaces.length === 0 &&
      topPlacesGoogle.length === 0 &&
      topPlacesAI.length === 0 &&
      streetPlace === null &&
      place === null
    ) {
      setHasNotification(false);
    }
  }, [place, whatIsHerePlaces, topPlacesGoogle, topPlacesAI, streetPlace]);

  useEffect(() => {
    if (!liveCoords || hasFetchedUserPlaceRef.current) return;
    hasFetchedUserPlaceRef.current = true;
    let cancelled = false;

    const fetchCity = async () => {
      try {
        const data = await fetchPhotonReversePlace(liveCoords.latitude, liveCoords.longitude, 1);
        if (!cancelled) {
          setCurrentUserPlace(data);
        }
      } catch {
        if (!cancelled) {
          setCurrentUserPlace(null);
        }
      }
    };

    fetchCity();
    return () => {
      cancelled = true;
    };
  }, [liveCoords]);

  const [panelMode, setPanelMode] = useState<PanelMode>(PanelMode.Place);
  const hasCachedTopPlaces = cachedTopPlaces.google.length > 0 || cachedTopPlaces.ai.length > 0;

  return (
    <View style={mapContainer.container}>
      <MapMemo
        ref={mapRef}
        onPoiClick={handlePoiClick}
        coords={coords}
        initialRegion={initialRegion}
        mapPadding={mapPadding}
        onMapPress={(event) => {
          if (event?.nativeEvent?.action === 'marker-press') return;
          handleMapPress(event);
          setPanelMode(PanelMode.Place);
        }}>
        {streetMarker}
        {placeMarker}

        {whatIsHerePlaces.length > 0 && (
          <MarkerPlaces
            markerPlaces={whatIsHerePlaces}
            selectedPlaceId={place?.placeId ?? null}
            onPress={(place) => {
              skipNextMapPressRef.current = true;
              clearStreet();
              setPlace(place as INearbyPlace);
              openPanel(true);
              handleCenterOnGeo(place.location, districtZoomLevel);
              setPanelMode(PanelMode.Place);
            }}
          />
        )}

        {topPlacesGoogle && topPlacesGoogle.length > 0 && (
          <MarkerPlaces
            markerPlaces={topPlacesGoogle}
            selectedPlaceId={place?.placeId ?? null}
            onPress={(place) => {
              skipNextMapPressRef.current = true;
              clearStreet();
              setPlace(place as INearbyPlace);
              openPanel(true);
              handleCenterOnGeo(place.location, districtZoomLevel);
            }}
          />
        )}
      </MapMemo>
      {/* <MenuButton
        onPress={handlePressMenuButton}
        isActive={isShowMenu}
        isLoading={isLoading || isLoadingTopPlaces || isLoadingInfoPlace || isLoadingStreet}
        hasNotification={hasNotification}
      /> */}
      {/* {isSkipButtonVisible ? (
        <SkipButton
          disabled={false}
          onPress={() => handleClearMap()}
        />
      ) : null} */}

      <View
        style={[mapContainer.bottomButtons, { bottom: insets.bottom }]}
        pointerEvents="box-none">
        <WhatButton
          onPress={() => {
            clearTopPlaces();
            setPanelMode(PanelMode.WhatIsHere);

            if (isPanelHidden) {
              setPanelMode(PanelMode.WhatIsHere);

              openPanel(true);
              return;
            }
            openPanel(true);
            handleSearchNearbyAIPlaces();
          }}
          nearbyPlacesLength={whatIsHerePlaces.length}
          isLoading={isLoadingWhatIsHerePlaces}
          disabled={isLoadingTopPlaces}
        />
        <TopButton
          onOpen={() => {
            openPanel(true);
            if (hasCachedTopPlaces) {
              setTopPlaces(cachedTopPlaces.google, cachedTopPlaces.ai);
            }
            setIsSearch(true);
            setPanelMode(PanelMode.TopSpots);
          }}
          isLoading={isLoadingTopPlaces}
          disabled={isLoadingWhatIsHerePlaces || isLoadingTopPlaces}
        />

        <LocationButton
          disabled={!canCenter}
          isLoading={isLocationButtonLoading}
          onPress={onPressCenterToUser}
        />
      </View>
      {/* {appVersion && (
        <View style={[mapContainer.versionBadge, { bottom: insets.bottom + spacing.xxxl + 23 }]}>
          <Text style={mapContainer.versionText}>v {appVersion}</Text>
        </View>
      )} */}
      {isAdmin && (
        <View
          style={[mapContainer.modelButtonWrapper, { top: modelButtonTop }]}
          pointerEvents="box-none">
          <Pressable
            style={mapContainer.modelButton}
            onPress={() => setIsModelSheetOpen(true)}
            hitSlop={10}>
            <Text style={mapContainer.modelButtonText}>{openAiModel}</Text>
          </Pressable>
        </View>
      )}
      <SearchInput
        insets={insets}
        isSearch={isSearch}
        onSearchPlace={handleSearchTopPlaces}
        autoSubmitOnOpen={!hasCachedTopPlaces}
        onRequestClose={() => setIsSearch(false)}
        currentUserPlace={currentUserPlace}
      />
      <Panel
        insets={insets}
        isShowMenu={isShowMenu}
        startCollapsed={panelStartCollapsed}
        openNonce={panelOpenNonce}
        onHidden={() => setIsPanelHidden(true)}
        onClose={() => {
          if (panelMode === PanelMode.TopSpots && (topPlacesGoogle.length > 0 || topPlacesAI.length > 0)) {

            setCachedTopPlaces({ google: topPlacesGoogle, ai: topPlacesAI });
          }
          handleClearMap();
          setIsShowMenu(false);
          setIsPanelHidden(false);
          setIsSearch(false);
        }}
        panelMode={panelMode}
        handleCenterOnGeo={handleCenterOnGeo}
        isLoading={isLoadingWhatIsHerePlaces || isLoadingTopPlaces || isLoadingInfoPlace || isLoadingStreet}
      />
      {errorPopup ? (
        <Toast
          title={errorPopup.title}
          status={errorPopup.status}
          message={errorPopup.message}
          close={() => setErrorPopup(null)}
        />
      ) : null}
      <Modal
        visible={isModelSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModelSheetOpen(false)}>
        <KeyboardAvoidingView
          style={mapContainer.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable
            style={mapContainer.sheetOverlay}
            onPress={() => setIsModelSheetOpen(false)}>
            <Pressable style={[mapContainer.sheet, { paddingTop: insets.bottom + spacing.xl }]}>
              <Text style={mapContainer.sheetTitle}>Settings</Text>
              <View style={mapContainer.sheetDivider} />
              {true ? (
                <>
                  <Text style={mapContainer.sheetLabel}>OpenAI model</Text>
                  {modelOptions.map((option) => {
                    const isSelected = openAiModel === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[mapContainer.sheetOption, isSelected && mapContainer.sheetOptionSelected]}
                        onPress={() => {
                          setOpenAiModel(option.value);
                          setIsModelSheetOpen(false);
                        }}>
                        <Text style={mapContainer.sheetOptionText}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : (
                <Text style={mapContainer.sheetHint}>Model selection requires an admin token.</Text>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default MapScreen;
