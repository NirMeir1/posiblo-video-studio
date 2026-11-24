// Stage 9: run the existing scripts/verify-deliverable.mjs on every export with the caption
// timeline that export actually shows, re-check source preservation and the reference archive,
// write draft brief/review records and print a summary that states the pending human checks.
// Verified exports (and metadata.json) are then copied to the delivery folder (lib/delivery.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {runPaths, rel} from '../lib/paths.mjs';
import {readJson, sha256File, writeJson, writeText} from '../lib/util.mjs';
import {draftBrief, draftReview} from '../lib/drafts.mjs';
import {deliver, deliveryDir} from '../lib/delivery.mjs';

export const MANUAL_CHECKS = [
  'Full playback of every export with sound (voice clarity, lip sync, every cut point)',
  'Phone-size inspection of every export (captions, title, face and platform UI do not collide)',
  'Fluent Hebrew caption review against the audio (and of the generated titles and metadata)',
];

const runCapture = (args, cwd) => new Promise(resolve => {
  const child = spawn(process.execPath, args, {cwd, windowsHide: true});
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  child.on('error', error => resolve({code: -1, out: String(error.message)}));
  child.on('exit', code => resolve({code, out}));
});

export const verify = async ({runDir, slug, repoRoot, state, log}) => {
  const paths = runPaths(runDir);
  const manifest = readJson(paths.render.manifest);
  const source = path.join(runDir, manifest.source);
  const results = [];
  for (const e of manifest.exports) {
    const report = paths.verify.report(e.name);
    fs.rmSync(report, {force: true});
    const {code, out} = await runCapture([path.join(repoRoot, 'scripts', 'verify-deliverable.mjs'), '--output', path.join(runDir, e.output), '--source', source, '--captions', path.join(runDir, e.captions), '--report', report], repoRoot);
    const parsed = fs.existsSync(report) ? readJson(report) : null;
    results.push({name: e.name, output: e.output, captions: e.captions, report: rel(runDir, report), automatedPass: Boolean(parsed?.automatedPass) && code === 0, checks: parsed?.checks ?? null, durationSeconds: parsed?.duration ?? null, error: parsed ? null : out.trim().split(/\r?\n/).slice(-5).join('\n')});
    log(`  ${e.name}: automated checks ${results.at(-1).automatedPass ? 'passed' : 'FAILED'}`);
  }

  const provenance = readJson(paths.ingest.provenance);
  const originalNow = fs.existsSync(state.source.originalPath) ? await sha256File(state.source.originalPath) : null;
  const copyNow = await sha256File(path.join(runDir, provenance.copy.path));
  const preservation = {originalPath: state.source.originalPath, originalUnchanged: originalNow === state.source.sha256, copyMatchesOriginal: copyNow === state.source.sha256, originalSha256: state.source.sha256};
  const baseline = await runCapture([path.join(repoRoot, 'scripts', 'verify-baseline.mjs')], repoRoot);

  // Delivery depends on each export's own checks and source preservation, not on the reference archive check.
  const delivery = await deliver({
    dir: deliveryDir(), log,
    sourcePreserved: preservation.originalUnchanged && preservation.copyMatchesOriginal,
    exports: results.map(r => ({name: r.name, file: path.join(runDir, r.output), automatedPass: r.automatedPass})),
    extras: [{file: paths.metadata.file, as: `${slug}-metadata.json`}],
  });

  const flags = readJson(paths.captions.flags);
  const loudness = readJson(paths.audio.loudness);
  const editMap = readJson(paths.cut.editMap);
  const clips = readJson(paths.clips.clips);
  const scenePlan = fs.existsSync(paths.clips.scenePlan) ? readJson(paths.clips.scenePlan) : {scenes: []};
  const sceneApproval = fs.existsSync(paths.clips.sceneApproval) ? readJson(paths.clips.sceneApproval) : null;
  const automatedPass = results.every(r => r.automatedPass) && preservation.originalUnchanged && preservation.copyMatchesOriginal && baseline.code === 0;
  const summary = {
    slug, runDir, createdAt: new Date().toISOString(), automatedPass, releaseReady: false,
    releaseReadyReason: 'Not release-ready: human checks below are pending. Automated checks do not establish release readiness.',
    exports: results, delivery, sourcePreservation: preservation, baselineIntegrity: {passed: baseline.code === 0, output: baseline.out.trim()},
    cut: {sourceSeconds: editMap.sourceDurationMs / 1000, editedSeconds: editMap.editedDurationMs / 1000, cuts: editMap.removals.length},
    loudness: {before: loudness.before.integratedLufs, after: loudness.after.integratedLufs, truePeak: loudness.after.truePeakDbtp, warnings: loudness.warnings},
    captions: flags.summary, clips: {count: clips.clips.length, note: clips.note},
    scenePlan: {scenes: scenePlan.scenes.length, model: scenePlan.model ?? null, approvedAt: sceneApproval?.approvedAt ?? null, decision: scenePlan.decision ?? null},
    pendingHumanChecks: MANUAL_CHECKS.map(check => ({check, status: 'PENDING'})),
    alsoPending: ['Documented improvement over the v1 reference', 'Current platform requirements checked from official sources', 'Review of every automatic cut, the generated on-screen titles and metadata.json'],
    notUploaded: 'Nothing was uploaded or published. All files are local: this folder and the delivery folder.',
  };
  writeJson(paths.verify.summaryJson, summary);
  writeText(paths.verify.brief(slug), draftBrief({slug, state, provenance, editMap, loudness, flags, clips, manifest}));
  writeText(paths.verify.review(slug), draftReview({slug, runDir, summary, manifest, flags, editMap}));

  const lines = [
    `# Pipeline summary: ${slug}`, '',
    `Folder: ${runDir}`,
    `Automated checks: ${automatedPass ? 'passed' : 'FAILED (see below)'}`,
    `Release status: NOT release-ready. Human review is pending.`, '',
    '## Exports',
    ...results.map(r => `- ${r.output}: ${r.automatedPass ? 'automated checks passed' : `FAILED${r.error ? ` (${r.error})` : ''}`}; report ${r.report}`), '',
    '## Delivered',
    `Folder: ${delivery.dir}`,
    ...(delivery.delivered.length ? delivery.delivered.map(d => `- ${d.file}`) : ['- nothing delivered']),
    ...delivery.skipped.map(s => `- NOT delivered: ${s.name} (${s.reason})`), '',
    `Source preserved: original unchanged ${preservation.originalUnchanged ? 'yes' : 'NO'}, copy identical ${preservation.copyMatchesOriginal ? 'yes' : 'NO'}. Reference archive: ${baseline.code === 0 ? 'intact' : 'CHECK FAILED'}.`,
    `Clean cut: ${summary.cut.sourceSeconds.toFixed(1)} s -> ${summary.cut.editedSeconds.toFixed(1)} s, ${summary.cut.cuts} cuts (03-clean-cut/edit-map.json).`,
    `Loudness: ${summary.loudness.before} -> ${summary.loudness.after} LUFS (target -14), true peak ${summary.loudness.truePeak} dBTP.${summary.loudness.warnings.length ? ` Warnings: ${summary.loudness.warnings.join(' ')}` : ''}`,
    `Captions: ${flags.summary.captionWords} words, machine-generated, ${flags.summary.priorityFlags} priority flags, ${flags.summary.missingConfidence} without confidence (06-captions/review-flags.json).`,
    `Clips: ${clips.clips.length}${clips.note ? ` (${clips.note})` : ''}. Metadata: metadata.json (machine-generated).`,
    `Animated scenes: ${scenePlan.scenes.length} (plan by ${scenePlan.model ?? 'unknown'}, approved ${sceneApproval?.approvedAt ?? 'NOT approved'}; 05-clip-selection/scene-plan.md).`, '',
    '## YOU MUST DO BEFORE POSTING',
    ...MANUAL_CHECKS.map((c, i) => `${i + 1}. ${c} - PENDING`),
    '', 'Also pending: review of every automatic cut, the generated titles and metadata, the improvement over the v1 reference, and current platform requirements.',
    `Draft records: ${rel(runDir, paths.verify.brief(slug))}, ${rel(runDir, paths.verify.review(slug))} (copy to docs/videos/ when you complete them).`,
    'Nothing was uploaded or published.',
  ];
  writeText(paths.verify.summaryMd, lines.join('\n') + '\n');
  log('\n' + lines.join('\n'));
  const outputs = [paths.verify.summaryJson, paths.verify.summaryMd, paths.verify.brief(slug), paths.verify.review(slug), ...results.filter(r => fs.existsSync(path.join(runDir, r.report))).map(r => path.join(runDir, r.report))];
  if (!automatedPass) throw new Error(`Automated verification failed; see ${rel(runDir, paths.verify.summaryJson)}`);
  return {outputs: outputs.map(f => rel(runDir, f)), summary: {automatedPass, exports: results.length}};
};
