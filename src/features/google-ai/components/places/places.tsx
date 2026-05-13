import { ScrollView, Text, View } from 'react-native';
import { panelStyles } from '../panel/panel.styles';
import Card from '@features/google-ai/ui/card/card';
import { IGooglePlace } from '@features/google-ai/types/google-place';
import { IAIPlace } from '@features/google-ai/types/ai-place';
import { TCurrentPlace } from '@features/google-ai/types/map';
import { INearbyPlace } from '@features/google-ai/types/nearby-place';

type PlacesProps = {
  places: INearbyPlace[] | IAIPlace[] | IGooglePlace[];
  onPressPlace: (place: TCurrentPlace) => void;
  isAiPlace?: boolean;
  onScroll: (e: any) => void;
  isScrollEnabled: boolean;
};

const Places = ({ places, onPressPlace, isAiPlace = false, onScroll, isScrollEnabled }: PlacesProps) => {
  return (
    <ScrollView
      scrollEventThrottle={16}
      contentContainerStyle={[panelStyles.scrollView, { paddingBottom: 130 }]}
      scrollEnabled={isScrollEnabled}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      showsVerticalScrollIndicator={false}>
      {places.length > 0 ? (
        <View style={panelStyles.nearbyList}>
          {places.map((place) => (
            <Card
              key={place.id}
              place={place}
              onPress={(selectedPhotoUrl) => {
                onPressPlace({ ...place, selectedPhotoUrl: selectedPhotoUrl ?? undefined });
              }}
            />
          ))}
        </View>
      ) : (
        <View style={panelStyles.block}>
          <Text style={panelStyles.descriptionText}>No places found</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Places;
