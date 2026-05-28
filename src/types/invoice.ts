export type TaxRate = 0.1 | 0.08 | 0

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export interface IssuerInfo {
  name: string
  registrationNumber: string
  address: string
  phone: string
  email: string
  bankInfo: string
}

export interface ClientInfo {
  name: string
  contactName: string
  address: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: TaxRate
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  issuer: IssuerInfo
  client: ClientInfo
  items: LineItem[]
  subtotal: number
  taxAmount10: number
  taxAmount8: number
  total: number
  notes: string
  createdAt: string
  updatedAt: string
  syncedAt?: string
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'subtotal' | 'taxAmount10' | 'taxAmount8' | 'total'> & {
  items: Omit<LineItem, 'amount'>[]
}
