'use client'
import { changeCallStatus } from '@/actions/attendance'
import { createCheckoutLink } from '@/actions/whop'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CallStatusEnum } from '@/generated/prisma/enums'
import { WebinarWithPresenter } from '@/lib/type'
import { cn } from '@/lib/utils'
import { vapi } from '@/lib/vapi/vapiclient'
import { buildEngagementCallOverrides } from '@/lib/vapi/buildCallOverrides'
import { Bot, Clock, Loader2, Mic, MicOff, PhoneOff } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const CallStatus = {
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
}

type Props = {
  userName?: string
  assistantId: string
  assistantName?: string
  callTimeLimit?: number
  webinar: WebinarWithPresenter
  userId: string
  engagementSummary?: string
}

const AutoConnectCall = ({
  userName = 'User',
  assistantId,
  assistantName = 'Ai Assistant',
  callTimeLimit = 3000,
  webinar,
  userId,
  engagementSummary,
}: Props) => {
  const [callStatus, setCallStatus] = useState(CallStatus.CONNECTING)
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false)
  const [userIsSpeaking, setUserIsSpeaking] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(callTimeLimit)

  const refs = useRef({
    countdownTimer: undefined as NodeJS.Timeout | undefined,
    audioStream: null as MediaStream | null,
    userSpeakingTimeout: undefined as NodeJS.Timeout | undefined,
  })

  // Identifies the current call attempt. Incremented every time we start
  // a new call session. Event handlers compare against this to ignore
  // stale events from a previous, already-torn-down session - this is
  // what prevents React Strict Mode's dev-only mount->cleanup->mount
  // cycle from leaking a late 'call-end' from the aborted first attempt
  // into the real session's listeners.
  const callSessionRef = useRef(0)
  // True once vapi.start() has actually been called for this component
  // instance - guards against Strict Mode's synthetic second mount
  // calling vapi.start() a second time on the shared singleton client.
  const hasStartedRef = useRef(false)
  // Holds a deferred teardown scheduled by the mount effect's cleanup.
  // If the component remounts almost immediately after (Strict Mode's
  // dev-only fake unmount), the new mount cancels this before it runs,
  // so the one real call session survives. A genuine unmount (navigating
  // away) isn't followed by a remount, so the teardown actually executes.
  const pendingStopRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Keep latest values in refs so the requestAnimationFrame loop in
  // checkAudioLevel (started once in setupAudio) always reads current
  // state instead of the stale values from its original closure.
  const assistantIsSpeakingRef = useRef(assistantIsSpeaking)
  const isMicMutedRef = useRef(isMicMuted)

  useEffect(() => {
    assistantIsSpeakingRef.current = assistantIsSpeaking
  }, [assistantIsSpeaking])

  useEffect(() => {
    isMicMutedRef.current = isMicMuted
  }, [isMicMuted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const cleanup = () => {
    if (refs.current.countdownTimer) {
      clearInterval(refs.current.countdownTimer)
      refs.current.countdownTimer = undefined
    }

    if (refs.current.userSpeakingTimeout) {
      clearTimeout(refs.current.userSpeakingTimeout)
      refs.current.userSpeakingTimeout = undefined
    }

    if (refs.current.audioStream) {
      refs.current.audioStream.getTracks().forEach((track) => track.stop())
      refs.current.audioStream = null
    }
  }

  const setupAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      refs.current.audioStream = stream

      // Simple speech detection using AudioContext
      const audioContext = new (window.AudioContext || window.AudioContext)()
      const analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256

      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyzer)

      // Monitor audio levels
      const checkAudioLevel = () => {
        const dataArray = new Uint8Array(analyzer.frequencyBinCount)
        analyzer.getByteFrequencyData(dataArray)

        // Calculate average volume
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        const normalizedVolume = average / 256

        // Detect speech based on volume
        if (
          normalizedVolume > 0.15 &&
          !assistantIsSpeakingRef.current &&
          !isMicMutedRef.current
        ) {
          setUserIsSpeaking(true)

          // Clear previous timeout
          if (refs.current.userSpeakingTimeout) {
            clearTimeout(refs.current.userSpeakingTimeout)
          }

          // Reset after short delay
          refs.current.userSpeakingTimeout = setTimeout(() => {
            setUserIsSpeaking(false)
          }, 500)
        }

        // Continue monitoring
        requestAnimationFrame(checkAudioLevel)
      }

      checkAudioLevel()
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  const stopCall = async () => {
    try {
      vapi.stop()
      setCallStatus(CallStatus.FINISHED)
      cleanup()
      const res = await changeCallStatus(userId, webinar.id, CallStatusEnum.COMPLETED)
      if (!res.success) {
        throw new Error('Failed to update call status')
      }
      toast.success('Call ended successfully')
    } catch (error) {
      console.error('Failed to stop call:', error)
      toast.error('Failed to stop call. Please try again.')
    }
  }

  const toggleMicMute = () => {
    if (refs.current.audioStream) {
      refs.current.audioStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicMuted // Toggle from current state
      })
    }
    setIsMicMuted(!isMicMuted)
  }

  const checkoutLink = async () => {
    try {
      if (!webinar?.price || !webinar?.presenter?.whopCompanyId) {
        return toast.error('No price or connected Whop business found')
      }
      const session = await createCheckoutLink(
        Number(webinar.price.toString()),
        webinar?.presenter?.whopCompanyId,
        userId,
        webinar.id
      )
      if (!session.sessionUrl) {
        throw new Error('Session ID not found in response')
      }

      window.open(session.sessionUrl, '_blank')
    } catch (error) {
      console.error('Error creating checkout link', error)
      toast.error('Failed to create checkout session. Please try again.')
    }
  }

  const startCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING)
      const overrides = buildEngagementCallOverrides(engagementSummary)
      await vapi.start(assistantId, overrides)
      const res = await changeCallStatus(userId, webinar.id, CallStatusEnum.InProgress)
      if (!res.success) {
        throw new Error('Failed to update call status')
      }
      toast.success('Call started successfully')
    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error('Failed to start call. Please try again.')
      setCallStatus(CallStatus.FINISHED)
    }
  }

  // Call setup & cleanup
  useEffect(() => {
    if (pendingStopRef.current) {
      clearTimeout(pendingStopRef.current)
      pendingStopRef.current = undefined
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      callSessionRef.current += 1
      startCall()
    }

    return () => {
      // Defer the real teardown by a tick. If this was Strict Mode's
      // synthetic unmount, the effect above will run again almost
      // immediately and cancel this before it fires. If it's a genuine
      // unmount (navigating away), nothing cancels it and it runs.
      pendingStopRef.current = setTimeout(() => {
        vapi.stop()
        cleanup()
        hasStartedRef.current = false
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array means this runs once on mount

  useEffect(() => {
    const onCallStart = async () => {
      console.log('Call started')
      setCallStatus(CallStatus.ACTIVE)
      setupAudio()

      // Start countdown timer from 3 minutes
      setTimeRemaining(callTimeLimit)
      refs.current.countdownTimer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(refs.current.countdownTimer)
            stopCall()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    const onCallEnd = () => {
      console.log('Call ended')
      setCallStatus(CallStatus.FINISHED)
      cleanup()
      changeCallStatus(userId, webinar.id, CallStatusEnum.COMPLETED).catch(
        (error) => {
          console.error('Failed to update call status on call-end:', error)
        }
      )
    }

    const onSpeechStart = () => {
      setAssistantIsSpeaking(true)
    }

    const onSpeechEnd = () => {
      setAssistantIsSpeaking(false)
    }

    const onError = (error: Error) => {
      console.error('Vapi error:', error)
      setCallStatus(CallStatus.FINISHED)
      cleanup()
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('error', onError)

    return () => {
      vapi.off('call-start', onCallStart)
      vapi.off('call-end', onCallEnd)
      vapi.off('speech-start', onSpeechStart)
      vapi.off('speech-end', onSpeechEnd)
      vapi.off('error', onError)
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, callTimeLimit])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative">
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg relative">
          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10">
            <Mic
              className={cn(
                'h-4 w-4',
                assistantIsSpeaking ? 'text-accent-primary' : ''
              )}
            />
            <span>{assistantName}</span>
          </div>

          <div className="h-full flex items-center justify-center">
            <div className="relative">
              {assistantIsSpeaking && (
                <>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-accent-primary animate-ping opacity-20"
                    style={{ margin: '-8px' }}
                  />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-accent-primary animate-ping opacity-10"
                    style={{ margin: '-16px', animationDelay: '0.5s' }}
                  />
                </>
              )}

              <div
                className={cn(
                  'flex justify-center items-center rounded-full overflow-hidden border-4 p-6',
                  assistantIsSpeaking
                    ? 'border-accent-primary'
                    : 'border-accent-secondary/50'
                )}
              >
                <Bot className="w-[70px] h-[70px]" />
              </div>

              {assistantIsSpeaking && (
                <div className="absolute -bottom-2 -right-2 bg-accent-primary text-white p-2 rounded-full">
                  <Mic className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg relative">
          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10">
            {isMicMuted ? (
              <>
                <MicOff className="h-4 w-4 text-destructive" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Mic
                  className={cn(
                    'h-4 w-4',
                    userIsSpeaking ? 'text-accent-secondary' : ''
                  )}
                />
                <span>{userName}</span>
              </>
            )}
          </div>

          <div className="absolute top-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <div className="h-full flex items-center justify-center">
            <div className="relative">
              {userIsSpeaking && !isMicMuted && (
                <>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-accent-secondary animate-ping opacity-20"
                    style={{ margin: '-8px' }}
                  />
                </>
              )}

              <div
                className={cn(
                  'flex justify-center items-center rounded-full overflow-hidden border-4',
                  isMicMuted
                    ? 'border-destructive/50'
                    : userIsSpeaking
                    ? 'border-accent-secondary'
                    : 'border-accent-secondary/50'
                )}
              >
                <Avatar className="w-[100px] h-[100px]">
                  <AvatarImage
                    src="/user-avatar.png"
                    alt={userName}
                  />
                  <AvatarFallback>{userName.split('')?.[0]}</AvatarFallback>
                </Avatar>
              </div>

              {isMicMuted && (
                <div className="absolute -bottom-2 -right-2 bg-destructive text-white p-2 rounded-full">
                  <MicOff className="h-5 w-5" />
                </div>
              )}

              {userIsSpeaking && !isMicMuted && (
                <div className="absolute -bottom-2 -right-2 bg-accent-secondary text-white p-2 rounded-full">
                  <Mic className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        </div>

        {callStatus === CallStatus.CONNECTING && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center flex-col gap-4 z-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
            <h3 className="text-xl font-medium">Connecting...</h3>
          </div>
        )}

        {callStatus === CallStatus.FINISHED && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center flex-col gap-4 z-20">
            <h3 className="text-xl font-medium">Call Ended</h3>
            <p className="text-muted-foreground">Time limit reached</p>
          </div>
        )}
      </div>

      <div className="bg-card border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {callStatus === CallStatus.ACTIVE && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span
                  className={cn(
                    'text-sm font-medium',
                    timeRemaining < 30
                      ? 'text-destructive animate-pulse'
                      : timeRemaining < 60
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatTime(timeRemaining)} remaining
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleMicMute}
              className={cn(
                'p-3 rounded-full transition-all',
                isMicMuted
                  ? 'bg-destructive text-primary'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              )}
              disabled={callStatus !== CallStatus.ACTIVE}
            >
              {isMicMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>

            <button
              onClick={stopCall}
              className="p-3 rounded-full bg-destructive text-primary hover:bg-destructive/90 transition-all"
              aria-label="End call"
              disabled={callStatus !== CallStatus.ACTIVE}
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>

          <Button
            onClick={checkoutLink}
            variant={'outline'}
          >
            Buy Now
          </Button>

          <div className="hidden md:block">
            {callStatus === CallStatus.ACTIVE && timeRemaining < 30 && (
              <span className="text-destructive font-medium">
                Call ending soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoConnectCall