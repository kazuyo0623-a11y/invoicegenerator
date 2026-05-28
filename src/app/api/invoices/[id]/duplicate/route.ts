import { NextResponse } from 'next/server'
import { duplicateInvoice } from '@/lib/invoice'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const invoice = duplicateInvoice(params.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(invoice, { status: 201 })
}
