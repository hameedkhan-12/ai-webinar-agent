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
  PlusCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import FeatureCard from './_components/FeatureCard'
import { KpiCard } from './_components/KpiCard'
import { HomeAnalyticsChart } from './_components/HomeAnalyticsChart'
import { RecentLeadsWidget } from './_components/RecentLeadsWidget'
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
    <div className="w-full mx-auto h-full space-y-8 pb-12">
      {/* Top Banner & Hero Section (Preserved exact structure & styling) */}
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

      {/* Row 1: Four Compact Pivora-Style KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Webinars"
          value={metrics.totalWebinars}
          icon={<Video className="w-4 h-4 text-foreground/80" />}
          trend={{ value: '+12%', isUp: true, caption: 'vs last month' }}
        />
        <KpiCard
          title="Captured Leads"
          value={metrics.totalLeads}
          icon={<Users className="w-4 h-4 text-blue-500" />}
          trend={{ value: '+8%', isUp: true, caption: 'vs last month' }}
        />
        <KpiCard
          title="Completed AI Calls"
          value={metrics.completedCalls}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          trend={{ value: '+24%', isUp: true, caption: 'conversions' }}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
          trend={{
            value: `${metrics.conversionRate}%`,
            isUp: metrics.conversionRate > 0,
            caption: 'target met',
          }}
        />
      </div>

      {/* Row 2: Asymmetric Layout — Hero Chart Card (~2/3) + Recent Leads Calendar List (~1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <HomeAnalyticsChart
            registeredCount={metrics.registeredCount}
            attendedCount={metrics.attendedCount}
            completedCalls={metrics.completedCalls}
            totalLeads={metrics.totalLeads}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <RecentLeadsWidget recentAttendances={metrics.recentAttendances} />
        </div>
      </div>

      {/* Row 3: Asymmetric 3-Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Widget 1: In-Progress Live Calls Widget */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-foreground">In-Progress Calls</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
              Live Session
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {metrics.inProgressCalls}
            </div>
            <p className="text-xs text-muted-foreground">
              Active AI breakout sales calls running right now.
            </p>
          </div>

          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Automated Closers
            </span>
            <span className="text-emerald-500 font-semibold">Active</span>
          </div>
        </div>

        {/* Widget 2: Feature Card 1 */}
        <FeatureCard
          Icon={<Video className="w-5 h-5 text-foreground" />}
          heading="Manage & Schedule Live Webinars"
          description="Host automated or live webinars with custom CTA buy buttons."
          link="/webinars"
        />

        {/* Widget 3: Feature Card 2 */}
        <FeatureCard
          Icon={<Mic className="w-5 h-5 text-foreground" />}
          heading="Configure Custom AI Voice Cloning"
          description="Set up AI sales agent prompt overrides and custom cloned voices."
          link="/ai-agents"
        />
      </div>
    </div>
  )
}
