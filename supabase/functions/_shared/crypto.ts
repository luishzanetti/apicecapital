// Shared crypto utilities for Supabase Edge Functions
// Extracted from dca-execute to eliminate duplication across functions

export function evpBytesToKey(password: string, salt: Uint8Array, keyLen: number, ivLen: number): Uint8Array {
  const totalLen = keyLen + ivLen;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  let prev = new Uint8Array(0);

  while (offset < totalLen) {
    const input = new Uint8Array(prev.length + password.length + salt.length);
    input.set(prev, 0);
    input.set(new TextEncoder().encode(password), prev.length);
    input.set(salt, prev.length + password.length);
    prev = md5(input);
    const copyLen = Math.min(prev.length, totalLen - offset);
    result.set(prev.slice(0, copyLen), offset);
    offset += copyLen;
  }
  return result;
}

export function md5(data: Uint8Array): Uint8Array {
  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,
    0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,
    0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,
    0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,
    0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,
    0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,
    0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,
    0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,
    0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];
  const S = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ];
  function rl(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
  const padLen = 64 - ((data.length + 9) % 64 === 0 ? 64 : (data.length + 9) % 64);
  const padded = new Uint8Array(data.length + 1 + padLen + 8);
  padded.set(data);
  padded[data.length] = 0x80;
  const bits = data.length * 8;
  padded[padded.length - 8] = bits & 0xff;
  padded[padded.length - 7] = (bits >>> 8) & 0xff;
  padded[padded.length - 6] = (bits >>> 16) & 0xff;
  padded[padded.length - 5] = (bits >>> 24) & 0xff;
  const words = new Uint32Array(padded.buffer);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      const t = d; d = c; c = b;
      b = (b + rl((a + f + K[j] + words[i + g]) | 0, S[j])) | 0;
      a = t;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  const r = new Uint8Array(16);
  const v = new DataView(r.buffer);
  v.setInt32(0, a0, true); v.setInt32(4, b0, true); v.setInt32(8, c0, true); v.setInt32(12, d0, true);
  return r;
}

export async function aesDecryptAsync(ciphertext: string, passphrase: string): Promise<string> {
  const raw = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  if (new TextDecoder().decode(raw.slice(0, 8)) !== 'Salted__') throw new Error('Invalid format');
  const salt = raw.slice(8, 16);
  const encrypted = raw.slice(16);
  const keyIv = evpBytesToKey(passphrase, salt, 32, 16);
  const key = await crypto.subtle.importKey('raw', keyIv.slice(0, 32), { name: 'AES-CBC' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: keyIv.slice(32, 48) }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

export async function hmacSHA256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
