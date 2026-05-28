import { NextResponse } from 'next/server'
import { listInvoices, createInvoice } from '@/lib/invoice'
import { syncInvoiceToSheets } from '@/lib/sheets'

export async function GET() {
  const invoices = listInvoices()
  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const body = await req.json()
  const invoice = createInvoice(body)
  syncInvoiceToSheets(invoice)
  return NextResponse.json(invoice, { status: 201 })
}
