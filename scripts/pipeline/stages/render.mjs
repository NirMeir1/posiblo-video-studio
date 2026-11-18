// Stage 7: render the full edited video and every clip in 9:16 with the reusable
// PosibloPipeline composition. Bundles once with out/<slug>/07-render/public as the public dir,
// so the render never reads or writes the repository's public/ folder.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {runPaths, rel} from '../lib/paths.mjs';
import {runNode} from './transcribe.mjs';
import {FRAME_MS} from '../lib/timeline.mjs';
import {rebaseCaptions} from '../../../src/pipeline/caption-timeline.mjs';
import {ensureDir, readJson, round, sha256Text, writeJson} from '../lib/util.mjs';
import {ApprovalRequired} from '../runner.mjs';
import {approvalStatus, checkPlanFile} from '../lib/approval.mjs';

export const COMPOSITION_ID = 'PosibloPipeline';
export const RENDER_FLAGS = ['--codec=h264', '--crf=18', '--pixel-format=yuv420p', '--audio-codec=aac', '--audio-bitrate=192k'];

const remotionCli = repoRoot => {
  const require = createRequire(path.join(repoRoot, 'package.json'));
  const pkg = require.resolve('@remotion/cli/package.json');
  return path.join(path.dirname(pkg), require(pkg).bin.remotion);
};

/** 1080x1920 when the source's short side supports it, otherwise the 720x1280 baseline. */
export const chooseResolution = ({width, height}) => Math.min(width, height) >= 1080 ? {width: 1080, height: 1920} : {width: 720, height: 1280};

/** Snaps a render range to the 30 fps frame grid so video trim and caption rebasing agree. */
export const snapRange = (startMs, endMs, maxMs) => {
  const startFrame = Math.max(0, Math.round(startMs / FRAME_MS));
  const endFrame = Math.min(Math.round(maxMs / FRAME_MS), Math.round(endMs / FRAME_MS));
  if (endFrame <= startFrame) throw new Error(`Empty render range ${startMs}-${endMs}`);
  return {startMs: startFrame * FRAME_MS, endMs: endFrame * FRAME_MS};
};

export const planExports = ({slug, clipsFile, captions, scenes = [], editedDurationMs, resolution}) => {
  const full = {name: 'full', title: clipsFile.fullVideoTitle ?? '', range: snapRange(0, editedDurationMs, editedDurationMs)};
  const clips = clipsFile.clips.map(c => ({name: c.id, title: c.title, range: snapRange(c.renderStartMs, c.renderEndMs, editedDurationMs), selection: {startMs: c.startMs, endMs: c.endMs}}));
  return [full, ...clips].map(item => {
    const props = {source: 'edited.mp4', captions, scenes, clip: item.range, title: item.title, ...resolution};
    return {...item, slug, props, rebased: rebaseCaptions(captions, item.range.startMs, item.range.endMs), propsHash: sha256Text(JSON.stringify(props))};
  });
};

export const render = async ({runDir, slug, repoRoot, tools, log}) => {
  const paths = runPaths(runDir);
  const captions = readJson(paths.captions.captions);
  const clipsFile = readJson(paths.clips.clips);
  const editMap = readJson(paths.cut.editMap);
  const probe = await tools.probe(paths.audio.edited);
  const video = probe.streams.find(s => s.codec_type === 'video');
  const resolution = chooseResolution(video);
  const notes = [];
  if (Math.abs(video.width / video.height - 9 / 16) > 0.01) notes.push(`Source is ${video.width}x${video.height}, not 9:16; it is center-cropped to fill the frame (objectFit cover). Check that the speaker stays in frame.`);
  if (resolution.width === 720) notes.push(`Source short side is ${Math.min(video.width, video.height)} px, so the 720x1280 baseline is used rather than 1080x1920.`);

  ensureDir(paths.render.publicDir);
  if (!fs.existsSync(paths.render.publicSource) || fs.statSync(paths.render.publicSource).size !== fs.statSync(paths.audio.edited).size) {
    fs.rmSync(paths.render.publicSource, {force: true});
    try { fs.linkSync(paths.audio.edited, paths.render.publicSource); } catch { fs.copyFileSync(paths.audio.edited, paths.render.publicSource); }
  }
  // Scene plan: written by stage 5, shown in Studio, approved by a person before anything renders.
  const plan = fs.existsSync(paths.clips.scenePlan) ? readJson(paths.clips.scenePlan) : {scenes: []};
  const planProblems = checkPlanFile(plan);
  if (planProblems.length) throw new Error(`${rel(runDir, paths.clips.scenePlan)} is not valid:\n- ${planProblems.join('\n- ')}`);
  const scenes = plan.scenes.map(({id, type, startMs, endMs, heading, items}) => ({id, type, startMs, endMs, heading, items}));
  const exportsPlan = planExports({slug, clipsFile, captions, scenes, editedDurationMs: editMap.editedDurationMs, resolution});
  for (const item of exportsPlan) { writeJson(paths.render.props(item.name), item.props); writeJson(paths.render.captions(item.name), item.rebased); }
  const status = approvalStatus(paths.clips.scenePlan, paths.clips.sceneApproval);
  if (!status.approved) {
    const r = p => rel(repoRoot, p);
    throw new ApprovalRequired(`Scene plan waiting for your approval (${status.reason}).`, {
      scenes: scenes.length, planMd: r(paths.clips.scenePlanMd), planJson: r(paths.clips.scenePlan),
      studio: `npx remotion studio --public-dir=${r(paths.render.publicDir)} --props=${r(paths.render.props('full'))}`,
    });
  }
  log(`  scene plan approved ${status.approval.approvedAt} (${scenes.length} scene(s))`);
  const cli = remotionCli(repoRoot);
  log('  bundling Remotion project...');
  fs.rmSync(paths.render.bundle, {recursive: true, force: true});
  await runNode([cli, 'bundle', 'src/index.ts', `--public-dir=${paths.render.publicDir}`, `--out-dir=${paths.render.bundle}`], {cwd: repoRoot});
  const previous = fs.existsSync(paths.render.manifest) ? readJson(paths.render.manifest).exports ?? [] : [];
  const done = [];
  for (const item of exportsPlan) {
    const output = paths.render.exportFile(slug, item.name);
    const propsFile = paths.render.props(item.name);
    const captionFile = paths.render.captions(item.name);
    const earlier = previous.find(p => p.name === item.name);
    if (earlier?.propsHash === item.propsHash && fs.existsSync(output)) {
      log(`  ${item.name}: already rendered with the same props, skipped`);
    } else {
      log(`  rendering ${item.name} (${((item.range.endMs - item.range.startMs) / 1000).toFixed(1)} s)...`);
      ensureDir(path.dirname(output));
      const partial = output.replace(/\.mp4$/, '.partial.mp4');
      fs.rmSync(partial, {force: true});
      await runNode([cli, 'render', paths.render.bundle, COMPOSITION_ID, partial, `--props=${propsFile}`, ...RENDER_FLAGS], {cwd: repoRoot});
      fs.rmSync(output, {force: true});
      fs.renameSync(partial, output);
    }
    done.push({name: item.name, output: rel(runDir, output), props: rel(runDir, propsFile), captions: rel(runDir, captionFile), propsHash: item.propsHash,
      range: {startMs: round(item.range.startMs), endMs: round(item.range.endMs)}, selection: item.selection ?? null, title: item.title, captionWords: item.rebased.length, ...resolution});
    writeJson(paths.render.manifest, {composition: COMPOSITION_ID, flags: RENDER_FLAGS, source: rel(runDir, paths.render.publicSource), notes, exports: done});
  }
  return {outputs: [paths.render.manifest, ...done.flatMap(d => [d.output, d.props, d.captions].map(f => path.join(runDir, f)))].map(f => rel(runDir, path.resolve(f))), summary: {exports: done.length, ...resolution, notes}};
};
