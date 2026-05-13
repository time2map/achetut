import { colors } from '@shared/styles';
import Svg, { Path } from 'react-native-svg';

const LocationIcon = ({
  width = 18,
  height = 18,
  color = colors.primaryBlue
}: {
  width?: number;
  height?: number;
  color?: string;
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 18 18"
      fill="none">
      <Path
        d="M9.9 18L7.05 10.95L0 8.1V6.7L18 0L11.3 18H9.9Z"
        fill={color}
      />
    </Svg>
  );
};

export default LocationIcon;
