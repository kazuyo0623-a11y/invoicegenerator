import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoice } from '@/lib/invoice'
import { InvoiceForm } from '@/components/invoice/InvoiceForm'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default function InvoiceDetailPage({ params }: Props) {
  const invoice = getInvoice(params.id)
  if (!invoice) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> 一覧へ戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
        </div>
        <a href={`/invoices/${invoice.id}/print`} target="_blank" rel="noreferrer">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            印刷 / PDF保存
          </Button>
        </a>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <InvoiceForm invoice={invoice} />
      </div>
    </div>
  )
}
