import type { Invoice } from '@/types/invoice'

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL

export async function syncInvoiceToSheets(invoice: Invoice): Promise<void> {
  if (!WEBHOOK_URL) return

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upsert', invoice }),
  }).catch(() => {
    // 同期失敗はサイレントに無視（ローカル保存は成功済み）
  })
}

export async function deleteInvoiceFromSheets(invoiceNumber: string): Promise<void> {
  if (!WEBHOOK_URL) return

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', invoiceNumber }),
  }).catch(() => {})
}
