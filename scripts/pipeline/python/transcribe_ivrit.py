"""Local Hebrew transcription with faster-whisper and the ivrit.ai fine-tuned Whisper model.

Used by stage 2 of `npm run pipeline` (transcriber "ivrit"). Runs fully on this computer:
the audio is never uploaded. The model is downloaded once from Hugging Face at a pinned
revision, only the listed files are fetched, and model.bin is checked against its published
SHA-256 before it is loaded. Later runs use the local copy offline.

Output JSON matches the shape of scripts/transcribe-source.mjs (text, words with
startInSeconds/endInSeconds) plus a per-word `confidence` (the model's word probability).
"""
import argparse
import hashlib
import json
import os
import sys
import time
import wave

os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

MODELS = {
    "ivrit-large-v3-turbo": {
        "repo": "ivrit-ai/whisper-large-v3-turbo-ct2",
        "revision": "72ad623a37947395efcc3933132353790e5a12f5",
        "sha256": {"model.bin": "db2a2265aa012c16c7db9edda3d699c99f984efdd3f2e22a72a8ce7e9720f3a2"},
        "license": "apache-2.0",
    },
}
FILES = ["config.json", "model.bin", "preprocessor_config.json", "tokenizer.json", "vocabulary.json"]


def log(message):
    print(message, file=sys.stderr, flush=True)


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def read_wav_16k_mono(path):
    """Reads the pipeline's mono 16 kHz PCM16 WAV without PyAV (faster-whisper 1.2.1's own
    decoder is incompatible with the PyAV version pip resolves today)."""
    import numpy as np

    with wave.open(path, "rb") as handle:
        if handle.getnchannels() != 1 or handle.getframerate() != 16000 or handle.getsampwidth() != 2:
            raise RuntimeError(f"{path} must be mono 16 kHz PCM16 WAV")
        frames = handle.readframes(handle.getnframes())
    return np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0


def fetch_model(name):
    from huggingface_hub import snapshot_download

    spec = MODELS[name]
    try:
        path = snapshot_download(spec["repo"], revision=spec["revision"], allow_patterns=FILES, local_files_only=True)
        log(f"Using cached model {spec['repo']}@{spec['revision'][:7]}")
    except Exception:
        log(f"Downloading {spec['repo']}@{spec['revision'][:7]} from Hugging Face (one time, about 1.6 GB)...")
        path = snapshot_download(spec["repo"], revision=spec["revision"], allow_patterns=FILES)
    missing = [f for f in FILES if not os.path.isfile(os.path.join(path, f))]
    if missing:
        raise RuntimeError(f"Model download is missing files: {', '.join(missing)}")
    for filename, expected in spec["sha256"].items():
        actual = sha256_file(os.path.join(path, filename))
        if actual != expected:
            raise RuntimeError(f"{filename} SHA-256 mismatch (expected {expected}, got {actual}); refusing to load the model")
    log("Model files verified (pinned revision, SHA-256 match)")
    return path, spec


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wav", nargs="?", help="mono 16 kHz WAV")
    parser.add_argument("output", nargs="?", help="output JSON path (must not exist)")
    parser.add_argument("--language", default="he")
    parser.add_argument("--model", default="ivrit-large-v3-turbo", choices=sorted(MODELS))
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"])
    parser.add_argument("--compute-type", default="default")
    parser.add_argument("--download-only", action="store_true")
    args = parser.parse_args()

    path, spec = fetch_model(args.model)
    if args.download_only:
        return
    if not args.wav or not args.output:
        parser.error("wav and output are required")
    if os.path.exists(args.output):
        raise RuntimeError(f"{args.output} already exists; refusing to overwrite")

    from faster_whisper import WhisperModel

    settings = {
        "language": args.language, "task": "transcribe", "beam_size": 5, "word_timestamps": True,
        # VAD skips non-speech, and not conditioning on previous text reduces invented/repeated text.
        "vad_filter": True, "condition_on_previous_text": False,
    }
    log(f"Transcribing {args.wav} locally with {spec['repo']} on {args.device}; automatic, not human verified")
    started = time.time()
    model = WhisperModel(path, device=args.device, compute_type=args.compute_type)
    segments_iter, info = model.transcribe(read_wav_16k_mono(args.wav), **settings)
    words, segments = [], []
    for segment in segments_iter:
        segments.append({"start": segment.start, "end": segment.end, "text": segment.text, "avgLogprob": segment.avg_logprob,
                         "noSpeechProb": segment.no_speech_prob, "compressionRatio": segment.compression_ratio})
        for word in segment.words or []:
            words.append({"text": word.word, "startInSeconds": round(word.start, 3), "endInSeconds": round(word.end, 3), "confidence": round(word.probability, 4)})
    result = {
        "text": "".join(w["text"] for w in words).strip(),
        "words": words,
        "model": args.model,
        "engine": "faster-whisper",
        "modelSource": {"repo": spec["repo"], "revision": spec["revision"], "sha256": spec["sha256"], "license": spec["license"]},
        "language": info.language, "languageProbability": info.language_probability, "durationSeconds": info.duration,
        "settings": settings, "device": args.device, "computeType": args.compute_type,
        "elapsedSeconds": round(time.time() - started, 1),
        "confidenceNote": "Per-word probability from the model. It is not a measure of accuracy; low values mark words to check first.",
        "segments": segments,
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    tmp = args.output + ".partial"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    os.replace(tmp, args.output)
    log(f"{len(words)} words in {result['elapsedSeconds']} s")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # clear single-line error for the Node stage
        log(f"ERROR: {error}")
        sys.exit(1)
