import {alphabet} from './constants';

export const createToBase64BinUint8 = (chars: string = alphabet, pad: string = '=') => {
  if (chars.length !== 64) throw new Error('chars must be 64 characters long');

  const table = chars.split('').map((c) => c.charCodeAt(0));
  const table2: number[] = [];

  for (const c1 of table) {
    for (const c2 of table) {
      const two = (c1 << 8) + c2;
      table2.push(two);
    }
  }

  const PAD: number = pad.length === 1 ? pad.charCodeAt(0) : 0;

  return (uint8: Uint8Array, start: number, length: number, dest: Uint8Array, offset: number): number => {
    const extraLength = length % 3;
    const baseLength = length - extraLength;
    for (; start < baseLength; start += 3) {
      const o1 = uint8[start];
      const o2 = uint8[start + 1];
      const o3 = uint8[start + 2];
      const v1 = (o1 << 4) | (o2 >> 4);
      const v2 = ((o2 & 0b1111) << 8) | o3;
      let u16 = table2[v1];
      dest[offset++] = u16 >> 8;
      dest[offset++] = u16;
      u16 = table2[v2];
      dest[offset++] = u16 >> 8;
      dest[offset++] = u16;
    }
    if (extraLength === 1) {
      const o1 = uint8[baseLength];
      const u16 = table2[o1 << 4];
      dest[offset++] = u16 >> 8;
      dest[offset++] = u16;
      if (PAD) {
        dest[offset++] = PAD;
        dest[offset++] = PAD;
      }
    } else if (extraLength) {
      const o1 = uint8[baseLength];
      const o2 = uint8[baseLength + 1];
      const v1 = (o1 << 4) | (o2 >> 4);
      const v2 = (o2 & 0b1111) << 2;
      const u16 = table2[v1];
      dest[offset++] = u16 >> 8;
      dest[offset++] = u16;
      dest[offset++] = table[v2];
      if (PAD) dest[offset++] = PAD;
    }
    return offset;
  };
};
