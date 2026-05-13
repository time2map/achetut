import { type FC } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { cardStyles } from './card.styles';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';
import { IGooglePlace } from '@features/google-ai/types/google-place';
import { IAIPlace } from '@features/google-ai/types/ai-place';
import { GOOGLE_PLACES_URL } from '@features/google-ai/utils/constants';
import { useInstallationIdStore } from '@shared/store/installation-id';
import { env } from '@shared/config/env';

type CardProps = {
  place: INearbyPlace | IGooglePlace | IAIPlace;
  onPress?: (selectedPhotoUrl: string | null) => void;
};

const Card: FC<CardProps> = ({ place, onPress }) => {
  const { displayName, description } = place;
  const photos = 'photos' in place ? (place.photos as Array<{ name?: string; url?: string }>) : [];
  const buildPlacesPhotoUrl = (photoName: string, maxWidthPx = 300) =>
    `${GOOGLE_PLACES_URL}/${photoName}/media?maxWidthPx=${maxWidthPx}`;
  const { xUserId } = useInstallationIdStore();
  const sourceHeader = env.xUserId ?? xUserId ?? '';
  const resolvedPhoto = (() => {
    const firstPhoto = Array.isArray(photos) ? photos[0] : null;
    if (!firstPhoto) return null;

    const url = typeof firstPhoto.url === 'string' ? firstPhoto.url : undefined;
    const name = typeof firstPhoto.name === 'string' ? firstPhoto.name : undefined;

    if (url) return url;
    if (name) {
      return buildPlacesPhotoUrl(name, 400);
    }
    return null;
  })();

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => onPress?.(resolvedPhoto)}
      activeOpacity={0.95}>
      <View style={cardStyles.content}>
        <Text
          style={cardStyles.title}
          numberOfLines={1}>
          {displayName}
        </Text>

        {!!description && (
          <Text
            style={cardStyles.subtitle}
            numberOfLines={4}>
            {description}
          </Text>
        )}
      </View>

      {resolvedPhoto ? (
        <Image
          source={{ uri: resolvedPhoto, headers: { 'x-user-id': sourceHeader } }}
          style={cardStyles.thumb}
        />
      ) : (
        <View style={cardStyles.thumbPlaceholder}>
          <Text style={cardStyles.placeholderText}>No photo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Card;
