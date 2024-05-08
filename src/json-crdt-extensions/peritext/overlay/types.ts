import type {OverlayPoint} from "./OverlayPoint";

export type BlockTag = [
  /**
   * Developer specified type of the block. For example, 'title', 'paragraph',
   * 'image', etc. For performance reasons, it is better to use a number to
   * represent the type.
   */
  type: number | number[],

  /**
   * Any custom attributes that the developer wants to add to the block.
   */
  attr?: undefined | unknown,
];

/**
 * Represents a two adjacent overlay points. The first point is the point
 * that is closer to the start of the document, and the second point is the
 * point that is closer to the end of the document. When an absolute start is
 * missing, the `p1` will be `undefined`. When an absolute end is missing, the
 * `p2` will be `undefined`.
 */
export type OverlayPair<T> = [p1: OverlayPoint<T> | undefined, p2: OverlayPoint<T> | undefined];

/**
 * The *overlay tuple* is similar to the {@link OverlayPair}, but ensures that
 * both points are defined. The leasing and trailing `undefined` are substituted
 * by virtual points.
 */
export type OverlayTuple<T> = [p1: OverlayPoint<T>, p2: OverlayPoint<T>];
