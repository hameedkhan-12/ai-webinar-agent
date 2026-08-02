type DecodedWav = {
  sampleRate: number
  channels: number
  // Mono, Float32 samples in [-1, 1]
  samples: Float32Array
}

/**
 * Minimal WAV (RIFF/PCM) decoder. Supports 16-bit integer PCM and 32-bit
 * float PCM, the two formats torchaudio.save typically produces. Mixes
 * down to mono by averaging channels.
 */
function decodeWav(buffer: Buffer): DecodedWav {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a valid WAV file')
  }

  let offset = 12
  let sampleRate = 24000
  let channels = 1
  let bitsPerSample = 16
  let audioFormat = 1 // 1 = PCM int, 3 = IEEE float
  let dataStart = -1
  let dataLength = 0

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)

    if (chunkId === 'fmt ') {
      audioFormat = buffer.readUInt16LE(offset + 8)
      channels = buffer.readUInt16LE(offset + 10)
      sampleRate = buffer.readUInt32LE(offset + 12)
      bitsPerSample = buffer.readUInt16LE(offset + 22)
    } else if (chunkId === 'data') {
      dataStart = offset + 8
      dataLength = chunkSize
    }

    offset += 8 + chunkSize + (chunkSize % 2)
  }

  if (dataStart === -1) {
    throw new Error('WAV file has no data chunk')
  }

  const bytesPerSample = bitsPerSample / 8
  const frameCount = Math.floor(dataLength / bytesPerSample / channels)
  const mono = new Float32Array(frameCount)

  for (let i = 0; i < frameCount; i++) {
    let sum = 0
    for (let ch = 0; ch < channels; ch++) {
      const pos = dataStart + (i * channels + ch) * bytesPerSample
      let value: number
      if (audioFormat === 3 && bitsPerSample === 32) {
        value = buffer.readFloatLE(pos)
      } else if (bitsPerSample === 16) {
        value = buffer.readInt16LE(pos) / 32768
      } else if (bitsPerSample === 8) {
        value = (buffer.readUInt8(pos) - 128) / 128
      } else {
        throw new Error(`Unsupported WAV bit depth: ${bitsPerSample}`)
      }
      sum += value
    }
    mono[i] = sum / channels
  }

  return { sampleRate, channels: 1, samples: mono }
}

/** Simple linear-interpolation resampler. Good enough for speech. */
function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples

  const ratio = toRate / fromRate
  const outLength = Math.round(samples.length * ratio)
  const out = new Float32Array(outLength)

  for (let i = 0; i < outLength; i++) {
    const srcPos = i / ratio
    const srcIndexLow = Math.floor(srcPos)
    const srcIndexHigh = Math.min(srcIndexLow + 1, samples.length - 1)
    const frac = srcPos - srcIndexLow
    out[i] =
      samples[srcIndexLow] * (1 - frac) + samples[srcIndexHigh] * frac
  }

  return out
}

/**
 * Converts a WAV buffer (as returned by Chatterbox) into raw 16-bit PCM
 * mono bytes at the target sample rate, matching what Vapi's
 * custom-voice provider expects in the voice-request response body.
 */
export function wavToPcm16(wavBuffer: Buffer, targetSampleRate: number): Buffer {
  const decoded = decodeWav(wavBuffer)
  const resampled = resample(decoded.samples, decoded.sampleRate, targetSampleRate)

  const pcm = Buffer.alloc(resampled.length * 2)
  for (let i = 0; i < resampled.length; i++) {
    const clamped = Math.max(-1, Math.min(1, resampled[i]))
    pcm.writeInt16LE(Math.round(clamped * 32767), i * 2)
  }

  return pcm
}