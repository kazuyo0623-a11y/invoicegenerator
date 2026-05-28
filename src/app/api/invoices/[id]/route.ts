import { NextResponse } from 'next/server'
import { getInvoice, updateInvoice, deleteInvoice } from '@/lib/invoice'
import { syncInvoiceToSheets, deleteInvoiceFromSheets } from '@/lib/sheets'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const invoice = getInvoice(params.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const invoice = updateInvoice(params.id, body)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  syncInvoiceToSheets(invoice)
  return NextResponse.json(invoice)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const invoice = getInvoice(params.id)
  const ok = deleteInvoice(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invoice) deleteInvoiceFromSheets(invoice.invoiceNumber)
  return new NextResponse(null, { status: 204 })
}
