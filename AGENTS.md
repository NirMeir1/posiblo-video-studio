# AGENTS.md

Always write the truth and be precise. If you do not know what to say, say "I do not know".

## Default task when the user provides a local video path

In this repository, a user message providing a local video path as input, even with no additional editing prompt, means: start a new Posiblo social-media edit using the required workflow below. Do not ask the user to repeat these instructions or fill a prompt template. Explicit requests such as inspect-only, transcription-only, or a different deliverable override this default; paths quoted in documentation, logs, or reference discussions are not new-video requests.

Follow `docs/social-media-video-workflow.md`, including its local-path intake and project-context discovery steps. Default targets are organic Facebook Reels, Instagram Reels, and TikTok vertical video. Infer optional audience/message details from the actual recording, record assumptions, and continue useful work. Ask only for information that blocks correct work, such as an inaccessible file or unresolved speech that needs confirmation. Default delivery is an edited Remotion Studio preview; export an MP4 when requested. Do not upload, publish, buy distribution, or use paid services without authorization.

Before creating or modifying any Posiblo video, read `docs/video-standard.md`, `docs/video-brief-template.md`, and `docs/video-review-template.md`. Follow the installed Remotion skills relevant to the task.

For every new video or social-media adaptation, also read `docs/social-media-video-workflow.md` and `docs/social-media-video-best-practices.md`. Apply the relevant platform and placement guidance and record its application in the video's brief and review. Inventory docs and inspect relevant supporting project files as the workflow requires; do not blindly apply every historical document or rerun the research prompt by default. Verify changing platform requirements from current official sources before final delivery; disclose anything that cannot be verified. The research report supplements the approved video standard and does not replace it.

Use `references/posiblo-v1/out/not-every-business-needs-ai-posiblo.mp4` as the approved quality reference. Preserve `references/posiblo-v1/` and its manifest; create new compositions and distinct output filenames for new videos. Do not replace the approved reference with a new render.

Match the standard's visual identity and quality, adapt graphics and timing to the actual speech, and document at least one specific improvement for every new video. Never invent speech or claim human caption review, visual inspection, or listening checks that did not happen.

Use a completed brief and review record for each new video. Run relevant automated checks on the actual deliverable path. Report unresolved issues and pending human review explicitly. Do not mark an export release-ready solely because automated checks passed.
