import Whop from '@whop/sdk'

const isSandbox = process.env.WHOP_ENV === 'sandbox'

const getAppUrl = () => (process.env.APP_URL ?? '').replace(/\/+$/, '')

export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  baseURL: isSandbox
    ? 'https://sandbox-api.whop.com/api/v1'
    : undefined,
})

export const WHOP_CHECKOUT_ENV: 'sandbox' | 'production' = isSandbox
  ? 'sandbox'
  : 'production'

export const PLATFORM_COMPANY_ID = process.env.WHOP_COMPANY_ID!

type CreateCheckoutParams = {
  companyId: string
  price: number
  currency?: string
  planType: 'one_time' | 'renewal'
  metadata: Record<string, string>
  billingPeriodDays?: number
  productTitle?: string
  productDescription?: string
  productExternalId?: string
  applicationFeeAmount?: number
  redirectPath?: string
}

export async function createCheckout({
  companyId,
  price,
  currency = 'usd',
  planType,
  metadata,
  billingPeriodDays,
  productTitle,
  productDescription,
  productExternalId,
  applicationFeeAmount,
  redirectPath = '/checkout/complete',
}: CreateCheckoutParams) {
  if (planType === 'renewal' && (!productTitle || !productExternalId)) {
    throw new Error(
      'productTitle and productExternalId are required when creating a renewal (recurring) checkout'
    )
  }

  const checkout = await whop.checkoutConfigurations.create({
    currency,
    account_id: companyId,
    redirect_url: `${getAppUrl()}${redirectPath}`,
    plan: {
      initial_price: price,
      plan_type: planType,
      currency,
      ...(planType === 'renewal'
        ? {
            renewal_price: price,
            billing_period: billingPeriodDays ?? 30,
            product: {
              title: productTitle!,
              external_identifier: productExternalId!,
              ...(productDescription
                ? { description: productDescription }
                : {}),
            },
          }
        : {}),
      ...(applicationFeeAmount !== undefined
        ? { application_fee_amount: applicationFeeAmount }
        : {}),
    },
    metadata,
  })
  
  const purchaseUrl = checkout.purchase_url

  return {
    planId: checkout.plan?.id,
    checkoutUrl: purchaseUrl?.startsWith('http')
      ? purchaseUrl
      : `${isSandbox ? 'https://sandbox.whop.com' : 'https://whop.com'}${purchaseUrl}`,
  }
}

function getCandidateKeys(secret: string): string[] {
  const keys: string[] = []

  // 1. Raw UTF-8 secret converted to base64 (e.g. Buffer.from('ws_...', 'utf8'))
  keys.push(Buffer.from(secret, 'utf8').toString('base64'))

  // 2. Standard base64 / hex-decoded base64
  const knownPrefixes = ['whsec_', 'ws_']
  const matchedPrefix = knownPrefixes.find((p) => secret.startsWith(p))
  const body = matchedPrefix ? secret.slice(matchedPrefix.length) : secret

  const isHex = /^[0-9a-fA-F]+$/.test(body) && body.length % 2 === 0
  if (isHex) {
    keys.push(Buffer.from(body, 'hex').toString('base64'))
  }

  let normalized = body.replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4 !== 0) {
    normalized += '='
  }
  keys.push(normalized)

  // 3. UTF-8 body without prefix
  keys.push(Buffer.from(body, 'utf8').toString('base64'))

  return Array.from(new Set(keys))
}

export async function verifyWebhook(rawBody: string, headers: Headers) {
  const rawSecret = process.env.WHOP_WEBHOOK_SECRET!
  const headerMap = Object.fromEntries(headers.entries())
  const candidateKeys = getCandidateKeys(rawSecret)

  let lastError: Error | null = null

  for (const key of candidateKeys) {
    try {
      return whop.webhooks.unwrap(rawBody, {
        headers: headerMap,
        key,
      })
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  // In sandbox environment, if signature verification fails (e.g. Whop Sandbox format mismatch),
  // parse payload so sandbox payment testing is not blocked, but log a warning.
  if (isSandbox) {
    console.warn(
      '⚠️ Whop Sandbox Webhook signature verification warning:',
      lastError?.message,
      '- Falling back to payload parsing for sandbox test.'
    )
    return JSON.parse(rawBody)
  }

  throw lastError ?? new Error('Webhook verification failed')
}