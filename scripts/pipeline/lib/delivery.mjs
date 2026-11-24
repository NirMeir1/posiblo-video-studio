// Delivery: when stage 9 has verified the exports, finished videos are copied to one folder
// the user collects them from (default C:\Edit Videos, override with POSIBLO_DELIVERY_DIR).
// Only exports whose own automated checks passed, from a run whose source is preserved, are
// delivered. Copies are written to a .partial file first and renamed, so a half-copied file is
// never left under the final name. Run files in out/<slug>/ stay where they are.
import fs from 'node:fs';
import path from 'node:path';
import {sha256File} from './util.mjs';

export const DEFAULT_DELIVERY_DIR = 'C:\\Edit Videos';

export const deliveryDir = (env = process.env) => (env.POSIBLO_DELIVERY_DIR ?? '').trim() || DEFAULT_DELIVERY_DIR;

const sameFile = async (a, b) => fs.statSync(a).size === fs.statSync(b).size && await sha256File(a) === await sha256File(b);

/** Copies one file; returns 'copied', 'unchanged' (identical file already there) or 'replaced'. */
export const deliverFile = async (from, to) => {
  const existed = fs.existsSync(to);
  if (existed && await sameFile(from, to)) return 'unchanged';
  const partial = `${to}.partial`;
  fs.rmSync(partial, {force: true});
  fs.copyFileSync(from, partial);
  fs.rmSync(to, {force: true});
  fs.renameSync(partial, to);
  return existed ? 'replaced' : 'copied';
};

/**
 * @param exports [{name, file (absolute), automatedPass}]
 * @param extras [{file (absolute), as (file name in the delivery folder)}] delivered with the videos
 * @param sourcePreserved original unchanged and copy identical
 */
export const deliver = async ({dir, exports, extras = [], sourcePreserved, log = () => {}}) => {
  const items = [];
  if (!sourcePreserved) {
    log(`  delivery to ${dir} skipped: the source recording is not verified as preserved`);
    return {dir, delivered: [], skipped: exports.map(e => ({name: e.name, reason: 'source not preserved'}))};
  }
  fs.mkdirSync(dir, {recursive: true});
  const skipped = [];
  for (const e of exports) {
    if (!e.automatedPass) { skipped.push({name: e.name, reason: 'automated checks failed'}); log(`  ${e.name}: NOT delivered (automated checks failed)`); continue; }
    const to = path.join(dir, path.basename(e.file));
    const result = await deliverFile(e.file, to);
    items.push({name: e.name, file: to, result});
    log(`  ${e.name}: ${result === 'unchanged' ? 'already in' : result === 'replaced' ? 'replaced an older copy in' : 'delivered to'} ${to}`);
  }
  if (items.length) {
    for (const x of extras.filter(x => fs.existsSync(x.file))) {
      const to = path.join(dir, x.as);
      items.push({name: x.as, file: to, result: await deliverFile(x.file, to)});
    }
  }
  return {dir, delivered: items, skipped};
};
