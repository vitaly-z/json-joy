// biome-ignore lint: React is used for JSX
import * as React from 'react';
import {rule, drule, keyframes} from 'nano-theme';
import {DefaultRendererColors} from './constants';
import {usePeritext} from '../../react';
import {useSyncStore} from '../../react/hooks';
import type {FocusViewProps} from '../../react/selection/FocusView';

const width = 0.125;
const animationTime = '1s';

const animation = keyframes({
  'from,to': {
    bg: DefaultRendererColors.ActiveCursor,
  },
  '50%': {
    bg: 'transparent',
  },
});

const blockClass = rule({
  pos: 'relative',
  d: 'inline-block',
  pe: 'none',
  us: 'none',
  w: '0px',
  h: '100%',
  bg: 'black',
  va: 'top',
});

const innerClass = drule({
  an: `${animationTime} ${animation} step-end infinite`,
  pos: 'absolute',
  top: '-0.15em',
  left: `-${width / 2}em`,
  w: width + 'em',
  h: '1.45em',
  bg: DefaultRendererColors.ActiveCursor,
  'mix-blend-mode': 'multiply',
});

export interface RenderFocusProps extends FocusViewProps {
  children: React.ReactNode;
}

export const RenderFocus: React.FC<RenderFocusProps> = ({left, italic, children}) => {
  const {dom} = usePeritext();
  const focus = useSyncStore(dom.cursor.focus);

  const style: React.CSSProperties = focus ? {} : {background: DefaultRendererColors.InactiveCursor, animation: 'none'};

  if (italic) {
    style.rotate = '11deg';
  }

  return (
    <span className={blockClass}>
      <span
        className={innerClass({
          bdrad: left ? `0 ${width * 0.5}em ${width * 0.5}em 0` : `${width * 0.5}em 0 0 ${width * 0.5}em`,
        })}
        style={style}
      >
        {children}
      </span>
    </span>
  );
};