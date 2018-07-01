// @flow

const fs = require('fs');
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

// Done
process.exit(0);
