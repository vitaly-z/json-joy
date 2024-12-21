import {Block} from './Block';
import {commonLength} from '../util/commonLength';
import {printTree} from 'tree-dump/lib/printTree';
import {LeafBlock} from './LeafBlock';
import {Range} from '../rga/Range';
import {CommonSliceType} from '../slice';
import type {MarkerOverlayPoint} from '../overlay/MarkerOverlayPoint';
import type {Path} from '@jsonjoy.com/json-pointer';
import type {Stateful} from '../types';
import type {Printable} from 'tree-dump/lib/types';
import type {Peritext} from '../Peritext';
import type {Point} from '../rga/Point';
import type {PeritextMlElement} from './types';

/**
 * A *fragment* represents a structural slice of a rich-text document. A
 * fragment can be bound to a specific range of text contents, however it
 * always constructs a tree of {@link Block}s, which represent the nested
 * structure of the text contents.
 */
export class Fragment extends Range implements Printable, Stateful {
  public readonly root: Block;

  constructor(
    public readonly txt: Peritext,
    start: Point,
    end: Point,
  ) {
    super(txt.str, start, end);
    this.root = new Block(txt, [], void 0, start, end);
  }

  // ------------------------------------------------------------------- export

  public toJson(): PeritextMlElement {
    const node = this.root.toJson();
    node[0] = '';
    return node;
  }

  // ---------------------------------------------------------------- Printable

  public toString(tab: string = ''): string {
    return 'Fragment' + printTree(tab, [(tab) => this.root.toString(tab)]);
  }

  // ----------------------------------------------------------------- Stateful

  public hash: number = 0;

  public refresh(): number {
    this.build();
    return (this.hash = this.root.refresh());
  }

  private insertBlock(parent: Block, path: Path, marker: undefined | MarkerOverlayPoint, end: Point = this.end): Block {
    const txt = this.txt;
    const common = commonLength(path, parent.path);
    const start: Point = marker ? marker : this.start;
    while (parent.path.length > common && parent.parent) parent = parent.parent as Block;
    while (parent.path.length + 1 < path.length) {
      const block = new Block(txt, path.slice(0, parent.path.length + 1), void 0, start, end);
      block.parent = parent;
      parent.children.push(block);
      parent = block;
    }
    const block = new LeafBlock(txt, path, marker, start, end);
    block.parent = parent;
    parent.children.push(block);
    return block;
  }

  protected build(): void {
    const {root} = this;
    root.children = [];
    let parent = this.root;
    const txt = this.txt;
    const overlay = txt.overlay;
    const iterator = overlay.markerPairs0(this.start, this.end);
    let pair: ReturnType<typeof iterator>;
    while (pair = iterator()) {
      const [p1, p2] = pair;
      const type = p1 ? p1.type() : CommonSliceType.p;
      const path = type instanceof Array ? type : [type];
      const block = this.insertBlock(parent, path, p1, p2);
      if (block.parent) parent = block.parent;
    }
  }
}
