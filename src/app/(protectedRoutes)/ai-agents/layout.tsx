import AiAgentsTabs from "./_components/AiAgentsTabs"

type Props = {
  children: React.ReactNode
}

const AiAgentsLayout = ({ children }: Props) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <AiAgentsTabs />
      {children}
    </div>
  )
}

export default AiAgentsLayout