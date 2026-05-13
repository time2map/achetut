import ButtonPrimary from '@features/google-ai/ui/button/button';
import { ActivityIndicator, View, Text } from 'react-native';
import { menuButtonStyles } from './menu-button.styles';
import BurgerIcon from '../icons/burger-icon';
import ArrowIcon from '../icons/arrow-icon';
import { colors } from '@shared/styles';
import CrossIcon from '../icons/cross-icon';

type MenuButtonProps = {
  isActive: boolean;
  isLoading: boolean;
  onPress: () => void;
  hasNotification?: boolean;
};

const MenuButton = ({ isActive, isLoading, onPress, hasNotification }: MenuButtonProps) => {
  const renderIcon = () => {
    if (isLoading)
      return (
        <ActivityIndicator
          color={colors.background}
          size="small"
        />
      );
    if (isActive) return <CrossIcon />;
    return <BurgerIcon />;
  };

  return (
    <View
      style={menuButtonStyles.buttonOverlay}
      pointerEvents="box-none">
      <View
        style={menuButtonStyles.menuButtonWrapper}
        pointerEvents="auto">
        <View style={menuButtonStyles.buttonContainer}>
          <ButtonPrimary
            icon={renderIcon()}
            onPress={onPress}
            size="medium"
            style={{ width: 50 }}
          />
          {hasNotification ? (
            <View
              style={menuButtonStyles.notificationBadge}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <Text style={menuButtonStyles.notificationText}>...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default MenuButton;
