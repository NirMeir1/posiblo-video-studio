# Video review: founder-introduction

Status: **exported / awaiting human review**. Not certified upload-ready.

- Brief: [founder-introduction-brief.md](founder-introduction-brief.md).
- Standard: Posiblo Video Standard v1.
- Composition: `FounderIntroduction`, [source](../../src/FounderIntroduction.tsx).
- Preview: [Remotion Studio](http://localhost:3001/FounderIntroduction); local server must remain running.
- Original: `C:\Posiblo\Founder introduction — edited_8.mp4`; copy: `public/input/founder-introduction-edited-8.mp4`.
- Exact exported MP4: [founder-introduction-posiblo.mp4](../../out/founder-introduction-posiblo.mp4), 82.333333 seconds, 720 × 1280, 30 fps, H.264/yuv420p and AAC. File size: 11,230,328 bytes. Export requested in follow-up “so export it”.
- Captions: [JSON](../../src/founder-introduction-captions.json), [editable Studio array](../../src/FounderCaptionTrack.tsx); SRT at `out/founder-introduction/founder-introduction.srt`.
- Automated evidence: [preview-verification.json](../../out/founder-introduction/preview-verification.json). Scope is source/captions/QA images, not MP4 acceptance.
- Exact-file export verification: [MP4 verification report](../../out/founder-introduction-posiblo.mp4.verification.json); all automated checks passed. [Sampled audio comparison](../../out/founder-introduction/export-audio-check.json) also passed; this is not a human listening check.
- Visual reviewer: Codex image inspection, 2026-11-15. No human listening or caption reviewer recorded.

## Checks

| Check | Status | Evidence / limits |
| --- | --- | --- |
| Opening communicates one clear message | pass for sampled visual | Final frame 0 shows the business-fit question immediately; source opening preserved |
| Relevant social-media guidance mapped and implemented | pass for planning/implementation | Brief context and per-placement rows; original speaker, single topic, truthful spoken invitation, clean visual crop, higher captions |
| Current requirements verified for each target placement | pending | Facebook announcement readable; Instagram size help returned 429; fresh TikTok help attempt returned no readable body; actual account requirements/previews not checked |
| Marketing proof, rights, and disclosures checked | pending | Experience/free-meeting statements are from speaker; no independent substantiation claimed. No added music. Original soundtrack rights/disclosure confirmation remains for publishing |
| CTA and destination/action checked | pass for copy; destination not applicable to this preview | Invitation reflects recorded offer; no fabricated booking URL or added promotional terms. Native posting action remains unconfigured |
| Diagrams explain actual speech | pass for sampled visuals and automatic transcript alignment | Business needs at 29s; listen/understand at 41s; choice at 48s; options at 53.5s. Human speech/meaning review remains pending |
| Branding and visual quality match/exceed v1 | pass for sampled identity/layout; overall approval pending | Dark/lime palette, white `posiblo` wordmark and lime dot, rounded cards, line icons, speaker inset; compared with approved MP4 frame at 22s. Full-video comparison not performed |
| Hebrew RTL, punctuation, and Latin text render correctly | pass for sampled rendering | RTL titles and captions inspected in main/transition sheets; word highlight follows source timestamps. Full linguistic accuracy requires human review |
| Captions checked against audio by fluent Hebrew listener | pending | Two automatic models and source embedded-text checks are not human listening. Six word-level corrections recorded in brief/log |
| Captions and diagrams readable at phone size | pass for sampled layout | 10 main images displayed at 360px width; transition images at 300px width; caption band starts at y=864. Essential titles/labels readable in these samples; no actual device test claimed |
| Face, captions, branding, platform overlays do not collide | pass for sampled internal composition; platform pending | Source y=270..880 crop excludes embedded subtitles and watermark in inspected frames. Dedicated caption band separate from cards. Native UI overlays not inspected |
| Entrances/exits/camera transitions checked | pass for sampled revised frames | Initial overlap found and fixed; revised contact sheet and final hold checked. This is still-frame sampling, not continuous playback |
| Full final export watched with sound; voice and lip sync checked | pending | MP4 exported; no full human listening/lip-sync check performed. Automated audio comparison passed in three sampled windows |
| Final-file decoding, metadata, caption order pass | pass | Exact exported MP4 passed full decoding, video/audio format, duration consistency, and caption bounds/order; see MP4 verification report |
| Original footage preserved; baseline integrity passes | pass | Original/project-copy SHA-256 equal in preview report; `npm.cmd run verify:baseline` passed all 23 archived files |

## Visual evidence and revisions

- [Main contact sheet](../../out/founder-introduction/qa-contact.png): 2, 9.5, 20, 29, 41, 48, 53.5, 60.67, 73, and 80 seconds. These main samples predate the subsequent edge-fade fixes; interior content at these timestamps is unchanged.
- [Revised transition sheet](../../out/founder-introduction/qa-transitions-revised-contact.png): source frames 0, 672, 678, 684, 690, 696, 918, 924, 930, 1128, 1134, 1140, 1641, 1647, 1653, 2058, 2064, 2070, 2469. Its last frame predates the final hold fix; use the image below for the actual final ending.
- [Final ending, frame 2469](../../out/founder-introduction/qa-final-hold/element-2469.png): invitation and free-meeting card hold through the end. Visually inspected after final source changes.
- Studio loaded the actual new composition; most recent checked browser console had zero errors. Direct browser batch screenshots stalled during some media seeks; independent Remotion QA image renders succeeded and were used for review.
- After export, Codex visually inspected frames extracted from the actual MP4 at [2s](../../out/founder-introduction/export-2.jpg), [29s](../../out/founder-introduction/export-29.jpg), [48s](../../out/founder-introduction/export-48.jpg), and [80s](../../out/founder-introduction/export-80.jpg). Posiblo branding, crop, diagrams, and captions are present; no Descript watermark or duplicate baked-in subtitles visible in those samples. This is not full playback review.

| Observation / timestamp | Evidence | Change | Verification |
| --- | --- | --- | --- |
| Source contains old captions and Descript logo | Original source frames at 2, 4, 22, 26, 54, 60, 70s | Fixed source crop above old text/logo; added Posiblo wordmark and own caption band | Main/revised sample sheets: no Descript watermark or duplicate captions visible; no face synthesis used |
| Speaker crosses headings/cards during transitions | Initial transition frames 678, 924, 1128, 1647, 2058 | Fade inset-scene content in after camera move; fade it out before return | Revised transition samples show content hidden while the camera crosses those areas |
| Final scene faded the invitation out | Revised frame 2469 | Hold ending card through last frame | Actual final-ending PNG checked after fix |
| Full-caption model produced six word errors | Second model plus embedded subtitles at 4/26/60/70s | Correct only supported words; retain all 195 word timestamps | Correction log and JSON/inline equality check; human audio confirmation still required |

## Automated checks actually performed

- `npm.cmd run lint`: ESLint and TypeScript passed after final code changes.
- `npm.cmd run verify:baseline`: passed 23 reference files.
- Full FFmpeg decode of `public/input/founder-introduction-edited-8.mp4`: passed.
- Original/copy SHA-256 equality; all 195 automatic-transcript word slots retained; source timestamps unchanged; non-overlapping captions within composition bounds; editable inline captions equal caption JSON; 10 sample PNGs verified at 720 × 1280: passed in preview report.
- Preview-stage Remotion image rendering: 10 main images, 16 initial transition images, 19 revised images, and one final-hold image.
- Requested MP4 export: all 2470 frames rendered and encoded successfully. Exact-file verification passed all seven checks. Audio comparison at 0–8s, 35–43s, and 70–78s returned correlations above 0.9999 with zero best-match lag in a ±10ms search; does not certify perceptual lip sync or caption meaning.

Export and verification commands actually run:

```powershell
node_modules/.bin/remotion.cmd render src/index.ts FounderIntroduction out/founder-introduction-posiblo.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=192k --concurrency=2 --is-production=false
npm.cmd run verify:video -- --output out/founder-introduction-posiblo.mp4 --source public/input/founder-introduction-edited-8.mp4 --captions src/founder-introduction-captions.json
```

Representative QA command (image outputs only):

```powershell
node_modules/.bin/remotion.cmd render src/index.ts FounderIntroduction out/founder-introduction/qa-frames --frames=60,285,600,870,1230,1440,1605,1820,2190,2400 --image-format=png --is-production=false --concurrency=2
```

## Placement compatibility

| Platform / placement / distribution | Status | Evidence / next action |
| --- | --- | --- |
| Facebook Reels / organic | pending native preview | Vertical draft; original speaker/content; confirm live account upload and overlays before release |
| Instagram Reels / organic | pending specs and native preview | Clean crop, own branding, readable sampled captions; resolve official help access and actual UI/acceptance |
| TikTok / organic | pending native preview and disclosure | People-led vertical draft; retain real voice; check actual uploader and promotional-content disclosure |
| Paid ads / Stories / Feed crops | not applicable | Not requested; do not infer their acceptance from this master |

## Improvements, tradeoffs, and release decision

- Specific improvement over v1: captions occupy a higher dedicated band rather than v1's 108px bottom offset; new diagrams explain this founder recording's diagnostic process instead of reusing v1's lead-routing story. The new source's baked-in subtitles and Descript branding are excluded by a reversible composition crop.
- Evidence: main and revised image sheets, frame 0 hook, final invitation hold, and source crop geometry. These establish sampled layout improvements, not higher retention or sales.
- Tradeoffs: speaker is cropped to head/shoulders and becomes smaller during diagrams; some gestures below source y=880 are excluded. Continuous 82.3s introduction retained rather than making an unapproved shorter cut. Lower reserved region is intentional, but not a verified platform safe zone.
- Unresolved/next: fluent Hebrew listener reviews all captions against actual audio, especially corrected words; full continuous exported-file playback/lip sync; platform account specs/UI/disclosures; source soundtrack rights if applicable. User can review the exported MP4 or Studio composition now.
- Human release decision/date: **pending**.
- Primary metric hypothesis: clearer problem-first explanation may improve qualified inquiries; **not measured**. No performance claims made.
