import { onAuthenticateUser } from '@/actions/auth'
import { getWebinarById } from '@/actions/webinar'
import { getObjectionInsights, ObjectionInsight } from '@/actions/objections'
import PageHeader from '@/components/ReusableComponent/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HomeIcon from '@/icons/HomeIcon'
import LeadIcon from '@/icons/LeadIcon'
import {
  Brain,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  params: Promise<{
    webinarId: string
  }>
}

export default async function ObjectionInsightsPage({ params }: Props) {
  const { webinarId } = await params
  const checkUser = await onAuthenticateUser()
  if (!checkUser.user) {
    redirect('/')
  }

  const webinar = await getWebinarById(webinarId)
  if (!webinar) {
    redirect('/webinars')
  }

  const insightsRes = await getObjectionInsights(webinarId)
  const insights: ObjectionInsight[] = insightsRes.data || []

  // Metrics summary calculation
  const totalObjectionCategories = insights.length
  const totalTimesRaised = insights.reduce((acc, curr) => acc + curr.timesRaised, 0)
  const totalRevenueImpact = insights.reduce((acc, curr) => acc + curr.estimatedRevenueImpact, 0)
  const avgConversionRate =
    insights.length > 0
      ? Math.round(
          insights.reduce((acc, curr) => acc + curr.conversionRateWhenRaised, 0) / insights.length
        )
      : 0

  const topObjection = insights[0]

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Header with Navigation */}
      <PageHeader
        leftIcon={<HomeIcon className="w-3 h-3" />}
        mainIcon={<Brain className="w-10 h-10 text-accent-primary" />}
        rightIcon={<LeadIcon className="w-4 h-4" />}
        heading={`Objection Intelligence — ${webinar.title}`}
        placeholder="Filter objections..."
      >
        <div className="flex items-center gap-3">
          <Link href={`/webinars/${webinarId}/pipeline`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Pipeline View
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tracked Objections
            </CardTitle>
            <Brain className="w-4 h-4 text-accent-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalObjectionCategories}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTimesRaised} total pushback instances
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Revenue Tied to Handled Objections
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${totalRevenueImpact.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Converted leads × webinar price (${Number(webinar.price || 0)})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Conversion When Raised
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {avgConversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all objection categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              #1 Revenue Impact Objection
            </CardTitle>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground truncate">
              {topObjection ? topObjection.label : 'None'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {topObjection
                ? `$${topObjection.estimatedRevenueImpact.toLocaleString()} revenue tied`
                : 'No objections recorded yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Objections Intelligence List */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent-primary" /> Objection Leaderboard
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Objections ranked by estimated revenue impact and conversion performance.
            </p>
          </div>
        </div>

        {insights.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center flex flex-col items-center justify-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No objections logged yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              When sales calls complete, AI automatically extracts buyer pushbacks, maps them to outcomes, and highlights the best responses here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {insights.map((item, idx) => (
              <Card
                key={item.id}
                className="bg-card border-border hover:border-accent-primary/40 transition-colors shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground font-mono">
                            {item.label}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {item.timesRaised} raised
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          Conversion Rate
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {item.conversionRateWhenRaised}% ({item.convertedCount}/{item.timesRaised})
                        </span>
                      </div>
                      <div className="text-right pl-4 border-l border-border">
                        <span className="text-xs text-muted-foreground block">
                          Est. Revenue Impact
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          ${item.estimatedRevenueImpact.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Best Agent Response */}
                  <div className="bg-secondary/40 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-primary uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" /> Best Converting Agent Response
                    </div>
                    <p className="text-sm text-foreground italic leading-relaxed">
                      &quot;{item.bestResponse}&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
