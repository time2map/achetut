import { colors } from '@shared/styles';
import Svg, { Circle } from 'react-native-svg';

const LocationIcon = () => {
  const size = 32;
  const center = size / 2;
  const outerColor = colors.background;
  const innerColor = colors.backgroundSubtle;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none">
      {/* Внешний круг (обводка) */}
      <Circle
        cx={center}
        cy={center}
        r={center - 2}
        fill={outerColor}
        opacity={0.2}
      />
      {/* Средний круг */}
      <Circle
        cx={center}
        cy={center}
        r={center / 2}
        fill={outerColor}
        opacity={0.6}
      />
      {/* Внутренняя точка */}
      <Circle
        cx={center}
        cy={center}
        r={center / 6}
        fill={innerColor}
      />
    </Svg>
  );
};

export default LocationIcon;
