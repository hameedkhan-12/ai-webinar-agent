/**
 * Shared types for the integration registry + adapter system.
 *
 * To add a new integration:
 * 1. Add an entry to registry.ts
 * 2. Create an adapter file in adapters/
 * Zero changes needed here or in UI/actions.
 */

// ── Categories ───────────────────────────────────────────────────────────────

export type IntegrationCategory =
  | 'CRM'
  | 'EMAIL'
  | 'AUTOMATION'
  | 'NOTIFICATIONS'
  | 'SPREADSHEETS'

// ── Config field descriptor (drives the dynamic form in the UI) ──────────────

export interface IntegrationConfigField {
  /** Machine-readable key stored in the config JSON blob */
  key: string
  /** Human-readable label shown in the form */
  label: string
  /** Input type */
  type: 'text' | 'password' | 'url' | 'email' | 'select'
  placeholder?: string
  /** Whether this field must be filled before connecting */
  required: boolean
  /** Options for type=select */
  options?: { label: string; value: string }[]
  /** Help text shown below the field */
  hint?: string
}

// ── Registry entry (metadata only — no secrets) ──────────────────────────────

export interface IntegrationMeta {
  /** Unique slug stored in DB (UserIntegration.integrationId) */
  id: string
  name: string
  description: string
  /** Tagline shown on the card */
  tagline: string
  category: IntegrationCategory
  /** Hex brand color */
  color: string
  /** SVG icon component path or external URL — we embed SVG inline */
  iconUrl: string
  /** Fields the user must fill to connect */
  configFields: IntegrationConfigField[]
  /** Whether this integration is generally available */
  available: boolean
  /** Short comma-separated list of features */
  features: string[]
}

// ── Lead payload sent to every adapter on sync ───────────────────────────────

export interface LeadSyncPayload {
  attendeeId: string
  attendeeEmail: string
  attendeeName: string
  webinarId: string
  webinarTitle: string
  /** The funnel stage at the time of sync */
  attendedType: string
  callStatus: string
  tags: string[]
  syncedAt: Date
}

// ── Adapter interface every integration must implement ───────────────────────

export interface IntegrationAdapter {
  /**
   * Push a lead/contact into the external platform.
   * `config` is the raw JSON from UserIntegration.config.
   * Should throw a descriptive Error on failure.
   */
  syncLead(payload: LeadSyncPayload, config: Record<string, string>): Promise<void>

  /**
   * Validate credentials without syncing real data.
   * Returns { ok: true } or { ok: false, error: string }
   */
  testConnection(config: Record<string, string>): Promise<{ ok: boolean; error?: string }>
}
