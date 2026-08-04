import { onAuthenticateUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import WhopConnectForm from './WhopConnectForm'

const page = async () => {
  const userExist = await onAuthenticateUser()
  if (!userExist.user) {
    redirect('/sign-in')
  }

  return (
    <div className="w-full mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Payment Integration</h1>
      <div className="w-full p-6 border border-input rounded-lg bg-background shadow-sm">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-linear-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Whop Payments
            </h2>
            <p className="text-muted-foreground text-sm">
              Connect your Whop business to start accepting payments for your
              webinars
            </p>
          </div>
        </div>

        <WhopConnectForm
          userId={userExist.user.id}
          currentCompanyId={userExist.user.whopCompanyId}
        />

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-2">
            How to find your Whop Company ID
          </h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Create or log into your business at whop.com</li>
            <li>
              Go to your Whop dashboard's Developer/Settings section to find
              your Company ID (starts with{' '}
              <code className="bg-muted px-1 rounded">biz_</code>)
            </li>
            <li>Paste it above and save</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default page