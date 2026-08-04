'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, LucideCheckCircle2, LucideAlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { saveWhopCompanyId } from '@/actions/whop'

type Props = {
  userId: string
  currentCompanyId: string | null
}

const WhopConnectForm = ({ userId, currentCompanyId }: Props) => {
  const [companyId, setCompanyId] = useState(currentCompanyId ?? '')
  const [saved, setSaved] = useState(!!currentCompanyId)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await saveWhopCompanyId(userId, companyId)
      if (!res.success) {
        throw new Error(res.message || 'Failed to save')
      }
      setSaved(true)
      toast.success('Whop company connected successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="my-6 p-4 bg-muted rounded-md">
        <div className="flex items-start">
          {saved ? (
            <LucideCheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3 shrink-0" />
          ) : (
            <LucideAlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {saved
                ? 'Your Whop business is connected'
                : 'Your Whop business is not connected yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {saved
                ? 'You can now accept payments through your webinars'
                : 'Connect your Whop company ID to start processing BUY_NOW payments'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value)
            setSaved(false)
          }}
          placeholder="biz_xxxxxxxxxxxxxx"
          className="flex-1"
        />
        <Button
          onClick={handleSave}
          disabled={loading || !companyId.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            'Update'
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </div>
  )
}

export default WhopConnectForm