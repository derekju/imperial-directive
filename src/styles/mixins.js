// @flow

export const positionAbsolute = (top: ?number, right: ?number, bottom: ?number, left: ?number) => ({
  bottom: bottom !== null ? `${bottom}px` : null,
  left: left !== null ? `${left}px` : null,
  position: 'absolute',
  right: right !== null ? `${right}px` : null,
  top: top !== null ? `${top}px` : null,
});
