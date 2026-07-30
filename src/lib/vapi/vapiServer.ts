import jwt from 'jsonwebtoken'
import { VapiClient } from '@vapi-ai/server-sdk'

const createVapiToken = () => {
  const payload = {
    orgId: process.env.VAPI_ORG_ID,
    token: {
      // This is the scope of the token
      tag: 'private',
    },
  }

  const key = process.env.VAPI_PRIVATE_KEY!

  const options = {
    expiresIn: '1h',
  }

  return jwt.sign(payload, key, options)
}

export const getVapiServer = () => {
  const token = createVapiToken()
  return new VapiClient({ token })
}
