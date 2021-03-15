import { Buffer } from 'buffer';

export function base64ToUint8Array(base64) {
  return new Uint8Array(atob(base64).split('').map(x => x.charCodeAt(0)));
}

export function Uint8ArrayToBase64(array) {
  return btoa(String.fromCharCode.apply(null, array));
}

function bufferToUint8(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return view;
}

export function encodeArrayForSDK(decodedArray) {
  if (!decodedArray) {
    return decodedArray;
  }
  const encoder = new TextEncoder('ascii');
  return decodedArray.map((value) => {
    if (typeof value === 'number') {
      return uint64ToBigEndian(value);
    }
    return encoder.encode(value);
  });
}

export function uint64ToBigEndian(x) {
  const buff = Buffer.alloc(8);
  buff.writeUIntBE(x, 0, 8);
  return bufferToUint8(buff);
}

export function encodeArrayForSigner(decodedArray) {
  if (!decodedArray) {
    return decodedArray;
  }
  return decodedArray.map((value) => {
    if (typeof value === 'number') {
      return btoa(String.fromCharCode.apply(null, uint64ToBigEndian(value)));
    }
    return btoa(value);
  });
}
