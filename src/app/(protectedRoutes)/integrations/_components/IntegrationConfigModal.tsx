'use client'

import { useState, useTransition } from 'react'
import { IntegrationMeta, IntegrationConfigField } from '@/lib/integrations/types'
import {
  saveIntegration,
  deleteIntegration,
  testIntegrationConnection,
  toggleIntegration,
} from '@/actions/integrations'
import { toast } from 'sonner'
import { IntegrationIcon } from './IntegrationIcon'
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Zap,
  ExternalLink,
} from 'lucide-react'

type Props = {
  integration: IntegrationMeta
  userId: string
  existingConfig: Record<string, string> | null
  isEnabled: boolean
  onClose: () => void
  onSaved: () => void
}

export function IntegrationConfigModal({
  integration,
  userId,
  existingConfig,
  isEnabled,
  onClose,
  onSaved,
}: Props) {
  const [config, setConfig] = useState<Record<string, string>>(existingConfig ?? {})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [isSaving, startSave] = useTransition()
  const [isTesting, startTest] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  const isConnected = !!existingConfig

  const handleFieldChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setTestResult(null)
  }

  const handleTest = () => {
    startTest(async () => {
      setTestResult(null)
      const result = await testIntegrationConnection(integration.id, config)
      setTestResult(result)
    })
  }

  const handleSave = () => {
    startSave(async () => {
      const { error } = await saveIntegration(userId, { integrationId: integration.id, config })
      if (error) {
        toast.error(error)
      } else {
        toast.success(`${integration.name} connected successfully!`)
        onSaved()
        onClose()
      }
    })
  }

  const handleDelete = () => {
    startDelete(async () => {
      const { error } = await deleteIntegration(userId, integration.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success(`${integration.name} disconnected`)
        onSaved()
        onClose()
      }
    })
  }

  const renderField = (field: IntegrationConfigField) => {
    const value = config[field.key] ?? ''
    const isPasswordVisible = showPassword[field.key]
    const inputType =
      field.type === 'password' ? (isPasswordVisible ? 'text' : 'password') : field.type

    return (
      <div key={field.key} className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-red-400">*</span>}
        </label>

        <div className="relative">
          {field.type === 'select' ? (
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            >
              <option value="">Select…</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition pr-10"
            />
          )}

          {field.type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword((p) => ({ ...p, [field.key]: !p[field.key] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header with brand color accent */}
        <div
          className="px-6 pt-6 pb-5 border-b border-border"
          style={{
            background: `linear-gradient(135deg, ${integration.color}18 0%, transparent 60%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${integration.color}20`, border: `1.5px solid ${integration.color}40` }}
              >
                <IntegrationIcon id={integration.iconUrl} color={integration.color} size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{integration.name}</h2>
                <p className="text-xs text-muted-foreground">{integration.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-secondary transition text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isConnected && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Currently connected</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {integration.configFields.map(renderField)}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mx-6 mb-4 rounded-lg px-4 py-3 flex items-start gap-2 text-sm ${testResult.ok
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
            {testResult.ok
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>{testResult.ok ? 'Connection successful! Ready to save.' : testResult.error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: integration.color }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isConnected ? 'Update' : 'Connect'}
            </button>
          </div>

          {isConnected && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Disconnect {integration.name}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
