# Video brief: shootsolo-20261123-174211-take15

Completed by the agent (Claude Code) on 2026-11-23 from the pipeline draft `out/shootsolo-20261123-174211-take15/review/shootsolo-20261123-174211-take15-brief.md`. Facts come from the run outputs and from frames the agent inspected. Inferences are labelled as inferences.

- Standard: Posiblo Video Standard v1. Social-media research report dated 2026-11-15.
- Audience (inferred from the automatic transcript): Hebrew-speaking business owners and individuals who do repetitive manual work and are considering automation.
- One main message (from the speech): Posiblo starts from the client's need, not from the technology, and builds the solution that fits. Two real cases illustrate this: a retail chain and a high-tech worker looking for a job.
- Desired viewer action / closing question: the recording has no spoken call to action. The closing line is the need-first statement. No CTA, offer, or link was added, because adding one would invent speech.
- Original footage: `C:\Users\meirn\Downloads\Shootsolo_20261123_174211_take15.mp4`, left unchanged. SHA-256 `bb4f5dc29f9693c032b4480bb4ce53e363b068e81cb20c410c67943efd544d6c`.
- Project copy: `out/shootsolo-20261123-174211-take15/01-ingest/source.mp4`. Stage 9 confirmed the copy is identical and the original is unchanged.
- Intake checks:
  - The file is accessible: 214,729,429 bytes.
  - ffprobe: H.264, 2160 x 3840 portrait (9:16), 36.36 s, about 29.29 fps (variable), yuvj420p. AAC audio, 48 kHz, mono.
  - The agent inspected edited frames at about 1, 10, 18, 23 and 30 s. They show a single speaker against a plain wall, framed head and torso, with no burned-in text or third-party watermark.
  - Language was set to Hebrew by option. The transcript output is consistent with Hebrew speech. The agent did not listen to the audio.
- Composition: `PosibloPipeline` (`src/PosibloPipeline.tsx`). The render source is `out/shootsolo-20261123-174211-take15/07-render/public/edited.mp4`. No new hand-written composition was created; the reusable pipeline composition is driven by per-export props.
- Target: organic short-form vertical video, 9:16, 1080 x 1920, 30 fps, H.264 CRF 18 yuv420p, AAC 192 kbps. The 4K source supports 1080 x 1920.
- Target placements, all organic and provisional by default: Facebook Reels, Instagram Reels, and TikTok. No paid placement.
- Social-media workflow: `docs/social-media-video-workflow.md`.
- Research report sections applied from `docs/social-media-video-best-practices.md`:
  - §3: original creator footage, no watermark, post description matching the video.
  - §4: early hook, one process per scene, no unsupported claims.
  - §5: 1080 x 1920 vertical master.
  - §6: captions are machine-generated and need fluent review.
  - §7: no added music; TikTok promotional disclosure.
  - §11: release checklist.
- Proof supporting marketing claims: the two client cases and "everything happens fully automatically" are the speaker's own statements. No independent evidence was supplied or checked, and no numbers, savings, or results were added.
- Caption and safe-zone plan:
  - The pipeline default puts captions about 20% of frame height above the bottom (about y = 1490 of 1920 in the inspected frames). That is higher than v1's 108 px at 720 x 1280.
  - Opening-hook title near the top; `posiblo.` wordmark top-left.
  - This was not verified in live platform previews: PENDING.
- Music, footage rights, and disclosure: no music was added. The footage is the user's own recording of themselves (an assumption from the file name and content). Rights to describe the two client cases publicly: PENDING owner confirmation. TikTok "Promotional content" disclosure applies if posted: PENDING.
- Primary success metric and test hypothesis (proposal only, not measured):
  - Metric: qualified inquiries and saves/shares from business owners.
  - Hypothesis: two concrete client cases shown as side-by-side cards will be easier to understand than speech alone.
- Duration: full edit 33.17 s (source 36.36 s, 2.96 s of pauses removed). Clip durations: 33.0, 25.3, 22.0, 27.9 and 24.3 s.
- Final output paths:
  - Exports: `out/shootsolo-20261123-174211-take15/07-render/exports/shootsolo-20261123-174211-take15-{full,clip-01..clip-05}.mp4`.
  - Delivered copies: `C:\Edit Videos\shootsolo-20261123-174211-take15-{full,clip-01..clip-05}.mp4`.
  - The approved reference was not touched.
- Captions:
  - Main files: `out/shootsolo-20261123-174211-take15/06-captions/captions.json` and `captions.srt`.
  - Per-export files: `07-render/captions/*.json`.
- Opening hook (full video): on-screen title "רשת קמעונאות ואיש הייטק: מה משותף ביניהם?", taken verbatim from speech sentences 0–1, while the speaker asks the same question.
- Planned improvement over v1, and how to check it: see "Improvement" below. Confirmation by a human: PENDING.
- Intentional deviations, trims, and audio processing:
  - Automatic clean cut with 4 internal joins, at edited times 0.13 s, 5.30 s, 8.73 s and 25.30 s, plus a trimmed tail. This differs from v1's continuous recording.
  - Denoise `afftdn=nr=10:nf=-45:tn=1`.
  - Loudness raised from -16.65 to -14.87 LUFS (target -14), true peak -1.48 dBTP. loudnorm fell back to dynamic normalization, so the audio needs a listen for pumping.
- Unclear words: 0 priority flags. The two lowest-confidence words are "קמעונאות" (0.83, about 0.65 s) and "אלא" (0.84, in the closing sentence). Fluent review: PENDING.
- Assumptions:
  - The default organic placements apply.
  - Hebrew captions.
  - Speaker-led layout with inset during the scenes.
  - "בפוסיבלו" is the speaker saying the brand name Posiblo.
- Export requested: yes. Under `AGENTS.md`, a video path alone counts as the export request.

## Scene-plan review (agent, 2026-11-23)

The machine plan by claude-haiku-5-5 is kept as `05-clip-selection/scene-plan.machine-original.json`. The agent edited the on-screen wording so that every word comes from the transcript, kept both scenes and their timing, and changed one icon. It then approved the plan with `--approve-scenes` under the standing authorization in `AGENTS.md` (given 2026-11-23). The approval file records `approvedBy: command line (--approve-scenes)`. `scene-plan.md` still shows the machine wording because it was not regenerated after the edit; `scene-plan.json` is the approved file.

| Scene / time (edited) | Speech | Machine text → approved text |
| --- | --- | --- |
| scene-01 cards, 8.89–22.51 s | Sentences 3–4: the two systems built | Heading "שתי מערכות שחוסכות עבודה ידנית" → "לייעל תהליכים ולחסוך עבודה ידנית" ("שתי", "מערכות שחוסכות" are not spoken). Card 1 detail "איתור קבוצות ופוסט מותאם לכל קבוצה" → "מאתרת קבוצות ומכינה פוסט עם תוכן מותאם". Card 2 detail "משרות, אנשי קשר והודעות מותאמות" → "משרות ואנשי קשר, בקשות חיבור והודעות". Card 2 icon `check` → `link` (connection requests). |
| scene-02 comparison, 25.36–32.80 s | Sentence 6: not technology first, the need first | Heading "מהצורך, לא מהטכנולוגיה" kept. "לא מתחילים מהטכנולוגיה" → "לא מתחיל מהטכנולוגיה". "מתחילים מהצורך שלכם / ומשם בונים את הפתרון המתאים" → "אלא מהצורך שלכם / ומשם אני בונה את הפתרון שהכי מתאים עבורכם". |

Opening-hook titles were also corrected to spoken words in `05-clip-selection/clips.json`. The machine original is kept as `clips.machine-original.json`.

| Export | Machine title | Approved title |
| --- | --- | --- |
| full | איך בונים אוטומציה שחוסכת עבודה ידנית | רשת קמעונאות ואיש הייטק: מה משותף ביניהם? |
| clip-01 | רשת קמעונאות ואיש הייטק: מה משותף? | unchanged |
| clip-02 | מערכת שעובדת לבד: חיפוש ושליחה אוטומטי | הכל קורה באופן אוטומטי לחלוטין |
| clip-03 | שניהם רצו לחסוך עבודה ידנית. הנה איך | שניהם פנו אליי כדי לחסוך עבודה ידנית |
| clip-04 | בפוסיבלו מתחילים מהצורך, לא מהטכנולוגיה | בפוסיבלו: מהצורך, לא מהטכנולוגיה |
| clip-05 | פוסט מותאם לכל קבוצה, ומתחילים מהצורך | פוסט עם תוכן מותאם לכל קבוצה |

## Improvement over v1 (proposed; human confirmation PENDING)

- Source and delivery resolution: the 4K source is exported at 1080 x 1920, while v1 used 720 x 1280. Evidence: ffprobe of the delivered full MP4 shows 1080 x 1920, 30/1, H.264, AAC about 189 kbps. This sharpens the speaker image; it does not add detail beyond the source.
- Clean source: no baked-in subtitles or third-party watermark, so no crop was needed. Evidence: inspected frames.
- On-screen text discipline: every scene label and hook title uses words the speaker actually says (listed above). This is unlike v1's hand-written scene titles.

## Project context applied

| File / section / skill | Why relevant | Decision applied / limitation |
| --- | --- | --- |
| `AGENTS.md` | Path-only intake, standing authorization | Ran the pipeline; reviewed, edited and approved the scene plan; did not upload or publish |
| `docs/video-standard.md` | Identity and editorial rules | Palette, wordmark, lime active word, speaker kept; on-screen text from the speech only |
| `docs/video-brief-template.md`, `docs/video-review-template.md` | Record structure | These records |
| `docs/social-media-video-workflow.md` | Intake, placements, pending checks | Organic Facebook, Instagram and TikTok defaults; placement rows below |
| `docs/social-media-video-best-practices.md` §3–7, §11 | Guidance | Original footage, hook, 1080 x 1920, caption review, no music, disclosure |
| `docs/videos/founder-introduction-*.md` | Format of a previous record | Structure only; its review results do not apply here |
| `README.md` (pipeline section) | Commands and stage outputs | Resume and approval commands |
| `scripts/pipeline/lib/scenes.mjs`, `lib/approval.mjs`, `stages/render.mjs` | Edit limits and how render reads edits | Heading ≤ 40, label ≤ 28, detail ≤ 48 characters. Approval is hash-bound. Render reads titles from `clips.json` |
| `src/PosibloPipeline.tsx` | What appears on screen | The title card shows for 3 s at the start of each export, so titles were reviewed as on-screen text |
| Remotion skills | Not invoked | No composition code was changed; rendering ran through the pipeline |

## Placement applicability and specification evidence

Current official requirements were **not** re-checked in this session; the most recent research is dated 2026-11-15. The check of current requirements is PENDING.

| Platform / placement / organic or paid | Relevant guidance and official source | Planned implementation | Current requirements, access date, scope / unknowns |
| --- | --- | --- | --- |
| Facebook Reels / organic | Report §3 (Meta originality guidance, March 2026; video publishing, June 2025) | Own speaker, 9:16 1080 x 1920, post text matching the video | Not re-checked 2026-11-23. Live upload and overlay preview PENDING |
| Instagram Reels / organic | Report §3 (originality, no watermark) | Clean master with Posiblo wordmark only | Not re-checked 2026-11-23. Meta help pages were blocked during research. UI preview PENDING |
| TikTok / organic | Report §3, §7 (creative best practices, promotional disclosure, commercial music) | People-led vertical video, hook in the first seconds, no added music | Not re-checked 2026-11-23. Disclosure toggle and uploader preview PENDING |
| Paid ads | Not applicable | Not requested or authorized | — |
