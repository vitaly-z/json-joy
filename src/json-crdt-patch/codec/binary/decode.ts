import {decodeString} from '../../../util/decodeString';
import {ITimestamp, LogicalTimestamp, LogicalVectorClock} from '../../clock';
import {Patch} from '../../Patch';
import {PatchBuilder} from '../../PatchBuilder';
import {decodeVarUint} from './util/varuint';
import {Code} from '../compact/constants';

export const decodeTimestamp = (buf: Uint8Array, offset: number): ITimestamp => {
  const o1 = buf[offset];
  const o2 = buf[offset + 1];
  const o3 = buf[offset + 2];
  const o4 = buf[offset + 3];
  const o5 = buf[offset + 4];
  const o6 = buf[offset + 5];
  const o7 = buf[offset + 6];
  const o8 = buf[offset + 7];
  let sessionId = o8;
  sessionId *= 0x100;
  sessionId += o4;
  sessionId *= 0x100;
  sessionId += o3;
  sessionId *= 0x100;
  sessionId += o2;
  sessionId *= 0x100;
  sessionId += o1;
  let time = o7;
  time *= 0x100;
  time += o6;
  time *= 0x100;
  time += o5;
  return new LogicalTimestamp(sessionId, time);
};

export const decode = (buf: Uint8Array): Patch => {
  const id = decodeTimestamp(buf, 0);
  let offset = 8;
  const clock = new LogicalVectorClock(id.getSessionId(), id.time);
  const builder = new PatchBuilder(clock);
  const length = buf.byteLength;

  const ts = (): ITimestamp => {
    const value = decodeTimestamp(buf, offset);
    offset += 8;
    return value;
  };

  const varuint = () => {
    const value = decodeVarUint(buf, offset);
    offset +=
      value <= 0b01111111 ? 1 : value <= 0b01111111_11111111 ? 2 : value <= 0b01111111_11111111_11111111 ? 3 : 4;
    return value;
  };

  while (offset < length) {
    const opcode = buf[offset];
    offset++;
    switch (opcode) {
      case Code.MakeObject: {
        builder.obj();
        continue;
      }
      case Code.MakeArray: {
        builder.arr();
        continue;
      }
      case Code.MakeString: {
        builder.str();
        continue;
      }
      case Code.MakeNumber: {
        builder.num();
        continue;
      }
      case Code.SetRoot: {
        builder.root(ts());
        continue;
      }
      case Code.SetObjectKeys: {
        const object = ts();
        const fields = varuint();
        const tuples: [key: string, value: ITimestamp][] = [];
        for (let i = 0; i < fields; i++) {
          const value = ts();
          const strLength = varuint();
          const key = decodeString(buf, offset, strLength);
          offset += strLength;
          tuples.push([key, value]);
        }
        builder.setKeys(object, tuples);
        continue;
      }
      case Code.SetNumber: {
        const after = ts();
        const value = new Float64Array(buf.slice(offset, offset + 8).buffer)[0];
        offset += 8;
        builder.setNum(after, value);
        continue;
      }
      case Code.InsertStringSubstring: {
        const obj = ts();
        const after = ts();
        const length = varuint();
        const str = decodeString(buf, offset, length);
        offset += length;
        builder.insStr(obj, after, str);
        continue;
      }
      case Code.InsertArrayElements: {
        const arr = ts();
        const after = ts();
        const length = varuint();
        const elements: ITimestamp[] = [];
        for (let i = 0; i < length; i++) {
          const value = ts();
          elements.push(value);
        }
        builder.insArr(arr, after, elements);
        continue;
      }
      case Code.Delete: {
        const obj = ts();
        const after = ts();
        const length = varuint();
        builder.del(obj, after, length);
        continue;
      }
      case Code.DeleteOne: {
        const obj = ts();
        const after = ts();
        builder.del(obj, after, 1);
        continue;
      }
      case Code.NoopOne: {
        builder.noop(1);
        continue;
      }
      case Code.Noop: {
        builder.noop(varuint());
        continue;
      }
    }
  }

  return builder.patch;
};
