import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

const noto = Noto_Sans_JP({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '請求書ジェネレーター',
  description: '請求書の作成・管理・PDF出力',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} bg-gray-50 text-gray-900`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
