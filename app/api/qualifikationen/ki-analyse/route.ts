import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trainers } = await req.json()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const summary = trainers.map((t: any) => ({
    name:             `${t.first_name} ${t.last_name}`,
    lizenz:           t.trainer_qualifications?.[0]?.qualification_types?.name ?? 'Keine',
    verified:         t.verified_at,
    status:           t.verification_status,
    specializations:  t.specializations ?? [],
  }))

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Analysiere dieses Fußball-Trainer-Team und gib mir eine kompakte Einschätzung.
Trainer-Team:
${JSON.stringify(summary, null, 2)}

Antworte NUR mit einem JSON-Objekt (kein Markdown):
{
  "gesamtbewertung": "Kurze 1-2 Satz Einschätzung des Teams",
  "staerken": ["Stärke 1", "Stärke 2"],
  "handlungsbedarf": ["Punkt 1", "Punkt 2"],
  "empfehlungen": [
    { "prioritaet": "hoch|mittel|niedrig", "text": "Empfehlung" }
  ],
  "lizenz_niveau": "Durchschnittliches Lizenzniveau (z.B. B-Lizenz)"
}`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ error: 'Parsing failed', raw: text }, { status: 500 })
  }
}
