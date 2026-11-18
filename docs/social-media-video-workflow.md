# Required social-media workflow for Posiblo videos

Use this process for every new video and social-media adaptation in this repository. It makes the research actionable without requiring every file in `docs` to be read. It supplements [Video Standard v1](video-standard.md); it does not change the approved identity or authorize a new standard version.

## 0. Accept a local path as the task

When the user supplies a video path as input in this repository's agent chat, start this workflow without requiring a separate prompt. Respect explicit narrower instructions. This convention is agent-driven: it is not a background file watcher or operating-system file association. The agent's first step is the one-command pipeline, `npm run pipeline -- <path>` (stages, outputs and options in `README.md`). It produces local drafts in `out/<slug>/`: transcript, clean cut, processed audio, clip candidates, captions, rendered full video and clips, `metadata.json`, verification reports, a summary, and draft brief/review records. The steps below then complete, review and polish that output. If the pipeline fails, report the failing stage and error instead of continuing as if it succeeded. The agent-assisted steps remain valid on their own when the pipeline is not used.

1. Resolve the exact supplied path and verify it is an accessible file, using literal-path handling for spaces and special characters. Do not execute the path as a shell command or search unrelated computer folders. If inaccessible, report the specific problem and request the minimum correction needed.
2. Inspect the media's actual metadata and content: duration, dimensions, frame rate, audio streams, orientation, language, and usable footage. Record what was actually inspected; do not infer speech from a filename. If a required tool is unavailable, attempt a supported alternative and disclose remaining limits.
3. Preserve the original. Work from a uniquely named copy under `public/input/` when needed, avoid filename collisions, and keep temporary/generated material inside the workspace. Do not overwrite an existing source or expose a file outside the project through a server. The pipeline already works on its own copy in `out/<slug>/01-ingest/` and records the original's hash.
4. Choose a unique output slug and composition. Infer the message, audience, and suitable scenes from the recording. If the content does not support a reasonable inference, record the uncertainty and ask for the essential missing direction while continuing independent checks.
5. Default to organic Facebook Reels, Instagram Reels, and TikTok, a vertical layout, the original speaker/voice, and the existing Posiblo visual standard. Determine caption language from the recording; apply Hebrew RTL rules when relevant. Do not invent an offer, savings claim, customer outcome, or dialogue.
6. Proceed through briefing, editing, preview, inspection, and review documentation. When the pipeline ran, start from its draft records in `out/<slug>/review/`, its `summary.md`, and the review flags in `06-captions/review-flags.json`; save the completed records under `docs/videos/`. A path alone requests the edited Studio preview. An accompanying export/MP4 request also authorizes rendering to a new output path. Publication and paid distribution require their own authorization.

Human caption review and inaccessible platform previews can remain pending while editing proceeds. They must remain visible in the final handoff and prevent an unsupported release-ready claim.

## 1. Load the relevant instructions

Read:

- `AGENTS.md` at the repository root.
- [Video standard](video-standard.md).
- [Brief template](video-brief-template.md).
- [Review template](video-review-template.md).
- This workflow and the [social-media research report](social-media-video-best-practices.md).

Follow the installed Remotion router and the skills relevant to creation, markup, Studio interactivity, captions, preview, and rendering as applicable. Read an existing video's brief/review when adapting that video. Other historical documents and the [research prompt](prompts/social-media-video-research-prompt.md) are not routine production inputs.

### Discover supporting project context on every intake

- Inventory `docs/` (including nested folders) so new relevant guidance is discoverable. Read applicable production guidance, asset documentation, and prior review lessons; do not treat historical prompts, another video's transcript, or old approval records as current instructions or proof of review.
- Read `README.md`, `package.json`, and Remotion configuration for project commands and tooling. Inspect composition registration, relevant `src/` components, asset locations in `public/`, and relevant `scripts/` before reusing them. Follow applicable directory instructions and installed skills.
- Consult the approved reference and its documentation as required by the standard. Preserve the reference archive and manifest unchanged; do not recursively read unrelated binaries or dependency directories.
- Check scripts for recording-specific paths, timestamps, corrections, and output names. In particular, the existing transcription/caption scripts contain first-video assumptions. Adapt or parameterize those before use with new footage; never carry over omitted phrases or write new captions over the approved video's files.
- Record the files/sections actually applied and the resulting decisions in the brief's context table. If current project guidance conflicts or is ambiguous, follow the user's explicit instruction and approved standard; disclose material unresolved conflicts.

The purpose is to apply all relevant project knowledge, not to concatenate every file into a prompt or silently inherit every past decision.

## 2. Complete the brief before building

Create `docs/videos/<slug>-brief.md` from the template. Inspect the actual input and record audience, main message, truthful proof, desired action, footage, and planned speech-aligned scenes.

Name each intended platform and placement, and distinguish organic from paid. If unspecified, record a provisional plan for organic Facebook Reels, Instagram Reels, and TikTok vertical video. This is a planning assumption, not confirmation that every placement accepts the export. Do not assume paid distribution or render extra variants without a need. Default to a Studio preview unless export is requested.

Add one applicability row for each intended placement:

| Platform / placement / organic or paid | Relevant guidance and source | Planned implementation | Current spec check / unknowns |
| --- | --- | --- | --- |
| Fill from this video's brief | Report section and official URL | Concrete layout/editorial decision | Date, applicable format/region, or pending |

Record a hook, demonstration, CTA, caption/safe-zone plan, rights/disclosure considerations, and one specific improvement over v1. Explain intentional deviations and mark irrelevant guidance as not applicable with a reason. Do not invent missing speech or performance evidence.

## 3. Check current requirements where they affect delivery

Use current official platform sources for the intended placement's upload specifications, safe-zone templates, commercial music, and disclosure requirements. Record URL, access date, scope, and the values that affect this export. Distinguish accepted limits from recommendations and local production choices.

Do not rerun the full research project for every video. Refresh the relevant findings when they are unresolved, have changed, or do not cover the target format. A blocked page is not verification. Continue independent production work, record unresolved checks, and keep placement compatibility pending until they are resolved. Do not generalize paid-ad requirements to organic posts.

## 4. Build and inspect in Remotion

Preserve the approved archive and original footage. Use a distinct composition and output filename. Keep the real speaker, voice, Posiblo identity, readable Hebrew captions, and diagrams synchronized with the actual explanation.

Open Studio according to the installed skills. Inspect the opening, explanation, densest graphic, transitions, longest captions, and closing at phone size. Check RTL and mixed-language rendering. Preview each intended placement with its actual controls, description, and CTA when access is available; record the evidence. A generic safe-zone overlay or a Remotion preview alone does not establish compatibility with every platform.

## 5. Record review and resolve feedback

Create `docs/videos/<slug>-review.md` from the template. Record each check as pending, pass, fail, or not applicable with a reason. For issues use: observation, exact file/timestamp, evidence, proposed change, and how the revision was checked. Fix observed issues and reinspect the affected scenes.

Include a per-placement verdict and supporting preview/spec evidence. State separately whether the result is a Studio draft, an exported file awaiting review, or release-ready. Never mark unperformed checks as passed.

## 6. Export and release only when applicable

When export is requested, render to the unique path and run the project's video verification command on that exact deliverable, as specified in the video standard. Check baseline integrity as required. Record commands and report paths.

The full export must be watched with sound and captions reviewed against audio by a fluent Hebrew listener before release. Record reviewer and date. If those checks or placement checks cannot be completed, deliver with the specific pending status and next action. Automated checks alone do not establish release readiness. Do not publish or buy distribution without authorization.

## 7. Define learning without inventing results

Record the primary metric and one improvement hypothesis when relevant. Only add performance findings after actual publishing/campaign data exists; include metric definitions and observation window. A proposed test or successful export is not evidence of marketing performance.

Final handoff: link the composition/preview or exact export, brief, and review; summarize the improvement, performed checks, per-placement status, and unresolved issues.
