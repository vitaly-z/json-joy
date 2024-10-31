import * as React from 'react';
import {usePeritext} from '../context';

export interface AnchorViewProps {}

export const AnchorView: React.FC<AnchorViewProps> = (props) => {
  const {renderers} = usePeritext();

  let children: React.ReactNode = null;
  for (const map of renderers) children = map.anchor?.(props, children);
  return children;
};
