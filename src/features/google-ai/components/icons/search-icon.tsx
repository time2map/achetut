import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

const SearchIcon = ({ size = 24, color = 'black' }) => {
  const strokeWidth = 2;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
};

export default SearchIcon;