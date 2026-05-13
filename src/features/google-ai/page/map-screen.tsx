import { useUserLocation } from '@shared/hooks/useUserLocation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { MapPressEvent, type PoiClickEvent, type Region } from 'react-native-maps';
import { getInitialRegion } from '@shared/utils/region';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { spacing } from '@shared/styles/tokens';
import { mapContainer } from '@features/google-ai/styles/map.styles';
import Panel from '@features/google-ai/components/panel/panel';
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
import { OPENAI_MODELS, WHAT_IS_HERE_PLACES_TYPES } from '../utils/constants';
import { TCitySuggestion } from '../store/autocomplete';
import { fetchPhotonReversePlace } from '../api/geocode-photon-place';
import { useModeStore } from '../store/mode';
import { INearbyPlace } from '../types/nearby-place';
import { IGooglePlace } from '../types/google-place';
import { IAIPlace } from '../types/ai-place';
import Toast from '../components/toast/toast';
import useCatchErrors from '../hooks/use-catch-errors';
import { MapMemo } from '../components/map/map-memo';
import SearchInput from '../components/search-input/search-input';
import { DEFAULT_OPENAI_MODEL, useAiSettingsStore } from '../store/ai-settings';
import { env } from '@shared/config/env';
import { useInstallationIdStore } from '@shared/store/installation-id';
import MarkerTypePoi from '../ui/marker/marker-type-poi/marker-type-poi';
import MarkerTypePlace from '../ui/marker/marker-type-place/marker-type-place';
import PlaceLabelsLayer from '@features/google-ai/ui/labels/place-labels-layer';

export enum PanelMode {
  TopSpots = 'top-spots',
  WhatIsHere = 'what-is-here',
  Place = 'place'
}

function regionToZoom(longitudeDelta: number, mapWidthPx: number) {
  if (!longitudeDelta || longitudeDelta <= 0 || !mapWidthPx) return 0;
  return Math.log2((360 * mapWidthPx) / (longitudeDelta * 256));
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
  const mapWidth = Dimensions.get('window').width;
  const modelButtonTop = insets.top + 90;
  const [mapPadding] = useState({
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
  const [mapZoomLevel, setMapZoomLevel] = useState(() => regionToZoom(initialRegion.longitudeDelta, mapWidth));
  const [mapCenterLat, setMapCenterLat] = useState(() => initialRegion.latitude);
  const [showPlaceLabels, setShowPlaceLabels] = useState(
    () => regionToZoom(initialRegion.longitudeDelta, mapWidth) >= 15
  );

  useEffect(() => {
    const z = regionToZoom(initialRegion.longitudeDelta, mapWidth);
    setMapZoomLevel(z);
    setMapCenterLat(initialRegion.latitude);
    setShowPlaceLabels(z >= 15);
  }, [initialRegion, mapWidth]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const z = regionToZoom(region.longitudeDelta, mapWidth);
      setMapZoomLevel(z);
      setMapCenterLat(region.latitude);
      setShowPlaceLabels(z >= 15);
    },
    [mapWidth]
  );

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
      zoomLevel: number = cityZoomLevel, // используйте маленькие числа!
      bottomOffset: number = Math.round(windowH / 2)
    ) => {
      if (!mapRef.current) return;
      const { width, height } = Dimensions.get('window');

      // Простая константа для смещения
      const OFFSET_MULTIPLIER = 0.000005; // начните с этого

      const latitudeOffset = bottomOffset * OFFSET_MULTIPLIER;
      const adjustedCenter = {
        ...center,
        latitude: center.latitude - latitudeOffset
      };

      const longitudeDelta = zoomLevel * (width / height);
      // 0.1 - очень далеко (город)
      // 0.05 - район
      // 0.01 - улицы
      // 0.005 - несколько домов
      // 0.001 - один дом
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
      setPanelStartCollapsed(false); // открываем полностью
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
      <MarkerTypePoi
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
      <MarkerTypePoi
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

    // animateCamera не возвращает promise, поэтому снимаем лоадер таймером
    // (длительность должна совпадать с duration в animateCamera)
    setTimeout(() => setIsCentering(false), 550);
  }, [liveCoords, isCentering, handleCenterOnGeo]);

  const isLocationButtonLoading = useMemo(() => {
    // если координат ещё нет — кнопка в лоадинге
    if (!liveCoords) return true;
    // если сейчас центрируем — тоже лоадинг
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
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapPress={(event) => {
          if (event?.nativeEvent?.action === 'marker-press') return;
          handleMapPress(event);
          setPanelMode(PanelMode.Place);
        }}>
        {streetMarker}
        {placeMarker}
        {whatIsHerePlaces.length > 0 || topPlacesGoogle.length > 0 ? (
          <PlaceLabelsLayer
            enabled={showPlaceLabels}
            places={whatIsHerePlaces.length > 0 ? whatIsHerePlaces : topPlacesGoogle}
            selectedPlaceId={place?.id}
            zoomLevel={mapZoomLevel}
            centerLatitude={mapCenterLat}
          />
        ) : null}
        {whatIsHerePlaces.length > 0 && (
          <MarkerTypePlace
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
          <MarkerTypePlace
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
      <View
        style={[mapContainer.bottomButtons, { left: insets.left, right: insets.right, bottom: insets.bottom }]}
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
          onPress={onPressCenterToUser}
        />
      </View>
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
