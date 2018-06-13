// @flow

export default (...deployments: string[]): string => {
  const randomIndex = Math.floor(Math.random() * deployments.length);
  return deployments[randomIndex];
};
