# Codex タスク指示書: ハートフルゴリオン(仮) キャラクター画像生成

## 🎯 あなた(Codex)が達成するタスク

ブラウザゲーム「ハートフルゴリオン(仮)」用の **50キャラクター × 第1形態の立ち絵** を、
ChatGPT (https://chatgpt.com/) の画像生成機能で順次生成し、所定のディレクトリに保存する。

完成形:
```
C:/Users/user02/Desktop/apartment-bishoujo-game/public/assets/characters/
├── ur_001/stage1/portrait_normal.png
├── ur_002/stage1/portrait_normal.png
├── ssr_001/stage1/portrait_normal.png
... (計50枚)
└── n_024/stage1/portrait_normal.png
```

ファイルがすべて配置されたら、ユーザーに「完了」と報告。

---

## 🛠 実行プロトコル

### ステップ0: ディレクトリ準備

以下のPowerShellワンライナーで全50ディレクトリを事前作成:

```powershell
$root = "C:/Users/user02/Desktop/apartment-bishoujo-game/public/assets/characters"
@("ur_001","ur_002","ssr_001","ssr_002","ssr_003","ssr_004",
"sr_001","sr_002","sr_003","sr_004","sr_005",
"r_001","r_002","r_003","r_004","r_005","r_006","r_007","r_008","r_009","r_010","r_011","r_012","r_013","r_014","r_015",
"n_001","n_002","n_003","n_004","n_005","n_006","n_007","n_008","n_009","n_010","n_011","n_012","n_013","n_014","n_015","n_016","n_017","n_018","n_019","n_020","n_021","n_022","n_023","n_024"
) | ForEach-Object { New-Item -ItemType Directory -Force -Path "$root/$_/stage1" | Out-Null }
```

### ステップ1: ChatGPTへアクセス
https://chatgpt.com/ を開いてログイン状態を確認。

### ステップ2: 各キャラクターを順次生成

下記「キャラクター50体仕様」の **char_id 順** に処理。各キャラごとに:

1. ChatGPTで **新規チャット** を開く(コンテキスト混在を防止)
2. 共通プロンプトテンプレートに、そのキャラの「個別仕様」を埋め込んで送信
3. 画像生成完了まで待機 (通常60-120秒)
4. 生成された画像を **右クリック → 名前を付けて保存** または ダウンロードボタン
5. ファイル名は `portrait_normal.png` に統一
6. 保存先パスは仕様の「出力パス」の通り
7. 完了したら次のキャラへ

### ステップ3: 完了報告

50キャラ処理後、以下のフォーマットで結果報告:

```
✅ 成功: 47件
- ur_001, ur_002, ssr_001, ... (一覧)

❌ 失敗: 3件
- sr_002: ChatGPTがポリシー違反として拒否
- r_007: 画像品質が低く再生成も失敗
- n_011: ネットワークエラー
```

---

## 📝 共通プロンプトテンプレート

各キャラクターについて、以下のテンプレートの `{name}` `{features}` `{costume}` `{pose}` を
「キャラクター50体仕様」のものに置換して送信:

```
アニメ調の美少女キャラクター立ち絵を生成してください。これは健全な美少女ゲームの公式キャラクターイラストで、品行方正で清楚な雰囲気の作品です。

【キャラクター名】{name}
【年齢設定】15-17歳に見える明るい少女
【外見特徴】{features}
【衣装】{costume}
【ポーズと小物】{pose}
【表情】優しく可愛らしい笑顔
【スタイル】明るく可愛らしい日本のアニメ調、彩度高め、丁寧なアニメ塗り、輪郭は柔らかい線画
【背景】真っ白(白背景)、キャラクター単体のみ、影は最小限
【構図】全身が映る正面立ち
【サイズ】縦長アスペクト比 2:3、頭頂から足元まで余白含めて収まる

健全で品行方正、誰でも楽しめる美少女ゲームの公式イラスト風でお願いします。
```

---

## 🎨 品質基準

- アニメ調、彩度高め、線画は柔らかい
- 全身(頭頂〜足元)が映る縦長構図
- 健全で品行方正な雰囲気
- キャラクター単体、背景は白
- 1枚目で著しく品質が低い場合のみ1回再生成

---

## ⚠️ エラー処理

| 状況 | 対処 |
|------|------|
| ChatGPTがポリシー違反で拒否 | スキップして次のキャラへ |
| 画像品質が著しく低い | 「もう一度生成してください」と1回だけ依頼、改善しなければスキップ |
| ChatGPTから「キャラ仕様と異なる絵」が返る | プロンプト末尾に「※外見特徴・衣装の指定を厳守してください」と追記して1回だけ再生成 |
| ネットワークエラー | 30秒待って同じプロンプトを再送 |
| 連続失敗3回 | そのキャラは諦め、最終レポートに失敗として記録 |

---

# キャラクター50体仕様

各エントリーは `{char_id}` `{name}` `{features}` `{costume}` `{pose}` `出力パス` の順。
プロンプトテンプレートに埋め込んで使用。

## UR レアリティ (2体)

### ur_001 | グランエルディオン
- features: 銀色の長い髪をハーフアップにまとめた凛々しい少女、緑の瞳、白い肌
- costume: 白と金の聖騎士見習いの軽装(白いチュニックに金の装飾、白いマント、白いブーツ)
- pose: 細身の長剣を片手で軽く構え、誇り高く正面立ち
- 出力: `public/assets/characters/ur_001/stage1/portrait_normal.png`

### ur_002 | ノワール・サンクチュアリ
- features: 漆黒の長髪、紫水晶のような瞳、白い肌、慎ましい雰囲気
- costume: 黒の修道服(全身を覆う長いローブ)、頭に黒いヴェール、銀の十字架ペンダント
- pose: 両手を胸前で組んで祈るような立ち姿、目を伏せ気味の静謐な表情
- 出力: `public/assets/characters/ur_002/stage1/portrait_normal.png`

## SSR レアリティ (4体)

### ssr_001 | ハートフルゴリオン
- features: 温かい栗色のセミロング(肩までのサラサラストレート)、優しい琥珀色の大きな瞳、ふっくら可愛い体型
- costume: ピンクと白の可愛い学園制服(白いブラウス、ピンクのリボン、プリーツスカート、白いソックス、ローファー)
- pose: 両手で大きな白いお盆を差し出すように持つ、ふんわり優しい笑顔
- 出力: `public/assets/characters/ssr_001/stage1/portrait_normal.png`

### ssr_002 | ロイヤルベルサイユ
- features: 金髪の縦ロール、青い瞳、白い肌、誇り高いお嬢様
- costume: 深紅のロングドレス(レースとリボンの装飾、長袖)、薔薇のヘアアクセサリー
- pose: 細身のレイピアを軽く片手で持ち、優雅にカーテシーポーズ
- 出力: `public/assets/characters/ssr_002/stage1/portrait_normal.png`

### ssr_003 | ドラグーンクラウン
- features: 鮮やかな青い髪(ショートボブ)、金色の瞳、頭から小さな龍の角が生える
- costume: 青と銀のシンプルな金属アーマー(肩当て、胸当て、長めの腰布、ブーツ)、青いマント
- pose: 長い槍(ランス)を縦に構え、勇ましく正面立ち
- 出力: `public/assets/characters/ssr_003/stage1/portrait_normal.png`

### ssr_004 | セイントマグノリア
- features: 桜色の長髪、淡いピンクの瞳、清楚で穏やかな雰囲気
- costume: 白を基調とした巫女装束風の長いローブ、緑の帯、木蓮の花の髪飾り
- pose: 木の杖を両手で軽く持ち、優しく微笑む
- 出力: `public/assets/characters/ssr_004/stage1/portrait_normal.png`

## SR レアリティ (5体)

### sr_001 | コンテッサウーノ
- features: 漆黒の長髪(縦ロール)、燃えるような赤い瞳、白い肌の貴族令嬢
- costume: 紅と黒のレース装飾ロングドレス(長袖、品のある襟元、ロングスカート)
- pose: 片手に赤い扇、もう片方の手は腰に当て、貴族的な微笑み
- 出力: `public/assets/characters/sr_001/stage1/portrait_normal.png`

### sr_002 | フェローチェ
- features: ボーイッシュなオレンジ色のショートヘア(やや跳ねた毛先)、勝気な琥珀色の瞳
- costume: 虎柄をモチーフにしたスポーティな半袖シャツとロングパンツ(ジャージのような動きやすい服)
- pose: 両手に短剣を持ち、軽くファイティングポーズ、活発な笑顔
- 出力: `public/assets/characters/sr_002/stage1/portrait_normal.png`

### sr_003 | アンジェリーク
- features: 銀色の長髪(ふんわりウェーブ)、空色の瞳、背中に小さな白い翼
- costume: 白いロングワンピース(裾フリル、長袖)、金の輪っかの天使の輪
- pose: 両手を胸前で軽く組み、穏やかな天使の微笑み
- 出力: `public/assets/characters/sr_003/stage1/portrait_normal.png`

### sr_004 | カランドリエ・ルナ
- features: ラベンダー色の長髪、神秘的な紫の瞳、白い肌
- costume: 星柄の長袖ロングドレス(深い紺色の生地に金の星刺繍)、三日月の髪飾り
- pose: 星型の宝石が付いたステッキを片手で持ち、神秘的な微笑
- 出力: `public/assets/characters/sr_004/stage1/portrait_normal.png`

### sr_005 | フェニックスメイデン
- features: 燃えるような赤いセミロング、オレンジの瞳、明るい活発な雰囲気
- costume: 赤と白のクラシックなメイド服(白いエプロン、赤いワンピース、白いカチューシャ、長いスカート)
- pose: 片手に金の燭台を持ち、もう片方は腰に当ててお辞儀、明るい笑顔
- 出力: `public/assets/characters/sr_005/stage1/portrait_normal.png`

## R レアリティ (15体)

### r_001 | フィフティーンラブ
- features: ブロンドのポニーテール、緑の瞳、健康的な少女
- costume: 白いテニスウェア(半袖シャツ、白いスコート、白いソックスとシューズ)、リストバンド
- pose: テニスラケットを両手で軽く持ち、爽やかな笑顔で正面立ち
- 出力: `public/assets/characters/r_001/stage1/portrait_normal.png`

### r_002 | エスポワール
- features: 淡い水色のロングヘア、優しい水色の瞳、希望に満ちた表情
- costume: 淡い水色のローブ(長袖、ロング丈)、白い縁取り、星形のブローチ
- pose: 星のステッキを両手で胸前に持ち、希望に満ちた笑顔
- 出力: `public/assets/characters/r_002/stage1/portrait_normal.png`

### r_003 | メゾン・カトレア
- features: 紫の長髪、エメラルドグリーンの瞳、髪に紫の蘭の花飾り
- costume: 緑のサンドレス(膝丈、半袖、白いレース襟)、白いストラップサンダル
- pose: 両手で蘭の花束を抱え、上品な微笑
- 出力: `public/assets/characters/r_003/stage1/portrait_normal.png`

### r_004 | ヴィラ・ソレイユ
- features: 金髪のロングヘア(ふんわりウェーブ)、青い瞳、健康的な日焼け肌
- costume: 白いマリンルックドレス(セーラー襟、半袖、膝下丈)、麦わら帽子、白いサンダル
- pose: 片手で麦わら帽子のつばを軽く押さえ、明るい笑顔
- 出力: `public/assets/characters/r_004/stage1/portrait_normal.png`

### r_005 | パレロワイヤル
- features: 淡黄色の髪(緩く結ったポニーテール)、青い瞳、上品な雰囲気
- costume: フランス宮廷風の淡黄色のロングドレス(長袖、フリル装飾)、小さな金のティアラ
- pose: 軽くカーテシーのポーズ、上品な微笑
- 出力: `public/assets/characters/r_005/stage1/portrait_normal.png`

### r_006 | ベルメゾン桜
- features: ピンクの長髪(後ろで桜の花飾りでまとめる)、ピンクの瞳、和風美少女
- costume: 桜柄のピンクの振袖(長袖、ロング丈)、白い帯、桜色の草履
- pose: 片手に和扇、もう片方の手は袖を抑え、和の微笑み
- 出力: `public/assets/characters/r_006/stage1/portrait_normal.png`

### r_007 | グランブルー
- features: 鮮やかな青いロングヘア、青い瞳、海好きの少女
- costume: ネイビーのウェットスーツ風ロングスリーブと白いラインジャケット、ネイビーのロングパンツ、青いゴーグルを首に
- pose: 両手を腰に当てて爽やかに立つ、海の少女の笑顔
- 出力: `public/assets/characters/r_007/stage1/portrait_normal.png`

### r_008 | ピアチェーレ
- features: 茶色のロングカール、明るいオレンジの瞳、陽気なイタリア少女
- costume: 黄色のサマードレス(半袖、膝丈、白いリボン装飾)、白いストッキングと靴
- pose: 両手を軽く広げ、歌うように楽しげに立つ
- 出力: `public/assets/characters/r_008/stage1/portrait_normal.png`

### r_009 | カサノヴァ・ローザ
- features: 燃えるような赤毛のロングヘア、赤い瞳、艶やかな雰囲気
- costume: 深紅のクラシックなロングワンピース(長袖、フリル装飾、ロング丈)、髪に赤い薔薇の飾り
- pose: 片手に赤い薔薇のバスケットを持ち、優雅な微笑
- 出力: `public/assets/characters/r_009/stage1/portrait_normal.png`

### r_010 | セレッソ咲耶
- features: 桜色のセミロング、ピンクの瞳、和洋折衷の雰囲気
- costume: 桜柄の浴衣風ドレス(半袖、膝下丈、桜模様)、白い帯、桜色の鼻緒の下駄
- pose: 片手で和扇を顔の前に軽く広げ、はにかみ笑顔
- 出力: `public/assets/characters/r_010/stage1/portrait_normal.png`

### r_011 | ハイツ・オーロラ
- features: 銀色の長髪、オーロラを思わせる青紫の瞳、神秘的な少女
- costume: 白とブルーのファー付き長いケープ(全身を覆う厚手のロングコート)、白いブーツ
- pose: 片手に銀の短剣を軽く持ち、毅然とした表情
- 出力: `public/assets/characters/r_011/stage1/portrait_normal.png`

### r_012 | フローラ・リアン
- features: 鮮やかな緑の長髪、エメラルドグリーンの瞳、頭に花のリース
- costume: 緑のサマードレス(半袖、膝丈、葉模様の刺繍)、白いストラップサンダル
- pose: 両手で花のリースを軽く持ち、森の妖精のような優しい笑顔
- 出力: `public/assets/characters/r_012/stage1/portrait_normal.png`

### r_013 | リヴェール・ノエル
- features: 銀色のセミロング、青い瞳、冬の少女の雰囲気
- costume: 白いロングコート(長袖、ロング丈、白いファー襟)、赤いマフラー、白いブーツ
- pose: 片手にハンドベルを軽く持ち、雪の中で歌うような穏やかな表情
- 出力: `public/assets/characters/r_013/stage1/portrait_normal.png`

### r_014 | カプリス
- features: 黒髪ツインテール(リボンで結う)、紫の瞳(片目を前髪で隠す)、悪戯っぽい雰囲気
- costume: 黒と紫のゴシック調のロングワンピース(長袖、膝下丈)、黒いリボン、黒いブーツ
- pose: 両手を背中に隠して微笑む、いたずらっぽい表情
- 出力: `public/assets/characters/r_014/stage1/portrait_normal.png`

### r_015 | ミラージュ・ベル
- features: 黒髪ロング、エキゾチックなアンバーの瞳、神秘的な少女
- costume: ターコイズ色の民族衣装風ロングドレス(長袖、ロング丈、金の装飾)、ベール風の薄絹を肩に
- pose: 片手に金の扇、もう片方の手は腰に当て、踊るような優雅なポーズ
- 出力: `public/assets/characters/r_015/stage1/portrait_normal.png`

## N レアリティ (24体)

### n_001 | レジデンスめぐみ
- features: 茶色のロングヘア、優しい琥珀色の瞳、親しみやすい雰囲気
- costume: シンプルな白いワンピース(半袖、膝丈、襟元に小さなリボン)、白いソックスとローファー
- pose: 両手を腰の前で軽く組み、親しみやすい笑顔
- 出力: `public/assets/characters/n_001/stage1/portrait_normal.png`

### n_002 | コーポマロニエ
- features: 栗色のセミロング、緑の瞳、自然派の雰囲気
- costume: 緑のチェック柄ワンピース(半袖、膝丈)、頭に栗の葉のリース、白いストッキング
- pose: 両手で栗の入った小さなバスケットを持ち、にこやかな笑顔
- 出力: `public/assets/characters/n_002/stage1/portrait_normal.png`

### n_003 | ハイツみどり
- features: 緑のショートヘア、緑の瞳、活発で健康的な少女
- costume: 白いシャツとデニムのオーバーオール(長ズボン)、緑のスニーカー
- pose: 両手を腰に当てて元気よく立つ、爽やかな笑顔
- 出力: `public/assets/characters/n_003/stage1/portrait_normal.png`

### n_004 | メゾン青葉
- features: 青葉色のセミロング、青い瞳、知的な少女
- costume: 青い半袖ワンピース(膝丈、白い襟)、白いストッキングとローファー
- pose: 両手で大きな本を抱え、優しく微笑む
- 出力: `public/assets/characters/n_004/stage1/portrait_normal.png`

### n_005 | アパートさくら
- features: 桜色のセミロング、ピンクの瞳、春の少女
- costume: ピンクのカーディガン、白いブラウス、白いプリーツスカート(膝丈)、白いソックス
- pose: 両手で桜の花びらを優しく受けるように軽く前に出す、春らしい笑顔
- 出力: `public/assets/characters/n_005/stage1/portrait_normal.png`

### n_006 | コーポさつき
- features: 短めの赤毛、緑の瞳、活発な少女
- costume: 赤いTシャツとデニムのロングパンツ、白いスニーカー
- pose: 軽く拳を握って元気よく立つ、活発な笑顔
- 出力: `public/assets/characters/n_006/stage1/portrait_normal.png`

### n_007 | ハウスやまぶき
- features: 山吹色のセミロング、黄色みの瞳、明るい少女
- costume: 黄色のサンドレス(半袖、膝丈、白いリボン)、麦わら帽子、白いサンダル
- pose: 麦わら帽子のつばを軽く押さえ、歌うように楽しげな笑顔
- 出力: `public/assets/characters/n_007/stage1/portrait_normal.png`

### n_008 | グリーンハイム
- features: 緑のショートボブ、茶色い瞳、力強い少女
- costume: 緑のオーバーオール(長ズボン)、白いシャツ、麦わら帽子、革のブーツ
- pose: 大きなフォーク(農具)を肩に担ぐように持ち、頼もしい笑顔
- 出力: `public/assets/characters/n_008/stage1/portrait_normal.png`

### n_009 | サンライズ柚月
- features: オレンジ色のセミロング、明るい黄色の瞳、朝陽のような雰囲気
- costume: オレンジのチュニック(七分袖、太もも丈)、白いロングレギンス、白いスニーカー
- pose: 両手を軽く広げて朝陽を浴びるような立ち姿、爽やかな笑顔
- 出力: `public/assets/characters/n_009/stage1/portrait_normal.png`

### n_010 | パークヴィラ
- features: 緑のロングヘア、ヘーゼルの瞳、自然好きの少女
- costume: 緑のフード付きパーカー、白いインナー、デニムのロングパンツ、白いスニーカー
- pose: 片手にリード(犬用)を持つ仕草、フレンドリーな笑顔
- 出力: `public/assets/characters/n_010/stage1/portrait_normal.png`

### n_011 | メゾン・ド・カモミール
- features: 金色のお下げ髪、青い瞳、薬草師の少女
- costume: 黄色のロングワンピース(長袖、膝下丈)、白いエプロン、薬草の入った小さなポーチを腰に
- pose: 両手で小さな薬瓶を持ち、優しく微笑む
- 出力: `public/assets/characters/n_011/stage1/portrait_normal.png`

### n_012 | コートシトラス
- features: オレンジのセミロング、オレンジの瞳、柑橘の少女
- costume: オレンジの長袖カットソーとデニムのロングパンツ、白いスニーカー
- pose: 両手で柑橘の入った小さなバスケットを持ち、爽やかな笑顔
- 出力: `public/assets/characters/n_012/stage1/portrait_normal.png`

### n_013 | レジデンス紫陽花
- features: 紫陽花色(青紫)のセミロング、青い瞳、雨の少女
- costume: 青と紫のレインコート(長袖、膝下丈)、白いレインブーツ
- pose: 片手で透明な傘を開いて差す、穏やかな雰囲気
- 出力: `public/assets/characters/n_013/stage1/portrait_normal.png`

### n_014 | スカイヒルズ星奈
- features: 紺色のセミロング、星のような瞳、天文少女
- costume: 星柄の長袖ロングTシャツと黒のロングスカート、白いソックスとローファー
- pose: 両手で小さな天球儀を持ち、星を見上げるような夢見る表情
- 出力: `public/assets/characters/n_014/stage1/portrait_normal.png`

### n_015 | ハイツ・ラ・パピヨン
- features: ピンクのロングヘア、紫の瞳、蝶の少女
- costume: ピンクのロングスリーブワンピース(膝下丈、薄い透明な蝶の翅のような装飾を背に)、白いストッキング
- pose: 蝶のように軽くスカートを摘んで踊るようなポーズ
- 出力: `public/assets/characters/n_015/stage1/portrait_normal.png`

### n_016 | ヴィレッタ朝霧
- features: 白銀のセミロング、灰色の瞳、朝霧の少女
- costume: 白いロングワンピース(長袖、ロング丈)、薄手の白いショールを肩に
- pose: 両手を胸前で軽く組み、神秘的に微笑む
- 出力: `public/assets/characters/n_016/stage1/portrait_normal.png`

### n_017 | セジュール紗良
- features: 茶色のセミロング、緑の瞳、旅装の少女
- costume: 白いブラウスとロングスカート(膝下丈)、革のジャケットを羽織る、革のブーツ
- pose: 片手に小さな旅行カバンを持ち、もう片方の手で帽子のつばを押さえる、旅人の笑顔
- 出力: `public/assets/characters/n_017/stage1/portrait_normal.png`

### n_018 | カサデルフィオーレ
- features: 緑のロングヘア、緑の瞳、花屋の少女
- costume: 白いブラウスと緑のサロペット(膝下丈)、白いストッキングとローファー、頭に花飾り
- pose: 両手で花束を抱え、優しく微笑む
- 出力: `public/assets/characters/n_018/stage1/portrait_normal.png`

### n_019 | メゾン白菊
- features: 黒髪のロングストレート、白い肌、清楚な少女
- costume: 白い和服(長袖、ロング丈)、薄いピンクの帯、白菊の髪飾り
- pose: 両手を体前で重ね、和の凛とした立ち姿、控えめな微笑
- 出力: `public/assets/characters/n_019/stage1/portrait_normal.png`

### n_020 | ヴィラ・パセリ
- features: 緑のショートボブ、緑の瞳、料理人の少女
- costume: 白いシェフコート(長袖、太もも丈)、緑のシェフ帽、白いエプロン、長いスカート、白いスニーカー
- pose: 片手にお玉、もう片方の手で親指を立てる、楽しげな笑顔
- 出力: `public/assets/characters/n_020/stage1/portrait_normal.png`

### n_021 | ハイツ・カナリア
- features: 金色のセミロング、黄色みの瞳、歌う少女
- costume: 黄色のサンドレス(半袖、膝丈、白いレース襟)、白いソックスとパンプス
- pose: 両手で小さな鳥籠を持ち、口を軽く開けて歌うような楽しげな表情
- 出力: `public/assets/characters/n_021/stage1/portrait_normal.png`

### n_022 | コーポ若葉
- features: 黄緑色のセミロング、明るい緑の瞳、新緑の少女
- costume: 緑の半袖カットソー、デニムのロングパンツ、白いスニーカー
- pose: 両手で若葉の枝を軽く持ち、爽やかな笑顔
- 出力: `public/assets/characters/n_022/stage1/portrait_normal.png`

### n_023 | メゾン木蓮
- features: 白とピンクのグラデーションヘア、ピンクの瞳、木蓮の少女
- costume: 白とピンクのロングドレス(長袖、膝下丈、木蓮の花刺繍)、頭に木蓮の花の冠
- pose: 両手で木蓮の花を捧げ持ち、優しく微笑む
- 出力: `public/assets/characters/n_023/stage1/portrait_normal.png`

### n_024 | パークサイド涼
- features: 水色のセミロング、青い瞳、夏の少女
- costume: 水色のサンドレス(半袖、膝丈、白いリボン)、白いストッキングと白いサンダル
- pose: 片手に和扇、もう片方の手は涼しげに胸前、夏らしい爽やかな笑顔
- 出力: `public/assets/characters/n_024/stage1/portrait_normal.png`

---

# ✅ 開始の合図

このタスク指示書を理解したら、以下の順番で実行を開始してください:

1. ステップ0のディレクトリ作成スクリプトを実行
2. ChatGPTを開いてログイン状態確認
3. **ur_001 グランエルディオン** から順に処理開始
4. 50キャラ完了後、最終レポートを出力

タスク所要時間の見積もり: 1キャラあたり90秒 × 50キャラ = **約75分** (連続稼働時)

不明点があればユーザーに確認、または失敗キャラを記録して進めてください。
