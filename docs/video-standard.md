# Posiblo Video Standard v1

The user approved `out/not-every-business-needs-ai-posiblo.mp4` as the reference and minimum quality level for future videos. Preserve its recognizable identity while improving clarity and execution. Approval of this reference does not certify its transcript as error-free.

## Reference and reproduction

- Approved archive: `references/posiblo-v1/out/not-every-business-needs-ai-posiblo.mp4`.
- Source snapshot: `references/posiblo-v1/src/`, with original media in `public/input/`, render configuration, scripts, and dependency lockfile in the same archive.
- `references/posiblo-v1/manifest.json` records SHA-256 hashes. Run `npm run verify:baseline` to check archive integrity.
- This is a snapshot of the workspace at standard creation. No exact historical render commit was established. Historical notes and QA retain the old output filename and are not a new certification of the approved MP4.
- Current composition: `PosibloFirstTest`, 720 x 1280, 30 fps, 1282 frames (about 42.73 seconds). Duration and scene count are specific to this recording, not requirements for all videos.
- To reproduce in isolation, copy the archived project outside the archive, install with `npm ci`, then use its render command. Its original script writes `out/posiblo-first-test.mp4`. Dependency installation may require network access. Never run a render into the archive.

## Visual identity

Use the existing `src/Motion.tsx` components as starting points: `SceneShell`, `WorkflowNode`, `Connector`, and `Icon`. Preserve the speaker layout, caption behavior, and branding patterns in `src/Composition.tsx` where appropriate. Create new topic-specific compositions rather than replacing the reference's content.

| Element | Baseline |
| --- | --- |
| Background / panel | `#0d181b` / `#18292e` |
| Primary accent | Lime `#d5fb72` |
| Text / secondary text | `#f5f5eb` / `#a6babd` |
| Connectors / caution | `#375057` / coral `#ff9d8c` |
| Typography | Arial, sans-serif; strong hierarchy; short headlines |
| Shapes | Rounded cards, simple line icons, clear directional connectors |
| Motion | Frame-based, restrained easing, staggered reveals, smooth camera transitions |
| Branding | White Posiblo wordmark with lime dot, consistently positioned |

Reference sizes at 720 x 1280: captions 37 px, scene titles 49 px, opening 57 px; captions have a dark backing and sit 108 px above the bottom. These are starting values, not proof of safety on every social platform. Check actual mobile readability and target-platform interface overlays. Scale layouts coherently for other resolutions.

## Editorial rules

1. Start with one clear hook. Explain the problem, show the relevant process or solution, connect it to a business outcome, and end with a focused question or action.
2. Place explanations where the actual speech introduces them. Graphics must explain something specific; avoid adding motion just to fill the frame.
3. Use a few excellent explanatory scenes. Reuse the design vocabulary, not identical timing or diagrams for every topic.
4. Keep the real speaker and voice. The reference runs the original recording continuously and shows the speaker in an inset during explanations. Treat that as the default; document intentional trims or pacing changes in the brief and maintain sync.
5. Do not introduce synthetic narration or avatars. Use free local tooling by default; paid services require explicit user authorization.
6. Preserve original footage. Work from project copies. Prefer higher-resolution originals when available; upscaling does not recover captured detail.

## Hebrew captions

Use Hebrew RTL layout, correct punctuation and mixed Hebrew/Latin ordering, short readable phrase groups, and lime highlighting for the active word. The reference groups up to five words with roughly 2.1 seconds from the first word's start; adapt grouping to meaning and readability.

Never invent unclear speech. Mark uncertainty in review notes, keep the audio intact, and seek confirmation for unresolved words. A fluent Hebrew listener must review captions against the actual audio before final release. Automated model agreement is not human review.

Known reference limitation: the automatically transcribed clause at 12.26-13.68 seconds was omitted from captions. Keep that issue visible in review records until confirmed. Do not silently carry that gap or transcript into future videos.

## Workflow and acceptance

1. Copy `docs/video-brief-template.md` to `docs/videos/<slug>-brief.md` and fill it from the request and recording. Record assumptions rather than blocking on optional preferences.
2. Inspect the reference and source; transcribe the new footage; map graphics to speech; build a distinct composition. Follow Remotion preview instructions and inspect representative scenes and transitions.
3. Complete `docs/video-review-template.md` as `docs/videos/<slug>-review.md`. Compare hook, explanation, readability, branding, motion, voice, and captions with v1. Record one concrete improvement with its evidence and any tradeoff.
4. Export only when requested. Default delivery is vertical H.264 MP4, 30 fps, AAC 192 kbps, CRF 18, yuv420p. Match the baseline's 720 x 1280 minimum; prefer 1080 x 1920 when source quality and intended delivery support it. Do not imply higher export resolution adds source detail.
5. Verify the exact final file using `npm run verify:video -- --output out/<slug>.mp4 --source public/input/<source>.mp4 --captions src/<captions>.json`. This checks full decoding, metadata, and caption bounds/order, not caption meaning or perceptual lip sync.
6. Watch the entire final export with sound, inspect it at phone size, and review Hebrew captions against audio. Record reviewer and date. Resolve failed checks; disclose pending human review. Never infer creative quality from automated checks.

Every new video must meet or exceed v1 for all review dimensions and demonstrate a specific improvement, such as a clearer opening, better diagram, verified captions, cleaner audio, or better source footage. More effects alone are not improvement. Evolve the standard to v2 only after explicit user approval; retain v1.
