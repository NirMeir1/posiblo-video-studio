# Approved reference: review record

Status: user-approved visual reference; human caption review pending.

- Standard: Posiblo Video Standard v1.
- Approved output: `out/not-every-business-needs-ai-posiblo.mp4`.
- Preserved copy: `references/posiblo-v1/out/not-every-business-needs-ai-posiblo.mp4`.
- Approval evidence: the user explicitly selected this video as the quality baseline in this conversation.
- Original prompt: `docs/prompts/original-video-prompt.md` (recovered from local history).
- Source provenance: current workspace snapshot, not an established historical render commit.

## Automated checks at standard creation

`npm.cmd run verify:baseline`: all 23 archived files matched their recorded SHA-256 hashes.

`npm.cmd run verify:video`: passed full decoding, H.264 vertical video format and frame rate, AAC audio, video/audio duration consistency, and caption timing bounds/order for the actual approved filename. Duration: 42.733333 seconds. Report: `out/not-every-business-needs-ai-posiblo.mp4.verification.json`.

`npm.cmd run lint`: ESLint and TypeScript passed. The archived historical report also records sampled source/output audio alignment, but uses the old filename; it is historical evidence rather than a fresh synchronization test of the approved file.

## Pending review and improvements

- Human Hebrew review: pending. Automatic captions omit the unclear clause at 12.26-13.68 seconds. A fluent listener should confirm this clause and review the complete transcript against audio. Do not guess or silently fill the gap.
- Full final-file playback, perceptual lip sync, phone-size readability, and target-platform overlays: not newly certified by this standardization task.
- Footage: the recorded source is 480 x 854, exported at 720 x 1280. Use a higher-resolution original for future videos when available. This task did not create new source detail or modify the approved video.
- Standardization improvement: archived source and media with integrity hashes; documented creative rules; reusable brief and review; verification now targets the actual approved filename and accepts new deliverable paths.

Future videos must record a specific creative or production improvement over this reference. Pending review here does not remove that requirement.
