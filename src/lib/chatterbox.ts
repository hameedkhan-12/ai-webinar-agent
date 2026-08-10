type GenerateSpeechParams = {
  prompt: string
  voiceKey: string
  temperature?: number
  topP?: number
  topK?: number
  repetitionPenalty?: number
  normLoudness?: boolean
}

/**
 * Calls the Chatterbox TTS Modal endpoint and returns the raw WAV bytes.
 * This is a single blocking call - Chatterbox generates the entire
 * utterance before responding, it does not stream audio progressively.
 * Callers doing live-call TTS (Vapi custom-voice) should keep `prompt`
 * short (one sentence/chunk) to minimize perceived latency, and rely on
 * Vapi's fallbackPlan in case this call is too slow or fails.
 */
/**
 * Pings the Chatterbox TTS Modal endpoint to warm up the GPU container on cold starts.
 */
export async function pingChatterbox(): Promise<boolean> {
  if (!process.env.CHATTERBOX_API_URL || !process.env.CHATTERBOX_API_KEY) {
    return false
  }

  try {
    const response = await fetch(`${process.env.CHATTERBOX_API_URL}/ping`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CHATTERBOX_API_KEY,
      },
      signal: AbortSignal.timeout(35000),
    })
    return response.ok
  } catch (error) {
    console.warn('Chatterbox ping failed or timed out:', error)
    return false
  }
}

export async function generateSpeech({
  prompt,
  voiceKey,
  temperature = 0.8,
  topP = 0.95,
  topK = 1000,
  repetitionPenalty = 1.2,
  normLoudness = true,
}: GenerateSpeechParams): Promise<Buffer> {
  if (!process.env.CHATTERBOX_API_URL || !process.env.CHATTERBOX_API_KEY) {
    throw new Error(
      'CHATTERBOX_API_URL / CHATTERBOX_API_KEY are not configured - deploy chatterbox_tts.py to Modal and set both env vars before custom voice generation (live calls or previews) can work.'
    )
  }

  const response = await fetch(`${process.env.CHATTERBOX_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CHATTERBOX_API_KEY!,
    },
    body: JSON.stringify({
      prompt,
      voice_key: voiceKey,
      temperature,
      top_p: topP,
      top_k: topK,
      repetition_penalty: repetitionPenalty,
      norm_loudness: normLoudness,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Chatterbox generation failed (${response.status}): ${detail}`
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}