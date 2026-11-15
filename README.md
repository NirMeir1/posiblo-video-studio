# Posiblo Video Studio

Remotion project for vertical Posiblo videos with the original speaker and voice, Hebrew RTL captions, and animated explanations in a dark and lime visual style.

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
