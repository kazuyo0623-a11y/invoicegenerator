import { notFound } from 'next/navigation'
import { getInvoice } from '@/lib/invoice'

interface Props {
  params: { id: string }
}

function formatYen(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

function taxLabel(rate: number) {
  if (rate === 0.1) return '10%'
  if (rate === 0.08) return '8%'
  return '非課税'
}

export default function PrintPage({ params }: Props) {
  const invoice = getInvoice(params.id)
  if (!invoice) notFound()

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <title>請求書 {invoice.invoiceNumber}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Noto Sans JP', sans-serif;
            font-size: 13px;
            color: #1a1a1a;
            background: #fff;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm 20mm 16mm;
          }

          /* 印刷時はmarginなし */
          @media print {
            html, body { margin: 0; padding: 0; }
            .page { margin: 0; padding: 14mm 16mm 12mm; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 0; }
          }

          /* 画面プレビュー */
          @media screen {
            body { background: #e5e7eb; }
            .page {
              margin: 24px auto;
              box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            }
          }

          /* --- レイアウト --- */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .doc-title { font-size: 26px; font-weight: 700; letter-spacing: 4px; }
          .doc-meta { text-align: right; font-size: 12px; color: #555; line-height: 1.7; }
          .doc-number { font-size: 13px; font-weight: 500; }

          .issuer { margin-bottom: 24px; }
          .issuer-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
          .issuer-sub { font-size: 11px; color: #555; line-height: 1.7; }

          .client-box {
            border: 1.5px solid #1a1a1a;
            padding: 12px 16px;
            margin-bottom: 28px;
            display: inline-block;
            min-width: 260px;
          }
          .client-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
          .client-sub { font-size: 11px; color: #555; }

          .amount-summary {
            text-align: center;
            margin-bottom: 28px;
            padding: 12px;
            border-bottom: 2px solid #1a1a1a;
          }
          .amount-label { font-size: 11px; color: #555; margin-bottom: 4px; }
          .amount-total { font-size: 24px; font-weight: 700; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 12px;
          }
          thead tr { background: #f3f4f6; }
          th {
            padding: 8px 10px;
            text-align: left;
            font-weight: 500;
            font-size: 11px;
            color: #555;
            border-bottom: 1px solid #d1d5db;
          }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
          }

          .totals { display: flex; justify-content: flex-end; margin-top: 8px; }
          .totals-table { width: 220px; font-size: 12px; }
          .totals-table td { padding: 4px 8px; border: none; }
          .totals-table .label { color: #555; }
          .totals-table .grand { font-size: 14px; font-weight: 700; border-top: 1.5px solid #1a1a1a; }
          .totals-table .grand td { padding-top: 8px; }

          .notes { margin-top: 32px; font-size: 12px; }
          .notes-label { font-size: 11px; color: #888; margin-bottom: 4px; }
          .notes-body { line-height: 1.7; white-space: pre-wrap; }

          .bank-info { margin-top: 16px; font-size: 12px; }

          .print-btn {
            position: fixed;
            top: 16px;
            right: 16px;
            background: #2563eb;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .print-btn:hover { background: #1d4ed8; }
        `}</style>
      </head>
      <body>
        <button className="print-btn no-print" onClick={() => {}} id="printBtn">
          🖨️ 印刷 / PDF保存
        </button>
        <script dangerouslySetInnerHTML={{ __html: `
          document.getElementById('printBtn').onclick = function() { window.print(); }
        `}} />

        <div className="page">
          {/* タイトル・番号 */}
          <div className="header">
            <div className="doc-title">{invoice.title}</div>
            <div className="doc-meta">
              <div className="doc-number">No. {invoice.invoiceNumber}</div>
              <div>発行日：{invoice.issueDate}</div>
              <div>支払期日：{invoice.dueDate}</div>
            </div>
          </div>

          {/* 発行者 */}
          <div className="issuer">
            <div className="issuer-name">{invoice.issuer.name}</div>
            <div className="issuer-sub">
              {invoice.issuer.registrationNumber && <div>登録番号：{invoice.issuer.registrationNumber}</div>}
              {invoice.issuer.address && <div>{invoice.issuer.address}</div>}
              {invoice.issuer.phone && <div>TEL：{invoice.issuer.phone}</div>}
              {invoice.issuer.email && <div>{invoice.issuer.email}</div>}
            </div>
          </div>

          {/* 請求先 */}
          <div className="client-box">
            <div className="client-name">{invoice.client.name} 御中</div>
            {invoice.client.contactName && (
              <div className="client-sub">{invoice.client.contactName} 様</div>
            )}
          </div>

          {/* 合計金額サマリー */}
          <div className="amount-summary">
            <div className="amount-label">ご請求金額</div>
            <div className="amount-total">{formatYen(invoice.total)}</div>
          </div>

          {/* 明細テーブル */}
          <table>
            <thead>
              <tr>
                <th>商品名</th>
                <th className="right">数量</th>
                <th className="right">単価</th>
                <th className="center">消費税</th>
                <th className="right">金額</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td className="right">{item.quantity.toLocaleString('ja-JP')}</td>
                  <td className="right">{formatYen(item.unitPrice)}</td>
                  <td className="center">{taxLabel(item.taxRate)}</td>
                  <td className="right">{formatYen(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 合計 */}
          <div className="totals">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td className="label">小計</td>
                  <td className="right">{formatYen(invoice.subtotal)}</td>
                </tr>
                {invoice.taxAmount10 > 0 && (
                  <tr>
                    <td className="label">消費税（10%）</td>
                    <td className="right">{formatYen(invoice.taxAmount10)}</td>
                  </tr>
                )}
                {invoice.taxAmount8 > 0 && (
                  <tr>
                    <td className="label">消費税（8%）</td>
                    <td className="right">{formatYen(invoice.taxAmount8)}</td>
                  </tr>
                )}
                <tr className="grand">
                  <td className="label">合計</td>
                  <td className="right">{formatYen(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 備考 */}
          {invoice.notes && (
            <div className="notes">
              <div className="notes-label">備考</div>
              <div className="notes-body">{invoice.notes}</div>
            </div>
          )}

          {/* 振込先 */}
          {invoice.issuer.bankInfo && (
            <div className="bank-info">
              <div className="notes-label">振込先</div>
              <div className="notes-body">{invoice.issuer.bankInfo}</div>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}
