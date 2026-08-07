import jwt from 'jsonwebtoken'
import { VapiClient } from '@vapi-ai/server-sdk'

const createVapiToken = () => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const issuedAt = nowInSeconds - 10

  const payload = {
    orgId: process.env.VAPI_ORG_ID,
    token: {
      // This is the scope of the token
      tag: 'private',
    },
    iat: issuedAt,
    exp: issuedAt + 55 * 60,
  }

  const key = process.env.VAPI_PRIVATE_KEY!

  return jwt.sign(payload, key)
}

export const getVapiServer = () => {
  const token = createVapiToken()
  return new VapiClient({ token })
}