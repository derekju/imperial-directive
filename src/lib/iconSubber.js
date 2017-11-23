// @flow

import actionPng from '../assets/icons/action.png';
import blockPng from '../assets/icons/block.png';
import damagePng from '../assets/icons/damage.png';
import dodgePng from '../assets/icons/dodge.png';
import evadePng from '../assets/icons/evade.png';
import insightPng from '../assets/icons/insight.png';
import meleePng from '../assets/icons/melee.png';
import rangedPng from '../assets/icons/ranged.png';
import React from 'react';
import strainPng from '../assets/icons/strain.png';
import strengthPng from '../assets/icons/strength.png';
import surgePng from '../assets/icons/surge.png';
import techPng from '../assets/icons/tech.png';

export const expandText = (
  text: string,
  index: number,
  priorityTarget: string,
  styles: ?Object = {}
) => {
  switch (text) {
    case '{ACTION}':
      return <img key={`${text}-${index}`} alt="Action" src={actionPng} style={styles} />;
    case '{BLOCK}':
      return <img key={`${text}-${index}`} alt="Block" src={blockPng} style={styles} />;
    case '{BREAK}':
      return <br />;
    case '{DMG}':
      return <img key={`${text}-${index}`} alt="Damage" src={damagePng} style={styles} />;
    case '{DODGE}':
      return <img key={`${text}-${index}`} alt="Dodge" src={dodgePng} style={styles} />;
    case '{EVADE}':
      return <img key={`${text}-${index}`} alt="Evade" src={evadePng} style={styles} />;
    case '{INSIGHT}':
      return <img key={`${text}-${index}`} alt="Insight" src={insightPng} style={styles} />;
    case '{MELEE}':
      return <img key={`${text}-${index}`} alt="Melee" src={meleePng} style={styles} />;
    case '{PRIORITY_TARGET}':
      return <span key={`${text}-${index}`}>{priorityTarget}</span>;
    case '{RANGED}':
      return <img key={`${text}-${index}`} alt="Ranged" src={rangedPng} style={styles} />;
    case '{STRAIN}':
      return <img key={`${text}-${index}`} alt="Strain" src={strainPng} style={styles} />;
    case '{STR}':
      return <img key={`${text}-${index}`} alt="Strength" src={strengthPng} style={styles} />;
    case '{SURGE}':
      return <img key={`${text}-${index}`} alt="Surge" src={surgePng} style={styles} />;
    case '{TECH}':
      return <img key={`${text}-${index}`} alt="Tech" src={techPng} style={styles} />;
    default:
      return <span key={`${text}-${index}`}>{text}</span>;
  }
};

export const generateTextArray = (text: string) => {
  let textToProcess = text;
  // Break text up into components
  const textArray = [];
  while (textToProcess.search(/\{.*\}/) !== -1) {
    const index = textToProcess.search(/\{.*\}/);
    if (index !== 0) {
      textArray.push(textToProcess.slice(0, index));
      textToProcess = textToProcess.slice(index);
    }
    // Now find the } so we store that too
    const bracketIndex = textToProcess.search('}');
    textArray.push(textToProcess.slice(0, bracketIndex + 1));
    textToProcess = textToProcess.slice(bracketIndex + 1);
  }

  // Push the rest
  textArray.push(textToProcess);

  return textArray;
};
