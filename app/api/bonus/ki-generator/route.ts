import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trainerId } = await req.json()

  const { data: trainer } = await supabase
    .from('trainers')
    .select(`first_name, last_name, hourly_rate, contract_type, specializations, languages, trainer_roles(role, role_name), bonus_rules(name, rule_name)`)
    .eq('id', trainerId)
    .single()

  if (!trainer) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })

  const context = {
    name: `${trainer.first_name} ${trainer.last_name}`,
    contractType: trainer.contract_type ?? 'Nicht angegeben',
    hourlyRate: trainer.hourly_rate ?? 'Nicht angegeben',
    roles: (trainer.trainer_roles as any[])?.map(r => r.role || r.role_name).filter(Boolean) ?? [],
    specializations: trainer.specializations ?? [],
    existingRules: (trainer.bonus_rules as any[])?.map(r => r.name || r.rule_name).filter(Boolean) ?? [],
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Du bist Experte für Trainer-Vergütungsmodelle im Fußball.
Schlage genau 3 faire und motivierende Bonus-Regeln vor für diesen Trainer:
Name: ${context.name}
Vertragsart: ${context.contractType}
Stundensatz: ${context.hourlyRate}€
Rollen: ${context.roles.join(', ') || 'Keine'}
Spezialisierungen: ${context.specializations.join(', ') || 'Keine'}
Bestehende Bonus-Regeln: ${context.existingRules.join(', ') || 'Keine'}

Antworte NUR mit einem JSON-Array (kein Markdown, keine Erklärung):
[{"name":"Regelname","rule_type":"percent","condition_type":"always","condition_value":null,"bonus_value":5,"reasoning":"Kurze Begründung"}]
rule_type: "percent" oder "fixed"
condition_type: "always" | "full_capacity" | "min_participants" | "min_revenue"`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const suggestions = JSON.parse(cleaned)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ error: 'Parsing failed', raw: text }, { status: 500 })
  }
}
