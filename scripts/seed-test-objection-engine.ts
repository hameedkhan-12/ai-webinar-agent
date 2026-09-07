
import "dotenv/config"
import { prisma } from "@/lib/prismaClient"
import { AttendedTypeEnum, CtaTypeEnum } from "@/generated/prisma/enums"

const PRESENTER_EMAIL = "hkstyles1212@gmail.com"

const TRANSCRIPTS = [
  {
    name: "Sarah Mitchell",
    email: "sarah.mitchell.test@example.com",
    converted: true,
    transcript: `AI Agent: Welcome to our AI Sales Acceleration webinar! I'm here to answer any questions. What's on your mind?
Prospect: Honestly this looks powerful, but the price seems really high. We're a bootstrapped startup.
AI Agent: Totally get that. Most bootstrapped teams start on our Starter plan at $149/mo — about a third of the Enterprise price. You only scale up when you hit 5x ROI. Would that lower the barrier?
Prospect: Yeah, $149 sounds much more manageable. I'm just worried about how long it takes to see results.
AI Agent: Fair question. Our median customer sees their first qualified meetings within 14 days. I can share three case studies from similar-stage startups if that helps build confidence.
Prospect: That would actually be really helpful. Let's do it.`,
  },
  {
    name: "Marcus Thompson",
    email: "marcus.thompson.test@example.com",
    converted: false,
    transcript: `AI Agent: Thanks for joining the webinar today, Marcus! What questions came up for you?
Prospect: This looks interesting but I'd need to run this by my business partner before we commit to anything.
AI Agent: Absolutely, that's a smart move for a decision like this. Would it help if I sent you a one-page summary you can share with him directly?
Prospect: Yes, that would be good. Also, I'm not sure we have the budget right now.
AI Agent: I completely understand budget constraints. Our quarterly billing option can spread the cost, and we also offer a 30-day money-back guarantee so there's zero risk.
Prospect: Let me talk to my partner first and I'll get back to you.`,
  },
  {
    name: "Jennifer Park",
    email: "jennifer.park.test@example.com",
    converted: false,
    transcript: `AI Agent: Hi Jennifer, great to have you here. Any questions from today's presentation?
Prospect: I like what I saw, but to be honest this isn't the right time for us. We're in the middle of a product launch.
AI Agent: Makes total sense — launches are intense. When do you expect things to settle down?
Prospect: Probably about 6 weeks out. Maybe after that.
AI Agent: Perfect. I'll mark you for a follow-up in 6 weeks. Is there anything I can send you now to keep this on your radar?
Prospect: Sure, just send me a summary. We might not have time to implement anything new right now.`,
  },
  {
    name: "David Chen",
    email: "david.chen.test@example.com",
    converted: true,
    transcript: `AI Agent: David, welcome! What stood out to you in today's session?
Prospect: The AI sales calls feature looks really promising. My main concern is whether it actually works for B2B SaaS or if it's more for e-commerce.
AI Agent: Great question — about 70% of our customers are B2B SaaS. The AI adapts its discovery questions based on deal complexity and deal cycle length.
Prospect: Okay that's reassuring. What about data security? We handle enterprise data and our legal team is strict about vendor compliance.
AI Agent: We're SOC 2 Type II certified and GDPR compliant. I can send over our security whitepaper and DPA for your legal team to review.
Prospect: Alright. If the paperwork checks out, I'm in. Let's move forward.`,
  },
  {
    name: "Amanda Rodriguez",
    email: "amanda.rodriguez.test@example.com",
    converted: false,
    transcript: `AI Agent: Amanda, thanks for attending! What's your biggest question after today?
Prospect: Honestly, I'm not sure this is better than what we already have. We use HubSpot sequences and they work okay.
AI Agent: That's fair — HubSpot sequences are solid for email. Where we're different is the live AI voice conversation layer. Our AI handles the first 3 minutes, qualifies the lead, and only transfers if they're interested.
Prospect: Hmm, so it's not replacing HubSpot, it's layering on top?
AI Agent: Exactly, we integrate with HubSpot natively. You'd see enriched contact data after every AI call.
Prospect: I still think I need to see more proof this works before committing. Do you have any ROI data?
AI Agent: Yes — our average customer sees a 3.2x increase in qualified meetings. I can send our benchmarking report.
Prospect: Okay send that over and I'll review it with my team.`,
  },
]

type ExtractedObjection = {
  label: string
  description: string
  transcriptExcerpt: string
  aiResponse: string
}

function fallbackHeuristic(text: string): ExtractedObjection[] {
  const t = text.toLowerCase()
  const objections: ExtractedObjection[] = []
  if (t.includes("price") || t.includes("expensive") || t.includes("cost") || t.includes("budget")) {
    objections.push({ label: "price_too_high", description: "Prospect raised concerns about pricing, cost, or budget.", transcriptExcerpt: "Prospect mentioned pricing or affordability concerns.", aiResponse: "AI agent explained payment options and program value." })
  }
  if (t.includes("partner") || t.includes("team") || t.includes("legal") || t.includes("boss")) {
    objections.push({ label: "needs_approval", description: "Prospect needs to consult a partner, team, or decision maker.", transcriptExcerpt: "Prospect mentioned needing approval from someone else.", aiResponse: "AI agent offered materials for the decision maker." })
  }
  if (t.includes("time") || t.includes("launch") || t.includes("right now")) {
    objections.push({ label: "bad_timing", description: "Prospect says this is not the right time.", transcriptExcerpt: "Prospect mentioned timing or a conflicting priority.", aiResponse: "AI agent asked about expected timeline and offered a follow-up." })
  }
  if (t.includes("security") || t.includes("compliance") || t.includes("gdpr") || t.includes("soc")) {
    objections.push({ label: "security_concerns", description: "Prospect raised data security or compliance concerns.", transcriptExcerpt: "Prospect asked about security, compliance, or data handling.", aiResponse: "AI agent confirmed certifications and offered security documentation." })
  }
  if (t.includes("already have") || t.includes("we use") || t.includes("hubspot") || t.includes("proof")) {
    objections.push({ label: "satisfied_with_current_tool", description: "Prospect feels their current solution is sufficient or wants proof of superiority.", transcriptExcerpt: "Prospect mentioned having an existing solution they are comfortable with.", aiResponse: "AI agent highlighted differentiation and offered ROI data." })
  }
  return objections
}

async function classifyTranscriptLocally(
  transcriptText: string,
  existingObjections: Array<{ label: string; description: string }>
): Promise<ExtractedObjection[]> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  const existingListStr =
    existingObjections.length > 0
      ? existingObjections.map((o) => `- "${o.label}": ${o.description}`).join("\n")
      : "None yet recorded."

  const prompt = `You are a sales intelligence analyst. Analyze the following transcript of a voice sales call between a prospect and an AI sales assistant.

Extract all customer objections, doubts, budget concerns, timing stalls, or pushbacks raised by the prospect.

Existing Objection Labels:
${existingListStr}

Instructions:
1. Re-use an existing label if the objection matches, otherwise create a snake_case label.
2. Provide a 1-sentence description of the objection.
3. Extract the exact transcript snippet (transcriptExcerpt) where the customer stated their objection.
4. Extract the AI agent response (aiResponse) where the agent handled the objection.

Return ONLY valid JSON: { "objections": [{ "label": "", "description": "", "transcriptExcerpt": "", "aiResponse": "" }] }
If no objections, return { "objections": [] }.

Transcript:
"""
${transcriptText}
"""`

  let jsonText = ""

  if (anthropicApiKey) {
    console.log("    → Anthropic classification...")
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicApiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    })
    if (res.ok) {
      const data = await res.json()
      jsonText = data.content?.[0]?.text || ""
    }
  } else if (openaiApiKey) {
    console.log("    → OpenAI classification...")
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    })
    if (res.ok) {
      const data = await res.json()
      jsonText = data.choices?.[0]?.message?.content || ""
    }
  } else {
    console.log("    → No AI key found, using heuristic fallback...")
    return fallbackHeuristic(transcriptText)
  }

  if (!jsonText) return fallbackHeuristic(transcriptText)

  try {
    const cleaned = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed.objections) ? parsed.objections : []
  } catch {
    return fallbackHeuristic(transcriptText)
  }
}

async function main() {
  console.log("\n🚀 Seeding Objection Engine test data...\n")

  const presenter = await prisma.user.findUnique({ where: { email: PRESENTER_EMAIL } })
  if (!presenter) {
    console.error(`\n❌  User "${PRESENTER_EMAIL}" NOT FOUND in the database.`)
    console.error("    Sign in at http://localhost:3000 once, then re-run this script.\n")
    process.exit(1)
  }

  console.log(`✅ Presenter: ${presenter.name} (${PRESENTER_EMAIL})`)

  const webinar = await prisma.webinar.create({
    data: {
      title: "🧪 AI Sales Acceleration — Objection Engine Test",
      description: "Seeded test webinar to validate the objection engine UI. Contains 5 realistic sales call scenarios.",
      presenterId: presenter.id,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 30 * 60 * 1000),
      duration: 90,
      ctaType: CtaTypeEnum.BOOK_A_CALL,
      ctaLabel: "Book a Strategy Call",
      ctaUrl: "https://cal.com/test/strategy-call",
      price: 997,
      webinarStatus: "ENDED",
      tags: ["test", "objection-engine", "demo"],
    },
  })

  console.log(`✅ Created webinar: "${webinar.title}"`)
  console.log(`   ID: ${webinar.id}\n`)

  for (const t of TRANSCRIPTS) {
    process.stdout.write(`  Processing ${t.name} (converted=${t.converted})...\n`)

    const attendee = await prisma.attendee.upsert({
      where: { email: t.email },
      update: { name: t.name },
      create: { email: t.email, name: t.name },
    })

    const existing = await prisma.attendance.findUnique({
      where: { attendeeId_webinarId: { attendeeId: attendee.id, webinarId: webinar.id } },
    })

    const attendance = existing ?? await prisma.attendance.create({
      data: {
        webinarId: webinar.id,
        attendeeId: attendee.id,
        attendedType: t.converted ? AttendedTypeEnum.CONVERTED : AttendedTypeEnum.ATTENDED,
        callStatus: "COMPLETED",
      },
    })

    const vapiCallId = `seed-${webinar.id.slice(0, 8)}-${attendee.id.slice(0, 8)}`
    const existingTranscript = await prisma.callTranscript.findUnique({ where: { vapiCallId } })

    const transcript = existingTranscript ?? await prisma.callTranscript.create({
      data: {
        attendanceId: attendance.id,
        vapiCallId,
        transcript: t.transcript,
        durationSeconds: Math.floor(Math.random() * 300) + 180,
      },
    })

    const existingObjections = await prisma.objection.findMany({
      where: { webinarId: webinar.id },
      select: { label: true, description: true },
    })

    const items = await classifyTranscriptLocally(t.transcript, existingObjections)
    let count = 0

    for (const item of items) {
      const label = (item.label || "general_pushback").toLowerCase().trim().replace(/[^a-z0-9_]/g, "_")
      const objection = await prisma.objection.upsert({
        where: { webinarId_label: { webinarId: webinar.id, label } },
        create: { webinarId: webinar.id, label, description: item.description || "Customer hesitation" },
        update: {},
      })
      const dup = await prisma.objectionInstance.findFirst({
        where: { objectionId: objection.id, attendanceId: attendance.id },
      })
      if (!dup) {
        await prisma.objectionInstance.create({
          data: { objectionId: objection.id, attendanceId: attendance.id, transcriptExcerpt: item.transcriptExcerpt || "", aiResponse: item.aiResponse || "", converted: t.converted },
        })
        count++
      }
    }

    await prisma.callTranscript.update({ where: { id: transcript.id }, data: { processingStatus: "FOLLOWED_UP" } })
    console.log(`    ✅ ${count} objections classified`)
  }

  const allObjections = await prisma.objection.findMany({
    where: { webinarId: webinar.id },
    include: { instances: true },
  })

  console.log("\n" + "─".repeat(60))
  console.log("📊 OBJECTION ENGINE SEED SUMMARY")
  console.log("─".repeat(60))
  console.log(`Webinar:  ${webinar.title}`)
  console.log(`ID:       ${webinar.id}`)
  console.log(`Presenter: ${presenter.name} (${PRESENTER_EMAIL})`)
  console.log()
  console.log(`Unique objection types: ${allObjections.length}`)
  for (const obj of allObjections) {
    const conv = obj.instances.filter((i) => i.converted).length
    console.log(`  • ${obj.label.padEnd(30)} raised ${obj.instances.length}x  converted ${conv}/${obj.instances.length}`)
  }
  console.log()
  console.log("🎉 All done! View the Objection Engine in the app:")
  console.log("   http://localhost:3000")
  console.log("─".repeat(60) + "\n")

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
