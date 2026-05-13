import { colors } from '@shared/styles';
import Svg, { Path, Rect } from 'react-native-svg';

const CrossIcon = ({ size = 40, color = colors.background }: { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none">
      <Path
        d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"
        fill={color}
      />
    </Svg>
  );
};

export default CrossIcon;
