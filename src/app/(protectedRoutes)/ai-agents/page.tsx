import { getAllAssistants } from '@/actions/vapi'
import { onAuthenticateUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import AiAgentSidebar from './_components/AiAgentSidebar'
import ModelSection from './_components/ModelSection'



const page = async () => {
  const allAgents = await getAllAssistants()
  const currentUser = await onAuthenticateUser()

  if (!currentUser.user) {
    redirect('/')
  }

  return (
    <div className="w-full flex h-[80vh] text-primary border border-border rounded-se-xl">
      <AiAgentSidebar
        aiAgents={allAgents?.data || []}
        user={currentUser.user}
      />
      <div className="flex-1 flex flex-col">
        <ModelSection user={currentUser.user} />
      </div>
    </div>
  )
}

export default page