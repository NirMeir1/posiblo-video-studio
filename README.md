# Posiblo Video Studio

Remotion project for vertical Posiblo videos with the original speaker and voice, Hebrew RTL captions, and animated explanations in a dark and lime visual style.

## Technologies and integrations

| Technology | What we use it for |
| --- | --- |
| Node.js and npm | Run commands, scripts, and dependency installation. |
| React / React DOM 19.3.1 and TypeScript 5.9.3 | Write video scenes, graphics, and typed components in TSX. |
| Remotion 4.0.543 and `@remotion/cli` | Edit in Studio, animate by frame, bundle, and render videos. Rspack is enabled in [remotion.config.ts](remotion.config.ts). |
| `@remotion/media` and `@remotion/captions` | Play source footage and work with timed Hebrew RTL captions. |
| `@remotion/whisper-webgpu`, Whisper, and `@huggingface/transformers` 4.2.0 | Transcribe speech locally; `scripts/transcribe-source.mjs` defaults to multilingual `large-v3-turbo`. Model downloads require network access. |
| Mediabunny and `@mediabunny/server` 1.64.0 | Installed media-processing dependencies supporting the Remotion tooling. |
| FFmpeg and FFprobe | Inspect media, extract audio, and verify exported video. Verification uses Remotion's bundled Windows x64 binaries. |
| MP4 / H.264, AAC, and JSON | Video delivery, audio delivery, and timed caption/review data. Transcription input is mono 16 kHz PCM16 WAV. |
| ESLint 10.12.0, Remotion ESLint config, Prettier 3.8.1, and React/web type definitions | Code checks, formatting, and type support; `npm run lint` runs ESLint and TypeScript. |
| Git and Node.js SHA-256 checks | Track source changes and check the approved reference's integrity. |

Exact direct dependencies are in [package.json](package.json); resolved dependencies are in [package-lock.json](package-lock.json).

Agent tooling is separate from the video runtime:

- **Codex and Remotion skills:** [AGENTS.md](AGENTS.md) defines the workflow. [skills-lock.json](skills-lock.json) records skills from `remotion-dev/skills`: best practices, creation, markup, interactivity, captions, Studio, rendering, docs, multimedia, maps, SaaS, licensing, and upgrades. Local skill files live in `.agents/skills/` and are Git-ignored; use the relevant ones for each task.
- **Plugins and MCP (Model Context Protocol):** the agent session can supply the Remotion plugin and browser/computer tools, including Playwright MCP, for preview and inspection. Available session tools vary; this repository does not configure an MCP server or require those tools to run its npm commands.
- **APIs and services:** the code uses local Remotion and Whisper JavaScript APIs. No hosted transcription API, OpenAI API key, backend, database, or social-platform publishing integration is configured in the project. Connected services available in an agent session are optional tools, not application dependencies. Paid services and uploads need authorization.

## Quick start

Requires Node.js `^20.19.0 || ^22.13.0 || >=24` and npm. The video verification script currently uses Windows-specific FFmpeg binaries.

```sh
npm ci
npm run dev
```

Open Remotion Studio to preview `PosibloFirstTest` (720 × 1280, 30 fps, about 43 seconds).

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run ESLint and TypeScript checks |
| `npm run build` | Bundle the project |
| `npm run render` | Render the current video to `out/not-every-business-needs-ai-posiblo-rerender.mp4` |
| `npm run verify:baseline` | Check the preserved reference against its hash manifest |

On PowerShell systems that block `npm.ps1`, use `npm.cmd` instead of `npm`.

## Project map

- `src/Root.tsx`: composition registration, dimensions, and duration.
- `src/Composition.tsx`: speaker footage, scene timing, branding, and captions.
- `src/Motion.tsx`: shared colors, graphics, and animation components.
- `src/captions-final.json`: timed captions used by the current video.
- `public/input/`: original footage.
- `out/`: generated exports and reports (Git-ignored).
- [references/](references/README.md): approved video, source snapshot, and integrity manifest. Preserve `references/posiblo-v1/` unchanged.

## Creating a video

When working with an agent in this repository, you can provide only a local video path:

```text
C:\Users\meirn\Videos\new-recording.mp4
```

Under [AGENTS.md](AGENTS.md), this starts the [social-media workflow](docs/social-media-video-workflow.md): inspect the footage, discover relevant docs/code/assets, complete a brief, edit in Remotion for organic Facebook Reels/Instagram Reels/TikTok, and document review and pending checks. The example path is illustrative. Optional details override the defaults; you do not need to paste the longer prompt.

Default delivery is a Studio preview. Add `export MP4` to request a rendered deliverable. This is an instruction for the agent operating in this project, not a background watcher or a general-purpose CLI pipeline. Human review remains required before release, and nothing is uploaded automatically.

1. Read [AGENTS.md](AGENTS.md) and the [video standard](docs/video-standard.md). Use the relevant installed Remotion skills when working with an agent.
2. Copy and complete the [brief](docs/video-brief-template.md) and [review](docs/video-review-template.md) as `docs/videos/<slug>-brief.md` and `docs/videos/<slug>-review.md`.
3. Preserve the footage; create a distinct composition and output filename. Adapt scenes and captions to the actual speech, and document at least one specific improvement over the approved reference. The transcription and caption-preparation scripts contain recording-specific paths and edits; adapt them before reuse.
4. Export when requested, then verify the exact deliverable:

   ```sh
   npm run verify:video -- --output out/<slug>.mp4 --source public/input/<source>.mp4 --captions src/<captions>.json
   ```

Verification checks decoding, format, and caption timing, and writes `<output>.verification.json`. For the current rerender, use `--output out/not-every-business-needs-ai-posiblo-rerender.mp4`; the source and caption defaults already match it. The legacy `scripts/verify-output.mjs` is recording-specific.

Before release, record full playback with sound, phone-size inspection, and caption review against the audio by a fluent Hebrew listener. Automated checks do not establish release readiness. Disclose unresolved issues; the reference has an unconfirmed caption gap at 12.26–13.68 seconds.

Start a new request with the [reusable video prompt](docs/prompts/next-video-prompt.md). The [original prompt](docs/prompts/original-video-prompt.md) is preserved for context.

This project is private and marked `UNLICENSED`; Remotion has [separate license terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
