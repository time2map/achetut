import TrophyIcon from '../icons/trophy-icon';
import ButtonPrimary from '@features/google-ai/ui/button/button';

type TopButtonProps = {
  onOpen: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const TopButton = ({ onOpen, isLoading = false, disabled = false }: TopButtonProps) => {
  return (
    <ButtonPrimary
      icon={<TrophyIcon />}
      label="Top Spots"
      onPress={onOpen}
      shadow
      disabled={isLoading || disabled}
    />
  );
};

export default TopButton;
