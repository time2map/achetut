import { Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';
import { placeInfoStyles } from './place-info.styles';
import { useMemo, useRef, useState } from 'react';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { panelStyles } from '@features/google-ai/components/panel/panel.styles';

import { IStreetPlace } from '@features/google-ai/types/street-place';
import { IAIPlace } from '@features/google-ai/types/ai-place';
import { IGooglePlace } from '@features/google-ai/types/google-place';
import ButtonSecondary from '@features/google-ai/ui/button/button-secondary/button-secondary';
import { openInGoogleMaps } from '@features/google-ai/utils/open-in-google-maps';
import { openInGoogleMapsById } from '@features/google-ai/utils/open-in-google-maps-by-id';
import { GOOGLE_PLACES_URL } from '@features/google-ai/utils/constants';
import { spacing } from '@shared/styles';
import { useInstallationIdStore } from '@shared/store/installation-id';
import { env } from '@shared/config/env';

type PlaceInfoProps = {
  place: INearbyPlace | IStreetPlace | IAIPlace | IGooglePlace;
  photos: string[];
  placeDescription: string;
  isStreet?: boolean;
  isLoadingPrompt?: boolean;
  isScrollEnabled?: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const PlaceInfo = ({
  place,
  photos,
  placeDescription,
  isStreet = false,
  isLoadingPrompt = false,
  isScrollEnabled = true,
  onScroll
}: PlaceInfoProps) => {
  const { placeId, displayName } = place as INearbyPlace | IGooglePlace;
  const { xUserId } = useInstallationIdStore();
  const sourceHeader = env.xUserId ?? xUserId ?? '';
  const buildPlacesPhotoUrl = (photoName: string, maxWidthPx = 900) =>
    `${GOOGLE_PLACES_URL}/${photoName}/media?maxWidthPx=${maxWidthPx}`;

  const resolvedPhotoUrls = useMemo(() => {
    const selectedPhotoUrl = (place as any)?.selectedPhotoUrl;
    const selected = typeof selectedPhotoUrl === 'string' && selectedPhotoUrl.length > 0 ? [selectedPhotoUrl] : [];
    const fromPlace = Array.isArray((place as any)?.photos)
      ? (place as any).photos
          .map((p: any) => p?.url ?? p?.name ?? '')
          .filter((s: any) => typeof s === 'string' && s.length > 0)
          .map((s: string) => (s.startsWith('http') ? s : buildPlacesPhotoUrl(s, 600)))
      : [];
    const fromProps = Array.isArray(photos) ? photos : [];
    const combined = [...selected, ...fromPlace, ...fromProps].filter((s) => typeof s === 'string' && s.length > 0);
    return Array.from(new Set(combined));
  }, [place, photos]);

  const photoScrollRef = useRef<ScrollView | null>(null);
  const panelPadding = spacing.md;
  const carouselWidth = Dimensions.get('window').width;
  const [photoIndex, setPhotoIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const handlePhotoScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset?.x ?? 0;
    setPhotoIndex(Math.round(offset / carouselWidth));
  };

  const handleOpenInGoogleMaps = () => {
    if (placeId) {
      openInGoogleMapsById({ placeId });
    } else {
      openInGoogleMaps({
        isAiPlace: (place as IAIPlace).type === 'ai',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        label: place.displayName,
        city: (place as IAIPlace).city
      });
    }
  };

  const isPhotos = resolvedPhotoUrls.length > 0;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={panelStyles.scrollView}
      showsVerticalScrollIndicator={false}
      scrollEnabled={isScrollEnabled}
      scrollEventThrottle={16}
      onScroll={onScroll}
      directionalLockEnabled
      nestedScrollEnabled>
      <View
        style={placeInfoStyles.container}
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}>
        {/* {isPhotos ? (
          <View style={[panelStyles.carouselWrapper, { marginHorizontal: -panelPadding, width: carouselWidth }]}>
            <ScrollView
              ref={photoScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              directionalLockEnabled
              scrollEnabled
              style={{ width: carouselWidth }}
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
              onMomentumScrollEnd={handlePhotoScroll}>
              {resolvedPhotoUrls.slice(0, 1).map((url: string, idx: number) => (
                <View
                  style={[panelStyles.photoSlide, { width: carouselWidth }]}
                  key={`${url}-${idx}`}>
                  <Image
                    key={`${url}-img-${idx}`}
                    source={imageHeaders ? { uri: url, headers: imageHeaders } : { uri: url }}
                    style={[
                      panelStyles.photo,
                      {
                        width: carouselWidth
                      }
                    ]}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null} */}
        {isPhotos ? (
          <View style={placeInfoStyles.heroImageWrapper}>
            <Image
              source={{ uri: resolvedPhotoUrls[0], headers: { 'x-user-id': sourceHeader } }}
              style={placeInfoStyles.heroImage}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>
        ) : null}

        {/* <View style={placeInfoStyles.backButtonWrapper}></View> */}

        {isLoadingPrompt ? (
          <View style={panelStyles.block}>
            <Text style={panelStyles.descriptionText}>Loading place description...</Text>
          </View>
        ) : (
          <View style={panelStyles.block}>
            <Text style={panelStyles.descriptionText}>{placeDescription}</Text>
          </View>
        )}

        <View style={{ alignSelf: 'center' }}>
          <ButtonSecondary
            label="Open in Google Maps"
            disabled={isLoadingPrompt}
            style={panelStyles.openInGoogleMapsButton}
            onPress={handleOpenInGoogleMaps}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default PlaceInfo;
