'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { IssuerInfo } from '@/types/invoice'

const schema = z.object({
  name: z.string().min(1, '氏名または会社名を入力してください'),
  registrationNumber: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  bankInfo: z.string(),
})

export function SettingsForm({ issuer }: { issuer: IssuerInfo }) {
  const [saved, setSaved] = useState(false)
  const form = useForm<IssuerInfo>({
    resolver: zodResolver(schema),
    defaultValues: issuer,
  })

  async function onSubmit(values: IssuerInfo) {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issuer: values }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>会社名 / 氏名 *</Label>
          <Input {...form.register('name')} className="mt-1" />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="col-span-2">
          <Label>登録番号（インボイス制度）</Label>
          <Input {...form.register('registrationNumber')} className="mt-1" placeholder="T1234567890123" />
        </div>
        <div className="col-span-2">
          <Label>住所</Label>
          <Input {...form.register('address')} className="mt-1" />
        </div>
        <div>
          <Label>電話番号</Label>
          <Input {...form.register('phone')} className="mt-1" />
        </div>
        <div>
          <Label>メールアドレス</Label>
          <Input {...form.register('email')} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>銀行口座情報</Label>
          <Textarea {...form.register('bankInfo')} className="mt-1" rows={3} placeholder="○○銀行 ××支店 普通 1234567" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">保存する</Button>
        {saved && <span className="text-green-600 text-sm">保存しました</span>}
      </div>
    </form>
  )
}
