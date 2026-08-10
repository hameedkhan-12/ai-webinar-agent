"""Chatterbox TTS API - Text-to-speech with voice cloning on Modal."""

import modal

# Use this to add R2 tokens:
# modal secret create cloudflare-r2 \
#   AWS_ACCESS_KEY_ID=<r2-access-key-id> \
#   AWS_SECRET_ACCESS_KEY=<r2-secret-access-key>

# Use this to test locally:
# modal run chatterbox_tts.py \
#   --prompt "Hello from Chatterbox [chuckle]." \
#   --voice-key "voices/system/<voice-id>"

# Use this to test CURL:
# curl -X POST "https://<your-modal-endpoint>/generate" \
#   -H "Content-Type: application/json" \
#   -H "X-Api-Key: <your-api-key>" \
#   -d '{"prompt": "Hello from Chatterbox [chuckle].", "voice_key": "voices/system/<voice-id>"}' \
#   --output output.wav

# R2 cloud bucket mount (read-only, replaces Modal Volume)
R2_BUCKET_NAME = "webinar"
R2_ACCOUNT_ID = "8aa6a0e9831eeef9757e9ecf0f5dbbeb"
R2_MOUNT_PATH = "/r2"
r2_bucket = modal.CloudBucketMount(
    R2_BUCKET_NAME,
    bucket_endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    secret=modal.Secret.from_name("cloudflare-r2"),
    read_only=True,
)

# Modal setup
image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "chatterbox-tts==0.1.6",
    "fastapi[standard]==0.124.4",
    "peft==0.18.0",
)
app = modal.App("chatterbox-tts", image=image)

with image.imports():
    import io
    import os
    import threading
    import time
    from collections import OrderedDict
    from pathlib import Path

    import torchaudio as ta
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    from fastapi import (
        Depends,
        FastAPI,
        HTTPException,
        Security,
    )
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from fastapi.security import APIKeyHeader
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("CHATTERBOX_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class TTSRequest(BaseModel):
        """Request model for text-to-speech generation."""

        prompt: str = Field(..., min_length=1, max_length=5000)
        voice_key: str = Field(..., min_length=1, max_length=300)
        temperature: float = Field(default=0.8, ge=0.0, le=2.0)
        top_p: float = Field(default=0.95, ge=0.0, le=1.0)
        top_k: int = Field(default=1000, ge=1, le=10000)
        repetition_penalty: float = Field(default=1.2, ge=1.0, le=2.0)
        norm_loudness: bool = Field(default=True)


# Upper bound on how many distinct voices' conditioning we keep cached in
# GPU memory at once (see self._conditionals_cache below). Each entry is
# small (a speaker embedding + short token/feature tensors), so this is a
# generous cap purely to prevent unbounded growth on a long-lived warm
# container serving many different cloned voices over time.
MAX_CACHED_VOICES = 50


@app.cls(
    gpu="a10g",
    scaledown_window=60 * 5,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("chatterbox-api-key"),
        modal.Secret.from_name("cloudflare-r2"),
    ],
    volumes={R2_MOUNT_PATH: r2_bucket},
)
@modal.concurrent(max_inputs=10)
class Chatterbox:
    @modal.enter()
    def load_model(self):
        self.model = ChatterboxTurboTTS.from_pretrained(device="cuda")
        # `model.generate(..., audio_prompt_path=...)` calls
        # `prepare_conditionals()` internally on *every* call, which runs the
        # voice encoder + s3gen reference-audio embedding over the reference
        # wav from scratch. That step dominates latency (measured 4-8s+ per
        # request in production, largely independent of text length) and is
        # identical for every request reusing the same voice. We cache the
        # resulting `Conditionals` per voice so repeat calls skip straight to
        # generation, which is what actually needs to run per-request.
        self._conditionals_cache = OrderedDict()
        # `model.generate()` mutates the shared `model.conds` attribute
        # rather than taking conditioning as an argument, so it isn't safe
        # to call concurrently for two different voices on the same model
        # instance (`@modal.concurrent(max_inputs=10)` allows overlapping
        # requests in one container) - a second request could swap out
        # `model.conds` while a first request's generation is still reading
        # it, silently mixing up voices. This lock serializes the
        # conditioning-swap + generate() critical section; since generation
        # is GPU-bound anyway (and a single GPU largely serializes compute
        # regardless), this doesn't meaningfully reduce throughput.
        self._generate_lock = threading.Lock()

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="Chatterbox TTS API",
            description="Text-to-speech with voice cloning",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.post("/generate", responses={200: {"content": {"audio/wav": {}}}})
        def generate_speech(request: TTSRequest):
            voice_path = Path(R2_MOUNT_PATH) / request.voice_key
            if not voice_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice not found at '{request.voice_key}'",
                )

            try:
                audio_bytes = self.generate.local(
                    request.prompt,
                    str(voice_path),
                    request.temperature,
                    request.top_p,
                    request.top_k,
                    request.repetition_penalty,
                    request.norm_loudness,
                )
                return StreamingResponse(
                    io.BytesIO(audio_bytes),
                    media_type="audio/wav",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate audio: {e}",
                )

        return web_app

    @modal.method()
    def generate(
        self,
        prompt: str,
        audio_prompt_path: str,
        temperature: float = 0.8,
        top_p: float = 0.95,
        top_k: int = 1000,
        repetition_penalty: float = 1.2,
        norm_loudness: bool = True,
    ):
        # Turbo ignores exaggeration/cfg_weight entirely (see tts_turbo.py),
        # but norm_loudness also affects how the *reference* audio itself is
        # prepped inside prepare_conditionals, so it's part of the cache key
        # too - otherwise a request with a different norm_loudness could
        # silently reuse conditioning prepared under the wrong setting.
        exaggeration = 0.0
        cache_key = (audio_prompt_path, exaggeration, norm_loudness)

        with self._generate_lock:
            cached_conds = self._conditionals_cache.get(cache_key)
            t0 = time.monotonic()
            if cached_conds is not None:
                # Re-insert at the end so this entry counts as most-recently-used.
                self._conditionals_cache.move_to_end(cache_key)
                self.model.conds = cached_conds
                print(f"[timing] conditioning cache HIT for {audio_prompt_path}")
            else:
                self.model.prepare_conditionals(
                    audio_prompt_path,
                    exaggeration=exaggeration,
                    norm_loudness=norm_loudness,
                )
                self._conditionals_cache[cache_key] = self.model.conds
                if len(self._conditionals_cache) > MAX_CACHED_VOICES:
                    self._conditionals_cache.popitem(last=False)
                print(f"[timing] conditioning cache MISS for {audio_prompt_path}, prepare_conditionals took {time.monotonic() - t0:.2f}s")

            t1 = time.monotonic()
            # No audio_prompt_path here - that would force a redundant
            # prepare_conditionals() call, undoing the caching above. The
            # model reuses self.conds, which we just set.
            wav = self.model.generate(
                prompt,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                repetition_penalty=repetition_penalty,
                norm_loudness=norm_loudness,
            )

        buffer = io.BytesIO()
        ta.save(buffer, wav, self.model.sr, format="wav")
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Chatterbox running on Modal [chuckle].",
    voice_key: str = "voices/system/default.wav",
    output_path: str = "/tmp/chatterbox-tts/output.wav",
    temperature: float = 0.8,
    top_p: float = 0.95,
    top_k: int = 1000,
    repetition_penalty: float = 1.2,
    norm_loudness: bool = True,
):
    import pathlib

    chatterbox = Chatterbox()
    audio_prompt_path = f"{R2_MOUNT_PATH}/{voice_key}"
    audio_bytes = chatterbox.generate.remote(
        prompt=prompt,
        audio_prompt_path=audio_prompt_path,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        repetition_penalty=repetition_penalty,
        norm_loudness=norm_loudness,
    )

    output_file = pathlib.Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(audio_bytes)
    print(f"Audio saved to {output_file}")