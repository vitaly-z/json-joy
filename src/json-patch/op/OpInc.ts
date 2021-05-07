import {AbstractOp} from './AbstractOp';
import {OperationInc} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from '../constants';
import {CompactIncOp} from '../compact';

/**
 * @category JSON Patch Extended
 */
export class OpInc extends AbstractOp<'inc'> {
  constructor(path: Path, public readonly inc: number) {
    super(path);
  }

  public op() {
    return 'inc' as 'inc';
  }

  public apply(doc: unknown) {
    const ref = find(doc, this.path);
    const result = this.inc + Number(ref.val);
    if (ref.obj) (ref as any).obj[(ref as any).key] = result;
    else doc = result;
    return {doc, old: ref.val};
  }

  public toJson(): OperationInc {
    const op: OperationInc = {
      op: 'inc',
      path: formatJsonPointer(this.path),
      inc: this.inc,
    };
    return op;
  }

  public toPacked(): CompactIncOp {
    return [OPCODE.inc, this.path, this.inc];
  }
}
