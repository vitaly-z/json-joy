import {fromBase64} from '../../../util/base64/fromBase64';
import {ts, VectorClock, ServerVectorClock, tss, ITimestampStruct} from '../../clock';
import {SESSION} from '../../constants';
import {Patch} from '../../Patch';
import {PatchBuilder} from '../../PatchBuilder';
import type * as types from './types';

const decodeId = (time: types.JsonCodecTimestamp): ITimestampStruct =>
  typeof time === 'number' ? ts(SESSION.SERVER, time) : ts(time[0], time[1]);

/**
 * Decodes a JSON CRDT patch from a JavaScript POJO into a {@link Patch} instance.
 *
 * @param data A JavaScript POJO representing a JSON CRDT patch in "json" format.
 * @returns A decoded {@link Patch} instance.
 */
export const decode = (data: types.JsonCodecPatch): Patch => {
  const {id, ops} = data;
  const clock = typeof id === 'number' ? new ServerVectorClock(SESSION.SERVER, id) : new VectorClock(id[0], id[1]);
  const builder = new PatchBuilder(clock);

  for (const op of ops) {
    switch (op.op) {
      case 'con': {
        if (op.timestamp) {
          builder.const(decodeId(op.value as types.JsonCodecTimestamp));
        } else {
          builder.const(op.value);
        }
        break;
      }
      case 'val': {
        builder.val(decodeId(op.value));
        break;
      }
      case 'obj': {
        builder.obj();
        break;
      }
      case 'vec': {
        builder.vec();
        break;
      }
      case 'str': {
        builder.str();
        break;
      }
      case 'bin': {
        builder.bin();
        break;
      }
      case 'arr': {
        builder.arr();
        break;
      }
      case 'ins_val': {
        builder.setVal(decodeId(op.obj), decodeId(op.value));
        break;
      }
      case 'ins_obj': {
        builder.setKeys(
          decodeId(op.obj),
          (op as types.JsonCodecInsObjOperation).value.map(([key, id]) => [key, decodeId(id)]),
        );
        break;
      }
      case 'ins_vec': {
        builder.insVec(
          decodeId(op.obj),
          (op as types.JsonCodecInsVecOperation).value.map(([key, id]) => [key, decodeId(id)]),
        );
        break;
      }
      case 'ins_str': {
        builder.insStr(decodeId(op.obj), decodeId(op.after || op.obj), op.value);
        break;
      }
      case 'ins_bin': {
        builder.insBin(decodeId(op.obj), decodeId(op.after || op.obj), fromBase64(op.value));
        break;
      }
      case 'ins_arr': {
        builder.insArr(decodeId(op.obj), decodeId(op.after || op.obj), op.values.map(decodeId));
        break;
      }
      case 'del': {
        builder.del(
          decodeId(op.obj),
          op.what.map((spans) => tss(...spans)),
        );
        break;
      }
      case 'nop': {
        builder.nop(op.len || 1);
        break;
      }
    }
  }

  const patch = builder.patch;
  patch.meta = data.meta;

  return patch;
};
