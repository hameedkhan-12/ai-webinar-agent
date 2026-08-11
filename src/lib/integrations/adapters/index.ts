/**
 * Adapter index — maps integration IDs to their adapter implementations.
 * When adding a new integration, import its adapter and add it here.
 */

import { IntegrationAdapter } from '../types'
import { hubspotAdapter } from './hubspot'
import { activecampaignAdapter } from './activecampaign'
import { mailchimpAdapter } from './mailchimp'
import { zapierAdapter } from './zapier'
import { gohighlevelAdapter } from './gohighlevel'
import { convertkitAdapter } from './convertkit'
import { slackAdapter } from './slack'
import { googleSheetsAdapter } from './google-sheets'

export const ADAPTERS: Record<string, IntegrationAdapter> = {
  hubspot: hubspotAdapter,
  activecampaign: activecampaignAdapter,
  mailchimp: mailchimpAdapter,
  zapier: zapierAdapter,
  gohighlevel: gohighlevelAdapter,
  convertkit: convertkitAdapter,
  slack: slackAdapter,
  'google-sheets': googleSheetsAdapter,
}

export function getAdapter(integrationId: string): IntegrationAdapter | undefined {
  return ADAPTERS[integrationId]
}
