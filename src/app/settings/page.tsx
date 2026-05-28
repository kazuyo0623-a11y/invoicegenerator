import { getSetting } from '@/lib/db'
import { SettingsForm } from '@/components/SettingsForm'
import type { IssuerInfo } from '@/types/invoice'

export default function SettingsPage() {
  const raw = getSetting('issuer')
  const issuer: IssuerInfo = raw
    ? JSON.parse(raw)
    : { name: '', registrationNumber: '', address: '', phone: '', email: '', bankInfo: '' }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">設定</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl">
        <h2 className="text-base font-semibold mb-6">発行者情報（自社情報）</h2>
        <SettingsForm issuer={issuer} />
      </div>
    </div>
  )
}
