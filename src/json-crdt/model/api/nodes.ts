import {ArrayRga} from '../../types/rga-array/ArrayRga';
import {BinaryRga} from '../../types/rga-binary/BinaryRga';
import {Const} from '../../types/const/Const';
import {find} from './find';
import {ITimestampStruct, Timestamp} from '../../../json-crdt-patch/clock';
import {ObjectLww} from '../../types/lww-object/ObjectLww';
import {Path} from '../../../json-pointer';
import {StringRga} from '../../types/rga-string/StringRga';
import {ValueLww} from '../../types/lww-value/ValueLww';
import {ArrayLww} from '../../types/lww-array/ArrayLww';
import {ExtensionApi, ExtensionDefinition, ExtensionJsonNode} from '../../extensions/types';
import {NodeEvents} from './events/NodeEvents';
import {printTree} from '../../../util/print/printTree';
import type * as types from '../proxy/types';
import type {JsonNode, JsonNodeView} from '../../types';
import type {ModelApi} from './ModelApi';
import type {Printable} from '../../../util/print/types';

export type ApiPath = string | number | Path | void;

/**
 * A generic local changes API for a JSON CRDT node.
 *
 * @category Local API
 */
export class NodeApi<N extends JsonNode = JsonNode> implements Printable {
  constructor(public readonly node: N, public readonly api: ModelApi<any>) {}

  /** @ignore */
  private ev: undefined | NodeEvents = undefined;

  /**
   * Event target for listening to node changes. You can subscribe to `"view"`
   * events, which are triggered every time the node's view changes.
   *
   * ```typescript
   * node.events.on('view', () => {
   *   // do something...
   * });
   * ```
   */
  public get events(): NodeEvents {
    const et = this.ev;
    return et || (this.ev = new NodeEvents(this));
  }

  /**
   * Find a child node at the given path starting from this node.
   *
   * @param path Path to the child node to find.
   * @returns JSON CRDT node at the given path.
   */
  public find(path?: ApiPath): JsonNode {
    const node = this.node;
    if (path === undefined) {
      if (typeof node.child === 'function') {
        const child = node.child();
        if (!child) throw new Error('NO_CHILD');
        return child;
      }
      throw new Error('CANNOT_IN');
    }
    if (typeof path === 'string' && !!path && path[0] !== '/') path = '/' + path;
    if (typeof path === 'number') path = [path];
    return find(this.node, path);
  }

  /**
   * Find a child node at the given path starting from this node and wrap it in
   * a local changes API.
   *
   * @param path Path to the child node to find.
   * @returns Local changes API for the child node at the given path.
   */
  public in(path?: ApiPath) {
    const node = this.find(path);
    return this.api.wrap(node as any);
  }

  public asVal(): ValueApi {
    if (this.node instanceof ValueLww) return this.api.wrap(this.node as ValueLww);
    throw new Error('NOT_VAL');
  }

  public asStr(): StringApi {
    if (this.node instanceof StringRga) return this.api.wrap(this.node);
    throw new Error('NOT_STR');
  }

  public asBin(): BinaryApi {
    if (this.node instanceof BinaryRga) return this.api.wrap(this.node);
    throw new Error('NOT_BIN');
  }

  public asArr(): ArrayApi {
    if (this.node instanceof ArrayRga) return this.api.wrap(this.node);
    throw new Error('NOT_ARR');
  }

  public asTup(): VectorApi {
    if (this.node instanceof ArrayLww) return this.api.wrap(this.node as ArrayLww);
    throw new Error('NOT_ARR');
  }

  public asObj(): ObjectApi {
    if (this.node instanceof ObjectLww) return this.api.wrap(this.node as ObjectLww);
    throw new Error('NOT_OBJ');
  }

  public asConst(): ConstApi {
    if (this.node instanceof Const) return this.api.wrap(this.node);
    throw new Error('NOT_CONST');
  }

  public asExt<EN extends ExtensionJsonNode, V, EApi extends ExtensionApi<EN>>(
    ext: ExtensionDefinition<any, EN, EApi>,
  ): EApi {
    let node: JsonNode | undefined = this.node;
    while (node) {
      if (node instanceof ext.Node) return new ext.Api(node, this.api);
      node = node.child ? node.child() : undefined;
    }
    throw new Error('NOT_EXT');
  }

  public val(path?: ApiPath): ValueApi {
    return this.in(path).asVal();
  }

  public str(path?: ApiPath): StringApi {
    return this.in(path).asStr();
  }

  public bin(path?: ApiPath): BinaryApi {
    return this.in(path).asBin();
  }

  public arr(path?: ApiPath): ArrayApi {
    return this.in(path).asArr();
  }

  public tup(path?: ApiPath): VectorApi {
    return this.in(path).asTup();
  }

  public obj(path?: ApiPath): ObjectApi {
    return this.in(path).asObj();
  }

  public const(path?: ApiPath): ConstApi {
    return this.in(path).asConst();
  }

  public view(): JsonNodeView<N> {
    return this.node.view() as unknown as JsonNodeView<N>;
  }

  public toString(tab: string = ''): string {
    return this.constructor.name + printTree(tab, [(tab) => this.node.toString(tab)]);
  }
}

/**
 * Represents the local changes API for the `con` JSON CRDT node {@link Const}.
 *
 * @category Local API
 */
export class ConstApi<N extends Const<any> = Const<any>> extends NodeApi<N> {
  /**
   * Returns a proxy object for this node.
   */
  public proxy(): types.ProxyNodeConst<N> {
    return {
      toApi: () => <any>this,
    };
  }
}

/**
 * Local changes API for the `val` JSON CRDT node {@link ValueLww}.
 *
 * @category Local API
 */
export class ValueApi<N extends ValueLww<any> = ValueLww<any>> extends NodeApi<N> {
  /**
   * Sets the value of the node.
   *
   * @param json JSON/CBOR value or ID (logical timestamp) of the value to set.
   * @returns Reference to itself.
   */
  public set(json: JsonNodeView<N>): this {
    const {api, node} = this;
    const builder = api.builder;
    const val = builder.constOrJson(json);
    api.builder.setVal(node.id, val);
    api.apply();
    return this;
  }

  /**
   * Returns a proxy object for this node. Allows to access the value of the
   * node by accessing the `.val` property.
   */
  public proxy(): types.ProxyNodeVal<N> {
    const self = this;
    const proxy = {
      toApi: () => <any>this,
      get val() {
        const childNode = self.node.node();
        return (<any>self).api.wrap(childNode).proxy();
      },
    };
    return <any>proxy;
  }
}

/**
 * Local changes API for the `vec` JSON CRDT node {@link ArrayLww}.
 *
 * @category Local API
 * @todo Rename to VectorApi.
 */
export class VectorApi<N extends ArrayLww<any> = ArrayLww<any>> extends NodeApi<N> {
  /**
   * Sets a list of elements to the given values.
   *
   * @param entries List of index-value pairs to set.
   * @returns Reference to itself.
   */
  public set(entries: [index: number, value: unknown][]): this {
    const {api, node} = this;
    const {builder} = api;
    builder.insVec(
      node.id,
      entries.map(([index, json]) => [index, builder.constOrJson(json)]),
    );
    api.apply();
    return this;
  }

  /**
   * Returns a proxy object for this node. Allows to access vector elements by
   * index.
   */
  public proxy(): types.ProxyNodeVec<N> {
    const proxy = new Proxy(
      {},
      {
        get: (target, prop, receiver) => {
          if (prop === 'toApi') return () => this;
          const index = Number(prop);
          if (Number.isNaN(index)) throw new Error('INVALID_INDEX');
          const child = this.node.get(index);
          if (!child) throw new Error('OUT_OF_BOUNDS');
          return (<any>this).api.wrap(child).proxy();
        },
      },
    );
    return proxy as types.ProxyNodeVec<N>;
  }
}

/**
 * Local changes API for the `obj` JSON CRDT node {@link ObjectLww}.
 *
 * @category Local API
 */
export class ObjectApi<N extends ObjectLww<any> = ObjectLww<any>> extends NodeApi<N> {
  /**
   * Sets a list of keys to the given values.
   *
   * @param entries List of key-value pairs to set.
   * @returns Reference to itself.
   */
  public set(entries: Partial<JsonNodeView<N>>): this {
    const {api, node} = this;
    const {builder} = api;
    builder.insObj(
      node.id,
      Object.entries(entries).map(([key, json]) => [key, builder.constOrJson(json)]),
    );
    api.apply();
    return this;
  }

  /**
   * Deletes a list of keys from the object.
   *
   * @param keys List of keys to delete.
   * @returns Reference to itself.
   */
  public del(keys: string[]): this {
    const {api, node} = this;
    const {builder} = api;
    api.builder.insObj(
      node.id,
      keys.map((key) => [key, builder.const(undefined)]),
    );
    api.apply();
    return this;
  }

  /**
   * Returns a proxy object for this node. Allows to access object properties
   * by key.
   */
  public proxy(): types.ProxyNodeObj<N> {
    const self = this;
    const proxy = new Proxy(
      {},
      {
        get: (target, prop, receiver) => {
          if (prop === 'toApi') return () => self;
          const key = String(prop);
          const child = this.node.get(key);
          if (!child) throw new Error('NO_SUCH_KEY');
          return (<any>this).api.wrap(child).proxy();
        },
      },
    );
    return proxy as types.ProxyNodeObj<N>;
  }
}

/**
 * Local changes API for the `str` JSON CRDT node {@link StringRga}. This API
 * allows to insert and delete bytes in the UTF-16 string by referencing its
 * local character positions.
 *
 * @category Local API
 */
export class StringApi extends NodeApi<StringRga> {
  /**
   * Inserts text at a given position.
   *
   * @param index Position at which to insert text.
   * @param text Text to insert.
   * @returns Reference to itself.
   */
  public ins(index: number, text: string): this {
    const {api, node} = this;
    const builder = api.builder;
    builder.pad();
    const nextTime = api.builder.nextTime();
    const id = new Timestamp(builder.clock.sid, nextTime);
    const after = node.insAt(index, id, text);
    if (!after) throw new Error('OUT_OF_BOUNDS');
    builder.insStr(node.id, after, text);
    api.advance();
    return this;
  }

  /**
   * Deletes a range of text at a given position.
   *
   * @param index Position at which to delete text.
   * @param length Number of UTF-16 code units to delete.
   * @returns Reference to itself.
   */
  public del(index: number, length: number): this {
    const {api, node} = this;
    const builder = api.builder;
    builder.pad();
    const spans = node.findInterval(index, length);
    if (!spans) throw new Error('OUT_OF_BOUNDS');
    node.delete(spans);
    builder.del(node.id, spans);
    api.advance();
    return this;
  }

  /**
   * Returns a proxy object for this node.
   */
  public proxy(): types.ProxyNodeStr {
    return {
      toApi: () => this,
    };
  }
}

/**
 * Local changes API for the `bin` JSON CRDT node {@link BinaryRga}. This API
 * allows to insert and delete bytes in the binary string by referencing their
 * local index.
 *
 * @category Local API
 */
export class BinaryApi extends NodeApi<BinaryRga> {
  /**
   * Inserts octets at a given position.
   *
   * @param index Position at which to insert octets.
   * @param data Octets to insert.
   * @returns Reference to itself.
   */
  public ins(index: number, data: Uint8Array): this {
    const {api, node} = this;
    const after = !index ? node.id : node.find(index - 1);
    if (!after) throw new Error('OUT_OF_BOUNDS');
    api.builder.insBin(node.id, after, data);
    api.apply();
    return this;
  }

  /**
   * Deletes a range of octets at a given position.
   *
   * @param index Position at which to delete octets.
   * @param length Number of octets to delete.
   * @returns Reference to itself.
   */
  public del(index: number, length: number): this {
    const {api, node} = this;
    const spans = node.findInterval(index, length);
    if (!spans) throw new Error('OUT_OF_BOUNDS');
    api.builder.del(node.id, spans);
    api.apply();
    return this;
  }

  /**
   * Returns a proxy object for this node.
   */
  public proxy(): types.ProxyNodeBin {
    return {
      toApi: () => this,
    };
  }
}

/**
 * Local changes API for the `arr` JSON CRDT node {@link ArrayRga}. This API
 * allows to insert and delete elements in the array by referencing their local
 * index.
 *
 * @category Local API
 */
export class ArrayApi<N extends ArrayRga<any> = ArrayRga<any>> extends NodeApi<N> {
  /**
   * Inserts elements at a given position.
   *
   * @param index Position at which to insert elements.
   * @param values JSON/CBOR values or IDs of the values to insert.
   * @returns Reference to itself.
   */
  public ins(index: number, values: Array<JsonNodeView<N>[number]>): this {
    const {api, node} = this;
    const {builder} = api;
    const after = !index ? node.id : node.find(index - 1);
    if (!after) throw new Error('OUT_OF_BOUNDS');
    const valueIds: ITimestampStruct[] = [];
    for (let i = 0; i < values.length; i++) valueIds.push(builder.json(values[i]));
    builder.insArr(node.id, after, valueIds);
    api.apply();
    return this;
  }

  /**
   * Deletes a range of elements at a given position.
   *
   * @param index Position at which to delete elements.
   * @param length Number of elements to delete.
   * @returns Reference to itself.
   */
  public del(index: number, length: number): this {
    const {api, node} = this;
    const spans = node.findInterval(index, length);
    if (!spans) throw new Error('OUT_OF_BOUNDS');
    api.builder.del(node.id, spans);
    api.apply();
    return this;
  }

  /**
   * Get the length of the array without materializing it to a view.
   *
   * @returns Length of the array.
   */
  public length(): number {
    return this.node.length();
  }

  /**
   * Returns a proxy object that allows to access array elements by index.
   *
   * @returns Proxy object that allows to access array elements by index.
   */
  public proxy(): types.ProxyNodeArr<N> {
    const proxy = new Proxy(
      {},
      {
        get: (target, prop, receiver) => {
          if (prop === 'toApi') return () => this;
          const index = Number(prop);
          if (Number.isNaN(index)) throw new Error('INVALID_INDEX');
          const child = this.node.getNode(index);
          if (!child) throw new Error('OUT_OF_BOUNDS');
          return (this.api.wrap(child) as any).proxy();
        },
      },
    );
    return proxy as types.ProxyNodeArr<N>;
  }
}
