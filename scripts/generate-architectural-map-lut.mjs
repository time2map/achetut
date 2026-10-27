import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const LUT_SIZE = 32;
const WIDTH = LUT_SIZE * LUT_SIZE;
const HEIGHT = LUT_SIZE;
const OUTPUT_PATH = resolve(
  'src/features/web-map/map-screen/assets/architectural-map-lut.png'
);

const clamp = (value) => Math.min(1, Math.max(0, value));

const tonalStops = [
  [0, 0.02],
  [0.1, 0.07],
  [0.25, 0.18],
  [0.5, 0.52],
  [0.75, 0.86],
  [1, 0.99]
];

function interpolateTone(value) {
  for (let index = 1; index < tonalStops.length; index += 1) {
    const [rightInput, rightOutput] = tonalStops[index];
    const [leftInput, leftOutput] = tonalStops[index - 1];
    if (value > rightInput) continue;

    const progress = (value - leftInput) / (rightInput - leftInput);
    const easedProgress = progress * progress * (3 - 2 * progress);
    return leftOutput + (rightOutput - leftOutput) * easedProgress;
  }

  return tonalStops.at(-1)[1];
}
//* зеленый акцент
const smoothstep = (min, max, value) => {
  const normalized = clamp((value - min) / (max - min));
  return normalized * normalized * (3 - 2 * normalized);
};

function grade(red, green, blue) {
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const baseTone = interpolateTone(luminance);

  // Preserve more of the native color in textured landmark materials.
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
  const texturedModelMask = smoothstep(0.035, 0.18, chroma);

  // Насколько зелёный канал преобладает над красным и синим.
  const greenDominance = green - Math.max(red, blue);
  const greenMask = smoothstep(0.015, 0.1, greenDominance);

  // Neutral surfaces stay nearly monochrome. Greens retain up to 18%,
  // while already colorful model textures retain up to 32% saturation.
  const retainedColor = Math.max(
    0.035 + (0.18 - 0.035) * greenMask,
    0.035 + (0.32 - 0.035) * texturedModelMask
  );

  // Lift colorful dusk-lit materials without flattening neutral shadows.
  const tone = clamp(baseTone + 0.045 * texturedModelMask);

  return [
    clamp(tone * 1.015 + 0.004 + (red - luminance) * retainedColor),
    clamp(tone + (green - luminance) * retainedColor),
    clamp(tone * 0.97 + (blue - luminance) * retainedColor)
  ];
}

// function grade(red, green, blue) {
//   const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
//   const tone = interpolateTone(luminance);
//   const retainedColor = 0.035;

//   return [
//     clamp(tone * 1.015 + 0.004 + (red - luminance) * retainedColor),
//     clamp(tone + (green - luminance) * retainedColor),
//     clamp(tone * 0.97 + (blue - luminance) * retainedColor)
//   ];
// }
//* настройка тона
// function grade(red, green, blue) {
//   const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
//   const tone = interpolateTone(luminance);
//   const retainedColor = 0.035;

//   return [
//     clamp(tone * 1.015 + 0.004 + (red - luminance) * retainedColor),
//     clamp(tone + (green - luminance) * retainedColor),
//     clamp(tone * 0.97 + (blue - luminance) * retainedColor)
//   ];
// }

const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);

for (let greenIndex = 0; greenIndex < LUT_SIZE; greenIndex += 1) {
  const rowOffset = greenIndex * (WIDTH * 4 + 1);
  scanlines[rowOffset] = 0;

  for (let blueIndex = 0; blueIndex < LUT_SIZE; blueIndex += 1) {
    for (let redIndex = 0; redIndex < LUT_SIZE; redIndex += 1) {
      const red = redIndex / (LUT_SIZE - 1);
      const green = greenIndex / (LUT_SIZE - 1);
      const blue = blueIndex / (LUT_SIZE - 1);
      const graded = grade(red, green, blue);
      const x = blueIndex * LUT_SIZE + redIndex;
      const pixelOffset = rowOffset + 1 + x * 4;

      scanlines[pixelOffset] = Math.round(graded[0] * 255);
      scanlines[pixelOffset + 1] = Math.round(graded[1] * 255);
      scanlines[pixelOffset + 2] = Math.round(graded[2] * 255);
      scanlines[pixelOffset + 3] = 255;
    }
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header[8] = 8;
header[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', header),
  pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0))
]);

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, png);
console.log(`Generated ${OUTPUT_PATH} (${WIDTH}x${HEIGHT}, ${png.length} bytes)`);
