// npm run setup:transcriber
// Creates the project-local Python environment (.venv, Git-ignored), installs the pinned
// packages from scripts/pipeline/python/requirements.txt, then downloads and verifies the
// ivrit.ai Hebrew model (pinned revision + SHA-256). Free; runs once.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {REPO_ROOT} from './lib/util.mjs';

export const venvPython = repoRoot => path.join(repoRoot, '.venv', process.platform === 'win32' ? 'Scripts\\python.exe' : 'bin/python');

const run = (command, args) => {
  console.log(`> ${[command, ...args].join(' ')}`);
  const result = spawnSync(command, args, {cwd: REPO_ROOT, stdio: 'inherit', windowsHide: true});
  if (result.error || result.status !== 0) throw new Error(`${command} failed${result.error ? `: ${result.error.message}` : ` with code ${result.status}`}`);
};

const findPython = () => {
  for (const [command, prefix] of [['python', []], ['py', ['-3']], ['python3', []]]) {
    const probe = spawnSync(command, [...prefix, '-c', 'import sys; print(sys.version_info[:2] >= (3, 9))'], {encoding: 'utf8', windowsHide: true});
    if (probe.status === 0 && probe.stdout.trim() === 'True') return [command, prefix];
  }
  throw new Error('Python 3.9 or later was not found on PATH. Install it (for example `winget install Python.Python.3.13`) and open a new terminal.');
};

const main = () => {
  const python = venvPython(REPO_ROOT);
  if (!fs.existsSync(python)) {
    const [command, prefix] = findPython();
    run(command, [...prefix, '-m', 'venv', '.venv']);
  }
  run(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', path.join('scripts', 'pipeline', 'python', 'requirements.txt')]);
  run(python, [path.join('scripts', 'pipeline', 'python', 'transcribe_ivrit.py'), '--download-only']);
  console.log('\nHebrew transcriber ready. npm run pipeline now uses it by default.');
};

// Run only when executed directly (the pipeline imports venvPython from this file).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`\nSETUP FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}
