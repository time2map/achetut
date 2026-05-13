import { colors } from '@shared/styles';
import Svg, { Rect } from 'react-native-svg';

const BurgerIcon = () => {
  const size = 40;
  const color = colors.background;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100">
      <Rect
        x="20"
        y="30"
        width="60"
        height="10"
        rx="4"
        fill={color}
      />
      <Rect
        x="20"
        y="45"
        width="60"
        height="10"
        rx="4"
        fill={color}
      />
      <Rect
        x="20"
        y="60"
        width="60"
        height="10"
        rx="4"
        fill={color}
      />
    </Svg>
  );
}; 

export default BurgerIcon;