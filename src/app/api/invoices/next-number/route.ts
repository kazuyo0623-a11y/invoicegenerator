import { NextResponse } from 'next/server'
import { getNextInvoiceNumber } from '@/lib/db'

export async function GET() {
  const number = getNextInvoiceNumber()
  return NextResponse.json({ number })
}
