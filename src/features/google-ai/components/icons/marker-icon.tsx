import { colors } from "@shared/styles";
import Svg, { Path } from "react-native-svg";

const MarkerIcon = ({size, isSelected}: {size: number, isSelected: boolean}) => {
  const glowOpacity = 0.14;
  const outerGlowWidth = 8;
  const innerGlowWidth = 6;
  const SIZE = 100;
  const scale = size / SIZE;
  const isSelectedMainColor = isSelected ? colors.pulseColorSelected : colors.textMuted;
  const isSelectedGlowColor = isSelected ? colors.textPrimary : colors.pulseColorSelected;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ transform: [{ scale }] }}>
      {/* Top outline */}
      <Path
        d="M50.1534 10.0977C63.3851 11.1584 72.0206 18.6443 75.6603 28.0977C79.2683 37.4698 77.9305 48.6826 71.5314 57.2305C70.8985 58.0758 69.7001 58.2477 68.8546 57.6152C68.3479 57.2359 68.0847 56.6532 68.09 56.0654L31.8761 55.7256C32.0084 56.4207 31.7512 57.1625 31.1466 57.6152C30.3012 58.2481 29.103 58.0755 28.4698 57.2305C22.0706 48.6825 20.7327 37.4699 24.3409 28.0977C27.9806 18.6441 36.6158 11.1582 49.8478 10.0977L50.0001 10.0918C50.0511 10.0918 50.1026 10.0936 50.1534 10.0977ZM50.5001 22.5986C43.9135 22.5986 38.5754 27.9481 38.5753 34.5449C38.5756 41.1416 43.9135 46.4902 50.5001 46.4902C57.0866 46.4902 62.4247 41.1416 62.4249 34.5449C62.4248 27.9482 57.0867 22.5987 50.5001 22.5986Z"
        fill={isSelectedMainColor}
        stroke={isSelectedGlowColor}
      />

      <Path
        d="M73 52L50 90L27 52"
        fill={isSelectedMainColor}
      />

      <Path
        d="M73 52L50 90L27 52"
        stroke={isSelectedGlowColor}
        strokeOpacity={glowOpacity}
        strokeWidth={outerGlowWidth}
        strokeLinejoin="round"
      />

      <Path
        d="M70 54L50 89L30 54"
        fill={isSelectedMainColor}
      />

      <Path
        d="M70 54L50 89L30 54"
        stroke={isSelectedGlowColor}
        strokeWidth={innerGlowWidth}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default MarkerIcon;
