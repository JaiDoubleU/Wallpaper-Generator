// Embeds the recipe in a PNG tEXt chunk so an exported wallpaper can be
// reopened for editing later (Requirements FR-15).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export async function withTextChunk(png: Blob, keyword: string, text: string): Promise<Blob> {
  const src = new Uint8Array(await png.arrayBuffer());
  // tEXt is Latin-1: escape anything outside ASCII so JSON stays valid.
  const safe = text.replace(/[^\x20-\x7e]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
  const body = new TextEncoder().encode(`tEXt${keyword}\0${safe}`);
  const chunk = new Uint8Array(4 + body.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, body.length - 4);
  chunk.set(body, 4);
  view.setUint32(4 + body.length, crc32(body));
  const insertAt = 8 + 25; // PNG signature + IHDR chunk
  return new Blob([src.subarray(0, insertAt), chunk, src.subarray(insertAt)], { type: 'image/png' });
}
