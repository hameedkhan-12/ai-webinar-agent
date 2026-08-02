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
export async function generateSpeech({
  prompt,
  voiceKey,
  temperature = 0.8,
  topP = 0.95,
  topK = 1000,
  repetitionPenalty = 1.2,
  normLoudness = true,
}: GenerateSpeechParams): Promise<Buffer> {
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