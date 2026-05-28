'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Printer, Copy, Trash2, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface Props {
  id: string
  invoiceNumber: string
}

export function InvoiceActions({ id, invoiceNumber }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDuplicate() {
    await fetch(`/api/invoices/${id}/duplicate`, { method: 'POST' })
    router.refresh()
    setOpen(false)
  }

  async function handleDelete() {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    router.refresh()
    setConfirmDelete(false)
    setOpen(false)
  }

  function handlePrint() {
    window.open(`/invoices/${id}/print`, '_blank')
    setOpen(false)
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>操作 — {invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => { router.push(`/invoices/${id}`); setOpen(false) }}>
              <Eye className="w-4 h-4" /> 詳細・編集
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> 印刷 / PDF保存
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={handleDuplicate}>
              <Copy className="w-4 h-4" /> 複製
            </Button>
            <Button variant="outline" className="justify-start gap-2 text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" /> 削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>削除の確認</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            請求書 <strong>{invoiceNumber}</strong> を削除しますか？この操作は取り消せません。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
