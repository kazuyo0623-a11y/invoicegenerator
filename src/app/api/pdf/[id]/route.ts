import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getInvoice } from '@/lib/invoice'
import { InvoicePDF } from '@/lib/pdf'
import { Document } from '@react-pdf/renderer'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const invoice = getInvoice(params.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoicePDF, { invoice }) as React.ReactElement<React.ComponentProps<typeof Document>>
  const buffer = await renderToBuffer(element)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  })
}
