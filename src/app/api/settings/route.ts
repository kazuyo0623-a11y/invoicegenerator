import { NextResponse } from 'next/server'
import { getSetting, setSetting } from '@/lib/db'

const ISSUER_KEY = 'issuer'

export async function GET() {
  const raw = getSetting(ISSUER_KEY)
  const issuer = raw ? JSON.parse(raw) : {
    name: '', registrationNumber: '', address: '',
    phone: '', email: '', bankInfo: '',
  }
  return NextResponse.json({ issuer })
}

export async function PUT(req: Request) {
  const body = await req.json()
  setSetting(ISSUER_KEY, JSON.stringify(body.issuer))
  return NextResponse.json({ ok: true })
}
