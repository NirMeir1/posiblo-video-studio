# Posiblo Video Studio

Turn a recording into vertical videos for Facebook Reels, Instagram Reels, and TikTok. The pipeline transcribes Hebrew, cleans up cuts and audio, adds captions, and prepares short clips, animated explanations, and post text. Review the edit in Remotion Studio and approve the scene plan before rendering; nothing is published automatically.

## Quick start

Use Node.js 22 (22.13 or later) or Node.js 24+, with npm. From the project folder:

```sh
npm ci
npm run dev
```

This opens Remotion Studio to preview the existing video. To process a new recording, complete the setup below.

On PowerShell systems that block `npm.ps1`, use `npm.cmd` instead of `npm`.

## Process a recording

### Set up once

1. Install a full FFmpeg build with `ffmpeg` and `ffprobe` on PATH. On Windows: `winget install --id Gyan.FFmpeg -e`, then open a new terminal.
2. Install Python 3.9+ and run `npm run setup:transcriber`. This creates `.venv` and downloads the Hebrew transcription model (about 1.6 GB).
3. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`. Keep `.env` private; it is Git-ignored.

### Run and review

```sh
npm run pipeline -- "C:\path\to\recording.mp4"
```

The pipeline copies the recording, transcribes Hebrew locally, cleans cuts and audio, selects clips, and prepares captions and animated scenes. It pauses before rendering for **your scene-plan approval**.

1. Read the generated `scene-plan.md` and preview it using the Studio command printed by the pipeline.
2. Edit the plan if needed, then approve it using the printed `--approve-scenes` command. When you give an agent only a video path, the agent reviews and approves the plan for you (see [AGENTS.md](AGENTS.md)).
3. After rendering and checks, the finished videos and their post text (`<slug>-metadata.json`) are copied to `C:\Edit Videos` (change it with `POSIBLO_DELIVERY_DIR` in `.env`). Start with `out/<slug>/summary.md` for exports, metadata, and verification results.

Run the same command to resume an interrupted run. Use `--slug <name>` for a separate run or `--rerun-from <stage>` to redo a stage and everything after it. See the [reference guide](docs/project-guide.md#one-command-pipeline) for stages, output paths, preview commands, and troubleshooting.

**Privacy and cost:** the original recording stays unchanged. Files stay local; transcript text is sent to the paid Anthropic API for clip selection, scene planning, and post metadata. Model setup requires downloads. Nothing is uploaded to social platforms or published automatically.

**Before posting:** a human must review playback with sound, phone-size readability, Hebrew captions and metadata, the improvement over the reference, and current platform requirements. Machine captions can be wrong; passing automated checks does not make an export release-ready.

## Work with an agent

Provide a local video path and nothing else. Under [AGENTS.md](AGENTS.md), the agent then does the rest alone:
- runs the pipeline;
- reviews, corrects and approves the scene plan;
- renders the full video and clips to MP4;
- writes the post metadata and runs the checks;
- completes the brief and review;
- copies the finished videos to `C:\Edit Videos` and reports the file paths.

Say "preview only" or "wait for my approval" to keep the approval step for yourself. Nothing is uploaded or published, and human review of playback and captions is still needed before posting.

## Technologies and tools

- **TypeScript, JavaScript, and React 19** — video components, animations, and pipeline scripts.
- **Node.js and npm** — runtime, commands, and dependencies.
- **Remotion 4 and Remotion Studio** — editing, previews, Hebrew RTL captions, and rendering.
- **FFmpeg and FFprobe** — cuts, audio cleanup, loudness normalization, and export checks.
- **Python, faster-whisper, and ivrit.ai** — local Hebrew transcription with word timestamps and confidence scores.
- **Hugging Face Transformers and Whisper WebGPU** — optional alternative local transcription.
- **Anthropic Claude API** — clip selection, scene planning, titles, captions, and hashtags.
- **Mediabunny** — installed media-processing dependencies supporting Remotion tooling.
- **ESLint, Prettier, TypeScript checks, and Node's test runner** — code quality and pipeline tests.
- **Codex instructions and Remotion skills** — video creation and review guidance, recorded in [AGENTS.md](AGENTS.md) and [skills-lock.json](skills-lock.json).

Exact versions are in [package.json](package.json) and [package-lock.json](package-lock.json). No database or social-media publishing integration is configured. Browser tools and MCP plugins are optional agent tools, not runtime requirements.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Open Remotion Studio |
| `npm run lint` | Check ESLint and TypeScript |
| `npm run test:pipeline` | Run pipeline tests with mocked API calls |
| `npm run build` | Bundle the project |
| `npm run render` | Export the existing reference-based composition to a distinct rerender file |
| `npm run verify:video -- --output <file> --source <file> --captions <file>` | Verify an export and its caption timeline |
| `npm run verify:baseline` | Check the approved reference's integrity |
| `npm run pipeline -- --help` | List pipeline options |

Video verification currently uses Windows-specific FFmpeg binaries. Pipeline media processing requires a full FFmpeg build on PATH.

## Project and documentation

- `src/` — video compositions, scenes, captions, and shared graphics.
- `scripts/pipeline/` and `tests/pipeline/` — pipeline implementation and tests.
- `out/<slug>/` — generated media, metadata, and review drafts (Git-ignored).
- [Approved reference](references/README.md) — preserve `references/posiblo-v1/` unchanged.
- [Reference guide](docs/project-guide.md) — detailed setup, pipeline stages, troubleshooting, and project map.
- [Video standard](docs/video-standard.md) and [social-media workflow](docs/social-media-video-workflow.md) — required editing and review process.
- [Brief template](docs/video-brief-template.md) and [review template](docs/video-review-template.md) — complete records in `docs/videos/` for each new video.

Private project, marked `UNLICENSED`. Remotion has [separate license terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
