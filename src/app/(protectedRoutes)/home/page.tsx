import React from 'react'
import OnBoarding from './_components/OnBoarding'
import {
  Video,
  Mic,
  Users,
  TrendingUp,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ArrowRight,
  PlusCircle,
  BarChart3,
} from 'lucide-react'
import FeatureCard from './_components/FeatureCard'
import FeatureSectionLayout from './_components/FeatureSectionLayout'
import UserInfoCard from '@/components/ReusableComponent/UserInfoCard'
import { onAuthenticateUser } from '@/actions/auth'
import { getDashboardMetrics } from '@/actions/attendance'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const checkUser = await onAuthenticateUser()
  if (!checkUser.user) {
    redirect('/')
  }

  const metricsResponse = await getDashboardMetrics(checkUser.user.id)
  const metrics = metricsResponse.data || {
    totalWebinars: 0,
    totalLeads: 0,
    completedCalls: 0,
    inProgressCalls: 0,
    conversionRate: 0,
    registeredCount: 0,
    attendedCount: 0,
    recentAttendances: [],
  }

  return (
    <div className="w-full mx-auto h-full space-y-10 pb-12">
      {/* Top Banner & Hero Section */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-gradient-to-r from-card/80 via-card/50 to-accent-primary/10 p-6 md:p-8 rounded-2xl border border-border/60 backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="space-y-4 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Spotlight AI Dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Welcome back, <span className="text-accent-primary">{checkUser.user.name}</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Track live attendee conversions, manage AI voice agents, and maximize lead engagements across all your webinars.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/webinars">
              <Button className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-2 font-medium">
                <PlusCircle className="w-4 h-4" /> Create Webinar
              </Button>
            </Link>
            <Link href="/ai-agents">
              <Button variant="outline" className="border-border/80 gap-2">
                <Mic className="w-4 h-4 text-accent-primary" /> AI Voice Agents
              </Button>
            </Link>
          </div>
        </div>

        <div className="z-10 w-full lg:w-auto">
          <OnBoarding />
        </div>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl space-y-3 hover:border-accent-primary/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Webinars</span>
            <div className="p-2.5 rounded-lg bg-accent-primary/10 text-accent-primary">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">{metrics.totalWebinars}</p>
            <p className="text-xs text-muted-foreground">Active hosted webinars</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl space-y-3 hover:border-blue-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Captured Leads</span>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">{metrics.totalLeads}</p>
            <p className="text-xs text-muted-foreground">Registered webinar attendees</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl space-y-3 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed AI Calls</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-emerald-400">{metrics.completedCalls}</p>
            <p className="text-xs text-muted-foreground">Successful breakout interactions</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl space-y-3 hover:border-purple-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Call Conversion Rate</span>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-purple-400">{metrics.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Lead completion percentage</p>
          </div>
        </div>
      </div>

      {/* Main Analytics & Recent Customers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Real Lead Conversion Progress */}
        <FeatureSectionLayout
          heading="Funnel Conversion Progress"
          link="/lead"
        >
          <div className="p-6 rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Registered Attendees</span>
                <span className="text-foreground font-semibold">{metrics.registeredCount}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalLeads > 0 ? (metrics.registeredCount / metrics.totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Live Webinar Attendees</span>
                <span className="text-foreground font-semibold">{metrics.attendedCount}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalLeads > 0 ? (metrics.attendedCount / metrics.totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Completed Breakout AI Calls</span>
                <span className="text-emerald-400 font-semibold">{metrics.completedCalls}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalLeads > 0 ? (metrics.completedCalls / metrics.totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Active in-call breakout sessions</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {metrics.inProgressCalls} Active
              </span>
            </div>
          </div>
        </FeatureSectionLayout>

        {/* Right: Live Recent Customers Feed */}
        <FeatureSectionLayout
          heading="Recent Lead Registrations"
          link="/lead"
        >
          <div className="flex flex-col gap-4 w-full">
            {metrics.recentAttendances.length > 0 ? (
              metrics.recentAttendances.slice(0, 3).map((item) => (
                <UserInfoCard
                  key={item.id}
                  customer={{
                    id: item.attendeeId,
                    name: item.name,
                    email: item.email,
                    createdAt: item.createdAt,
                    updatedAt: item.createdAt,
                  }}
                  tags={item.tags.length > 0 ? item.tags : [item.webinarTitle]}
                />
              ))
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-border/60 text-center space-y-3 bg-card/20">
                <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">No customer registrations yet</p>
                <p className="text-xs text-muted-foreground">
                  When attendees register for your webinars, they will appear here in real time.
                </p>
              </div>
            )}
          </div>
        </FeatureSectionLayout>
      </div>

      {/* Feature Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          Icon={<Video className="w-9 h-9 text-accent-primary" />}
          heading="Manage & Schedule Live Webinars"
          link="/webinars"
        />
        <FeatureCard
          Icon={<Mic className="w-9 h-9 text-accent-primary" />}
          heading="Configure Custom AI Voice Cloning"
          link="/ai-agents"
        />
      </div>
    </div>
  )
}
