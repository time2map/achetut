import { ActivityIndicator } from 'react-native';
import ButtonSecondary from '@features/google-ai/ui/button/button-secondary/button-secondary';
import { colors } from '@shared/styles';

type TopButtonProps = {
  onOpen: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const TopButton = ({ onOpen, isLoading = false, disabled = false }: TopButtonProps) => {
  return (
    <ButtonSecondary
      label="Top Spots"
      onPress={onOpen}
      disabled={isLoading || disabled}
      icon={
        isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.textPrimary}
          />
        ) : undefined
      }
      style={{ height: 56 }}
    />
  );
};

export default TopButton;
