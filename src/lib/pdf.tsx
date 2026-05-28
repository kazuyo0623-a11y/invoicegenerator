import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Invoice } from '@/types/invoice'

Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf' },
  ],
})

const styles = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, padding: 40, color: '#1a1a1a' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 },
  invoiceNumber: { fontSize: 9, textAlign: 'right', color: '#555', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  issuerBlock: { flex: 1 },
  metaBlock: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: 8, color: '#888', marginBottom: 2 },
  value: { fontSize: 9, marginBottom: 4 },
  clientBox: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 3,
    padding: 10, marginBottom: 20, backgroundColor: '#fafafa',
  },
  clientName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f0f0f0',
    borderTopWidth: 1, borderColor: '#ccc', paddingVertical: 5, paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderColor: '#eee',
    paddingVertical: 5, paddingHorizontal: 4,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'center' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  totalsSection: { alignItems: 'flex-end', marginTop: 8 },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { width: 80, textAlign: 'right', marginRight: 8, color: '#555' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotalRow: {
    flexDirection: 'row', marginTop: 4,
    borderTopWidth: 1.5, borderColor: '#333', paddingTop: 4,
  },
  grandTotalLabel: { width: 80, textAlign: 'right', marginRight: 8, fontWeight: 'bold', fontSize: 11 },
  grandTotalValue: { width: 80, textAlign: 'right', fontWeight: 'bold', fontSize: 11 },
  notes: { marginTop: 24, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' },
  notesLabel: { fontSize: 8, color: '#888', marginBottom: 4 },
  registrationNumber: { fontSize: 8, color: '#555', marginTop: 2 },
})

function formatYen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`
}

function taxLabel(rate: number): string {
  if (rate === 0.1) return '10%'
  if (rate === 0.08) return '8%'
  return '非課税'
}

export function InvoicePDF({ invoice }: { invoice: Invoice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{invoice.title}</Text>
        <Text style={styles.invoiceNumber}>No. {invoice.invoiceNumber}</Text>

        <View style={styles.row}>
          <View style={styles.issuerBlock}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{invoice.issuer.name}</Text>
            {invoice.issuer.registrationNumber && (
              <Text style={styles.registrationNumber}>登録番号: {invoice.issuer.registrationNumber}</Text>
            )}
            <Text style={styles.value}>{invoice.issuer.address}</Text>
            {invoice.issuer.phone && <Text style={styles.value}>TEL: {invoice.issuer.phone}</Text>}
            {invoice.issuer.email && <Text style={styles.value}>{invoice.issuer.email}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>発行日</Text>
            <Text style={styles.value}>{invoice.issueDate}</Text>
            <Text style={styles.label}>支払期限</Text>
            <Text style={styles.value}>{invoice.dueDate}</Text>
          </View>
        </View>

        <View style={styles.clientBox}>
          <Text style={styles.clientName}>{invoice.client.name} 御中</Text>
          {invoice.client.contactName && (
            <Text style={styles.value}>{invoice.client.contactName} 様</Text>
          )}
          {invoice.client.address && <Text style={styles.value}>{invoice.client.address}</Text>}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>品目</Text>
          <Text style={styles.colQty}>数量</Text>
          <Text style={styles.colUnit}>単価</Text>
          <Text style={styles.colTax}>税率</Text>
          <Text style={styles.colAmount}>金額</Text>
        </View>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{formatYen(item.unitPrice)}</Text>
            <Text style={styles.colTax}>{taxLabel(item.taxRate)}</Text>
            <Text style={styles.colAmount}>{formatYen(item.amount)}</Text>
          </View>
        ))}

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小計（税抜）</Text>
            <Text style={styles.totalValue}>{formatYen(invoice.subtotal)}</Text>
          </View>
          {invoice.taxAmount10 > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>消費税（10%）</Text>
              <Text style={styles.totalValue}>{formatYen(invoice.taxAmount10)}</Text>
            </View>
          )}
          {invoice.taxAmount8 > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>消費税（8%）</Text>
              <Text style={styles.totalValue}>{formatYen(invoice.taxAmount8)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>合計金額</Text>
            <Text style={styles.grandTotalValue}>{formatYen(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>備考</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {invoice.issuer.bankInfo && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.notesLabel}>振込先</Text>
            <Text>{invoice.issuer.bankInfo}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
