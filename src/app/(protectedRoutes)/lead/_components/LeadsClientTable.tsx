'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, UserCheck, Video, Calendar, Filter } from 'lucide-react'
import { LeadRecord } from '@/actions/attendance'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

type Props = {
  leads: LeadRecord[]
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export default function LeadsClientTable({ leads }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'InProgress' | 'PENDING'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.webinarTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.webinarTags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'ALL' || lead.callStatus === statusFilter

        return matchesSearch && matchesStatus
      }),
    [leads, searchTerm, statusFilter]
  )

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredLeads.slice(start, start + PAGE_SIZE)
  }, [filteredLeads, safePage])

  const rangeStart = filteredLeads.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredLeads.length)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-medium flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Call Completed
          </Badge>
        )
      case 'InProgress':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 font-medium flex items-center gap-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Call In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/60 px-2.5 py-0.5 w-fit">
            Pending Call
          </Badge>
        )
    }
  }

  const getAttendedBadge = (type: string) => {
    switch (type) {
      case 'CONVERTED':
        return (
          <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Converted
          </Badge>
        )
      case 'ATTENDED':
        return (
          <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Attended
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-secondary/60 text-secondary-foreground">
            Registered
          </Badge>
        )
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter leads by name, email, webinar, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border/60 focus-visible:ring-accent-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['ALL', 'COMPLETED', 'InProgress', 'PENDING'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/20'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {status === 'ALL' ? 'All Leads' : status === 'InProgress' ? 'In Call' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Lead Name & Email</TableHead>
              <TableHead className="font-semibold text-foreground">Webinar Source</TableHead>
              <TableHead className="font-semibold text-foreground">AI Call Status</TableHead>
              <TableHead className="font-semibold text-foreground">Funnel Stage</TableHead>
              <TableHead className="font-semibold text-foreground">Tags</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Registered Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length > 0 ? (
              paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-border/40 hover:bg-accent-primary/5 transition-colors group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/80 bg-accent-primary/10">
                        <AvatarFallback className="font-medium text-xs bg-accent-primary/20 text-accent-primary">
                          {lead.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-accent-primary transition-colors">
                          {lead.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{lead.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/webinars/${lead.webinarId}/pipeline`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/link"
                    >
                      <Video className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                      <span className="truncate max-w-[200px] underline-offset-4 group-hover/link:underline">
                        {lead.webinarTitle}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.callStatus)}</TableCell>
                  <TableCell>{getAttendedBadge(lead.attendedType)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.webinarTags.length > 0 ? (
                        lead.webinarTags.slice(0, 2).map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-border/60 text-muted-foreground"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground/60" />
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-accent-primary/10 text-accent-primary">
                      <UserCheck className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">No leads found</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchTerm
                        ? 'No leads matching your search criteria.'
                        : 'No attendees have registered for your webinars yet. Share your webinar links to collect leads!'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredLeads.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border/60 bg-secondary/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              of{' '}
              <span className="font-medium text-foreground">{filteredLeads.length}</span> leads
            </p>

            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safePage - 1)
                    }}
                    className={cn(safePage <= 1 && 'pointer-events-none opacity-50')}
                  />
                </PaginationItem>

                {getPageNumbers(safePage, totalPages).map((page, index) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safePage}
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safePage + 1)
                    }}
                    className={cn(safePage >= totalPages && 'pointer-events-none opacity-50')}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
