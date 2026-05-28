import { InvoiceForm } from '@/components/invoice/InvoiceForm'
import { getSetting } from '@/lib/db'
import type { IssuerInfo } from '@/types/invoice'

export default function NewInvoicePage() {
  const raw = getSetting('issuer')
  const defaultIssuer: IssuerInfo | undefined = raw ? JSON.parse(raw) : undefined

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">新規請求書作成</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <InvoiceForm defaultIssuer={defaultIssuer} />
      </div>
    </div>
  )
}
