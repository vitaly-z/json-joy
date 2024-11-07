import * as React from 'react';
import {RenderCaret} from './RenderCaret';
import {RenderFocus} from './RenderFocus';
import {RenderAnchor} from './RenderAnchor';
import {RenderInline} from './RenderInline';
import {RenderPeritext} from './RenderPeritext';
import {CommonSliceType} from '../../../json-crdt-extensions';
import type {RendererMap} from '../../react/types';

const h = React.createElement;

export const renderers: RendererMap = {
  text: (props, inline) => {
    const style = (props.style || (props.style = {})) as React.CSSProperties;
    const attr = inline.attr();

    let textDecoration = '';

    if (attr[CommonSliceType.b]) style.fontWeight = 'bold';
    if (attr[CommonSliceType.i]) style.fontStyle = 'italic';
    if (attr[CommonSliceType.u]) textDecoration = 'underline';
    if (attr[CommonSliceType.s]) textDecoration = textDecoration ? textDecoration + ' line-through' : 'line-through';

    style.textDecoration = textDecoration;

    return props;
  },
  caret: (props, children) => h(RenderCaret, <any>props, children),
  focus: (props, children) => h(RenderFocus, <any>props, children),
  anchor: (props) => h(RenderAnchor, <any>props),
  inline: (props, children) => h(RenderInline, props as any, children),
  block: ({hash, block}, children) => {
    const isRoot = block.tag() === '';
    if (isRoot) return children;
    return h('div', {style: {padding: '16px 0'}}, children);
  },
  peritext: (props, children, ctx) => h(RenderPeritext, {...props, children, ctx}),
};
