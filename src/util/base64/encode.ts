const E = '=';
const EE = '==';

export const createToBase64 = (chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/') => {
  if (chars.length !== 64) throw new Error('chars must be 64 characters long');

  const table = chars.split('');
  const table2: string[] = [];

  for (const c1 of table) {
    for (const c2 of table) {
      const two = c1 + c2;
      Number(two);
      table2.push(two);
    }
  }

  return (uint8: Uint8Array, length: number): string => {
    let out = '';
    const extraLength = length % 3;
    const baseLength = length - extraLength;
    for (let i = 0; i < baseLength; i += 3) {
      const o1 = uint8[i];
      const o2 = uint8[i + 1];
      const o3 = uint8[i + 2];
      const v1 = (o1 << 4) | (o2 >> 4);
      const v2 = ((o2 & 0b1111) << 8) | o3;
      out += table2[v1] + table2[v2];
    }
    if (extraLength) {
      if (extraLength === 1) {
        const o1 = uint8[baseLength];
        out += table2[o1 << 4] + EE;
      } else {
        const o1 = uint8[baseLength];
        const o2 = uint8[baseLength + 1];
        const v1 = (o1 << 4) | (o2 >> 4);
        const v2 = (o2 & 0b1111) << 2;
        out += table2[v1] + table[v2] + E;
      }
    }
    return out;
  };
};

const encodeSmall = createToBase64();
const hasBuffer = typeof Buffer === 'function' && typeof Buffer.from === 'function';

export const toBase64 = !hasBuffer
  ? (uint8: Uint8Array) => encodeSmall(uint8, uint8.byteLength)
  : (uint8: Uint8Array): string => {
      const length = uint8.byteLength;
      if (length <= 48) return encodeSmall(uint8, length);
      return Buffer.from(uint8).toString('base64');
    };