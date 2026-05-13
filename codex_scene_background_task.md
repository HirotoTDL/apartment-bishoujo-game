# Codex タスク指示書: シーン背景画像生成 (7枚)

## 🎯 タスク概要

ハートフルゴリオン(仮) で使用する **シネマティック背景画像7枚** を ChatGPT 画像生成で作成し、
所定ディレクトリに配置する。

> ⚠️ 現在のコード (`src/components/ScenicBackground.vue`) に書かれている SVG は **仮組**
> です。最終的に本タスクで生成した画像で完全に置き換えるため、
> 仮組のクオリティに合わせる必要はなく、**画像生成側で最大品質を狙う** こと。

完成形:
```
C:/Users/user02/Desktop/apartment-bishoujo-game/public/assets/bg/
├── title_cityscape.jpg     (タイトル画面)
├── home_lobby.jpg          (ホーム画面)
├── battle_arena.jpg        (戦闘画面)
├── stages_map.jpg          (ステージ選択)
├── dex_archive.jpg         (アパート図鑑)
├── shop_market.jpg         (ショップ)
└── party_sanctuary.jpg     (編成/キャラ詳細)
```

---

## 🛠 実行プロトコル

### ステップ0: 出力ディレクトリ準備

```powershell
New-Item -ItemType Directory -Force -Path "C:/Users/user02/Desktop/apartment-bishoujo-game/public/assets/bg" | Out-Null
```

### ステップ1: 各シーンを順次生成

下記「7シーン詳細仕様」を順番に処理。各シーンごとに:

1. ChatGPTで **新規チャット** を開く (コンテキスト混在防止)
2. シーン仕様の **プロンプト** をそのまま送信
3. 画像生成完了を待機 (60-120秒)
4. 生成画像を右クリック → 名前を付けて保存
5. ファイル名は `{scene_id}.jpg` (例: `title_cityscape.jpg`)
6. 保存先: `public/assets/bg/{scene_id}.jpg`

### ステップ2: 品質基準チェック

各画像を以下で検証:

| 検証項目 | 基準 | 不合格時の対処 |
|---------|------|---------------|
| 解像度 | 横:縦 = 16:9 (1792x1024 以上を推奨) | 再生成 or 別構図で出し直し |
| ファイルサイズ | 100KB ~ 600KB | 大きすぎる場合は再圧縮 (jpg q=85) |
| 文字・ロゴ・キャラ | 含まれない | プロンプト末尾に "no text, no logos, no characters" を追加して再生成 |
| 中央構図 | 中央30%が比較的落ち着いている (UIに干渉しない) | 構図変更要請して再生成 |
| 色調統一 | 紫・ピンクを基調 | プロンプトに色調を強調して再生成 |

### ステップ3: 圧縮 & リサイズ (任意・推奨)

ChatGPTの出力サイズが大きすぎる場合、PowerShell + ImageMagick または Python で:

```python
# Python例 (PIL使用)
from PIL import Image
import os

bg_dir = "C:/Users/user02/Desktop/apartment-bishoujo-game/public/assets/bg"
for f in os.listdir(bg_dir):
    if not f.endswith(".jpg") and not f.endswith(".png"):
        continue
    p = os.path.join(bg_dir, f)
    img = Image.open(p).convert("RGB")
    # 1920x1080 にフィット (16:9 にクロップ)
    target_ratio = 16 / 9
    ratio = img.width / img.height
    if ratio > target_ratio:
        # 横が広い → 横をクロップ
        new_w = int(img.height * target_ratio)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        # 縦が広い → 縦をクロップ
        new_h = int(img.width / target_ratio)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))
    img = img.resize((1920, 1080), Image.LANCZOS)
    out = os.path.splitext(p)[0] + ".jpg"
    img.save(out, "JPEG", quality=85, optimize=True)
    print(f"{f} -> {os.path.basename(out)} ({os.path.getsize(out) // 1024}KB)")
```

### ステップ4: 整合性レビュー

7枚すべて揃ったら **同一フォルダで一覧表示** し、以下を確認:
- 同じゲーム世界観に見えるか (色調・スタイル統一)
- どれか1枚だけ浮いていないか
- すべて中央UIが配置可能な構図か

問題があれば該当シーンを再生成。

### ステップ5: 完了報告

以下のフォーマットで結果を報告:

```
✅ 成功: 7/7
- title_cityscape.jpg   1920x1080  234KB
- home_lobby.jpg        1920x1080  189KB
...

⚠️ 注意点:
- (もしあれば再生成の経緯や注意点)
```

---

## 🎨 共通スタイル要件

すべてのシーンに以下を適用:

### 必須スタイル
- **アートスタイル**: 日本のアニメ/JRPG コンセプトアート風、絵画的、シネマティック
- **参考スタイル**: 「ファイナルファンタジー XV」「原神」「アズールレーン」「崩壊スターレイル」のシネマティック背景
- **色調**: 紫・ピンク・マゼンタを主体、アクセントに金・水色・群青
- **ライティング**: 雰囲気重視 (夕暮れ・夜・ろうそく・月光・神秘的な内部光源)
- **粒子感**: 微細な光の粒・霧・煙・パーティクル

### 必須除外要素 (negative)
- ❌ 文字・ロゴ・看板の判読可能なテキスト
- ❌ 人物・キャラクター・顔・人型シルエット (建物のシルエットはOK)
- ❌ 直接的なブランドロゴ
- ❌ 強いノイズ・グレイン (微細はOK、ザラザラはNG)
- ❌ ウォーターマーク

### 構図
- **16:9 横長**
- **中央30%は控えめ** (UIテキスト・カードがここに来る)
- 細かいディテールは画面の **左右端・上下端** に配置
- 視線誘導は中央奥や上空など、画面外を意識

### 解像度
- **最低 1024x576** (16:9)
- **推奨 1792x1024 以上** (DALL-E 最大)
- **目標 1920x1080** (リサイズ後)

---

## 📝 共通プロンプトテンプレート

各シーンのプロンプトは以下のテンプレートに従う:

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】{scene_description}
【MOOD】{mood_specification}
【KEY ELEMENTS】{key_visual_elements}
【COLOR PALETTE】{color_palette}
【LIGHTING】{lighting_specification}
【COMPOSITION】The center 30% of the frame should be visually calm
                (UI elements will be placed there). Detail and visual
                interest should be in the edges and corners.
【STYLE】Painterly, atmospheric, cinematic, evocative of Final Fantasy
         XV concept art, Genshin Impact, or Honkai Star Rail backgrounds.
         Detailed but not cluttered. Soft purple-pink dominant palette.

Important constraints:
- No text, no logos, no readable signs, no watermarks
- No human characters, no faces, no silhouettes of people
  (architectural silhouettes are fine)
- No characters of any kind in the foreground
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger preferred)
- No grain or noise overlay (very subtle is OK)
```

---

# 🖼 7シーン詳細仕様

## 1. title_cityscape.jpg — タイトル画面

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】A romantic Japanese-style apartment cityscape at deep twilight,
         showing a wide vista of charming residential buildings with
         warmly lit windows, viewed from a slightly elevated angle.

【MOOD】Nostalgic, dreamy, hopeful, magical-realism. Like the moment
        just after sunset when streetlights and apartment windows
        begin to glow against a deepening sky.

【KEY ELEMENTS】
- Foreground (left/right edges): silhouetted apartment building rooftops
  with antennas, balconies, hanging laundry hint, AC units (no faces),
  power lines crossing the sky
- Mid-ground: layered apartment buildings (3-6 stories) with many
  warm-yellow lit windows, some with curtains showing soft interior
  glow, varied building shapes (modern + traditional Japanese)
- Background: distant city skyline silhouette fading into the sky
- Sky: dramatic gradient from deep navy/violet at top through magenta/
  pink in the middle to warm amber/peach near the horizon
- Atmospheric: scattered cherry blossom petals floating through the air,
  faint stars beginning to appear in the upper sky
- A large soft setting sun or moon glow on the right horizon

【COLOR PALETTE】
- Sky: #1a0a3a (top) → #5a1a5a → #c93a7a → #ff9bbf → #ffd4b8 (horizon)
- Buildings: dark silhouettes (#0a0218, #1a0a2a) with warm yellow
  windows (#ffd680, #ffe4a0)
- Petals: soft pink (#ff9bbf, #ffb8d4)
- Accent: amber sun/moon glow (#ffd4b8)

【LIGHTING】Twilight backlight. Buildings mostly silhouetted against the
            glowing sky, with their windows providing the warm punctuation.
            Petals catch the light softly.

【COMPOSITION】The center horizon line is uncluttered. Title text will
                go in the center upper area. Buttons in lower center.
                Most visual detail (buildings, petals, sun) clusters
                in the lower-left, lower-right, and upper corners.

【STYLE】Painterly, atmospheric, cinematic, evocative of Makoto Shinkai
         film backgrounds (Your Name, Weathering With You) or Genshin
         Impact city scenes. Detailed silhouettes, soft glow, dreamy.

Important constraints:
- No text, no logos, no readable signs, no watermarks
- No human characters, no faces, no silhouettes of people in windows
  (just abstract warm glow)
- No characters of any kind in the foreground
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
- No grain or noise overlay (subtle film grain OK)
```

出力: `public/assets/bg/title_cityscape.jpg`

---

## 2. home_lobby.jpg — ホーム画面

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】Interior of a cozy, slightly upscale apartment building lobby
         or reception area at night, with a large arched window in the
         back wall showing a moonlit city silhouette outside.

【MOOD】Welcoming, warm, slightly nostalgic. A safe homebase feeling.
        Like the lobby of a charming hotel or a quiet library in the
        evening.

【KEY ELEMENTS】
- Floor: polished dark wood or marble with subtle reflections, faint
  grid lines or geometric inlay pattern
- Back wall (center, recessed): a tall arched window taking up the
  upper half of the wall, divided by mullion bars into 4 panes,
  showing distant city skyline silhouette and a glowing pale moon
- Side walls (left/right): warm wall sconces with golden glow,
  rich purple-tinted dark wallpaper or wooden paneling
- Furnishings (foreground left & right edges): tall potted plants
  (small ornamental trees or palms), an antique-style side table with
  a vase of pink/white flowers on one side, hint of an upholstered
  bench or sofa
- Center floor area: a deep red or burgundy ornate carpet runner
  extending from the foreground toward the window
- Ceiling: hint of a crystal chandelier or hanging lantern with soft
  golden light spilling down
- Atmospheric: gentle warm light particles floating like dust motes

【COLOR PALETTE】
- Walls: deep purple-violet (#2a1438, #1a0a28)
- Floor: dark polished surface (#1a0822, #0a0410)
- Window/sky: night blue-purple (#1a0a3a, #5a1a4a) with bright moon
  (#fff4dc)
- Lamps: warm amber (#ffd4b8) with golden glow
- Carpet: rich burgundy (#5a1a3a)
- Plants: muted forest green (#2a4a2a)

【LIGHTING】Warm, golden interior lamps casting pools of light. Cool
            moonlight streaming through the window. Strong contrast
            between warm interior and cool exterior. Soft, inviting.

【COMPOSITION】Symmetrical with the arched window at center back.
                Lamps and plants frame the left/right edges. The center
                ground area is uncluttered (UI panels go here).

【STYLE】Painterly, warm, atmospheric. Evocative of Studio Ghibli interiors,
         or a Tales-series town inn at night. Detailed but not busy.

Important constraints:
- No text, no logos, no readable signs, no watermarks
- No people, no faces, no character silhouettes (architectural and
  natural elements only)
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
- No strong grain or noise
```

出力: `public/assets/bg/home_lobby.jpg`

---

## 3. battle_arena.jpg — 戦闘画面

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】A mystical battle arena: a circular ceremonial floor with
         glowing magic-circle runes etched into ornate tiles, flanked
         by tall stone pillars, set in a dimly lit cavernous space.

【MOOD】Tense, mystical, ceremonial. A sacred place where combat
        rituals take place. Atmospheric but not threatening.

【KEY ELEMENTS】
- Floor: dark tiled ground covering the lower 2/3 of the frame, with
  a large faintly-glowing magic circle in the center (concentric rings,
  pentagram/hexagram patterns, runic inscriptions) emitting soft
  pink/violet light
- Foreground floor edges: smaller geometric tile patterns
- Walls (vanishing into darkness on left and right): tall stone
  pillars (4-6 visible) with carved bases and capitals, gently lit by
  the magic circle below
- Background: cavernous depth fading into shadow, with hints of
  distant arches or stone architecture, a faint upward glow as if
  from above (unseen ceiling)
- Atmospheric: floating purple/pink magical particles, soft light
  rays from above, slight haze for depth
- Floor reflection: subtle wet-stone or polished-marble reflection
  of the magic circle's glow

【COLOR PALETTE】
- Floor: dark slate (#1a0a2a) with magic circle (#ff6b9d, #c34dff)
- Pillars: deep purple stone (#2a1438, #3a1c48)
- Background: black to deep violet gradient (#0a0418 → #2a1438)
- Magic glow: pink-magenta (#ff6b9d) and violet (#c34dff)
- Particles: soft pink-white sparks

【LIGHTING】The main light source is the floor magic circle, casting
            an eerie upward glow on the pillars and creating long
            shadows toward the camera. Cool, mystical.

【COMPOSITION】Strong central symmetry. The center magic circle is
                the visual anchor but its glow is soft enough that
                character cards layered on top remain readable.
                Pillars frame the left/right edges.

【STYLE】Painterly, atmospheric, mystical. Evocative of Final Fantasy
         summoner arenas, Tales of Arise battle backgrounds, or Persona
         5 dungeon entrance halls.

Important constraints:
- No text, no logos, no readable signs, no watermarks
- No people, no faces, no character silhouettes
- The runic inscriptions in the magic circle should be abstract
  symbols, not real readable script
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
- No heavy grain
```

出力: `public/assets/bg/battle_arena.jpg`

---

## 4. stages_map.jpg — ステージ選択

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】An overhead view of an old parchment-style fantasy map showing
         a sprawling residential district with paths connecting various
         apartment landmarks, spread across a wooden tabletop or stone
         alcove.

【MOOD】Adventurous, contemplative, like opening a treasure map.
        A planning-stage feeling. Slightly worn and aged.

【KEY ELEMENTS】
- Background surface: aged parchment paper texture with subtle stains
  and discolorations, or a polished dark wooden table surface
- Map content (covering the whole frame):
  - Topographic contour lines suggesting hills and valleys
  - A dashed/dotted path winding from lower-left to upper-right,
    representing the journey route
  - Small isometric apartment building icons (3-5 of them)
    at various points along the path
  - Cardinal direction compass rose in the upper-left
  - Decorative cartouches or frame elements in the corners
  - Hand-drawn-style mountain or forest illustrations in unused areas
  - Small icons: trees, lanterns, gates
- Lighting accents: a single warm spot of light (as if from a lamp
  off-screen) hitting the parchment, with the edges falling into
  shadow
- Atmospheric: floating dust particles in the lamp light, slight
  haze, faint coffee/tea ring stain in one corner

【COLOR PALETTE】
- Parchment: muted amber/tan (#1a0820 if dark theme, or warm sepia
  for contrast — keep dark-themed)
- Map lines: dark muted ink (#3a1a48)
- Path: pink/magenta accent dashes (#ff6b9d)
- Landmarks: dark purple silhouettes (#7a3a8a)
- Highlight: warm amber lamp glow (#ffd4b8)

【LIGHTING】A single off-camera warm lamp casting a circle of light
            on the map, with edges darkening to vignette. As if
            studying the map alone at night.

【COMPOSITION】The map fills the entire frame. The center has the
                main journey path which should be visible but not
                dominant — UI cards will overlay on the map.

【STYLE】Painterly, hand-drawn cartography aesthetic, vintage
         atmospheric. Evocative of Final Fantasy world maps, Zelda
         field maps, or Dungeons & Dragons map art.

Important constraints:
- No text, no logos, no readable place names, no watermarks
- Compass rose can have abstract N/S/E/W marks but no real readable text
- No people, no faces, no character silhouettes
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
```

出力: `public/assets/bg/stages_map.jpg`

---

## 5. dex_archive.jpg — アパート図鑑

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】Interior of a grand library or archive room with floor-to-
         ceiling bookshelves filled with colorful book spines, ornate
         wooden trim, soft library lighting, and a feeling of vast
         knowledge.

【MOOD】Scholarly, mystical, cozy, anticipatory. Like a magic library
        where each book might contain a secret.

【KEY ELEMENTS】
- Walls: massive wooden bookshelves covering the entire back wall
  and side walls (4-5 tiers high), filled with multicolored book
  spines (reds, blues, greens, purples, golds), some books worn
  with embossed gold accents
- Foreground (slight angle visible): an ornate carved wooden lectern
  or reading desk with a closed leather tome on top, optional candle
  holder with lit candle
- Side accent: a tall ladder leaning against a bookshelf, or a small
  rolling cart with stacked books
- Ceiling (upper edges): warm wooden coffered ceiling visible at the
  top of the frame, with hanging brass or crystal chandeliers casting
  soft golden light
- Floor: deep-red or purple ornate rug pattern (visible only at
  the bottom edge of the frame)
- Atmospheric: floating dust motes in slanted shafts of warm light
  filtering down from an unseen window above

【COLOR PALETTE】
- Bookshelves & wood: deep brown-purple (#3a1820, #1a0810)
- Book spines: varied (#5a1a3a, #3a1a5a, #1a3a5a, #3a5a1a, #5a3a1a),
  desaturated to avoid clashing
- Candles/lights: warm amber (#ffd4b8)
- Walls behind shelves (rare gaps): deep violet (#1f0a30, #0a0218)
- Dust motes: pale gold (#ffe4a0)

【LIGHTING】Soft, warm library lighting from chandeliers above and
            candles/lamps at desk level. Shadows in upper corners.
            Slight godrays of dust-filled light streaming down.

【COMPOSITION】The bookshelves provide a richly textured backdrop with
                horizontal lines from the shelves. The center area is
                relatively uniform (books) so UI cards layer cleanly.
                Foreground desk anchors lower edge.

【STYLE】Painterly, warm, scholarly atmospheric. Evocative of Hogwarts
         library, Studio Ghibli's bookshop interiors (Howl's Moving
         Castle), or the library scenes from Final Fantasy XIV.

Important constraints:
- No text, no logos, no readable book titles, no watermarks
  (book spines should be abstract colored rectangles with optional
  gold lines, no actual letters)
- No people, no faces, no character silhouettes
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
```

出力: `public/assets/bg/dex_archive.jpg`

---

## 6. shop_market.jpg — ショップ

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】Interior of a charming magical merchant's shop or apothecary,
         with shelves of mysterious wares (potions, scrolls, gems,
         curiosities), a wooden counter in the foreground, warm
         golden lighting, and a sense of wonder.

【MOOD】Inviting, curious, slightly mysterious. Like walking into Diagon
        Alley's Ollivander's, or a JRPG item shop where every shelf
        holds adventure.

【KEY ELEMENTS】
- Foreground (lower 1/3): a polished wooden counter running across
  the frame, with a brass or wrought-iron cash register on the side,
  a small scale, a stack of leather-bound contract scrolls, scattered
  gold coins
- Background wall (back): tall wooden shelves filled with:
  - Glass potion bottles of varied colors (pink, blue, green, gold)
  - Rolled-up scrolls tied with ribbons
  - Small ornate boxes and chests
  - Crystal balls or gemstones on display stands
  - Hanging dried herbs from the ceiling beam
  - Antique trinkets and curiosities
- Side wall (left or right): a small leaded-glass window with warm
  light streaming through
- Ceiling: hanging brass lantern with golden flame, hint of wooden
  rafters
- Atmospheric: warm dust particles in the lantern light, faint
  shimmer from gemstones

【COLOR PALETTE】
- Wood (counter, shelves): warm brown (#3a1820, #5a2a30)
- Background wall: deep purple-brown (#1a0a30, #0a0414)
- Potions & gems: jewel tones (jewel pinks, ambers, emeralds, sapphires)
- Lantern/light: warm gold (#ffce4d, #ffd4b8)
- Counter brass/coins: bright gold (#fbbf24)

【LIGHTING】Warm golden lantern light from above creating a cozy
            hearth glow. Cool light through the window on one side
            for contrast. Soft shadows in corners.

【COMPOSITION】The counter establishes the lower foreground; the back
                wall of items provides a rich but visually-calm
                middle (UI items overlay on top); window/lantern
                anchor a corner.

【STYLE】Painterly, atmospheric, JRPG-style shop interior. Evocative
         of Final Fantasy IX shops, or the apothecary scenes in
         anime like Princess Connect / Atelier series.

Important constraints:
- No text, no logos, no readable price tags or book titles,
  no watermarks (any visible markings should be abstract)
- No people, no faces, no character silhouettes (no shopkeeper)
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
```

出力: `public/assets/bg/shop_market.jpg`

---

## 7. party_sanctuary.jpg — 編成/キャラ詳細

```
Wide cinematic 16:9 anime/JRPG concept art background for a bishoujo collection game.

【SCENE】A grand sanctuary or shrine hall with rows of tall stone
         pillars on both sides, hanging silk banners with abstract
         crests, a central raised altar or pedestal in the back, and
         shafts of magical light from above. A ceremonial space where
         heroes gather.

【MOOD】Reverent, majestic, ceremonial, awe-inspiring. A place where
        bonds are forged and oaths sworn.

【KEY ELEMENTS】
- Floor: dark polished stone or marble with subtle inlay patterns
  (geometric or floral motifs), reflective enough to catch some glow
- Pillars (left and right edges, 3-4 visible per side, receding into
  distance with forced perspective): tall, carved stone pillars with
  ornate capitals, glowing decorative gems set in their tops
- Hanging banners (between the pillars, several visible): long
  vertical silk banners in deep purple or magenta with abstract
  geometric crests or stylized blossom emblems
- Background center: a raised altar or pedestal under a large
  circular skylight, with a single beam of warm/cool light streaming
  down onto it
- Atmospheric: floating pink/violet petals or magical sparks drifting
  through the shafts of light, light haze
- Ceiling: hint of vaulted arches or dome structure visible at upper
  edges

【COLOR PALETTE】
- Pillars & stone: deep purple-grey (#3a1830, #1a0816, #5a2a48)
- Banners: rich magenta-purple (#5a1a3a, #ff6b9d accent emblems)
- Light shaft: warm pale gold or soft pink-white (#ffe4f0)
- Floor reflection: subtle pink glow
- Sparks/petals: pale pink-white

【LIGHTING】Cathedral-like overhead light: cool god-ray streaming
            down from a skylight onto the central altar. Gentle
            torches or gem-lights at the tops of pillars provide
            soft accent. Strong vertical light direction.

【COMPOSITION】Strong central symmetry with vanishing point at the
                back-center altar. Pillars frame the left and right.
                The center horizontal middle is calm so character
                cards layer cleanly on top.

【STYLE】Painterly, grand, sacred. Evocative of the Mondstadt cathedral
         in Genshin Impact, the Aetherius hall in Honkai Star Rail,
         or the temple interiors of Fire Emblem games.

Important constraints:
- No text, no logos, no readable inscriptions, no watermarks
  (banner emblems should be abstract geometric shapes, no letters)
- No people, no faces, no character silhouettes
- Aspect ratio strictly 16:9 (landscape)
- Output resolution as large as possible (1792x1024 or larger)
```

出力: `public/assets/bg/party_sanctuary.jpg`

---

# ✅ 完了後の引き渡し手順

7枚すべて `public/assets/bg/` に配置完了したら、私 (Codex) は以下を実行:

1. ファイル一覧と各ファイルサイズを報告
2. 各ファイルの解像度を `Get-Item` または `Identify` で確認
3. 「合計サイズが 5MB 以下か」を確認 (超える場合は再圧縮を実施)
4. ユーザーに「✅ 7/7 完了。組み込みは Claude に依頼してください」と報告

その後、**Claude 側で** 以下を実行 (本ファイルの守備範囲外):

- `ScenicBackground.vue` を、仮組SVG → 実画像参照に置き換え
- `<img>` または `background-image: url()` で `/assets/bg/{scene}.jpg` を参照
- パフォーマンスチェック (preloadのhint等)
- 本番デプロイ

---

# 📌 開始の合図

このタスク指示書を理解したら、以下の順番で実行を開始してください:

1. ステップ0のディレクトリ作成スクリプトを実行
2. ChatGPTを開いてログイン状態を確認
3. **1. title_cityscape.jpg** から順に処理開始
4. 7枚完了後、最終レポートを出力

タスク所要時間の見積もり: 1枚あたり3〜5分 (生成 + ダウンロード + リサイズ確認)
合計: **約25〜40分**

不明点があればユーザーに確認、または失敗した場合は失敗ログを残して進めてください。
