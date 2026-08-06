import { redirect } from 'next/navigation'
import { onAuthenticateUser } from '@/actions/auth'
import { VoicesView } from '@/features/voices/views/voices-view'

const VoicesPage = async () => {
  const currentUser = await onAuthenticateUser()

  if (!currentUser.user) {
    redirect('/')
  }

  return (
    <div className="w-full flex min-h-[80vh] flex-col border border-border rounded-se-xl">
      <VoicesView user={currentUser.user} />
    </div>
  )
}

export default VoicesPage