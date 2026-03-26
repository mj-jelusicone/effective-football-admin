import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=de,at,ch`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EffectiveFootballAdmin/1.0' },
  })
  if (!res.ok) return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data)
}
