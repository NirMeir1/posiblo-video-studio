// Scene-plan approval. An approval records the SHA-256 of the exact plan file it approved,
// so editing the plan afterwards requires approving again.
import fs from 'node:fs';
import {readJson, sha256Text, writeJson} from './util.mjs';
import {SCENE_TYPES} from './scenes.mjs';

export const planHash = planFile => sha256Text(fs.readFileSync(planFile, 'utf8'));

/** Re-checks a (possibly hand-edited) plan file. Returns a list of problems. */
export const checkPlanFile = plan => {
  const problems = [];
  if (!plan || !Array.isArray(plan.scenes)) return ['scene-plan.json must contain a "scenes" array'];
  plan.scenes.forEach((s, i) => {
    const at = `scenes[${i}]`;
    if (!SCENE_TYPES[s?.type]) problems.push(`${at}.type must be one of ${Object.keys(SCENE_TYPES).join(', ')}`);
    if (!Number.isFinite(s?.startMs) || !Number.isFinite(s?.endMs) || s.endMs <= s.startMs) problems.push(`${at} needs startMs < endMs`);
    if (typeof s?.heading !== 'string' || !s.heading.trim()) problems.push(`${at}.heading is empty`);
    if (!Array.isArray(s?.items)) problems.push(`${at}.items must be an array`);
    if (typeof s?.id !== 'string' || !s.id) problems.push(`${at}.id is missing`);
    if (i && s.startMs < plan.scenes[i - 1].endMs) problems.push(`${at} overlaps the previous scene`);
  });
  return problems;
};

export const approvalStatus = (planFile, approvalFile) => {
  if (!fs.existsSync(planFile)) return {approved: false, reason: 'no scene plan exists yet'};
  if (!fs.existsSync(approvalFile)) return {approved: false, reason: 'the scene plan has not been approved'};
  const approval = readJson(approvalFile);
  if (approval.planSha256 !== planHash(planFile)) return {approved: false, reason: 'the scene plan changed after it was approved'};
  return {approved: true, approval};
};

export const approvePlan = (planFile, approvalFile) => {
  if (!fs.existsSync(planFile)) throw new Error('There is no scene plan to approve yet; run the pipeline first.');
  const problems = checkPlanFile(readJson(planFile));
  if (problems.length) throw new Error(`scene-plan.json is not valid, so it was not approved:\n- ${problems.join('\n- ')}`);
  const record = {approvedAt: new Date().toISOString(), planSha256: planHash(planFile), approvedBy: 'command line (--approve-scenes)'};
  writeJson(approvalFile, record);
  return record;
};
