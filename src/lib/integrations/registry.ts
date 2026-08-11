/**
 * Integration Registry
 *
 * Master list of every integration this platform supports.
 * To add a new integration: add an entry here + a matching adapter file.
 * Nothing else needs to change.
 */

import { IntegrationMeta } from './types'

export const INTEGRATIONS: IntegrationMeta[] = [
  // ── CRM ───────────────────────────────────────────────────────────────────
  {
    id: 'hubspot',
    name: 'HubSpot',
    description:
      'Sync webinar attendees directly into HubSpot CRM as contacts. Automatically tag by funnel stage, call status, and webinar attended.',
    tagline: 'CRM, Marketing & Sales',
    category: 'CRM',
    color: '#FF7A59',
    iconUrl: 'hubspot',
    available: true,
    features: ['Auto-create contacts', 'Funnel stage tags', 'Deal pipeline sync'],
    configFields: [
      {
        key: 'accessToken',
        label: 'Private App Token',
        type: 'password',
        placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: true,
        hint: 'Create a Private App in HubSpot → Settings → Integrations → Private Apps',
      },
      {
        key: 'portalId',
        label: 'Portal ID',
        type: 'text',
        placeholder: '12345678',
        required: true,
        hint: 'Found in HubSpot URL: app.hubspot.com/contacts/{portalId}',
      },
    ],
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    description:
      'Push leads to GoHighLevel contacts and trigger workflow automations based on webinar attendance and call outcomes.',
    tagline: 'All-in-one CRM & Automation',
    category: 'CRM',
    color: '#1F8BFF',
    iconUrl: 'gohighlevel',
    available: true,
    features: ['Contact sync', 'Tag automation', 'Workflow triggers'],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-gohighlevel-api-key',
        required: true,
        hint: 'GoHighLevel → Settings → API Key',
      },
      {
        key: 'locationId',
        label: 'Location ID',
        type: 'text',
        placeholder: 'abc123xyz',
        required: true,
        hint: 'Found in GoHighLevel → Settings → Business Profile',
      },
    ],
  },

  // ── EMAIL ─────────────────────────────────────────────────────────────────
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    description:
      'Subscribe attendees to lists and trigger automations based on webinar behavior — registered, attended, clicked CTA, or completed AI call.',
    tagline: 'Email & Marketing Automation',
    category: 'EMAIL',
    color: '#356AE6',
    iconUrl: 'activecampaign',
    available: true,
    features: ['List subscribe', 'Automation triggers', 'Behavioral tagging'],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        hint: 'ActiveCampaign → Settings → Developer → API Key',
      },
      {
        key: 'apiUrl',
        label: 'Account URL',
        type: 'url',
        placeholder: 'https://youraccountname.api-us1.com',
        required: true,
        hint: 'Found in ActiveCampaign → Settings → Developer',
      },
      {
        key: 'listId',
        label: 'List ID (optional)',
        type: 'text',
        placeholder: '1',
        required: false,
        hint: 'Leave blank to use the default list',
      },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description:
      'Add webinar registrants to your Mailchimp audience. Apply tags based on attendance, engagement, and AI call outcomes.',
    tagline: 'Email Marketing',
    category: 'EMAIL',
    color: '#FFE01B',
    iconUrl: 'mailchimp',
    available: true,
    features: ['Audience sync', 'Tag management', 'Merge field updates'],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1',
        required: true,
        hint: 'Mailchimp → Account → Extras → API Keys',
      },
      {
        key: 'audienceId',
        label: 'Audience / List ID',
        type: 'text',
        placeholder: 'abc123def',
        required: true,
        hint: 'Mailchimp → Audience → Settings → Audience ID',
      },
      {
        key: 'serverPrefix',
        label: 'Server Prefix',
        type: 'text',
        placeholder: 'us1',
        required: true,
        hint: 'The last part of your API key after the dash (e.g. us1)',
      },
    ],
  },
  {
    id: 'convertkit',
    name: 'ConvertKit',
    description:
      'Subscribe attendees to sequences and apply tags in ConvertKit based on webinar funnel stage and AI call outcome.',
    tagline: 'Email for Creators',
    category: 'EMAIL',
    color: '#FB6970',
    iconUrl: 'convertkit',
    available: true,
    features: ['Subscriber sync', 'Sequence enrollment', 'Tag triggers'],
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        hint: 'ConvertKit → Settings → Advanced → API Key',
      },
      {
        key: 'formId',
        label: 'Form ID (optional)',
        type: 'text',
        placeholder: '1234567',
        required: false,
        hint: 'Subscribe attendees to a specific form/sequence',
      },
    ],
  },

  // ── AUTOMATION ────────────────────────────────────────────────────────────
  {
    id: 'zapier',
    name: 'Zapier',
    description:
      'Send webinar lead events to any Zapier Webhook. Connect 5,000+ apps — Notion, Google Sheets, Slack, Salesforce, and more.',
    tagline: 'Universal Automation Bridge',
    category: 'AUTOMATION',
    color: '#FF4A00',
    iconUrl: 'zapier',
    available: true,
    features: ['Webhook push on every event', '5,000+ app connections', 'Custom payload'],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Zapier Webhook URL',
        type: 'url',
        placeholder: 'https://hooks.zapier.com/hooks/catch/your-zap-id/your-hook-token/',
        required: true,
        hint: 'Create a Zap → Trigger: Webhooks by Zapier → Catch Hook → copy URL here',
      },
      {
        key: 'secret',
        label: 'Shared Secret (optional)',
        type: 'password',
        placeholder: 'my-secret-token',
        required: false,
        hint: 'Sent as X-Webhook-Secret header for verification on the Zapier side',
      },
    ],
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Get real-time Slack notifications whenever someone registers, joins your webinar, clicks your CTA, or completes an AI sales call.',
    tagline: 'Team Notifications',
    category: 'NOTIFICATIONS',
    color: '#4A154B',
    iconUrl: 'slack',
    available: true,
    features: ['Registration alerts', 'CTA click pings', 'Call completion updates'],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Slack Incoming Webhook URL',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/your-team-id/your-bot-id/your-webhook-token',
        required: true,
        hint: 'Create an Incoming Webhook at api.slack.com/apps → Incoming Webhooks',
      },
      {
        key: 'channel',
        label: 'Channel (optional)',
        type: 'text',
        placeholder: '#sales-alerts',
        required: false,
        hint: 'Override the default channel for this webhook',
      },
    ],
  },

  // ── SPREADSHEETS ─────────────────────────────────────────────────────────
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description:
      'Append every webinar lead as a new row in a Google Sheet. Includes name, email, webinar, funnel stage, call status, and timestamp.',
    tagline: 'Spreadsheet Logging',
    category: 'SPREADSHEETS',
    color: '#34A853',
    iconUrl: 'google-sheets',
    available: true,
    features: ['Auto-append rows', 'Full lead data', 'Webhook-driven'],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Apps Script Web App URL',
        type: 'url',
        placeholder: 'https://script.google.com/macros/s/XXXXXXXXXX/exec',
        required: true,
        hint: 'Deploy a Google Apps Script Web App to receive POST requests and append rows',
      },
      {
        key: 'sheetName',
        label: 'Sheet Name (optional)',
        type: 'text',
        placeholder: 'Sheet1',
        required: false,
        hint: 'Which tab to append rows to (defaults to Sheet1)',
      },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getIntegration(id: string): IntegrationMeta | undefined {
  return INTEGRATIONS.find((i) => i.id === id)
}

export function getIntegrationsByCategory(
  category: IntegrationMeta['category'],
): IntegrationMeta[] {
  return INTEGRATIONS.filter((i) => i.category === category)
}

export const INTEGRATION_CATEGORIES: IntegrationMeta['category'][] = [
  'CRM',
  'EMAIL',
  'AUTOMATION',
  'NOTIFICATIONS',
  'SPREADSHEETS',
]
