import { colors } from '@shared/styles';
import Svg, { Path } from 'react-native-svg';

const BackIcon = ({ size = 26, color = colors.textPrimary }: { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none">
      <Path
        d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z"
        fill={color}
      />
    </Svg>
  );
};

export default BackIcon;
