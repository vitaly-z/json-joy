import {AbstractRga, Chunk} from '../rga/AbstractRga';
import {ITimestampStruct, tick} from '../../../json-crdt-patch/clock';
import {Model} from '../../model';
import {printBinary} from '../../../util/print/printBinary';
import {printTree} from '../../../util/print/printTree';
import type {JsonNode, JsonNodeView} from '..';
import type {Printable} from '../../../util/print/types';

type E = ITimestampStruct;

const Empty = [] as any[];

/**
 * @ignore
 * @category CRDT Node
 */
export class ArrChunk implements Chunk<E[]> {
  public readonly id: ITimestampStruct;
  public span: number;
  public del: boolean;
  public data: E[] | undefined;
  public len: number;
  public p: ArrChunk | undefined;
  public l: ArrChunk | undefined;
  public r: ArrChunk | undefined;
  public p2: ArrChunk | undefined;
  public l2: ArrChunk | undefined;
  public r2: ArrChunk | undefined;
  public s: ArrChunk | undefined;

  constructor(id: ITimestampStruct, span: number, data: E[] | undefined) {
    this.id = id;
    this.span = span;
    this.len = data ? span : 0;
    this.del = !data;
    this.p = undefined;
    this.l = undefined;
    this.r = undefined;
    this.s = undefined;
    this.data = data;
  }

  public merge(data: E[]) {
    this.data!.push(...data);
    this.span = this.data!.length;
  }

  public split(ticks: number): ArrChunk {
    const span = this.span;
    this.span = ticks;
    if (!this.del) {
      const data = this.data!;
      const rightData = data.splice(ticks);
      const chunk = new ArrChunk(tick(this.id, ticks), span - ticks, rightData);
      return chunk;
    }
    return new ArrChunk(tick(this.id, ticks), span - ticks, undefined);
  }

  public delete(): void {
    this.del = true;
    this.data = undefined;
  }

  public clone(): ArrChunk {
    return new ArrChunk(this.id, this.span, this.data ? [...this.data] : undefined);
  }
}

/**
 * Represents the `arr` JSON CRDT type, which is a Replicated Growable Array
 * (RGA). Each element ot the array is a reference to another JSON CRDT node.
 *
 * @category CRDT Node
 */
export class ArrNode<Element extends JsonNode = JsonNode>
  extends AbstractRga<E[]>
  implements JsonNode<Readonly<JsonNodeView<Element>[]>>, Printable
{
  constructor(public readonly doc: Model<any>, id: ITimestampStruct) {
    super(id);
  }

  /**
   * Returns a reference to an element at a given position in the array.
   *
   * @param position The position of the element to get.
   * @returns An element of the array, if any.
   */
  public get(position: number): E | undefined {
    const pair = this.findChunk(position);
    if (!pair) return undefined;
    return pair[0].data![pair[1]];
  }

  /**
   * Returns a JSON node at a given position in the array.
   *
   * @param position The position of the element to get.
   * @returns A JSON node, if any.
   */
  public getNode(position: number): JsonNode | undefined {
    const id = this.get(position);
    if (!id) return undefined;
    return this.doc.index.get(id);
  }

  public getById(id: ITimestampStruct): E | undefined {
    const chunk = this.findById(id);
    if (!chunk || chunk.del) return undefined;
    const offset = id.time - chunk.id.time;
    return chunk.data![offset];
  }

  // -------------------------------------------------------------- AbstractRga

  /** @ignore */
  public createChunk(id: ITimestampStruct, data: E[] | undefined): ArrChunk {
    return new ArrChunk(id, data ? data.length : 0, data);
  }

  /** @ignore */
  protected onChange(): void {
    this._view = Empty as any;
  }

  protected toStringName(): string {
    return super.toStringName();
  }

  // ----------------------------------------------------------------- JsonNode

  /** @ignore */
  public child() {
    return undefined;
  }

  /** @ignore */
  public container(): JsonNode | undefined {
    return this;
  }

  /** @ignore */
  private _tick: number = 0;
  /** @ignore */
  private _view = Empty;
  public view(): Readonly<JsonNodeView<Element>[]> {
    const doc = this.doc;
    const tick = doc.clock.time + doc.tick;
    const _view = this._view;
    if (this._tick === tick) return _view;
    const view = [] as JsonNodeView<Element>[];
    const index = doc.index;
    let useCache = true;
    for (let chunk = this.first(); chunk; chunk = this.next(chunk)) {
      if (chunk.del) continue;
      for (const node of chunk.data!) {
        const element = index.get(node)!.view() as JsonNodeView<Element>;
        if (_view[view.length] !== element) useCache = false;
        view.push(element);
      }
    }
    if (_view.length !== view.length) useCache = false;
    return useCache ? _view : ((this._tick = tick), (this._view = view));
  }

  /** @ignore */
  public children(callback: (node: JsonNode) => void) {
    const index = this.doc.index;
    for (let chunk = this.first(); chunk; chunk = this.next(chunk))
      if (!chunk.del) for (const node of chunk.data!) callback(index.get(node)!);
  }

  /** @ignore */
  public api: undefined | unknown = undefined;

  // ---------------------------------------------------------------- Printable

  /** @ignore */
  protected printChunk(tab: string, chunk: ArrChunk): string {
    const pos = this.pos(chunk);
    let valueTree = '';
    if (!chunk.del) {
      const index = this.doc.index;
      valueTree = printTree(
        tab,
        chunk.data!.map(
          (id, i) => (tab) => `[${pos + i}]: ${index.get(id)!.toString(tab + '    ' + ' '.repeat(String(i).length))}`,
        ),
      );
    }
    return (
      this.formatChunk(chunk) +
      valueTree +
      printBinary(tab, [
        chunk.l ? (tab) => this.printChunk(tab, chunk.l!) : null,
        chunk.r ? (tab) => this.printChunk(tab, chunk.r!) : null,
      ])
    );
  }
}