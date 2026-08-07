import type { Metadata } from 'next'
import MarketingNavbar from '@/components/marketing/MarketingNavbar'
import Hero from '@/components/marketing/Hero'
import Features from '@/components/marketing/Features'
import HowItWorks from '@/components/marketing/HowItWorks'
import PricingSection from '@/components/marketing/PricingSection'
import CtaSection from '@/components/marketing/CtaSection'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export const metadata: Metadata = {
  title: 'Spotlight - Webinars that book calls automatically',
  description:
    'Host live webinars and hand off every "Book a Call" click to a context-aware AI voice agent - no human required.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <PricingSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  )
}