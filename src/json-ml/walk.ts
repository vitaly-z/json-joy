import {iter, UndefIterator} from "../util/iterator";
import type {JsonMlNode} from "./types";

export const walk0 = (node: JsonMlNode): UndefIterator<JsonMlNode> => {
  const stack: JsonMlNode[] = [node];
  return () => {
    const node = stack.pop();
    if (!node) return;
    if (typeof node === 'string') return node;
    const length = node.length;
    for (let i = length - 1; i >= 2; i--) stack.push(node[i] as JsonMlNode);
    return node;
  };
};

export const walk = (node: JsonMlNode) => iter(walk0(node));
