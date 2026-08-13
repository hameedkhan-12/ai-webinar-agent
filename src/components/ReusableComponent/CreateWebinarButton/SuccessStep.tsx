import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Copy, ExternalLink, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  webinarLink: string
  onCreateNew?: () => void
}

const SuccessStep = ({ webinarLink, onCreateNew }: Props) => {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webinarLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative space-y-6 px-6 py-8 text-center">
      <div className="flex items-center justify-center">
        <div className="rounded-full bg-emerald-500 p-2">
          <Check className="h-6 w-6 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Your webinar has been created</h2>
      <p className="text-muted-foreground">
        You can share the link with your viewers for them to join
      </p>
      <div className="mx-auto mt-4 flex max-w-md">
        <Input
          value={webinarLink}
          readOnly
          className="rounded-r-none border-border bg-background"
        />
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="rounded-l-none border-l-0 border-border"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-4 flex justify-center">
        <Link href={webinarLink} target="_blank">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview Webinar
          </Button>
        </Link>
      </div>
      {onCreateNew && (
        <div className="mt-8">
          <Button onClick={onCreateNew} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Another Webinar
          </Button>
        </div>
      )}
    </div>
  )
}

export default SuccessStep
