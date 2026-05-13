import { colors } from '@shared/styles';
import React from 'react';
import Svg, {
  Defs,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  Path
} from 'react-native-svg';

const MapPlaceIcon = () => {
  return (
    <Svg
      width={42}
      height={48}
      viewBox="0 0 42 48"
      fill="none">
      <G filter="url(#filter0_d_378_3940)">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.96 4C29.7745 4 36.92 11.1455 36.92 19.96C36.92 26.7183 32.7193 32.4956 26.7864 34.8231L21.869 41.5445C21.7665 41.6852 21.6304 41.8 21.4722 41.8793C21.314 41.9586 21.1383 42 20.96 42C20.7817 42 20.606 41.9586 20.4478 41.8793C20.2896 41.8 20.1535 41.6852 20.051 41.5445L15.1336 34.8231C9.20071 32.4956 5 26.7183 5 19.96C5 11.1455 12.1455 4 20.96 4Z"
          fill="white"
        />
      </G>
      <Path
        d="M33.8791 19.96C33.8791 12.8245 28.0946 7.04004 20.9591 7.04004C13.8235 7.04004 8.03906 12.8245 8.03906 19.96C8.03906 27.0956 13.8235 32.88 20.9591 32.88C28.0946 32.88 33.8791 27.0956 33.8791 19.96Z"
        fill={colors.primaryRed}
      />
      <Path
        d="M27.3363 19.9601C27.3363 16.1825 24.2739 13.1201 20.4963 13.1201C16.7186 13.1201 13.6562 16.1825 13.6562 19.9601C13.6562 23.7377 16.7186 26.8001 20.4963 26.8001C24.2739 26.8001 27.3363 23.7377 27.3363 19.9601Z"
        fill="white"
      />
      <Defs>
        <Filter
          id="filter0_d_378_3940"
          x="0"
          y="0"
          width="41.9199"
          height="48"
          filterUnits="userSpaceOnUse">
          <FeFlood
            floodOpacity={0}
            result="BackgroundImageFix"
          />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy="1" />
          <FeGaussianBlur stdDeviation="2.5" />
          <FeComposite
            in2="hardAlpha"
            operator="out"
          />
          <FeColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <FeBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_378_3940"
          />
          <FeBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_378_3940"
            result="shape"
          />
        </Filter>
      </Defs>
    </Svg>
  );
};

export default MapPlaceIcon;
