// @flow

const SNOW_TILES = [
  'h01a',
  'h02a',
  'h03a',
  'h04a',
  'h05a',
  'h06a',
  'h07a',
  'h08a',
  'h09a',
  'h11a',
  'h12a',
  'h13a',
  'h14a',
  'h15a',
  'h16a',
  'h17a',
  'h18a',
  'h19a',
  'h20a',
  'h21a',
  'h21b',
  'h22a',
  'h23a',
  'h24a',
];

export default (mapImage: Array<Array<string>>): boolean => {
  for (let i = 0; i < mapImage.length; i++) {
    for (let j = 0; j < mapImage[i].length; j++) {
      if (SNOW_TILES.includes(mapImage[i][j])) {
        return true;
      }
    }
  }

  return false;
};
