import { v4 as uuidv4 } from 'uuid'
import { getDb, getNextInvoiceNumber } from './db'
import type { Invoice, InvoiceFormData, LineItem } from '@/types/invoice'

function calcTotals(items: Omit<LineItem, 'amount'>[]) {
  let subtotal = 0
  let taxAmount10 = 0
  let taxAmount8 = 0

  const lineItems: LineItem[] = items.map(item => {
    const amount = Math.floor(item.quantity * item.unitPrice)
    subtotal += amount
    if (item.taxRate === 0.1) taxAmount10 += Math.floor(amount * 0.1)
    if (item.taxRate === 0.08) taxAmount8 += Math.floor(amount * 0.08)
    return { ...item, amount }
  })

  return {
    items: lineItems,
    subtotal,
    taxAmount10,
    taxAmount8,
    total: subtotal + taxAmount10 + taxAmount8,
  }
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    title: row.title as string,
    issueDate: row.issue_date as string,
    dueDate: row.due_date as string,
    status: row.status as Invoice['status'],
    issuer: JSON.parse(row.issuer_json as string),
    client: JSON.parse(row.client_json as string),
    items: JSON.parse(row.items_json as string),
    subtotal: row.subtotal as number,
    taxAmount10: row.tax_amount_10 as number,
    taxAmount8: row.tax_amount_8 as number,
    total: row.total as number,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: row.synced_at as string | undefined,
  }
}

export function listInvoices(): Invoice[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all()
  return (rows as Record<string, unknown>[]).map(rowToInvoice)
}

export function getInvoice(id: string): Invoice | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!row) return null
  return rowToInvoice(row as Record<string, unknown>)
}

export function createInvoice(data: InvoiceFormData): Invoice {
  const db = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()
  const { items, subtotal, taxAmount10, taxAmount8, total } = calcTotals(data.items)

  const invoice: Invoice = {
    ...data,
    id,
    items,
    subtotal,
    taxAmount10,
    taxAmount8,
    total,
    createdAt: now,
    updatedAt: now,
  }

  db.prepare(`
    INSERT INTO invoices
      (id, invoice_number, title, issue_date, due_date, status,
       issuer_json, client_json, items_json,
       subtotal, tax_amount_10, tax_amount_8, total,
       notes, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, invoice.invoiceNumber, invoice.title,
    invoice.issueDate, invoice.dueDate, invoice.status,
    JSON.stringify(invoice.issuer), JSON.stringify(invoice.client),
    JSON.stringify(invoice.items),
    invoice.subtotal, invoice.taxAmount10, invoice.taxAmount8, invoice.total,
    invoice.notes, now, now
  )

  return invoice
}

export function updateInvoice(id: string, data: Partial<InvoiceFormData>): Invoice | null {
  const existing = getInvoice(id)
  if (!existing) return null

  const db = getDb()
  const now = new Date().toISOString()

  const merged = { ...existing, ...data }
  const { items, subtotal, taxAmount10, taxAmount8, total } = calcTotals(
    data.items ?? existing.items
  )

  db.prepare(`
    UPDATE invoices SET
      invoice_number = ?, title = ?, issue_date = ?, due_date = ?,
      status = ?, issuer_json = ?, client_json = ?, items_json = ?,
      subtotal = ?, tax_amount_10 = ?, tax_amount_8 = ?, total = ?,
      notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.invoiceNumber, merged.title, merged.issueDate, merged.dueDate,
    merged.status,
    JSON.stringify(merged.issuer), JSON.stringify(merged.client),
    JSON.stringify(items),
    subtotal, taxAmount10, taxAmount8, total,
    merged.notes, now, id
  )

  return getInvoice(id)
}

export function deleteInvoice(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(id)
  return result.changes > 0
}

export function duplicateInvoice(id: string): Invoice | null {
  const original = getInvoice(id)
  if (!original) return null

  const newNumber = getNextInvoiceNumber()
  const now = new Date().toISOString().split('T')[0]

  return createInvoice({
    invoiceNumber: newNumber,
    title: original.title,
    issueDate: now,
    dueDate: original.dueDate,
    status: 'draft',
    issuer: original.issuer,
    client: original.client,
    items: original.items,
    notes: original.notes,
  })
}
