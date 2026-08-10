import React from 'react'
import PageHeader from '@/components/ReusableComponent/PageHeader'
import LeadIcon from '@/icons/LeadIcon'
import PipelineIcon from '@/icons/PipelineIcon'
import { Webcam, Users, CheckCircle2, PhoneCall, TrendingUp } from 'lucide-react'
import { onAuthenticateUser } from '@/actions/auth'
import { getAllLeadsForUser } from '@/actions/attendance'
import { redirect } from 'next/navigation'
import LeadsClientTable from './_components/LeadsClientTable'

export default async function LeadPage() {
  const checkUser = await onAuthenticateUser()
  if (!checkUser.user) {
    redirect('/')
  }

  const leadsResponse = await getAllLeadsForUser(checkUser.user.id)
  const leads = leadsResponse.data || []

  const totalLeads = leads.length
  const completedCalls = leads.filter((l) => l.callStatus === 'COMPLETED').length
  const inProgressCalls = leads.filter((l) => l.callStatus === 'InProgress').length
  const conversionRate = totalLeads > 0 ? Math.round((completedCalls / totalLeads) * 100) : 0

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      <PageHeader
        leftIcon={<Webcam className="w-3 h-3" />}
        mainIcon={<LeadIcon className="w-12 h-12" />}
        rightIcon={<PipelineIcon className="w-3 h-3" />}
        heading="Customer & Lead Intelligence"
        placeholder="Search customers..."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl flex items-center justify-between shadow-sm hover:border-accent-primary/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Captured Leads</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{totalLeads}</p>
          </div>
          <div className="p-3 rounded-xl bg-accent-primary/10 text-accent-primary">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl flex items-center justify-between shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Completed AI Calls</p>
            <p className="text-3xl font-bold tracking-tight text-emerald-400">{completedCalls}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl flex items-center justify-between shadow-sm hover:border-amber-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Active Breakouts</p>
            <p className="text-3xl font-bold tracking-tight text-amber-400">{inProgressCalls}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-xl flex items-center justify-between shadow-sm hover:border-purple-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Conversion Rate</p>
            <p className="text-3xl font-bold tracking-tight text-purple-400">{conversionRate}%</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Datatable */}
      <LeadsClientTable leads={leads} />
    </div>
  )
}
