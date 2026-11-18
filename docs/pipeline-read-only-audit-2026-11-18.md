## 1. SUMMARY

**The one-command pipeline is not implemented.** This is currently a working, recording-specific Remotion project with some reusable helpers.
Node and the requested Remotion dependencies match; the working tree is clean on `main`, matching the locally recorded `origin/main`.
All 23 approved-reference files match their manifest. No first-party publishing integration was found.
No files were changed, packages installed, pipeline/render commands run, or external APIs called during the audit. This report was subsequently saved at the user's request.

**Top 5 blockers:**

1. No `pipeline` npm script, entry script, or `scripts/pipeline/` directory.
2. FFmpeg/FFprobe missing from PATH; bundled FFmpeg is a restricted build.
3. No clean-cut or audio-processing stages.
4. No Anthropic clip selection, boundary validation, or platform metadata generation.
5. No reusable composition accepting the required props or orchestration verifying every export.

## 2. STATUS TABLE

Paths are relative to the repository root. Findings describe the repository at audit time, before this report file was created.

| Item | Expected | Found (file path) | Status |
|---|---|---|---|
| Node/npm | Supported Node; npm available | Node **24.16.0**, npm **11.13.0**; engine requirement in `package.json` matches | Present |
| Working tree/branch | Clean; branch identified | `git status`: clean `main`; no staged changes | Present |
| FFmpeg/FFprobe PATH | Both available | Both commands unavailable on PATH | Missing |
| Full FFmpeg/filter support | `silenceremove`, `loudnorm`, `afftdn` | `node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`: n7.1; configuration disables filters generally, enables `loudnorm`, does not enable the other two | Partial |
| Required dependencies | Remotion packages 4.0.543; Transformers installed | `package.json` and `npm ls`: all requested Remotion packages **4.0.543**, Transformers **4.2.0** | Present |
| Existing commands | lint/build/render preserved | All present in `package.json`; render targets `PosibloFirstTest` | Present |
| Pipeline command | `npm run pipeline -- <video-path>` | No script in `package.json`; no `scripts/pipeline/` | Missing |
| Stage 1: ingest/probe | Copy original, probe, save under `out/<slug>/` | Preservation documented; probing exists in final verifier, but no ingest/copy stage | Missing |
| Stage 2: transcription | Local large-v3-turbo, Hebrew default, word timing | `scripts/transcribe-source.mjs`: parameterized WAV/output paths, model default, timed captions; language is required, not defaulted; WAV preparation absent | Partial |
| Stage 3: clean cut | Remove silences/fillers/repeated takes | No implementation in `scripts/` | Missing |
| Stage 4: audio | Denoise; approximately −14 LUFS | No processing implementation in `scripts/` | Missing |
| Stage 5: clip selection | Anthropic; 5–6 reasoned, validated candidates | No implementation | Missing |
| Stage 6: captions | Generated Hebrew RTL JSON; uncertainty flags | Caption generators and RTL components exist; generators contain recording-specific edits; all inspected confidence values are null, without word-level review flags | Partial |
| Stage 7: rendering | Props-driven full video and clips, 9:16 | `src/Root.tsx`: two fixed 720×1280 compositions; neither accepts source/captions/range/title props | Partial |
| Stage 8: metadata | Hebrew title/caption/hashtags for three platforms | No generator or pipeline `metadata.json` contract | Missing |
| Stage 9: verification | Verify every export; final manual-review reminder | `scripts/verify-deliverable.mjs` accepts paths and records pending human review; no pipeline invokes it for every export | Partial |
| Anthropic environment | Key/model read from environment | `.env`: both requested key names **exist**; no project code reads them | Partial |
| Example environment | Placeholder-only `.env.example` | File absent | Missing |
| Environment protection | `.env` ignored | `.gitignore` covers `.env` and `.env.*`, permits example files | Present |
| Original composition | Preserve existing video | `PosibloFirstTest` remains registered; composition, graphics, captions and source match archive hashes | Present |
| Reference integrity | Archive matches manifest | `references/posiblo-v1/`: **23/23** sizes and SHA-256 hashes match; no extra archived files found | Present |
| Local-only operation | No platform publishing/upload integration | No first-party implementation found in `src/`, `scripts/`, or project configuration | Present |
| Documentation | Describe new pipeline command accurately | `README.md`, `AGENTS.md`, workflow docs describe agent-assisted editing; README explicitly says no general-purpose CLI pipeline | Missing |
| Skills | Official lock entries and local files | `skills-lock.json`: 13 entries from `remotion-dev/skills`; all 13 local `SKILL.md` files exist | Present |
| Plugin/MCP requirements | None required | No repository plugin/MCP configuration found; optional skills and historical Playwright artifacts exist | Present |

**Caption details:** `src/Composition.tsx` reads generated JSON and uses `dir="rtl"`/`lang="he"`. The founder composition uses a generated inline caption array through `FounderCaptionTrack.tsx`; it does not load arbitrary caption JSON through composition props. Rendered RTL behavior was not tested during this audit.

**Secrets check:** key-pattern matches occurred in `.env` and two dependency README files. No matching key-like strings were found elsewhere in the searched text or in diffs/messages across the **five locally available commits**. No secret values were printed.

## 3. ORDER VALIDATION

**Expected:**

`Ingest/probe → Transcribe → Clean cut → Audio → Clip selection → Captions → Render → Metadata → Verify/summary`

**Actual:** no pipeline entry script exists, so there is **no implemented execution order** to validate.

The available pieces are independent helpers:

- Transcription requires an already prepared mono 16 kHz PCM16 WAV.
- Caption-preparation scripts read fixed recording-specific files.
- Rendering uses fixed compositions and output filenames.
- Verification runs separately when invoked manually.

Every structural mismatch:

1. No ordered nine-stage orchestrator.
2. No common `out/<slug>/` output contract.
3. No ingest-stage probing or automatic source copy.
4. No automatic input handoff between stages.
5. Clean cut, audio, clip selection and metadata stages are absent.
6. No timestamp mapping after cuts, needed to keep captions and clip ranges synchronized.
7. No full-video-plus-clips rendering loop.
8. No automatic verification loop or final pipeline summary.

There is also a legacy handoff mismatch: `transcribe.mjs` writes `out/transcription-raw.json`, while `prepare-captions.mjs` reads `out/transcription-large-v3-turbo.json`.

## 4. LIST A - SAFE TO REMOVE

**None identified with 100% confidence.**

No removal commands are proposed. Lack of a direct application import does not establish that a package, skill, or historical artifact is unused by tooling or manual workflows.

## 5. LIST B - UNSURE (KEEP)

| Item | Evidence and reason to keep |
|---|---|
| `@mediabunny/server@1.64.0` | No first-party import found. Remotion CLI explicitly recognizes this package, and README documents it. Potentially unnecessary, but removal is not proven safe. |
| Direct `mediabunny@1.64.0` | No first-party import; multiple Remotion dependencies use it. Keep. |
| Direct `@huggingface/transformers@4.2.0` | Used transitively by Whisper and explicitly required by the expected design. Keep. |
| `@emnapi/runtime@1.11.3` | `npm ls` marks it **extraneous**, but the lockfile contains an optional entry and native tooling references the package. Investigate before removing. |
| `boolean@3.2.0` | Lockfile marks it **unsupported/deprecated**. Dependency chain: Transformers → `onnxruntime-node` → `global-agent`/`roarr` → `boolean`. Address through the owning dependency, not manual deletion. |
| `prettier@3.8.1` | No npm formatting script, but `.prettierrc` exists and editor/manual use is possible. |
| `@types/web@0.0.166` | Type packages can apply without direct imports. No compilation was run to establish redundancy. |
| Legacy scripts and caption files | Recording-specific, but referenced by docs, generators or historical workflows. Preserve until replacements and retention decisions exist. |
| Maps/SaaS/licensing/upgrade skills | Not required for the specified pipeline runtime, but referenced by the skill router and potentially useful for other tasks. |
| `.claude/skills/` | Contains junctions to skills rather than simply independent duplicate files; may support another agent client. |
| `.playwright-mcp/` and `out/` QA artifacts | Not runtime requirements; may retain review evidence. Keep. |

No direct package was established to be unknown or unmaintained. The locally documented unsupported dependency is `boolean`; broader current maintenance status was not checked online.

## 6. FIX LIST

1. **Define stage contracts and add the entry command.** Create `scripts/pipeline/`, exact nine-stage sequencing, isolated `out/<slug>/` outputs, safe subprocess arguments, collision handling and failure propagation.
2. **Provide full FFmpeg/FFprobe on PATH.** Require the three specified filters; keep the restricted Remotion binaries separate.
3. **Implement ingest.** Copy the source, probe it, record provenance and prepare transcription WAV input without modifying the original.
4. **Adapt transcription.** Reuse the parameterized helper, default language to Hebrew, preserve raw word timing and record uncertainty.
5. **Implement clean cut.** Detect and remove silences, fillers and repeated takes; save an edit map and remap transcript timestamps.
6. **Implement audio processing.** Denoise and normalize toward −14 LUFS, recording measurements.
7. **Implement stage 5 Anthropic selection.** Load environment configuration, use `ANTHROPIC_MODEL`, request 5–6 candidates with reasons, and validate finite ranges, sentence boundaries and video bounds.
8. **Implement generic captions.** Consume the edited timeline, generate timed JSON, flag low or unavailable confidence, and remove recording-specific corrections from the reusable path.
9. **Add a reusable Remotion composition.** Accept source, captions, clip range and title; derive duration; rebase clip captions; preserve both existing compositions.
10. **Implement stage 8 metadata.** Generate and validate Hebrew metadata for Facebook Reels, Instagram Reels and TikTok; save `metadata.json`. Restrict Anthropic calls to stages 5 and 8.
11. **Wire verification and summary.** Verify every full/clip export using its actual caption timeline. Report failures and explicitly require complete playback and fluent Hebrew caption review.
12. **Add `.env.example` and update docs.** Document the implemented command, stage outputs, model setting, local-only guarantees and manual review requirements.
13. **Then validate execution.** Test stage ordering, timestamp remapping, malformed API responses, source preservation and every-export verification. Review dependency concerns without altering the reference archive.

## 7. COULD NOT VERIFY

- **Runtime correctness:** pipeline, lint, build, rendering, transcription and verification scripts were intentionally not executed.
- **Filter inventory:** `ffmpeg -filters` was outside the allowed command list. Bundled `-version` configuration shows a restricted build with `loudnorm` enabled and no enablement for `silenceremove` or `afftdn`.
- **Anthropic credentials/model:** only key-name existence was inspected. Values, validity and whether the model equals `claude-haiku-5-5` were not checked.
- **API/model availability, package maintenance and upstream skill provenance:** no network/API calls were made. Local files and lock entries do not prove current upstream status.
- **Playback and Hebrew accuracy:** no video playback, listening or fresh visual inspection occurred. Existing review records still contain pending human checks.
- **Original composition execution:** preserved source/assets were confirmed statically; successful rendering was not freshly established.
- **Absolute secret absence:** pattern searches cannot detect every credential format, encoded secret or binary content. Source maps/binaries and unavailable remote or unreachable Git history were not exhaustively inspected.
- **Literal “no upload code anywhere”:** first-party publishing integrations were absent, but installed Remotion Studio contains asset-upload helpers. Skill references also use “upload” for local/GPU operations. A repository-wide ban extending to dependencies is therefore not satisfied literally.
- **Global Git ignore configuration:** Git reported permission denied reading `C:\Users\meirn\.config\git\ignore`. Repository status and diffs completed, but that global configuration was inaccessible.
