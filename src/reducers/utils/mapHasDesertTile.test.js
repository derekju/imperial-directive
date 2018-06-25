import mapHasDesertTile from './mapHasDesertTile';
import missions from '../../data/missions.json';

test('mapHasDesertTile returns true if map has desert tile', () => {
  expect(mapHasDesertTile(missions.highMoon.mapImage)).toBeTruthy();
});

test('mapHasDesertTile returns false if map does not have desert tile', () => {
  expect(mapHasDesertTile(missions.aftermath.mapImage)).toBeFalsy();
  expect(mapHasDesertTile(missions.theSource.mapImage)).toBeFalsy();
  expect(mapHasDesertTile(missions.fireInTheSky.mapImage)).toBeFalsy();
});
