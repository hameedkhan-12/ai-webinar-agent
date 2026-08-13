import { onAuthenticateUser } from '@/actions/auth'
import { getWebinarByPresenterId } from '@/actions/webinar'
import { toWebinarListItem } from '@/lib/webinar-list'
import { redirect } from 'next/navigation'
import { WebinarsClient } from './_components/WebinarsClient'

export const metadata = {
  title: 'Webinars | AI Webinar Platform',
  description: 'Manage and monitor all your scheduled, live, and ended webinars.',
}

type Props = {
  searchParams: Promise<{
    webinarStatus?: string
  }>
}

export default async function WebinarsPage({ searchParams }: Props) {
  const { webinarStatus } = await searchParams
  const checkUser = await onAuthenticateUser()

  if (!checkUser.user) {
    redirect('/')
  }

  const webinars = await getWebinarByPresenterId(checkUser.user.id)
  const webinarItems = webinars.map(toWebinarListItem)

  return <WebinarsClient webinars={webinarItems} initialFilter={webinarStatus} />
}
