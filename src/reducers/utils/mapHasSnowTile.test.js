import mapHasSnowTile from './mapHasSnowTile';
import missions from '../../data/missions.json';

test('mapHasSnowTile returns false if map does not have snow tile', () => {
  expect(mapHasSnowTile(missions.aftermath.mapImage)).toBeFalsy();
  expect(mapHasSnowTile(missions.theSource.mapImage)).toBeFalsy();
  expect(mapHasSnowTile(missions.fireInTheSky.mapImage)).toBeFalsy();
});

test('mapHasSnowTile returns true if expansion tile present', () => {
  const fakeMapImage = [['h01a']];
  expect(mapHasSnowTile(fakeMapImage)).toBeTruthy();
});
