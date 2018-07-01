// @flow

const fs = require('fs');
const replace = require('replace-in-file');
const upperFirst = require('lodash/upperFirst');

const missionName = process.argv[2];

if (!missionName) {
  console.log('Need mission name supplied!');
  process.exit(1);
}

// Copy one of the other missions
// We'll copy forestAmbush

console.log('Copying file...');
fs.copyFileSync('./src/reducers/missions/forestAmbush.js', `./src/reducers/missions/${missionName}.js`);

console.log('Appending to reducers/missions/index.js...');
fs.appendFileSync(`./src/reducers/missions/index.js`, `import {${missionName}, get${upperFirst(missionName)}GoalText} from './${missionName}';\n`);

console.log('Appending to reducers/index.js...');
fs.appendFileSync(`./src/reducers/index.js`, `import ${missionName} from './missions/${missionName}';\n`);

console.log('Appending to reducers/types.js...');
fs.appendFileSync(`./src/reducers/types.js`, `import type {${upperFirst(missionName)}StateType} from './missions/${missionName}';\n`);
fs.appendFileSync(`./src/reducers/types.js`, `  ${missionName}: ${upperFirst(missionName)}StateType,\n`);

console.log('Modifying template...');
replace.sync({
  files: `./src/reducers/missions/${missionName}.js`,
  from: 'export function* forestAmbush(): Generator',
  to: 'export function* binaryRevolution(): Generator',
});
replace.sync({
  files: `./src/reducers/missions/${missionName}.js`,
  from: "const MISSION_NAME = 'forestAmbush';",
  to: `const MISSION_NAME = '${missionName}';`,
});
replace.sync({
  files: `./src/reducers/missions/${missionName}.js`,
  from: 'export type ForestAmbushStateType',
  to: `export type ${upperFirst(missionName)}StateType`,
});
replace.sync({
  files: `./src/reducers/missions/${missionName}.js`,
  from: 'export default (state: ForestAmbushStateType',
  to: `export default (state: ${upperFirst(missionName)}StateType`,
});
replace.sync({
  files: `./src/reducers/missions/${missionName}.js`,
  from: 'export const getForestAmbushGoalText',
  to: `export const get${upperFirst(missionName)}GoalText`,
});

// Done
process.exit(0);
