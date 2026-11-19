# Posiblo Video Studio reference guide

Remotion project for vertical Posiblo videos with the original speaker and voice, Hebrew RTL captions, and animated explanations in a dark and lime visual style.

## Technologies and integrations

- **TypeScript, JavaScript, and React 19** — video components, animations, and pipeline scripts.
- **Node.js and npm** — runtime, commands, and dependency management.
- **Remotion 4 and Remotion Studio** — video editing, previews, animations, Hebrew RTL captions, and rendering.
- **FFmpeg and FFprobe** — cutting video, cleaning audio, normalizing volume, and checking exports.
- **Python, faster-whisper, and ivrit.ai** — default local Hebrew transcription with word timestamps and confidence scores.
- **Hugging Face Transformers and Whisper WebGPU** — optional alternative local transcription via `--transcriber whisper-webgpu`.
- **Anthropic Claude API** — clip selection, animated scene planning, and social-media titles, captions, and hashtags, using the official Anthropic SDK.
- **Mediabunny** — installed media-processing dependencies supporting Remotion tooling.
- **ESLint, Prettier, TypeScript checks, and Node's test runner** — code quality, formatting, and pipeline tests.
- **Codex instructions and Remotion skills** — guidance for creating, captioning, previewing, rendering, and reviewing videos; see [AGENTS.md](../AGENTS.md) and [skills-lock.json](../skills-lock.json).

The pipeline runs locally, with Anthropic API calls for planning and metadata. Model setup downloads files from Hugging Face. No database or automatic social-media publishing integration is configured.

Exact direct dependencies are in [package.json](../package.json); resolved dependencies are in [package-lock.json](../package-lock.json).

Agent tooling is separate from the video runtime:

- **Codex and Remotion skills:** [AGENTS.md](../AGENTS.md) defines the workflow. [skills-lock.json](../skills-lock.json) records skills from `remotion-dev/skills`: best practices, creation, markup, interactivity, captions, Studio, rendering, docs, multimedia, maps, SaaS, licensing, and upgrades. Local skill files live in `.agents/skills/` and are Git-ignored; use the relevant ones for each task.
- **Plugins and MCP (Model Context Protocol):** the agent session can supply the Remotion plugin and browser/computer tools, including Playwright MCP, for preview and inspection. Available session tools vary; this repository does not configure an MCP server or require those tools to run its npm commands.
- **APIs and services:** the code uses local Remotion and Whisper JavaScript APIs. The pipeline also calls the Anthropic Messages API in stages 5 and 8 only, with `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` read from `.env` (see [.env.example](../.env.example)). No hosted transcription API, OpenAI API key, backend, database, or social-platform publishing integration is configured in the project. Connected services available in an agent session are optional tools, not application dependencies. Paid services and uploads need authorization.

## Quick start

Requires Node.js `^20.19.0 || ^22.13.0 || >=24` and npm. The video verification script currently uses Windows-specific FFmpeg binaries. The pipeline additionally needs FFmpeg on PATH, Python 3.9+ and a `.env` file (see [pipeline setup](#setup-once)); its test command uses `node --test` with a file glob, which needs Node.js 21 or later.

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
| `npm run pipeline -- <video-path>` | Run the one-command pipeline (see below); local files only |
| `npm run test:pipeline` | Pipeline unit tests (mocked API, no real calls) |
| `npm run setup:transcriber` | One-time setup of the free local Hebrew transcriber |

On PowerShell systems that block `npm.ps1`, use `npm.cmd` instead of `npm`.

## Project map

- `src/Root.tsx`: composition registration, dimensions, and duration.
- `src/Composition.tsx`: speaker footage, scene timing, branding, and captions.
- `src/Motion.tsx`: shared colors, graphics, and animation components.
- `src/captions-final.json`: timed captions used by the current video.
- `src/PosibloPipeline.tsx`: reusable props-driven composition used by the pipeline; `src/PipelineScenes.tsx`: its four animated scene templates.
- `src/pipeline/`: caption and scene timing shared by the composition and the pipeline.
- `scripts/pipeline/`: the one-command pipeline (`run.mjs` entry, `runner.mjs`, `stages/`, `lib/`, `python/` transcriber, `examples/` worked example from the approved reference); `tests/pipeline/`: its tests.
- `public/input/`: original footage.
- `out/`: generated exports and reports (Git-ignored).
- [references/](../references/README.md): approved video, source snapshot, and integrity manifest. Preserve `references/posiblo-v1/` unchanged.

## One-command pipeline

Turns one recording into a cleaned full video, 5-6 short clips, Hebrew captions, animated explanations where they help, and post metadata, all as local files. It pauses once for your approval before rendering.

### Setup (once)

1. Install dependencies: `npm ci`
2. Install a full FFmpeg build, then **open a new terminal** so PATH updates:

   ```powershell
   winget install --id Gyan.FFmpeg -e
   ffmpeg -version
   ```

3. Install the free local Hebrew transcriber (creates `.venv`, installs pinned Python packages, downloads and verifies the model, about 1.6 GB). Needs Python 3.9+ on PATH:

   ```powershell
   npm run setup:transcriber
   ```

4. Create `.env` from the template and fill in your key and model:

   ```powershell
   Copy-Item .env.example .env
   ```

   `.env` is Git-ignored. Never commit it or paste the key into code.

The pipeline checks FFmpeg and `.env` at startup and stops with a clear message if anything is missing. Remotion's bundled FFmpeg is a restricted build and is not used for these stages.

### Run

```powershell
npm run pipeline -- "C:\path\to\recording.mp4"
```

To try it on the footage already in the repository (about 43 s, so the 20-60 s clips overlap heavily; it is also the approved reference's own recording, so the scene planner runs without its worked example there):

```powershell
npm run pipeline -- public/input/testvideo.mp4
```

Quote paths that contain spaces. Results go to `out/<slug>/`; start with `out/<slug>/summary.md`.

| Option | Default | Purpose |
| --- | --- | --- |
| `--slug <name>` | from the file name | Run folder name under `out/` |
| `--language <code>` | `he` | Transcription language |
| `--transcriber <name>` | `ivrit` | `ivrit` (Hebrew fine-tuned model) or `whisper-webgpu` (the original transcriber) |
| `--whisper-model <id>` | `large-v3-turbo` | Model for `--transcriber whisper-webgpu` |
| `--rerun-from <stage>` | none | Redo a stage (id or 1-9) and all later stages |
| `--help` | | Show usage |

**Cost and time.** Stage 5 makes two Anthropic API requests (clips, scene plan) and stage 8 one; each is retried once if the answer is malformed. All are billed to your key. Transcription runs on the CPU (about 25 s for 43 s of speech on the development machine). `setup:transcriber` downloads the Hebrew model once; later runs work offline. Rendering time grows with video length and the number of clips.

**Local only.** Everything is written to `out/<slug>/` (Git-ignored). The original recording is only read and hashed; work happens on a copy. The pipeline contains no upload or publishing code. The only network calls are the one-time model downloads (Hugging Face, during `setup:transcriber`) and the Anthropic API in stages 5 and 8. Audio is never sent anywhere; the API receives transcript text only.

| # | Stage | Main outputs in `out/<slug>/` |
| --- | --- | --- |
| 1 | Ingest: copy, probe, provenance, 16 kHz mono WAV | `01-ingest/source.<ext>`, `probe.json`, `provenance.json`, `audio-16k-mono.wav` |
| 2 | Transcribe locally (default language `he`, word timing). Default: ivrit.ai Hebrew Whisper via `scripts/pipeline/python/transcribe_ivrit.py`, with per-word confidence; `--transcriber whisper-webgpu` uses `scripts/transcribe-source.mjs` | `02-transcribe/transcription-<model>.json` (raw), `transcript.json`, `transcript.txt` |
| 3 | Clean cut: shorten silences longer than 0.75 s, remove hesitation fillers and repeated takes, keep natural pauses; remap timestamps | `03-clean-cut/edit-map.json`, `silences.json`, `cut-video.mp4`, `cut-audio.wav`, `transcript-edited.json` |
| 4 | Audio: `afftdn` denoise, two-pass `loudnorm` to about -14 LUFS, mux | `04-audio/loudness.json` (before/after), `audio-processed.wav`, `edited.mp4` |
| 5 | Clip selection and scene plan (Anthropic API, two calls): 5-6 clips of 20-60 s on sentence boundaries, with reasons; then a judgment of where an animated explanation helps and where the speaker alone is better (zero scenes is allowed). Both validated, retried once if malformed | `05-clip-selection/clips.json`, `scene-plan.json`, `scene-plan.md`, `sentences.json`, `api-attempts.json`, `scene-api-attempts.json` |
| 6 | Hebrew RTL captions on the edited timeline, with review flags | `06-captions/captions.json`, `captions.srt`, `review-flags.json` |
| 7 | **Pauses for your approval of the scene plan**, then renders the full video and every clip in 9:16 with the `PosibloPipeline` composition | `07-render/exports/<slug>-full.mp4`, `<slug>-clip-NN.mp4`, `props/`, `captions/`, `renders.json` |
| 8 | Metadata (Anthropic API): Hebrew title, caption and hashtags per export for Facebook Reels, Instagram Reels and TikTok; validated | `metadata.json`, `08-metadata/api-attempts.json` |
| 9 | Verify every export with `scripts/verify-deliverable.mjs` and its actual caption timeline; re-check source and reference hashes; summary and draft records | `09-verify/*.verification.json`, `summary.md`, `09-verify/summary.json`, `review/<slug>-brief.md`, `review/<slug>-review.md` |

Stages run in this order and the first failure stops the run (`pipeline-state.json` records it). Running the same command again resumes: finished stages are skipped. A finished run is never overwritten silently; use `--rerun-from <stage>` to redo a stage and everything after it, or `--slug <name>` for a separate run. A different file with the same name gets a new suffixed folder. Run `npm run pipeline -- --help` for all options.

Limits to know: captions are machine transcription and can still be wrong; words under 0.6 confidence are flagged first, but confidence can miss errors (testing showed garbled phrases with no flag), so every word needs review (with `--transcriber whisper-webgpu` no confidence exists at all). Cut, title and metadata decisions are automatic. Only one audio stream (the first) is used. Animated scenes use four templates; anything more custom is Studio polish.

**Manual review is required before posting.** The summary lists it as pending every time: full playback of every export with sound, a phone-size check, and a fluent Hebrew review of captions, titles and metadata against the audio. Automated checks passing does not make an export release-ready.

### Animated scenes: the scene plan and your approval

Stage 5 decides, per part of the speech, whether an animated explanation helps. It learns the judgment from a worked example of the approved reference video (`scripts/pipeline/examples/posiblo-v1-scenes.json`): where its scenes appear, what they show, where it deliberately keeps the speaker alone, and why. Scene types: a **flow** of steps, a short list of **cards**, a problem/solution **comparison**, or a closing **question**. During a scene the speaker shrinks to a corner window, as in the v1 reference. Personal stories, opinions and punchy lines keep the speaker full screen, and "no scenes" is a valid outcome. On-screen text must come from the speech; text that cannot be matched to it is flagged in the plan.

The run then **pauses before rendering** and prints three steps:

1. Read the reasons in `out/<slug>/05-clip-selection/scene-plan.md` and preview the plan in Studio with the printed command (`npx remotion studio --public-dir=... --props=...`, composition `PosibloPipeline`).
2. Optionally edit or delete scenes in `scene-plan.json`.
3. Approve and render: `npm run pipeline -- <video> --approve-scenes`.

An approval is tied to the exact plan file; editing the plan afterwards needs a new approval. To use a different model for the scene plan only, set `ANTHROPIC_SCENE_MODEL` in `.env`.

To preview a run in Studio at any time (the full video; use `props/clip-NN.json` for a clip):

```sh
npx remotion studio --public-dir=out/<slug>/07-render/public --props=out/<slug>/07-render/props/full.json
```

Select **PosibloPipeline** in the sidebar. The other compositions show "media unavailable" in this mode because their footage is not in the run's folder; that is expected. Stop Studio with Ctrl+C before starting it for another run, or the new command reuses the running preview.

### Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| `ffmpeg and ffprobe must be on PATH` | Install FFmpeg (Setup step 2) and open a new terminal. |
| `The Hebrew transcriber is not installed` | Run `npm run setup:transcriber` (Setup step 3). |
| `SHA-256 mismatch` | The downloaded model differs from the pinned one; it is not loaded. Delete `%USERPROFILE%\.cache\huggingface\hub\models--ivrit-ai--whisper-large-v3-turbo-ct2` and run setup again. |
| `Missing ANTHROPIC_API_KEY ...` | Create `.env` (Setup step 4). |
| `PIPELINE STOPPED at stage N` | Read the error, fix the cause, and run the same command again; finished stages are skipped. |
| `PAUSED at stage 7 ... Scene plan waiting for your approval` | Not an error. Preview the plan, then run the printed `--approve-scenes` command. |
| `already has a finished run` | Nothing was changed. Use `--rerun-from <stage>` or `--slug <new-name>`. |
| `Another pipeline run (pid ...)` | Wait for the other run. If none is running, delete `out/<slug>/.pipeline.lock`. |
| Stage 2 seems stuck with `--transcriber whisper-webgpu` | It is downloading that model (more than 1.7 GB) on first use; check your network. An interrupted download restarts from the beginning. |
| `Model response was still invalid after one retry` | The API answer failed validation twice; the attempts are saved in `05-clip-selection/api-attempts.json`, `scene-api-attempts.json` or `08-metadata/api-attempts.json`. Run the same command again. |
| Studio shows "media unavailable" | Select **PosibloPipeline**; the other compositions cannot find their footage in a run's folder. |

## Creating a video

When working with an agent in this repository, you can provide only a local video path:

```text
C:\Users\meirn\Videos\new-recording.mp4
```

Under [AGENTS.md](../AGENTS.md), this starts the [social-media workflow](social-media-video-workflow.md): inspect the footage, discover relevant docs/code/assets, complete a brief, edit in Remotion for organic Facebook Reels/Instagram Reels/TikTok, and document review and pending checks. The example path is illustrative. Optional details override the defaults; you do not need to paste the longer prompt.

Default delivery is a Studio preview. Add `export MP4` to request a rendered deliverable. This is an instruction for the agent operating in this project, not a background watcher; under [AGENTS.md](../AGENTS.md) the agent starts by running the [one-command pipeline](#one-command-pipeline) and then continues this workflow on its output. Human review remains required before release, and nothing is uploaded automatically.

1. Read [AGENTS.md](../AGENTS.md) and the [video standard](video-standard.md). Use the relevant installed Remotion skills when working with an agent.
2. Copy and complete the [brief](video-brief-template.md) and [review](video-review-template.md) as `docs/videos/<slug>-brief.md` and `docs/videos/<slug>-review.md`.
3. Preserve the footage; create a distinct composition and output filename. Adapt scenes and captions to the actual speech, and document at least one specific improvement over the approved reference. The transcription and caption-preparation scripts contain recording-specific paths and edits; adapt them before reuse.
4. Export when requested, then verify the exact deliverable:

   ```sh
   npm run verify:video -- --output out/<slug>.mp4 --source public/input/<source>.mp4 --captions src/<captions>.json
   ```

Verification checks decoding, format, and caption timing, and writes `<output>.verification.json`. For the current rerender, use `--output out/not-every-business-needs-ai-posiblo-rerender.mp4`; the source and caption defaults already match it. The legacy `scripts/verify-output.mjs` is recording-specific.

Before release, record full playback with sound, phone-size inspection, and caption review against the audio by a fluent Hebrew listener. Automated checks do not establish release readiness. Disclose unresolved issues; the reference has an unconfirmed caption gap at 12.26–13.68 seconds.

Start a new request with the [reusable video prompt](prompts/next-video-prompt.md). The [original prompt](prompts/original-video-prompt.md) is preserved for context.

This project is private and marked `UNLICENSED`; Remotion has [separate license terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

