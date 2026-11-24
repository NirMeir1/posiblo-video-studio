# Video review: shootsolo-20261123-174211-take15

Status: **exported / awaiting human review. Not release-ready.**

- Brief: [shootsolo-20261123-174211-take15-brief.md](shootsolo-20261123-174211-take15-brief.md).
- Standard: Posiblo Video Standard v1.
- Composition: `PosibloPipeline`. Source: `out/shootsolo-20261123-174211-take15/07-render/public/edited.mp4`, which is the clean-cut, denoised copy.
- Exact final files, delivered to `C:\Edit Videos\`:

  | File | Size (bytes) | Duration (s) |
  | --- | --- | --- |
  | `shootsolo-20261123-174211-take15-full.mp4` | 30,671,640 | 33.17 |
  | `shootsolo-20261123-174211-take15-clip-01.mp4` | 30,439,161 | 33.03 |
  | `shootsolo-20261123-174211-take15-clip-02.mp4` | 27,964,763 | 25.30 |
  | `shootsolo-20261123-174211-take15-clip-03.mp4` | 20,884,165 | 22.00 |
  | `shootsolo-20261123-174211-take15-clip-04.mp4` | 19,426,402 | 27.88 |
  | `shootsolo-20261123-174211-take15-clip-05.mp4` | 17,649,295 | 24.34 |
  | `shootsolo-20261123-174211-take15-metadata.json` | 15,514 | — |

  The originals are in `out/shootsolo-20261123-174211-take15/07-render/exports/`.
- Automated reports: `out/shootsolo-20261123-174211-take15/09-verify/{full,clip-01..clip-05}.verification.json` and `09-verify/summary.json`. They were produced by pipeline stage 9 (`scripts/verify-deliverable.mjs`).
- Commands run:
  - `npm run pipeline -- "C:\Users\meirn\Downloads\Shootsolo_20261123_174211_take15.mp4"`
  - then the same command with `--approve-scenes`
- Scene-plan approval: by the agent (Claude Code) under the standing authorization in `AGENTS.md` (given 2026-11-23). Approved 2026-11-23T16:29:32Z, after the agent edited the wording. The edits are listed in the brief.
- Reviewer and review date: the agent inspected still frames on 2026-11-23. **No human reviewer yet.**

| Check | Status | Evidence / issue / timestamp |
| --- | --- | --- |
| Opening communicates one clear message | pass for sampled frame | Full video at 1.5 s: the title "רשת קמעונאות ואיש הייטק: מה משותף ביניהם?" matches the spoken question. The agent checked a still frame only. |
| Relevant social-media guidance mapped to brief and implemented | pass for planning | See the brief's context and placement tables. |
| Current requirements verified for each target placement | **PENDING** | Not re-checked in this session. The research is dated 2026-11-15. |
| Marketing proof, rights, and applicable disclosures checked | **PENDING** | The client cases are the speaker's own statements and were not substantiated. The owner must confirm the cases may be described publicly. TikTok promotional disclosure must be set when posting. |
| CTA and destination/action checked where applicable | not applicable | The recording has no spoken CTA, and none was added. A spoken CTA could be considered in a future take. |
| Diagrams explain the actual speech | pass for wording; human meaning review PENDING | Scene 1 (8.89–22.51 s) shows two cards, one per spoken case. Scene 2 (25.36–32.80 s) shows the spoken contrast. All text was checked word by word against the automatic transcript, which a human has not verified. |
| Branding and visual quality match or exceed v1 | **PENDING** (agent observations below) | The dark/lime palette, `posiblo.` wordmark, rounded cards, line icons and speaker inset are present. Issues observed: see feedback rows 1–3. |
| Hebrew RTL, punctuation, and Latin text read correctly | pass for sampled rendering | RTL titles, cards and captions render in the right order in the sampled frames. No Latin text or digits. |
| Captions checked against audio by a fluent Hebrew listener | **PENDING** | The machine transcript has 0 priority flags. Lowest-confidence words: "קמעונאות" (0.83) and "אלא" (0.84). |
| Captions and diagrams readable at phone size | **PENDING**; issue observed | At 360 x 640 the card detail lines are very small (feedback row 1). |
| Face, captions, branding, and platform overlays do not collide | **PENDING** | No internal collision in the sampled frames. Platform UI was not previewed. |
| Entrances, exits, and camera transitions checked | **PENDING** | Not watched in motion. Cut points to check (edited timeline): 0.13, 5.30, 8.73, 25.30 s. |
| Full final export watched with sound; voice clear; lip sync checked | **PENDING** | Not done. Listen in particular for loudnorm pumping (dynamic-mode warning). |
| Final file decoding, metadata, caption bounds/order pass | pass (automated) | All 6 exports pass all 7 checks: video format, audio format, source has video and audio, duration, audio duration, subtitle timings, full decode. Full: 1080 x 1920, 30 fps, H.264, AAC. |
| Original footage preserved; baseline integrity passes | pass (automated) | Stage 9: original unchanged, copy identical, reference archive intact. |

- **Specific improvement over v1 (proposed, confirmation PENDING):**
  - 1080 x 1920 delivery from a clean 4K source, compared with v1's 720 x 1280.
  - All on-screen scene and title text is restricted to words the speaker actually says.
- Evidence of that improvement:
  - ffprobe of the delivered full MP4.
  - The word-by-word edits listed in the brief.
  - Frame sheets the agent viewed (scratch files, not kept in the repository).
- Tradeoffs / deviations:
  - Automatic jump cuts remove 2.96 s of pauses.
  - The speaker becomes a small inset during the two scenes.
  - Captions sit higher than in v1.
  - There is no spoken CTA.
- Human release decision and date: **PENDING**.

## Feedback and verification

| # | Observation / file / timestamp | Evidence | Proposed change | Revision verification / reviewer / date |
| --- | --- | --- | --- | --- |
| 1 | Card detail text is very small. Full video 10.5 s and 18 s (scene 1), 27 s and 31.5 s (scene 2). | Frames scaled to 360 x 640: the detail lines are much smaller than the 37 px-equivalent caption size. | Enlarge the detail font in `PosibloPipeline` scene cards, or drop the detail lines. This is a composition code change and was not made in this run. | Open |
| 2 | Weak contrast: dark detail text on the lime highlighted card. Full video 31.5 s. | Frame inspection. | Check contrast. Consider darker or larger text on the lime card. | Open |
| 3 | Scene layouts leave the lower-middle of the frame empty between the cards and the captions. | Frames at 10.5, 18, 27 and 31.5 s. | Consider larger cards or vertical centring. | Open; design judgment for a human |
| 4 | Title line breaks split phrases: clip-04 "לא / מהטכנולוגיה", clip-05 "לכל / קבוצה". | Clip frames at 1.5 s. | Shorten the titles or add controlled line breaks. | Open |
| 5 | The clip-02 opening title quotes "הכל קורה באופן אוטומטי לחלוטין", which is spoken only near the end of that clip (about 22.8 s). | `clips.json` and the clip-02 frame at 1.5 s. | Accept as a teaser, or change the title. | Open; human decision |
| 6 | Generated post metadata contains text that goes beyond the speech. | clip-02 Facebook: "כך מתחילה העבודה עם פוסיבלו". clip-03 Facebook/Instagram: "כל אחד קיבל פתרון שונה, לפי הצורך שלו" and "מתחילים מהבעיה". clip-03 TikTok: "עבודה ידנית שגוזלת זמן". clip-04 TikTok: "זה מה שעשינו". Hashtags #חיסכון_בזמן and #טיפים_לעסקים are not supported by the speech (it says manual work, not time). | Edit these lines in `C:\Edit Videos\shootsolo-20261123-174211-take15-metadata.json` before posting. The file was left as generated. | Open |
| 7 | `scene-plan.md` still shows the machine wording. | The file was not regenerated after the JSON edit. | Treat `scene-plan.json` as authoritative. | Noted |

## Placement compatibility

| Platform / placement / organic or paid | Status | Exact file, spec evidence, preview evidence, date / unresolved issue |
| --- | --- | --- |
| Facebook Reels / organic | **PENDING** | `C:\Edit Videos\shootsolo-20261123-174211-take15-*.mp4`. Requirements not re-checked; no native preview. |
| Instagram Reels / organic | **PENDING** | Same files. Requirements not re-checked; no native preview. |
| TikTok / organic | **PENDING** | Same files. Disclosure, requirements and uploader preview pending. |
| Paid ads | not applicable | Not requested or authorized. |

- Primary metric and hypothesis: qualified inquiries, saves and shares. Hypothesis: the two-case cards improve comprehension. **Not measured.**
- Actual performance evidence: none. Nothing was uploaded or published.
