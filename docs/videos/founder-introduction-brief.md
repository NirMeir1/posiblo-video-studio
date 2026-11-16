# Video brief: founder-introduction

- Standard: Posiblo Video Standard v1; social-media research dated 2026-11-15.
- Audience: Hebrew-speaking business owners evaluating software, automation, or AI help (inferred from actual automatic transcript).
- One main message: start with the business problem and choose the appropriate solution; Nir personally accompanies the process.
- Desired viewer action: discuss their problem/idea in a free introductory and initial mapping meeting, as stated in the recording; no invented booking link.
- Original: `C:\Posiblo\Founder introduction — edited_8.mp4`.
- Preserved project copy: `public/input/founder-introduction-edited-8.mp4`.
- Intake: accessible; 82.30s container / 82.246418s video; H.264 720 × 1280, variable/approximately 29.046 fps; AAC 48 kHz stereo. FFprobe inspected actual media. Source frames at 2, 22, 54s inspected visually. Hebrew visible; local multilingual Whisper transcription used for speech, not human listening review.
- Source limitation: burned-in white Hebrew captions around lower quarter and Descript watermark near bottom. User explicitly requested removing the watermark and retaining Posiblo branding. Plan: crop the camera window above both; do not erase/reconstruct face pixels. Inspect moving head across samples; original unchanged.
- Composition: `FounderIntroduction`, `src/FounderIntroduction.tsx`.
- Delivery: Remotion Studio preview and requested MP4 export, 720 × 1280 at 30 fps, 2470 frames (82.333s), original continuous voice. Export requested: yes, in the follow-up “so export it”.
- Export path: `out/founder-introduction-posiblo.mp4`; H.264, CRF 18, yuv420p, AAC 192 kbps. Verification and review status are in the review record.
- Captions: `src/founder-introduction-captions.json`; SRT and raw transcription in `out/founder-introduction/`.
- Hook: original question about AI, agents, automation, and what actually fits the viewer; graphic emphasizes business fit rather than adding new speech.
- Planned improvement over v1: captions lifted into a dedicated higher band; cropped speaker window removes embedded duplicate subtitles and watermark. Speech-specific “listen → understand → choose” diagram explains founder approach. These are measurable layout/clarity improvements, not marketing-performance claims.
- Intentional deviations: preserve all speech and pauses, no speed changes; crop speaker visually; no added music or synthesized voice. Keep full founder introduction rather than arbitrarily truncating to a generic duration target.
- Rights/disclosures: user supplied video and requested edit; third-party music rights not established. Do not add commercial music. TikTok commercial-disclosure setting must be checked before posting; no posting authorized.
- Success hypothesis: showing the diagnostic process will improve comprehension and qualified inquiries; no campaign data available.
- Human review: pending for complete Hebrew caption accuracy, final listening/lip sync, and platform previews.
- Automatic transcription corrections: 3.96s `ירדים` → `יודעים` (medium model and embedded subtitle at 4s); 25.94/26.06s `של העובדות` → `שלא עובדות` (embedded subtitle at 26s); 60.14s `לבות` → `ללוות` (embedded subtitle at 60s); 69.70s `הגירות` → `היכרות` and 70.00s `ומפוי` → `ומיפוי` (embedded subtitle at 70s). These are provisional editorial corrections, not human audio verification. Full correction log: `out/founder-introduction/caption-corrections.json`.

## Speech and scene plan

| Source time | Subject from automatic transcript | Visual plan |
| --- | --- | --- |
| 0–6.1s | AI, agents, automation: what fits you? | Immediate Hebrew question and clean large speaker |
| 6.1–17.2s | Nir, software experience, automation and AI | Identity card; experience statement attributed to speaker, not independently verified |
| 17.2–22.4s | Technology is a means to solve problems | Focused problem-first title |
| 22.4–31s | Slow process, disconnected systems, idea for site/app | Three distinct problem cards matched to speech |
| 31–37.4s | You do not need to know the solution upfront | Speaker and reassurance |
| 37.4–49.3s | Listen, understand the business and problem, choose | Staged diagnostic flow with retained speaker inset |
| 49.3–55.1s | Automation, app/system, or simpler option | Three solution choices revealed in speech order |
| 55.1–59.4s | Solution fit | Large speaker and fit-focused title |
| 59.4–64.3s | Personal accompaniment | Large speaker and personal accompaniment title |
| 64.3–82.33s | Problem/idea, free meeting, explore directions, talk | Closing invitation matching actual offer; no invented destination |

## Project context applied

| File / skill | Application |
| --- | --- |
| `AGENTS.md`; `docs/social-media-video-workflow.md` | Path-only intake, preserve sources, distinct composition, preview default |
| `docs/video-standard.md`; approved reference MP4 frame at 22s | Dark/lime palette, white wordmark, speaker retained, restrained cards/lines |
| `docs/video-brief-template.md`; `docs/video-review-template.md` | Brief and evidence-based review with pending checks |
| `docs/social-media-video-best-practices.md`, sections 3–11 | Immediate relevance, organic targets, placement evidence, caption clarity, truthful offer |
| `README.md`; `package.json`; `remotion.config.ts`; `src/Root.tsx` | Existing Remotion project; keep old composition; add independent registration |
| `src/Motion.tsx`; `src/Composition.tsx` | Reuse palette/icons and identity; adapt timing/layout to this recording |
| `scripts/transcribe.mjs`; `scripts/prepare-captions.mjs`; `scripts/check-phrases.mjs` | Recording-specific paths and omissions cannot be reused; added isolated parameterized WAV transcription helper |
| `docs/posiblo-v1-review.md`; `references/README.md` | Prior caption gap is historical; baseline must remain unchanged |
| Remotion creation, markup, interactivity, captions, Studio skills and referenced layout/timeline/RTL guidance | Opened Studio before editing; frame-based motion, editable authored layers and shared source clock |

## Placement applicability and specification evidence

Access attempts: 2026-11-15. These are organic placements; no ad acceptance claim.

| Platform / placement | Relevant guidance and source | Implementation / unresolved evidence |
| --- | --- | --- |
| Facebook organic Reels | [Official video publishing announcement](https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/) accessible; [originality guidance](https://about.fb.com/news/2026/03/rewarding-original-creators-on-facebook/) in research | Own speaker, vertical master, relevant diagrams, original speech; actual account upload/overlay preview pending |
| Instagram organic Reels | [Official size help](https://help.instagram.com/1038071743007909) returned HTTP 429; report's originality and watermark findings | Remove Descript branding via crop, keep Posiblo; current acceptance details and native UI preview pending; no unsupported numeric safe-zone claim |
| TikTok organic | [Official promotional-content help](https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/promoting-a-brand-product-or-service) returned no readable body on fresh attempt; previously researched guidance in report | Vertical people-led explanation; no added music; disclosure and actual account/UI compatibility pending |

The caption band and margins are local design choices. They do not replace platform preview evidence. Refresh unresolved requirements before an upload-ready delivery.
