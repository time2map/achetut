import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import ButtonSecondary from '@features/google-ai/ui/button/button-secondary/button-secondary';
import { whatButtonStyles } from './what-button.styles';
import { colors } from '@shared/styles/tokens';
import ButtonPrimary from '@features/google-ai/ui/button/button';
import CrossIcon from '../icons/cross-icon';

type WhatButtonProps = {
  onPress: () => void;
  nearbyPlacesLength: number;
  isLoading: boolean;
  disabled?: boolean;
};

const WhatButton = ({ onPress, nearbyPlacesLength, isLoading, disabled = false }: WhatButtonProps) => {
  const [showHint, setShowHint] = useState(false);
  const [searchRequested, setSearchRequested] = useState(false);

  useEffect(() => {
    if (!searchRequested) return;
    if (isLoading) return;

    if (nearbyPlacesLength === 0) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
    setSearchRequested(false);
  }, [isLoading, nearbyPlacesLength, searchRequested]);

  return (
    <View style={[whatButtonStyles.buttonOverlay]}>
      <View style={{ position: 'relative', alignSelf: 'center' }}>
        {showHint ? (
          <View
            pointerEvents="auto"
            style={whatButtonStyles.hint}>
            <Text style={whatButtonStyles.hintText}>
              There was nothing near you.
              {'\n'}
              Go ahead.
            </Text>

            <ButtonPrimary
              icon={
                <CrossIcon
                  size={30}
                  color={colors.textPrimary}
                />
              }
              onPress={() => setShowHint(false)}
              size="small"
              color={colors.background}
            />

            <View style={whatButtonStyles.hintArrow} />
          </View>
        ) : null}
      </View>
      <View
        style={whatButtonStyles.wrapper}
        pointerEvents="auto">
        <ButtonSecondary
          label="What’s here"
          disabled={isLoading || disabled}
          icon={
            isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.textPrimary}
              />
            ) : undefined
          }
          style={whatButtonStyles.button}
          onPress={() => {
            setShowHint(false);
            setSearchRequested(true);
            onPress();
          }}
        />
      </View>
    </View>
  );
};

export default WhatButton;
