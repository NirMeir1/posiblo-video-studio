import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = path.resolve('references/posiblo-v1');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const failures = [];
for (const file of manifest.files) {
  const target = path.resolve(root, file.path);
  if (!target.startsWith(root + path.sep)) throw new Error('Invalid manifest path');
  if (!fs.existsSync(target)) { failures.push(`${file.path}: missing`); continue; }
  const data = fs.readFileSync(target);
  const hash = createHash('sha256').update(data).digest('hex');
  if (data.length !== file.bytes || hash !== file.sha256) failures.push(`${file.path}: changed`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Baseline integrity passed: ${manifest.files.length} files.`);
