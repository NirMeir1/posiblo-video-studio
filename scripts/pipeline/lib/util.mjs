// Small filesystem and hashing helpers shared by the pipeline stages.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const sha256File = file => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  fs.createReadStream(file).on('error', reject).on('data', chunk => hash.update(chunk)).on('end', () => resolve(hash.digest('hex')));
});

export const sha256Text = text => createHash('sha256').update(text).digest('hex');

export const ensureDir = dir => fs.mkdirSync(dir, {recursive: true});

/** Writes JSON atomically (temporary file, then rename) so an interrupted run never leaves half a file. */
export const writeJson = (file, value) => {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(tmp, file);
};

export const writeText = (file, text) => {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
};

export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

/** ASCII slug from a file name. Non-Latin names (e.g. Hebrew) fall back to "video". */
export const slugify = name => {
  const base = path.basename(name, path.extname(name));
  const slug = base.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return slug || 'video';
};

export const isInside = (child, parent) => {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

export const round = (value, digits = 3) => Number(value.toFixed(digits));
