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