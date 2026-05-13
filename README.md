# ハートフルゴリオン(仮) (Apartment Bishoujo Collection)

全国のアパート/レジデンス名から生まれた美少女50人と出会い、戦い、仲間にして育てる
ブラウザ向けキャラクター収集ゲームです。

## 主な機能

- **50キャラクター**: アパート名から連想された美少女、レアリティN/R/SR/SSR/URの5段階
- **ターン制バトル**: 属性相性、技、状態異常、捕獲、逃走
- **育成と進化**: Lv25で第2形態、Lv50で第3形態、衣装が豪奢に変化
- **5章・15ステージ**: 序章N領域 → 終章UR聖域
- **クラウドセーブ**: Firebase Authentication + Firestore (要設定)
- **GitHub Pages デプロイ**: GitHub Actions で自動公開

## 必須キャラクター (初期実装に含む)

- ハートフルゴリオン (SSR/光)
- コンテッサウーノ (SR/火)
- フェローチェ (SR/火)
- フィフティーンラブ (R/木)
- エスポワール (R/光)
- レジデンスめぐみ (N/光) — 初期パーティ
- コーポマロニエ (N/木) — 初期パーティ

## 起動

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 本番ビルド -> dist/
```

## Firebase設定 (クラウドセーブを有効にする)

1. https://console.firebase.google.com で新規プロジェクト作成
2. **Authentication** で「匿名認証」と「Google認証」を有効化
3. **Firestore Database** を作成 (本番モード可)、`saves/{uid}` への読み書きをユーザー本人のみ許可
4. プロジェクト設定 > マイアプリ > ウェブアプリ追加で取得した設定を `.env.local` に記述:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

設定がなければ **localStorage モード** (端末固有のセーブ) で動作します。

### Firestore セキュリティルール例

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /saves/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## GitHub Pagesへのデプロイ

1. GitHubに新規リポジトリ作成、コードをpush
2. リポジトリの Settings > Pages > Source を「GitHub Actions」に
3. Firebase用環境変数を Settings > Secrets and variables > Actions に登録 (上の6つ)
4. `main` ブランチへのpushで自動デプロイ

`vite.config.ts` の `base` はリポジトリ名に自動追従します(GitHub Actionsの `BASE_PATH` 環境変数経由)。

## キャラクター画像生成

実画像はChatGPTやSDXLで個別生成する必要があります。
全2250枚分(50キャラ × 3進化 × 15ポーズ)のプロンプトシートを自動生成:

```bash
npx tsx scripts/gen_image_prompts.ts
# -> image_prompts.md / image_prompts.json
```

実画像が用意できたら `public/assets/characters/{char_id}/stage{1|2|3}/{pose_id}.png` に
配置し、`src/assets/placeholder.ts` を画像ロード関数に置き換えてください。

それまでは手続的に生成されるSVGプレースホルダで動作します。

表情差分・進化差分まで含めた生成運用ルールは
`docs/character_image_generation_rules.md` を参照してください。

## ディレクトリ構成

```
src/
├── assets/placeholder.ts         # 仮画像SVG生成
├── components/CharCard.vue       # キャラ表示カード
├── config/firebase.ts            # Firebase設定
├── game/
│   ├── data/                     # マスターデータ (50キャラ/技/ステージ/アイテム)
│   ├── battle.ts                 # 戦闘エンジン
│   ├── growth.ts                 # 育成・進化ロジック
│   ├── stageRunner.ts            # ステージ進行
│   └── types.ts                  # 型定義
├── save/                         # セーブアダプタ (local + Firebase)
├── stores/player.ts              # Pinia状態管理
├── views/                        # 画面 (Title/Home/Stages/Battle/Party/Dex/Shop/CharacterDetail)
└── router.ts                     # ルーティング
.github/workflows/deploy.yml      # 自動デプロイ
scripts/gen_image_prompts.ts      # 画像プロンプト生成
```

## ゲームバランス調整

- レアリティ別ステータス総計: N=250, R=320, SR=410, SSR=520, UR=640
- 捕獲基礎率(HP1まで削った場合): N=60%, R=35%, SR=15%, SSR=5%, UR=1%
- 経験値倍率: N=1.0, R=1.4, SR=2.0, SSR=3.0, UR=5.0
- 属性相性: 火>木>水>火、光↔闇 (倍率1.5x / 0.7x)

## ライセンス

private (個人プロジェクト)
