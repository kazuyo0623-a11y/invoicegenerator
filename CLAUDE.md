# CLAUDE.md

このファイルはリポジトリで作業する Claude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

日本語対応の請求書ジェネレーター Web アプリ。フォームで入力した請求書データを Google スプレッドシートへ自動同期し、PDF として出力できる。インボイス制度（適格請求書）対応。

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動 (localhost:3000)
npm run build     # 本番ビルド
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## 技術スタック

- **Next.js 14** (App Router) — フレームワーク兼 API サーバー
- **TypeScript + Zod** — 型定義とバリデーション
- **Tailwind CSS + shadcn/ui** — スタイリングと UI コンポーネント
- **React Hook Form** — フォーム状態管理
- **@react-pdf/renderer** — サーバーサイドでの PDF 生成
- **NextAuth.js** — Google OAuth 2.0 認証
- **Google Sheets API v4** — スプレッドシート読み書き
- **SQLite (better-sqlite3)** — ローカルの請求書データ永続化

## アーキテクチャ

```
app/
  (auth)/signin/          Google OAuth サインイン画面
  dashboard/              請求書一覧
  invoices/new/           新規作成フォーム
  invoices/[id]/          詳細・編集
  invoices/[id]/pdf/      PDF プレビュー
  settings/               発行者情報・Google Sheets 設定
  api/
    auth/[...nextauth]/   NextAuth ハンドラ
    invoices/             請求書 CRUD (GET/POST/PUT/DELETE)
    pdf/[id]/             PDF ストリーム生成
    sheets/sync/          Google Sheets への同期トリガー

lib/
  db.ts                   better-sqlite3 のシングルトン接続と DB スキーマ
  sheets.ts               Google Sheets API クライアント（書き込みロジック）
  pdf.ts                  @react-pdf/renderer のドキュメント定義

types/
  invoice.ts              Invoice / LineItem / IssuerInfo / ClientInfo 型定義
```

## 主要データモデル

```typescript
// types/invoice.ts
interface Invoice {
  id: string
  invoiceNumber: string        // 採番ルール: "YYYY-NNNN"
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  issueDate: string            // YYYY-MM-DD
  dueDate: string
  issuer: IssuerInfo           // 発行者（自社）
  client: ClientInfo           // 請求先
  items: LineItem[]
  subtotal: number
  taxAmount10: number          // 10% 消費税
  taxAmount8: number           // 8% 消費税（軽減税率）
  total: number
  notes: string
  syncedAt?: string            // Google Sheets 最終同期日時
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: 0.1 | 0.08 | 0     // 消費税区分
  amount: number               // 自動計算: quantity * unitPrice
}
```

## Google Sheets 同期

- `lib/sheets.ts` が Google Sheets API v4 を直接呼び出す
- スプレッドシートには「請求書一覧」と「明細一覧」の 2 シートを維持する
- 既存行は `invoiceNumber` をキーに照合して **upsert** する
- Google の OAuth トークンは NextAuth のセッション内に保持する（`access_token`）
- スプレッドシート ID は `settings` テーブルに保存し、設定画面から変更可能

## PDF 生成

- `app/api/pdf/[id]/route.ts` がサーバーサイドで PDF を生成し `Content-Disposition: attachment` で返す
- `lib/pdf.ts` に `@react-pdf/renderer` の `<Document>` コンポーネントを定義する
- フォントは Noto Sans JP を使用（日本語文字化け防止のため必須）

## 環境変数

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=./data/invoices.db   # SQLite ファイルパス
```

## 請求書番号の採番

採番ロジックは `lib/db.ts` 内に集約。形式は `YYYY-NNNN`（例: `2026-0001`）。年が変わると連番はリセット。手動上書きも可能。
