import { onAuthenticateUser } from '@/actions/auth'
import { getAllProductsFromStripe } from '@/actions/stripe'
import { getAllAssistants } from '@/actions/vapi'
import Header from '@/components/ReusableComponent/LayoutComponents/Header'
import Sidebar from '@/components/ReusableComponent/LayoutComponents/Sidebar'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
}

const Layout = async ({ children }: Props) => {
  const userExist = await onAuthenticateUser()
  console.log('userExist', userExist)
  if (!userExist.user) {
    redirect('/sign-in')
  }

  const stripeProducts = await getAllProductsFromStripe()
  const assistants = await getAllAssistants()


  return (
    <div className="flex w-full min-h-screen">
      {/* SIDEBAR */}
      <Sidebar />
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        {/* HEADER */}
        <Header
          user={userExist.user}
          stripeProducts={stripeProducts.products || []}
          assistants={assistants.data || []}
        />

        <div className="flex-1 py-10 ">{children}</div>
      </div>
    </div>
  )
}

export default Layout
