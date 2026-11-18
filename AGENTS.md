# AGENTS.md

Always write the truth and be precise. If you do not know what to say, say "I do not know".

## Default task when the user provides a local video path

In this repository, a user message providing a local video path as input, even with no additional editing prompt, means: start a new Posiblo social-media edit using the required workflow below. Do not ask the user to repeat these instructions or fill a prompt template. Explicit requests such as inspect-only, transcription-only, or a different deliverable override this default; paths quoted in documentation, logs, or reference discussions are not new-video requests.

**Pipeline first.** Start by running `npm run pipeline -- <path>`. The pipeline produces local files in `out/<slug>/`: transcript, clean cut, processed audio, clip candidates, Hebrew captions, rendered full video and clips, `metadata.json`, verification results, and draft brief and review records. Then continue with the workflow below on the pipeline's output: complete the brief and review record, polish in Remotion Studio, and report. If the pipeline fails, report the failing stage and error, and do not continue as if it had succeeded. The pipeline is local-only and never uploads or publishes.

Follow `docs/social-media-video-workflow.md`, including its local-path intake and project-context discovery steps. Default targets are organic Facebook Reels, Instagram Reels, and TikTok vertical video. Infer optional audience/message details from the actual recording, record assumptions, and continue useful work. Ask only for information that blocks correct work, such as an inaccessible file or unresolved speech that needs confirmation. Default delivery is an edited Remotion Studio preview; export an MP4 when requested.

**Authorization of paid services.** The pipeline's use of the Anthropic API in stage 5 (clip selection) and stage 8 (metadata), with the user's own key from `.env`, is authorized. Every other paid service, any upload, any publishing, and any purchase of distribution remain unauthorized without explicit approval from the user.

Before creating or modifying any Posiblo video, read `docs/video-standard.md`, `docs/video-brief-template.md`, and `docs/video-review-template.md`. Follow the installed Remotion skills relevant to the task.

For every new video or social-media adaptation, also read `docs/social-media-video-workflow.md` and `docs/social-media-video-best-practices.md`. Apply the relevant platform and placement guidance and record its application in the video's brief and review. Inventory docs and inspect relevant supporting project files as the workflow requires; do not blindly apply every historical document or rerun the research prompt by default. Verify changing platform requirements from current official sources before final delivery; disclose anything that cannot be verified. The research report supplements the approved video standard and does not replace it.

Use `references/posiblo-v1/out/not-every-business-needs-ai-posiblo.mp4` as the approved quality reference. Preserve `references/posiblo-v1/` and its manifest; create new compositions and distinct output filenames for new videos. Do not replace the approved reference with a new render.

Match the standard's visual identity and quality, adapt graphics and timing to the actual speech, and document at least one specific improvement for every new video. Never invent speech or claim human caption review, visual inspection, or listening checks that did not happen.

Use a completed brief and review record for each new video. The pipeline creates drafts as `docs/videos/<slug>-brief.md` and `docs/videos/<slug>-review.md`, filled only with facts it actually has. The following stay marked PENDING until a human actually does them, and the agent must never mark them as done: full playback with sound, phone-size inspection, fluent Hebrew caption review, the documented improvement over the reference, and the check of current platform requirements. Run relevant automated checks on the actual deliverable path. Report unresolved issues and pending human review explicitly. Do not mark an export release-ready solely because automated checks passed.

## Pipeline rules

- Pipeline code lives in `scripts/pipeline/`. Do not edit the legacy recording-specific scripts or captions; they are kept for reference and the original video.
- The pipeline uses the full `ffmpeg` and `ffprobe` from PATH, not Remotion's restricted bundled binaries, and fails clearly if `silenceremove`, `loudnorm`, or `afftdn` are missing.
- Never print, log, or commit secrets. `.env` is ignored by Git; `.env.example` holds placeholders only.
- Never modify the original recording. All work happens on a copy in `out/<slug>/`.
- Hebrew transcription and captions are machine-generated and can contain errors. Flag low-confidence words for review and never present captions as human-verified.