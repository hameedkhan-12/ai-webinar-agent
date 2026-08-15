import { Resend } from 'resend'

const globalForResend = globalThis as unknown as { resend?: Resend }

function createResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY environment variable is required to send follow-up emails.'
    )
  }

  return new Resend(apiKey)
}

export const resend = globalForResend.resend ?? (globalForResend.resend = createResendClient())

if (process.env.NODE_ENV !== 'production') {
  globalForResend.resend = resend
}

/** Sender address - must be a verified domain in your Resend account. */
export const FOLLOW_UP_FROM_ADDRESS =
  process.env.FOLLOW_UP_FROM_ADDRESS || 'onboarding@resend.dev'
