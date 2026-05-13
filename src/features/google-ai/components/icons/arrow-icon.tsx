import { colors } from '@shared/styles';
import Svg, { Path } from 'react-native-svg';

const ArrowIcon = () => {
  const size = 30;
  const color = colors.background;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
};

export default ArrowIcon;
