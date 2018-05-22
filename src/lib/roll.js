// @flow

export default (chance: number) => Math.floor(Math.random() * 100) >= 100 - chance;
