import {SliceTypeName} from '../slice';
import {toText as _toHtml} from 'very-small-parser/lib/html/toText';
import {toHast as _toHast} from 'very-small-parser/lib/html/json-ml/toHast';
import type {JsonMlNode} from 'very-small-parser/lib/html/json-ml/types';
import type {THtmlToken} from 'very-small-parser/lib/html/types';
import type {PeritextMlNode} from '../block/types';

export const toJsonMl = (json: PeritextMlNode): JsonMlNode => {
  if (typeof json === 'string') return json;
  const [tag, attr, ...children] = json;
  const namedTag = tag === '' ? tag : SliceTypeName[tag as any];
  const htmlTag = namedTag ?? (attr?.inline ? 'span' : 'div');
  const htmlAttr = attr && attr.data !== void 0 ? {'data-attr': JSON.stringify(attr.data)} : null;
  const htmlNode: JsonMlNode = [htmlTag, htmlAttr];
  const length = children.length;
  for (let i = 0; i < length; i++) htmlNode.push(toJsonMl(children[i]));
  return htmlNode;
};

export const toHast = (json: PeritextMlNode): THtmlToken => {
  const jsonml = toJsonMl(json);
  // console.log(jsonml);
  const hast = _toHast(jsonml);
  return hast;
};

export const toHtml = (json: PeritextMlNode, tab?: string, indent?: string): string =>
  _toHtml(toHast(json), tab, indent);
