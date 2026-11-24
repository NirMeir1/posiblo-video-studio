# AGENTS.md

Always write the truth and be precise. If you do not know what to say, say "I do not know".

## Default task when the user provides a local video path

In this repository, a user message providing a local video path as input, even with no additional editing prompt, means: produce finished Posiblo videos from it, end to end, without further instructions from the user. Do not ask the user to repeat these instructions, fill a prompt template, approve the scene plan, or run any command. Explicit requests such as inspect-only, transcription-only, preview-only, "wait for my approval", or a different deliverable override this default; paths quoted in documentation, logs, or reference discussions are not new-video requests.

**Standing authorization (given by the user on 2026-11-23).** A video path alone authorizes the agent to run the whole pipeline, review and edit the scene plan, approve it with `--approve-scenes` on the user's behalf, render the full video and clips to MP4, run the metadata stage and the automated checks, and complete the brief and review records. It does not authorize uploading, publishing, buying distribution, or any paid service other than those listed under "Authorization of paid services".

**Steps, in order, all done by the agent:**

1. Run `npm run pipeline -- "<path>"` from the repository root. In PowerShell, use `npm.cmd` if `npm.ps1` is blocked.
2. When the run pauses at stage 7 for scene-plan approval, review `out/<slug>/05-clip-selection/scene-plan.json` against the transcript (`02-transcribe/transcript.txt`):
   - Every on-screen word must come from the speech.
   - Fix wording that does not match what is said.
   - Delete a scene whose text is invented, garbled, or does not help.
   - Before editing, keep the machine original as `scene-plan.machine-original.json`.
   - Inspect representative frames if possible.
3. Approve and render: `npm run pipeline -- "<path>" --approve-scenes`. The approval file records `approvedBy: command line (--approve-scenes)`. In the review record, state that the agent approved it under this standing authorization, with the date.
4. Wait for stages 7–9 (render, metadata, verify) to finish.
   - Stage 9 copies every export that passed its checks, plus `<slug>-metadata.json`, to the delivery folder `C:\Edit Videos` (code: `scripts/pipeline/lib/delivery.mjs`; override with `POSIBLO_DELIVERY_DIR`).
   - Confirm that `C:\Edit Videos\<slug>-full.mp4` and the clip files exist, and read `out/<slug>/summary.md` (section "Delivered").
5. Complete the brief and review records (see below).
6. Report to the user:
   - The exact paths of the full MP4 and the clips in `C:\Edit Videos`.
   - `summary.md` and `metadata.json`.
   - Any scene-plan edits.
   - Automated check results.
   - The human checks that remain PENDING.

If the pipeline fails, report the failing stage and error, and do not continue as if it had succeeded. If the message says the model answer was invalid, run the same command once more before reporting. Missing setup (`.env`, FFmpeg, transcriber) and an inaccessible file are blocking: report them with the exact fix. The pipeline is local-only and never uploads or publishes.

Follow `docs/social-media-video-workflow.md`, including its local-path intake and project-context discovery steps. Default targets are organic Facebook Reels, Instagram Reels, and TikTok vertical video. Infer optional audience/message details from the actual recording, record assumptions, and continue useful work. Ask only for information that blocks correct work, such as an inaccessible file. Record unclear speech as pending review instead of stopping. Default delivery is the rendered MP4 full video and clips; a video path counts as the export request.

**Authorization of paid services.** The pipeline's use of the Anthropic API in stage 5 (clip selection and scene plan) and stage 8 (metadata), with the user's own key from `.env`, is authorized. Every other paid service, any upload, any publishing, and any purchase of distribution remain unauthorized without explicit approval from the user.

Before creating or modifying any Posiblo video, read `docs/video-standard.md`, `docs/video-brief-template.md`, and `docs/video-review-template.md`. Follow the installed Remotion skills relevant to the task.

For every new video or social-media adaptation, also read `docs/social-media-video-workflow.md` and `docs/social-media-video-best-practices.md`. Apply the relevant platform and placement guidance and record its application in the video's brief and review. Inventory docs and inspect relevant supporting project files as the workflow requires; do not blindly apply every historical document or rerun the research prompt by default. Verify changing platform requirements from current official sources before final delivery; disclose anything that cannot be verified. The research report supplements the approved video standard and does not replace it.

Use `references/posiblo-v1/out/not-every-business-needs-ai-posiblo.mp4` as the approved quality reference. Preserve `references/posiblo-v1/` and its manifest; create new compositions and distinct output filenames for new videos. Do not replace the approved reference with a new render.

Match the standard's visual identity and quality, adapt graphics and timing to the actual speech, and document at least one specific improvement for every new video. Never invent speech or claim human caption review, visual inspection, or listening checks that did not happen.

Use a completed brief and review record for each new video. The pipeline writes drafts to `out/<slug>/review/<slug>-brief.md` and `out/<slug>/review/<slug>-review.md`, filled only with facts it actually has; complete them and save them as `docs/videos/<slug>-brief.md` and `docs/videos/<slug>-review.md`. The following stay marked PENDING until a human actually does them, and the agent must never mark them as done: full playback with sound, phone-size inspection, fluent Hebrew caption review, the documented improvement over the reference, and the check of current platform requirements. Run relevant automated checks on the actual deliverable path. Report unresolved issues and pending human review explicitly. Do not mark an export release-ready solely because automated checks passed.

## Pipeline rules

- Pipeline code lives in `scripts/pipeline/`. Do not edit the legacy recording-specific scripts or captions; they are kept for reference and the original video.
- The pipeline uses the full `ffmpeg` and `ffprobe` from PATH, not Remotion's restricted bundled binaries, and fails clearly if `silenceremove`, `loudnorm`, or `afftdn` are missing.
- Never print, log, or commit secrets. `.env` is ignored by Git; `.env.example` holds placeholders only.
- Never modify the original recording. All work happens on a copy in `out/<slug>/`.
- Re-running the same command resumes: finished stages are skipped, and a finished run is never overwritten silently. Use `--rerun-from <stage>` to redo a stage and everything after it, or `--slug <name>` for a separate run. See `README.md` for stage outputs.
- Stage 2 transcribes locally with the ivrit.ai Hebrew model through `faster-whisper` in `.venv` (set up with `npm run setup:transcriber`; model pinned by commit and SHA-256). `--transcriber whisper-webgpu` keeps the original transcriber available.
- Stage 5 also writes a scene plan (where animated explanations help, and where they do not). The pipeline pauses before rendering until the plan is approved with `--approve-scenes`. Under the standing authorization above, the agent reviews the plan and runs `--approve-scenes` itself. It never writes or edits the approval file by hand. If the user asked to approve the plan themselves, the agent stops at the pause and shows the plan instead.
- Run `npm run test:pipeline` (mocked API, no real calls) and `npm run lint` after changing pipeline or composition code.
- Hebrew transcription and captions are machine-generated and can contain errors. Flag low-confidence words for review and never present captions as human-verified.