// biome-ignore lint: React is used for JSX
import * as React from 'react';
import {usePeritext} from '../context';
import {Char} from '../../constants';

// biome-ignore lint: empty interface is expected
export type AnchorViewProps = {};

export const AnchorView: React.FC<AnchorViewProps> = (props) => {
  const {renderers} = usePeritext();

  // This zero-width non-breaking space prevents word wrapping at position where
  // anchor is inserted.
  let children: React.ReactNode = Char.ZeroLengthSpace;
  for (const map of renderers) children = map.anchor?.(props, children) ?? children;
  return children;
};
