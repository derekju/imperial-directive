// @flow

const DESERT_TILES = [
  '01b',
  '02b',
  '03b',
  '04b',
  '05b',
  '06b',
  '07b',
  '08b',
  '09b',
  '10b',
  '11b',
  '12b',
  '13b',
  '14b',
  '15b',
  '16b',
  '17b',
  '18b',
  '37a',
  '38a',
  '39b',
];

export default (mapImage: Array<Array<string>>): boolean => {
  for (let i = 0; i < mapImage.length; i++) {
    for (let j = 0; j < mapImage[i].length; j++) {
      if (DESERT_TILES.includes(mapImage[i][j])) {
        return true;
      }
    }
  }

  return false;
};
