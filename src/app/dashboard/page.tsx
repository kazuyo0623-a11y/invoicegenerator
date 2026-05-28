import Link from 'next/link'
import { listInvoices } from '@/lib/invoice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { InvoiceActions } from '@/components/invoice/InvoiceActions'
import type { InvoiceStatus } from '@/types/invoice'

const statusLabel: Record<InvoiceStatus, string> = {
  draft: '下書き',
  sent: '送付済',
  paid: '入金済',
  cancelled: 'キャンセル',
}

const statusVariant: Record<InvoiceStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  sent: 'default',
  paid: 'outline',
  cancelled: 'destructive',
}

export default function DashboardPage() {
  const invoices = listInvoices()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">請求書一覧</h1>
        <Link href="/invoices/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4">請求書がまだありません</p>
          <Link href="/invoices/new">
            <Button variant="outline">最初の請求書を作成する</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">請求書番号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">発行日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">請求先</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">合計金額</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.issueDate}</td>
                  <td className="px-4 py-3">{inv.client.name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ¥{inv.total.toLocaleString('ja-JP')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant[inv.status]}>{statusLabel[inv.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InvoiceActions id={inv.id} invoiceNumber={inv.invoiceNumber} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
