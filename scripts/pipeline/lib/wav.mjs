// Minimal PCM WAV reading/writing for sample-exact audio cuts (streams, never loads whole files).
import fs from 'node:fs';

/** Reads the fmt and data chunk locations of a PCM WAV file. */
export const readWavInfo = file => {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(12);
    fs.readSync(fd, head, 0, 12, 0);
    if (head.toString('ascii', 0, 4) !== 'RIFF' || head.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${file} is not a RIFF WAV`);
    const size = fs.fstatSync(fd).size;
    let offset = 12;
    let format = null;
    while (offset + 8 <= size) {
      const chunk = Buffer.alloc(8);
      fs.readSync(fd, chunk, 0, 8, offset);
      const id = chunk.toString('ascii', 0, 4);
      let chunkSize = chunk.readUInt32LE(4);
      if (id === 'fmt ') {
        const f = Buffer.alloc(16);
        fs.readSync(fd, f, 0, 16, offset + 8);
        format = {codec: f.readUInt16LE(0), channels: f.readUInt16LE(2), sampleRate: f.readUInt32LE(4), bitsPerSample: f.readUInt16LE(14)};
      }
      if (id === 'data') {
        if (!format) throw new Error('WAV data chunk before fmt chunk');
        // ffmpeg writes 0xFFFFFFFF (or a too-large size) when streaming; trust the file length.
        if (chunkSize === 0xffffffff || offset + 8 + chunkSize > size) chunkSize = size - offset - 8;
        const frameBytes = format.channels * format.bitsPerSample / 8;
        return {...format, dataOffset: offset + 8, dataBytes: chunkSize, frameBytes, frames: Math.floor(chunkSize / frameBytes)};
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
    throw new Error(`${file} has no data chunk`);
  } finally {
    fs.closeSync(fd);
  }
};

const header = ({channels, sampleRate, bitsPerSample}, dataBytes) => {
  const b = Buffer.alloc(44);
  b.write('RIFF', 0, 'ascii'); b.writeUInt32LE(36 + dataBytes, 4); b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii'); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(channels, 22);
  b.writeUInt32LE(sampleRate, 24); b.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  b.writeUInt16LE(channels * bitsPerSample / 8, 32); b.writeUInt16LE(bitsPerSample, 34);
  b.write('data', 36, 'ascii'); b.writeUInt32LE(dataBytes, 40);
  return b;
};

/**
 * Writes a new PCM WAV made of the given sample-frame ranges [start, end) of `source`.
 * Ranges past the end of the source are padded with silence so the output length is exact.
 */
export const writeWavRanges = (source, destination, ranges) => {
  const info = readWavInfo(source);
  if (info.codec !== 1) throw new Error('Only PCM WAV can be cut');
  const total = ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
  const src = fs.openSync(source, 'r');
  const dst = fs.openSync(destination, 'w');
  try {
    fs.writeSync(dst, header(info, total * info.frameBytes));
    const chunkFrames = 1 << 16;
    for (const {start, end} of ranges) {
      for (let pos = start; pos < end; pos += chunkFrames) {
        const count = Math.min(chunkFrames, end - pos);
        const buffer = Buffer.alloc(count * info.frameBytes);
        const available = Math.max(0, Math.min(count, info.frames - pos));
        if (available > 0) fs.readSync(src, buffer, 0, available * info.frameBytes, info.dataOffset + pos * info.frameBytes);
        fs.writeSync(dst, buffer);
      }
    }
  } finally {
    fs.closeSync(src);
    fs.closeSync(dst);
  }
  return {frames: total, sampleRate: info.sampleRate, channels: info.channels};
};
