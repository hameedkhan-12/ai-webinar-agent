import { onAuthenticateUser } from '@/actions/auth'
import { getWebinarById } from '@/actions/webinar'
import RenderWebinar from './_components/RenderWebinar'
import { WebinarWithPresenter } from '@/lib/type'
import { WebinarStatusEnum } from '@/generated/prisma/enums'

type Props = {
  params: Promise<{
    liveWebinarId: string
  }>
  searchParams: Promise<{
    error: string
  }>
}

const page = async ({ params, searchParams }: Props) => {
  const { liveWebinarId } = await params
  const { error } = await searchParams
  const webinarData = await getWebinarById(liveWebinarId)

 

  if (webinarData?.webinarStatus === WebinarStatusEnum.ENDED) {
    // recording = await getStreamRecording(liveWebinarId)
  }

  if (!webinarData) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center text-lg sm:text-4xl">
        Webinar not found
      </div>
    )
  }

  const checkUser = await onAuthenticateUser()
  // Todo: Create API keys
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string

  return (
    <div className="w-full min-h-screen mx-auto">
      <RenderWebinar
        error={error}
        user={checkUser.user || null}
        webinar={webinarData as WebinarWithPresenter}
        apiKey={apiKey}
        recording={null}
      />
    </div>
  )
}

export default page
