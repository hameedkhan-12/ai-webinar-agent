import jwt from 'jsonwebtoken'
import { VapiClient } from '@vapi-ai/server-sdk'

const createVapiToken = () => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  // Back-date iat slightly to tolerate small clock drift between this
  // machine and Vapi's validation server (fixes intermittent
  // "token used before issue at (iat)" errors).
  const issuedAt = nowInSeconds - 10

  const payload = {
    orgId: process.env.VAPI_ORG_ID,
    token: {
      // This is the scope of the token
      tag: 'private',
    },
    iat: issuedAt,
    // Vapi rejects tokens with an expiry more than 1 hour out. Using a
    // slightly shorter window (55 minutes) leaves a safety margin for
    // clock skew/latency between signing here and validation on Vapi's
    // side, which was otherwise causing intermittent 401s.
    exp: issuedAt + 55 * 60,
  }

  const key = process.env.VAPI_PRIVATE_KEY!

  return jwt.sign(payload, key)
}

export const getVapiServer = () => {
  const token = createVapiToken()
  return new VapiClient({ token })
}