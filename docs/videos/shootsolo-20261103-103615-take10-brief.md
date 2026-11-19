# Video brief: shootsolo-20261103-103615-take10

Status: Studio draft prepared; scene approval and human review PENDING.

- Preview: http://localhost:3010/PosibloPipeline. Actual generated title: איך יודעים מה באמת מתאים לעסק שלכם?
- Completed pipeline preparation: five clip candidates, 199 caption words, four priority flags. One proposed flow at 37.5–49.1 seconds: listen, understand the problem, choose a solution. Scene approval PENDING.
- Processed audio measured -14.85 LUFS; dynamic normalization warning requires listening review.
- Ending issue: the machine-timed final word `רבה` falls beyond the usable stream and was omitted; preceding `תודה` is low-confidence and clipped at the end boundary. Human listening/timing correction PENDING. See review for exact timestamps.

- Standard: Posiblo Video Standard v1.
- Audience (inferred from machine transcript): Hebrew-speaking business owners considering software, automation, or AI assistance.
- Main message: understand the actual business problem before choosing technology; Nir offers personal guidance through implementation.
- Desired action: the recorded invitation to a free introductory and initial mapping meeting. No booking URL was supplied or added.
- Original: `C:\Users\meirn\Downloads\Shootsolo_20261103_103615_take10.mp4`.
- Project copy: `out/shootsolo-20261103-103615-take10/01-ingest/source.mp4`; original is not edited.
- Intake evidence: accessible file, 516472619 bytes; pipeline metadata reports 2160 × 3840 portrait, 87.52 seconds, approximately 29.04 fps, AAC 48000 Hz. Probe/provenance files preserve exact values and source hash.
- Content inspection: agent inspected one extracted source frame at 5 seconds: centered speaker against a light wall. This is not complete playback or phone-size review.
- Language: Hebrew was configured, not automatically detected; the generated transcript is Hebrew. No listening review claimed.
- Composition: reusable `PosibloPipeline` with run-specific props and media; existing reference compositions remain unchanged.
- Delivery: Studio preview; export was not explicitly requested. Pipeline must pause before rendering for the user's scene decision.
- Target: 9:16, planned 1080 × 1920, 30 fps; organic Facebook Reels, Instagram Reels, and TikTok (assumption).
- Duration: edit map proposes 84.033 seconds; 8 automatic cuts remove approximately 3.214 seconds from the usable stream timeline. Container duration and usable stream duration differ slightly.
- Transcript: `out/shootsolo-20261103-103615-take10/02-transcribe/transcript.txt`; 200 machine-transcribed words, not human-verified.
- Caption files: `out/shootsolo-20261103-103615-take10/06-captions/captions.json` and `captions.srt` when stage 6 completes. Review uncertainty flags before release.
- Hook: recorded question about how to know which AI, agents, and automation options actually fit the viewer. Generated title remains subject to review.
- Scenes: use the generated `05-clip-selection/scene-plan.md` once available; graphics must follow the recorded problem-first approach. Approval PENDING; no agent approval permitted.
- Caption plan: Hebrew RTL, short phrase groups, lime active word, dark backing. Existing composition uses a 20% bottom offset; this is a local layout choice, not verified platform safety.
- Audio plan: local denoise and two-pass normalization toward -14 LUFS. Measurements and listening review remain separate.
- Proposed improvement over v1: use the higher-resolution original (2160 × 3840 versus the reference's documented 480 × 854 source) for a 1080 × 1920 preview. Perceived improvement remains PENDING human comparison; dimensions alone do not certify visual quality.
- Claims: the transcript states eight years of experience and a free initial meeting. These are speaker statements, not independently verified results. No quantified savings, customer results, or invented offer added.
- Rights/disclosures: user supplied the recording; ownership and business disclosure settings remain PENDING confirmation. No added music. No publishing or paid distribution authorized.
- Primary metric hypothesis: relevant inquiries about business problems; a problem-first explanation may attract better-qualified inquiries. No performance data exists.
- Unclear words: machine confidence flags require fluent Hebrew listening review; never infer correctness solely from model confidence.
- Social workflow: `docs/social-media-video-workflow.md`. Research report dated 2026-11-15, sections 3–7 and 11 applied provisionally.

## Project context applied

| Source | Decision / limitation |
| --- | --- |
| AGENTS.md and video standard | Pipeline first; preserve source and v1; stop for scene approval; keep human checks pending. |
| README.md, package.json, remotion.config.ts, project guide | Use npm.cmd because PowerShell blocks npm.ps1; full installed FFmpeg added to this process's PATH only. |
| src/Root.tsx, PosibloPipeline.tsx | Reuse props-driven pipeline composition, run-specific public directory, original voice, Posiblo palette, RTL captions. |
| Pipeline transcription, cut, audio, render, paths, draft helpers | Use new recording's timings; no legacy captions or recording-specific scripts reused. Draft records are only generated after stage 9, so this record is authored before that stage rather than pretending drafts already exist. |
| references/README.md and docs/posiblo-v1-review.md | Approved source is low resolution; its known caption gap is not copied. Baseline integrity passed for all 23 files on 2026-11-19. |
| docs inventory and historical pipeline audit | Historical audit predates current pipeline implementation and is not current runtime evidence. |
| Installed Remotion creation, captions, and Studio skills | Preview delivery, source-timed transcription and edited caption remapping; open Studio with generated props once available. |

## Placement applicability and specification evidence

All human current-requirements checks remain PENDING under AGENTS.md. Agent web checks on 2026-11-19 do not satisfy that gate.

| Placement | Guidance and implementation | Evidence / unresolved scope |
| --- | --- | --- |
| Facebook Reels / organic | Original speaker, relevant description, vertical local master. | Official [publishing announcement](https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/) read 2026-11-19; describes publishing transition and audience controls, not full account-specific export acceptance or safe zones. PENDING live preview and human check. |
| Instagram Reels / organic | Clean master, Posiblo branding, readable captions. | [Official help](https://help.instagram.com/1038071743007909) returned login requirement on 2026-11-19. Numeric requirements, cover crops and interface safety PENDING. |
| TikTok / organic | Real speaker and voice, early question, 9:16 presentation. Paid-ad specifications are not treated as organic requirements. | [Official camera tools](https://support.tiktok.com/en/using-tiktok/creating-videos/camera-tools) returned no readable content on 2026-11-19. Current limits, business disclosure and interface preview PENDING. |

Paid variants, music-library selection and conversion destination testing are not applicable to this preview request; any later publication requires its own checks.
