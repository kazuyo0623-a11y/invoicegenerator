# Google Sheets 連携セットアップ手順

請求書ジェネレーターで保存した請求書データを、Google Apps Script 経由で自動的にスプレッドシートへ反映する手順です。

---

## 全体の仕組み

```
請求書ジェネレーター（Next.js）
        │  保存時に POST
        ▼
Google Apps Script（Web アプリ）
        │  データを書き込み
        ▼
Google スプレッドシート
  ├── シート①「請求書一覧」
  └── シート②「明細一覧」
```

OAuth 認証不要。Apps Script を Web アプリとして公開するだけで連携できます。

---

## Step 1 : スプレッドシートを作成する

1. [Google スプレッドシート](https://sheets.google.com) を開く
2. **「空白のスプレッドシート」** で新規作成
3. タイトルを「請求書管理」などに変更（任意）
4. URL から **スプレッドシート ID** をコピーしておく  
   例：`https://docs.google.com/spreadsheets/d/`**`1ABCdef_xxxx`**`/edit`

---

## Step 2 : Apps Script エディタを開く

1. スプレッドシート上部メニュー **「拡張機能」→「Apps Script」** をクリック
2. エディタが新しいタブで開く
3. 左側のファイル名 `コード.gs` をクリックして選択

---

## Step 3 : スクリプトコードを貼り付ける

エディタ内の既存コードをすべて削除し、以下を貼り付けます。

```javascript
// ============================================================
// 請求書ジェネレーター × Google Sheets 連携スクリプト
// ============================================================

/**
 * POST リクエストを受け取るエントリーポイント。
 * 請求書ジェネレーターから呼ばれる。
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const invoiceSheet = ss.getSheetByName('請求書一覧');
    const itemsSheet   = ss.getSheetByName('明細一覧');

    if (!invoiceSheet || !itemsSheet) {
      throw new Error('シートが見つかりません。先に setupSheets() を実行してください。');
    }

    if (data.action === 'upsert') {
      upsertInvoice(invoiceSheet, itemsSheet, data.invoice);
    } else if (data.action === 'delete') {
      deleteInvoice(invoiceSheet, itemsSheet, data.invoiceNumber);
    } else {
      throw new Error('不明な action: ' + data.action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ------------------------------------------------------------
// 請求書の追加 / 更新（upsert）
// ------------------------------------------------------------
function upsertInvoice(invoiceSheet, itemsSheet, invoice) {
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  // --- 請求書一覧シートへ upsert ---
  const invoiceValues = invoiceSheet.getDataRange().getValues();
  let targetRow = -1;
  for (let i = 1; i < invoiceValues.length; i++) {
    if (String(invoiceValues[i][0]) === String(invoice.invoiceNumber)) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }

  const statusLabel = {
    draft:     '下書き',
    sent:      '送付済',
    paid:      '入金済',
    cancelled: 'キャンセル'
  }[invoice.status] || invoice.status;

  const invoiceRow = [
    invoice.invoiceNumber,                         // A: 請求番号
    invoice.issueDate,                             // B: 請求日
    invoice.dueDate,                               // C: 支払期日
    invoice.client.name,                           // D: 会社名
    invoice.client.contactName || '',              // E: 担当者名
    invoice.subtotal,                              // F: 小計
    invoice.taxAmount10 + invoice.taxAmount8,      // G: 消費税
    invoice.total,                                 // H: 合計
    statusLabel,                                   // I: ステータス
    invoice.notes || '',                           // J: 備考
    now                                            // K: 最終更新
  ];

  if (targetRow === -1) {
    invoiceSheet.appendRow(invoiceRow);
  } else {
    invoiceSheet.getRange(targetRow, 1, 1, invoiceRow.length).setValues([invoiceRow]);
  }

  // --- 明細一覧シートの既存行を削除 ---
  const itemValues = itemsSheet.getDataRange().getValues();
  for (let i = itemValues.length - 1; i >= 1; i--) {
    if (String(itemValues[i][0]) === String(invoice.invoiceNumber)) {
      itemsSheet.deleteRow(i + 1);
    }
  }

  // --- 明細を追加 ---
  for (const item of invoice.items) {
    const taxLabel = item.taxRate === 0.1  ? '10%'
                   : item.taxRate === 0.08 ? '8%'
                   : '非課税';
    itemsSheet.appendRow([
      invoice.invoiceNumber, // A: 請求番号
      item.description,      // B: 商品名
      item.quantity,         // C: 数量
      item.unitPrice,        // D: 単価
      taxLabel,              // E: 消費税率
      item.amount            // F: 金額
    ]);
  }
}

// ------------------------------------------------------------
// 請求書の削除
// ------------------------------------------------------------
function deleteInvoice(invoiceSheet, itemsSheet, invoiceNumber) {
  // 請求書一覧から削除
  const invoiceValues = invoiceSheet.getDataRange().getValues();
  for (let i = invoiceValues.length - 1; i >= 1; i--) {
    if (String(invoiceValues[i][0]) === String(invoiceNumber)) {
      invoiceSheet.deleteRow(i + 1);
      break;
    }
  }

  // 明細一覧から削除
  const itemValues = itemsSheet.getDataRange().getValues();
  for (let i = itemValues.length - 1; i >= 1; i--) {
    if (String(itemValues[i][0]) === String(invoiceNumber)) {
      itemsSheet.deleteRow(i + 1);
    }
  }
}

// ------------------------------------------------------------
// 初回セットアップ：シートとヘッダーを自動作成
// スクリプトエディタから手動で一度だけ実行する
// ------------------------------------------------------------
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- 請求書一覧シート ---
  let invoiceSheet = ss.getSheetByName('請求書一覧');
  if (!invoiceSheet) invoiceSheet = ss.insertSheet('請求書一覧');

  const invoiceHeaders = [
    '請求番号', '請求日', '支払期日', '会社名', '担当者名',
    '小計', '消費税', '合計', 'ステータス', '備考', '最終更新'
  ];
  invoiceSheet.getRange(1, 1, 1, invoiceHeaders.length)
    .setValues([invoiceHeaders])
    .setFontWeight('bold')
    .setBackground('#dbeafe')
    .setFontColor('#1e40af');
  invoiceSheet.setFrozenRows(1);
  invoiceSheet.setColumnWidth(1, 110);  // 請求番号
  invoiceSheet.setColumnWidth(2, 90);   // 請求日
  invoiceSheet.setColumnWidth(3, 90);   // 支払期日
  invoiceSheet.setColumnWidth(4, 160);  // 会社名
  invoiceSheet.setColumnWidth(5, 110);  // 担当者名
  invoiceSheet.setColumnWidth(6, 90);   // 小計
  invoiceSheet.setColumnWidth(7, 80);   // 消費税
  invoiceSheet.setColumnWidth(8, 100);  // 合計
  invoiceSheet.setColumnWidth(9, 90);   // ステータス
  invoiceSheet.setColumnWidth(10, 200); // 備考
  invoiceSheet.setColumnWidth(11, 140); // 最終更新

  // 数値列の書式
  invoiceSheet.getRange('F2:H1000').setNumberFormat('#,##0');

  // --- 明細一覧シート ---
  let itemsSheet = ss.getSheetByName('明細一覧');
  if (!itemsSheet) itemsSheet = ss.insertSheet('明細一覧');

  const itemHeaders = ['請求番号', '商品名', '数量', '単価', '消費税率', '金額'];
  itemsSheet.getRange(1, 1, 1, itemHeaders.length)
    .setValues([itemHeaders])
    .setFontWeight('bold')
    .setBackground('#dcfce7')
    .setFontColor('#166534');
  itemsSheet.setFrozenRows(1);
  itemsSheet.setColumnWidth(1, 110);
  itemsSheet.setColumnWidth(2, 200);
  itemsSheet.setColumnWidth(3, 70);
  itemsSheet.setColumnWidth(4, 90);
  itemsSheet.setColumnWidth(5, 80);
  itemsSheet.setColumnWidth(6, 90);
  itemsSheet.getRange('D2:D1000').setNumberFormat('#,##0');
  itemsSheet.getRange('F2:F1000').setNumberFormat('#,##0');

  SpreadsheetApp.getUi().alert(
    'セットアップ完了！\n\n' +
    '「請求書一覧」と「明細一覧」シートを作成しました。\n' +
    '次に Web アプリとしてデプロイしてください。'
  );
}
```

---

## Step 4 : シートを初期化する

1. エディタ上部の **関数選択プルダウン** で `setupSheets` を選択
2. **▶ 実行** ボタンをクリック
3. 初回実行時は「権限を確認」ダイアログが出る  
   → 「権限を確認」→ Google アカウントを選択 → 「詳細」→「安全でないページへ移動」→「許可」
4. スプレッドシートに「請求書一覧」「明細一覧」シートが自動作成される

---

## Step 5 : Web アプリとしてデプロイする

1. エディタ右上の **「デプロイ」→「新しいデプロイ」** をクリック
2. 歯車アイコン（種類の選択）→ **「ウェブアプリ」** を選択
3. 以下のように設定する

| 項目 | 設定値 |
|------|--------|
| 説明 | 請求書ジェネレーター連携 |
| 次のユーザーとして実行 | **自分** |
| アクセスできるユーザー | **全員** |

4. **「デプロイ」** をクリック
5. 表示された **ウェブアプリの URL** をコピーする  
   例：`https://script.google.com/macros/s/AKfyc.../exec`

> ⚠️ **スクリプトを変更したら「新しいバージョンをデプロイ」が必要です**  
> 「デプロイ」→「デプロイを管理」→ 編集アイコン → バージョン「新バージョン」→「デプロイ」

---

## Step 6 : 請求書ジェネレーターに URL を設定する

### .env.local ファイルに追記

プロジェクトルートの `.env.local` ファイル（なければ新規作成）に追記：

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfyc.../exec
```

### 設定画面から設定する場合

アプリの **「設定」画面** の「Google Sheets 連携」欄に URL を入力して保存。

---

## スプレッドシートの構成

### シート①「請求書一覧」

| 列 | 項目名 | 内容 |
|----|--------|------|
| A | 請求番号 | 例：2026-0001 |
| B | 請求日 | 例：2026-05-28 |
| C | 支払期日 | 例：2026-06-30 |
| D | 会社名 | 請求先の会社名 |
| E | 担当者名 | 請求先の担当者 |
| F | 小計 | 税抜き合計（数値） |
| G | 消費税 | 消費税合計（数値） |
| H | 合計 | 税込み合計（数値） |
| I | ステータス | 下書き / 送付済 / 入金済 / キャンセル |
| J | 備考 | 備考テキスト |
| K | 最終更新 | 最終同期日時 |

### シート②「明細一覧」

| 列 | 項目名 | 内容 |
|----|--------|------|
| A | 請求番号 | 請求書一覧と紐付けるキー |
| B | 商品名 | 商品・サービス名 |
| C | 数量 | 数量 |
| D | 単価 | 単価（数値） |
| E | 消費税率 | 10% / 8% / 非課税 |
| F | 金額 | 数量 × 単価（数値） |

---

## 使い方

### 通常の使い方

1. 請求書ジェネレーターで請求書を作成・編集して **「保存する」** をクリック
2. 自動的に Apps Script へデータが送信される
3. Google スプレッドシートの「請求書一覧」「明細一覧」に即時反映される
4. 同じ請求番号のデータは **上書き更新**（重複しない）

### 削除時

- 請求書ジェネレーターで請求書を削除すると、スプレッドシートの対応行も自動削除される

### 動作確認（curl）

デプロイが正しくできているか手動でテスト：

```bash
curl -L -X POST "https://script.google.com/macros/s/AKfyc.../exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upsert",
    "invoice": {
      "invoiceNumber": "TEST-0001",
      "issueDate": "2026-05-28",
      "dueDate": "2026-06-30",
      "status": "draft",
      "client": { "name": "テスト株式会社", "contactName": "山田太郎" },
      "items": [
        { "id": "1", "description": "テスト商品", "quantity": 1, "unitPrice": 10000, "taxRate": 0.1, "amount": 10000 }
      ],
      "subtotal": 10000,
      "taxAmount10": 1000,
      "taxAmount8": 0,
      "total": 11000,
      "notes": ""
    }
  }'
```

`{"success":true}` が返れば連携成功です。

---

## トラブルシューティング

| 症状 | 原因と対処 |
|------|-----------|
| `{"success":false,"error":"シートが見つかりません"}` | `setupSheets()` を実行していない |
| 403 / 権限エラー | デプロイ時の「アクセスできるユーザー」が「全員」になっているか確認 |
| データが反映されない | `.env.local` の URL が正しいか確認。スクリプト変更後は再デプロイが必要 |
| 文字化け | Apps Script のスクリプトファイルが UTF-8 で保存されているか確認 |
| スクリプト変更が反映されない | 「デプロイを管理」→「新バージョンでデプロイ」を実行する |
