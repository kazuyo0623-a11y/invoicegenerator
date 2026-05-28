'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Invoice, IssuerInfo } from '@/types/invoice'

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, '商品名を入力してください'),
  quantity: z.number().min(0.01, '0より大きい値'),
  unitPrice: z.number().min(0, '0以上'),
  taxRate: z.union([z.literal(0.1), z.literal(0.08), z.literal(0)]),
})

const formSchema = z.object({
  invoiceNumber: z.string().min(1, '請求番号を入力してください'),
  title: z.string().min(1),
  issueDate: z.string().min(1, '請求日を入力してください'),
  dueDate: z.string().min(1, '支払期日を入力してください'),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']),
  client: z.object({
    name: z.string().min(1, '会社名を入力してください'),
    contactName: z.string(),
    address: z.string(),
  }),
  issuer: z.object({
    name: z.string(),
    registrationNumber: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    bankInfo: z.string(),
  }),
  items: z.array(lineItemSchema).min(1, '商品を1件以上入力してください'),
  notes: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  invoice?: Invoice
  defaultIssuer?: IssuerInfo
}

const TAX_OPTIONS = [
  { value: '0.1', label: '10%' },
  { value: '0.08', label: '8%' },
  { value: '0', label: '非課税' },
]

function calcAmounts(items: FormValues['items']) {
  let subtotal = 0, tax10 = 0, tax8 = 0
  for (const item of items) {
    const amt = Math.floor((item.quantity || 0) * (item.unitPrice || 0))
    subtotal += amt
    if (item.taxRate === 0.1) tax10 += Math.floor(amt * 0.1)
    if (item.taxRate === 0.08) tax8 += Math.floor(amt * 0.08)
  }
  return { subtotal, tax10, tax8, total: subtotal + tax10 + tax8 }
}

export function InvoiceForm({ invoice, defaultIssuer }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: invoice
      ? {
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          client: invoice.client,
          issuer: invoice.issuer,
          items: invoice.items,
          notes: invoice.notes,
        }
      : {
          invoiceNumber: '',
          title: '請求書',
          issueDate: today,
          dueDate: '',
          status: 'draft',
          client: { name: '', contactName: '', address: '' },
          issuer: defaultIssuer ?? { name: '', registrationNumber: '', address: '', phone: '', email: '', bankInfo: '' },
          items: [{ id: uuidv4(), description: '', quantity: 1, unitPrice: 0, taxRate: 0.1 }],
          notes: '',
        },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const watchItems = form.watch('items')
  const { subtotal, tax10, tax8, total } = calcAmounts(watchItems)

  useEffect(() => {
    if (!invoice) {
      fetch('/api/invoices/next-number')
        .then(r => r.json())
        .then(d => form.setValue('invoiceNumber', d.number))
    }
  }, [invoice, form])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices'
      const method = invoice ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const saved = await res.json()
      router.push(`/invoices/${saved.id}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* 請求先・日付・番号 */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <Label>会社名 <span className="text-red-500">*</span></Label>
          <Input
            {...form.register('client.name')}
            className="mt-1"
            placeholder="株式会社○○"
          />
          {form.formState.errors.client?.name && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.client.name.message}</p>
          )}
        </div>

        <div>
          <Label>担当者名</Label>
          <Input
            {...form.register('client.contactName')}
            className="mt-1"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <Label>請求番号 <span className="text-red-500">*</span></Label>
          <Input {...form.register('invoiceNumber')} className="mt-1" />
          {form.formState.errors.invoiceNumber && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.invoiceNumber.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>請求日 <span className="text-red-500">*</span></Label>
            <Input type="date" {...form.register('issueDate')} className="mt-1" />
            {form.formState.errors.issueDate && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.issueDate.message}</p>
            )}
          </div>
          <div>
            <Label>支払期日 <span className="text-red-500">*</span></Label>
            <Input type="date" {...form.register('dueDate')} className="mt-1" />
            {form.formState.errors.dueDate && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.dueDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 明細テーブル */}
      <div>
        <div className="border rounded-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="grid grid-cols-[1fr_90px_110px_80px_36px] bg-gray-50 border-b text-xs font-medium text-gray-600 px-3 py-2 gap-2">
            <span>商品名</span>
            <span className="text-right">数量</span>
            <span className="text-right">単価（円）</span>
            <span className="text-center">消費税</span>
            <span />
          </div>

          {/* 明細行 */}
          <div className="divide-y">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_90px_110px_80px_36px] px-3 py-2 gap-2 items-center">
                <Input
                  {...form.register(`items.${index}.description`)}
                  placeholder="商品・サービス名"
                  className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
                />
                <Input
                  {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  type="number" step="any" min="0"
                  className="text-right"
                />
                <Input
                  {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  type="number" min="0"
                  className="text-right"
                />
                <Controller
                  control={form.control}
                  name={`items.${index}.taxRate`}
                  render={({ field: f }) => (
                    <Select
                      value={String(f.value)}
                      onValueChange={v => f.onChange(parseFloat(v) as 0.1 | 0.08 | 0)}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAX_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                  className="flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ id: uuidv4(), description: '', quantity: 1, unitPrice: 0, taxRate: 0.1 })}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> 行を追加
        </Button>

        {/* 合計エリア */}
        <div className="mt-4 flex justify-end">
          <div className="w-60 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>小計</span>
              <span>¥{subtotal.toLocaleString('ja-JP')}</span>
            </div>
            {tax10 > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>消費税（10%）</span>
                <span>¥{tax10.toLocaleString('ja-JP')}</span>
              </div>
            )}
            {tax8 > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>消費税（8%）</span>
                <span>¥{tax8.toLocaleString('ja-JP')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2">
              <span>合計</span>
              <span>¥{total.toLocaleString('ja-JP')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? '保存中...' : '保存する'}
        </Button>
      </div>
    </form>
  )
}
