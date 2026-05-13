# Firebase セットアップ手順

ハートフルゴリオン(仮) で **アカウント機能 + クラウドセーブ** を有効にする手順です。
所要時間は10〜15分程度。GUIの操作のみで完了します。

## ステップ1: Firebaseプロジェクトを作成

1. https://console.firebase.google.com にアクセス
2. **「プロジェクトを追加」** をクリック
3. プロジェクト名に `heartful-gorion` (またはお好みの名前) を入力
4. Google Analytics は **「有効にしない」** を選択 (なくても動きます。後でも有効化可能)
5. 「プロジェクトを作成」 → 完了したら「続行」

## ステップ2: Webアプリを追加して設定を取得

1. プロジェクトのダッシュボードで **「</> ウェブ」アイコン** をクリック
2. アプリのニックネーム: `Heartful Gorion Web` などを入力
3. 「**このアプリの Firebase Hosting も設定する**」は **チェックなし** でOK
4. 「アプリを登録」をクリック
5. 表示される `firebaseConfig` 値をメモ:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                       // ← VITE_FIREBASE_API_KEY
  authDomain: "your-proj.firebaseapp.com", // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "your-proj",                  // ← VITE_FIREBASE_PROJECT_ID
  storageBucket: "your-proj.appspot.com",  // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "1234567890",         // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc..."                // ← VITE_FIREBASE_APP_ID
};
```

「コンソールに進む」をクリック。

## ステップ3: 認証を有効化

1. 左メニュー **「構築 > Authentication」** → 「始める」
2. **「Sign-in method」** タブ
3. **「Google」を有効化**:
   - クリック → 「有効にする」をオン
   - プロジェクトのサポートメール: 自分のメールアドレスを選択
   - 「保存」
4. (任意)**「匿名」を有効化** — ログインなしでも遊ばせるならON

## ステップ4: Firestore を有効化

1. 左メニュー **「構築 > Firestore Database」** → 「データベースの作成」
2. **「本番環境モードで開始」** を選択 → 「次へ」
3. ロケーション: **`asia-northeast1` (東京)** を選択 → 「有効にする」
4. しばらく待ってDB作成完了

## ステップ5: セキュリティルールを設定

1. Firestore Database 画面の **「ルール」** タブ
2. 既存ルールを全て削除し、以下を貼り付け:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /saves/{uid} {
      allow read, write: if request.auth != null
                        && request.auth.uid == uid
                        && request.resource.data.schemaVersion == 1;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **「公開」** をクリック

(リポジトリ内の `firestore.rules` と同じ内容です)

## ステップ6: 認証ドメインを追加 (GitHub Pages公開用)

GitHub Pagesから認証する場合、ドメインを許可リストに追加する必要があります。

1. **Authentication > Settings** タブ
2. 「**承認済みドメイン**」セクション
3. 「ドメインを追加」 → `hirototdl.github.io` を追加

(localhost と firebaseapp.com はデフォルトで許可済み)

## ステップ7: 設定値を伝える

ステップ2でメモした値を、私(Claude)に教えてください。私は以下を実行します:

- ローカル開発用に `.env.local` を作成
- GitHub Actions の Secrets に登録
- 動作確認 & デプロイ

伝え方の例:

```
apiKey: AIzaSyXXXXXXXXXX
authDomain: heartful-gorion.firebaseapp.com
projectId: heartful-gorion
storageBucket: heartful-gorion.appspot.com
messagingSenderId: 123456789012
appId: 1:123456789012:web:abc123def456
```

---

## トラブルシューティング

### 「ポップアップがブロックされました」
Google認証時にポップアップが出ない場合、ブラウザの設定でhirototdl.github.ioのポップアップを許可してください。

### 「auth/unauthorized-domain」エラー
ステップ6の承認済みドメイン追加を忘れている可能性があります。

### Firestore書き込みエラー
ステップ5のルールが反映されていない、または認証されていない可能性があります。
ブラウザのコンソールで `firebase auth().currentUser` が値を持つことを確認。
