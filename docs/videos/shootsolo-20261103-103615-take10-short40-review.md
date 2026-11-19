# Video review: shootsolo-20261103-103615-take10-short40

Status: user accepted the 40-second Studio preview; requested downloadable export. Final-file and specific human release checks remain PENDING.

- User acceptance, 2026-11-19: "ok, good. I checked it - its ok. now I need to download it?" Recorded as acceptance of this composition including its previewed diagram and authorization to export this 40-second version. This does not establish full exported-file playback with sound, phone-size inspection, fluent caption review, or platform checks.
- Export target: `out/shootsolo-20261103-103615-take10/short40/posiblo-introduction-40s.mp4`, H.264, 1080 × 1920, 30 fps, CRF 18, yuv420p, AAC 192 kbps.
- Direct composition export uses the user's preview acceptance. The separate 84-second pipeline run remains paused; no pipeline approval flag was run or approval file written.

- Brief: `docs/videos/shootsolo-20261103-103615-take10-short40-brief.md`.
- Standard: Posiblo Video Standard v1.
- Composition/preview: `PosibloIntro40`, http://localhost:3012/PosibloIntro40.
- Source: `public/input/shootsolo-20261103-103615-take10-processed.mp4`; original and 84-second edit preserved.
- Exact final file: `out/shootsolo-20261103-103615-take10/short40/posiblo-introduction-40s.mp4`; verification results recorded below after export.
- Agent checks: 2026-11-19. Human reviewer/date: PENDING.

| Check | Status | Evidence / issue |
| --- | --- | --- |
| Exact requested duration | pass (automated) | 1200 frames / 30 fps = 40 s; Studio displays 00:40.00. |
| Caption timing and selected source | pass (automated) | `out/shootsolo-20261103-103615-take10/short40/edit-check.json`: 100 words, positive ordered timings within 40 seconds; media exists. This is not semantic or listening verification. |
| Code checks | pass (automated) | `npm.cmd run test:pipeline`: 62/62; `npm.cmd run lint`: ESLint and TypeScript passed. |
| Opening communicates one message | PENDING | Retained full recorded hook; generated title remains reviewable. |
| Relevant social guidance | documented | Brief maps organic guidance to hook, process and closing; marketing performance unmeasured. |
| Current platform requirements | PENDING | Parent official-source access limitations still apply; human check required. |
| Claims/rights/disclosures | PENDING | Parent speaker claims retained; no added third-party media or music. |
| CTA/action | PENDING | Free introductory mapping meeting and closing preserved; no URL supplied. |
| Diagram explains actual speech | PENDING | Same proposed three-step diagram retained with the whole process segment; user accepted the composition including the diagram on 2026-11-19. Semantic review against audio remains PENDING. |
| Branding/visual quality versus v1 | PENDING | Existing identity reused. Agent inspected process screenshot at frame 650 (21.667 s): diagram, speaker inset and captions visible without an observed collision in that sampled browser frame. No full or human comparison claimed. |
| Hebrew RTL and mixed Latin/numerals | PENDING | Captions unchanged from machine transcript; AI and 8 require fluent review. |
| Fluent Hebrew caption review | PENDING | No human review claimed. |
| Phone-size inspection | PENDING | Browser screenshot is not human phone-size review. |
| Actual platform overlays | PENDING | No platform previews available. |
| Entrances/exits and five new joins | PENDING | Boundary padding selected from machine timings; listen around 5.933, 10.8, 15.867, 27.633, 35.867 s for natural speech. |
| Full playback with sound/lip sync | PENDING | No human full playback performed. Dynamic-normalization warning inherited from parent. |
| Final export decoding/metadata | pass (automated) | Exact MP4 verified: full decode, H.264 1080 × 1920 at 30 fps, AAC, audio duration and 100-word caption timing. Duration exactly 40 s. Report: `out/shootsolo-20261103-103615-take10/short40/posiblo-introduction-40s.mp4.verification.json`. |
| Source/reference preservation | pass for prior baseline check; new source hash check PENDING | Parent intake/source preserved; prior baseline command passed all 23 files. Archive untouched by this change. |
| Specific improvement over v1 | PENDING | Proposed higher-source-detail and concise narrative improvements require human comparison. |

- Tradeoff: removes background/examples and longer service promise to retain hook, credibility, method and offer at original speed. Ending uses a complete invitation and omits the parent version's flagged thank-you.
- Human release decision/date: PENDING.
- Placement compatibility: Facebook Reels PENDING; Instagram Reels PENDING; TikTok PENDING. All require current human checks and actual UI previews.
- Approval: no `--approve-scenes` invocation or approval file written. This is a shortened preview, not completion of pipeline stages 7–9.
- Performance: not measured.

- Export completed 2026-11-19: approximately 53.7 MB. Verification command: `npm.cmd run verify:video -- --output out/shootsolo-20261103-103615-take10/short40/posiblo-introduction-40s.mp4 --source public/input/shootsolo-20261103-103615-take10-processed.mp4 --captions out/shootsolo-20261103-103615-take10/short40/captions.json`. All automated checks passed. Exported-file playback and the specific human release checks remain PENDING; general preview acceptance is recorded separately above.

## Feedback and verification

| Observation / evidence | Change | Verification |
| --- | --- | --- |
| User requested 40 s instead of 84 s | Select six complete sections; rebase captions/diagram; add `PosibloIntro40` | Studio duration 00:40.00; timing report and code checks pass. |
| Per-shot progress would restart after cuts | Disable per-shot progress in the new composition; overlay one continuous bar | Sampled process screenshot shows overall progress; existing composition default remains enabled. |
