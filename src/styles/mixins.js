// @flow

export const positionAbsolute = (top: ?number, right: ?number, bottom: ?number, left: ?number) => ({
  bottom: bottom !== null && bottom !== undefined ? `${bottom}px` : null,
  left: left !== null && left !== undefined ? `${left}px` : null,
  position: 'absolute',
  right: right !== null && right !== undefined ? `${right}px` : null,
  top: top !== null && top !== undefined ? `${top}px` : null,
});
