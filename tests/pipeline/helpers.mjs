import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const tempDir = prefix => fs.mkdtempSync(path.join(os.tmpdir(), `posiblo-${prefix}-`));

/** Words of `durationMs` each, separated by `gapMs`, starting at `startMs`. */
export const makeWords = (texts, {startMs = 0, durationMs = 300, gapMs = 100} = {}) => {
  let t = startMs;
  return texts.map((text, index) => {
    const w = {index, text: index ? ` ${text}` : text, startMs: t, endMs: t + durationMs, confidence: null};
    t += durationMs + gapMs;
    return w;
  });
};

/** A mock Anthropic client that returns the queued responses in order and records requests. */
export const mockClient = responses => {
  const requests = [];
  return {
    requests,
    messages: {
      create: async body => {
        requests.push(structuredClone(body));
        const next = responses.shift();
        if (next instanceof Error) throw next;
        if (typeof next === 'string') return {stop_reason: 'end_turn', content: [{type: 'text', text: next}], usage: {input_tokens: 1, output_tokens: 1}};
        if (!next) throw new Error('mock client: no more responses');
        return next;
      },
    },
  };
};
