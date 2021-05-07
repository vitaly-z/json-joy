import {AbstractOp} from './AbstractOp';
import {OperationMove} from '../types';
import {OpRemove} from './OpRemove';
import {OpAdd} from './OpAdd';
import {Path, toPath, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from '../constants';
import {CompactMoveOp} from '../compact';

/**
 * @category JSON Patch
 */
export class OpMove extends AbstractOp<'move'> {
  constructor(path: Path, public readonly from: Path) {
    super(path);
  }

  public op() {
    return 'move' as 'move';
  }

  public apply(doc: unknown) {
    const remove = new OpRemove(toPath(this.from), undefined).apply(doc);
    const add = new OpAdd(this.path, remove.old).apply(remove.doc);
    return add;
  }

  public toJson(): OperationMove {
    return {
      op: 'move',
      path: formatJsonPointer(this.path),
      from: formatJsonPointer(this.from),
    };
  }

  public toPacked(): CompactMoveOp {
    return [OPCODE.move, this.path, this.from];
  }
}
