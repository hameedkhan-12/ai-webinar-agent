import Whop from '@whop/sdk'

// WHOP_ENV switches the whole app between sandbox and production.
// Set WHOP_ENV=sandbox (with a sandbox WHOP_API_KEY) on demo/preview
// deployments only — never on the live production deployment, or real
// checkouts will silently start hitting Whop's sandbox instead of taking
// real payments.
const isSandbox = process.env.WHOP_ENV === 'sandbox'

export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  // NOTE: must be `baseURL` (capital URL) — `baseUrl` is silently ignored
  // by the SDK and it will fall back to production, causing a sandbox key
  // to fail with 401s. The /api/v1 suffix is required too.
  baseURL: isSandbox
    ? 'https://sandbox-api.whop.com/api/v1'
    : undefined,
})

// Use this on the client (or wherever the checkout link/embed is rendered)
// to know which Whop environment the current deployment is pointed at.
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
}: CreateCheckoutParams) {
  if (planType === 'renewal' && (!productTitle || !productExternalId)) {
    throw new Error(
      'productTitle and productExternalId are required when creating a renewal (recurring) checkout'
    )
  }

  const checkout = await whop.checkoutConfigurations.create({
    currency,
    account_id: companyId,
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

  return {
    planId: checkout.plan?.id,
    checkoutUrl: isSandbox
      ? `https://sandbox.whop.com/checkout/${checkout.plan?.id}`
      : `https://whop.com/checkout/${checkout.plan?.id}`,
  }
}

export async function verifyWebhook(rawBody: string, headers: Headers) {
  return whop.webhooks.unwrap(rawBody, {
    headers: Object.fromEntries(headers.entries()),
    key: process.env.WHOP_WEBHOOK_SECRET!,
  })
}