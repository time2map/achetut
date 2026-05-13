import { colors } from '@shared/styles';
import Svg, { Path, Rect } from 'react-native-svg';

const CrossIcon = ({ size = 40, color = colors.textPrimary }: { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none">
      <Path
        d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z"
        fill={color}
      />
    </Svg>
  );
};

export default CrossIcon;
