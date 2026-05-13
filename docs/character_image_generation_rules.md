# Character Image Generation Rules

This document defines the operating rules for generating all character images for
ハートフルゴリオン(仮). Use it for stage variations, expression variations, battle
poses, damage poses, and any future replacement art.

## Scope

- Characters: all 50 `char_id` entries in `src/game/data/characters.ts`.
- Assets: `public/assets/characters/{char_id}/stage{1|2|3}/{pose_id}.png`.
- Prompt source: `image_prompts.json` and `image_prompts.md`.
- Primary target for the current first pass: `stage1/portrait_normal.png`.
- Long-term target: 50 characters x 3 stages x 15 poses = 2250 images.

## Golden Identity Rule

Every character must have one canonical identity sheet before generating many
variants. The identity sheet is the source of truth for:

- Face shape, eye color, hairstyle, hair length, and signature expression.
- Body type and silhouette.
- Costume motifs, key colors, accessories, and held item.
- Element, rarity, apartment-source theme, and personality.
- Forbidden overlaps with other characters.

When generating a new pose or expression, preserve identity first and vary only
the requested pose, expression, stage, or damage state.

## Stage Progression Rule

Stages must read as the same character evolving, not as different characters.

- Stage 1: simple first form, readable silhouette, fewer accessories.
- Stage 2: upgraded outfit, clearer element effects, more ornamentation, same face
  and hair identity.
- Stage 3: final form, strongest rarity expression, most elaborate costume and
  effects, still recognizably the same character.

Allowed stage changes:

- Add armor, robes, ornaments, wings, aura, better weapons, or refined hairstyle.
- Intensify color accents tied to the element and rarity.
- Upgrade fabric quality and accessories.

Not allowed:

- Changing hair color, eye color, face type, body type, or signature item unless
  the character master explicitly says so.
- Making stage 2 or 3 visually contradict stage 1.
- Reusing another character's distinctive motif.

## Pose And Expression Rule

Pose and expression differences must be generated from the same identity.

- `portrait_normal`: neutral standing pose, calm default expression.
- `portrait_smile`: same outfit and stance family, brighter smile.
- `portrait_serious`: same outfit, focused or battle-ready expression.
- `battle_*`: more dynamic pose, weapon or item clearly usable.
- `broken_light`: mildly damaged or tired, no explicit injury, no torn sexualized
  clothing.
- `broken_heavy`: heavily exhausted but still safe for a general audience; avoid
  graphic wounds and avoid revealing body focus.

For expression variants, do not change clothing, accessories, hairstyle, or color
palette except for tiny facial-expression-driven details.

## Consistency Prompt Requirements

Every generation prompt must include:

- `char_id`, character name, rarity, element, stage, and pose id.
- The canonical face, hair, eye, costume, accessory, and silhouette details.
- A statement that the character is clearly an adult.
- Full-body vertical 2:3 framing, head-to-toe visible, centered with padding.
- One character only.
- No text, logo, watermark, background objects, floor plane, or cast shadow.
- Background strategy:
  - If using built-in image generation, use a flat chroma-key background and
    convert it to transparency locally.
  - Do not leave project-bound assets only in the generated-images directory.

## Tasteful Exposure Rule

The art may use tasteful skin exposure when it fits the character concept and
rarity. Keep it suitable for a general-audience fantasy collection game.

Allowed:

- Bare shoulders, sleeveless tops, open jackets, cropped tops, midriff accents,
  short skirts, shorts, thigh-high socks, sandals, and elegant stage costumes.
- Beach, dancer, athletic, or adventurer outfits when they are clearly adult,
  stylized, and non-explicit.
- More elaborate or glamorous exposure for higher evolution stages, while
  preserving the character identity.

Not allowed:

- Nudity, visible nipples, genitals, see-through sexual focus, or explicit poses.
- Camera framing focused on breasts, hips, underwear, or crotch.
- Childlike body proportions combined with revealing outfits.
- Damaged-state clothing used to sexualize the character.

Use exposure intensity deliberately instead of making every character equally
safe-looking.

- Low: wholesome, mostly covered, cute or elegant.
- Medium: bare shoulders, short skirt, shorts, thigh-highs, visible legs, open
  jacket, or cropped top.
- High: adult glamorous social-game styling, emphasized curves, cleavage,
  midriff, high slit, dancer/resort/fantasy costume, or bodycon silhouette.

High exposure is allowed only when the prompt also states that the character is
clearly adult, non-explicit, and not framed as nudity or underwear focus.

## Illustrator Variation Rule

Characters should not all look like one illustrator drew them. Keep the shared
world as a polished anime social game, but vary the apparent artist direction by
character.

Use one art lane per character or small group:

- Soft pastel painterly: airy colors, delicate eyelashes, gentle gradients.
- Crisp cel-shaded: clean linework, sharp silhouettes, bright game-card colors.
- Elegant fantasy: ornate clothing, refined faces, jewelry-like details.
- Sporty pop: energetic proportions, bold shapes, saturated accents.
- Gothic glossy: high contrast, dark fabrics, luminous eyes, dramatic hair.
- Floral watercolor: soft edges, flower motifs, translucent fabric accents.
- Glamorous social-game: adult proportions, confident pose, tasteful sex appeal.
- Retro shoujo: long eyelashes, decorative hair, romantic costume silhouette.

Rules:

- Preserve the character identity and world first.
- Do not copy a named living artist or a specific copyrighted franchise style.
- Vary line thickness, face proportions, shading density, costume detail, and
  color treatment enough that adjacent characters feel like different cards.
- Record the intended art lane in the generation prompt.

## Rarity Impact Rule

Higher rarity characters must feel like premium social-game cards.

- UR: flagship popular-illustrator slot. Use exceptional beauty, ornate costume
  density, striking silhouette, luminous eyes, memorable accessory shapes, and a
  composition that immediately feels special.
- SSR: near-flagship card quality. Use highly polished faces, strong motif
  clarity, richer materials, and a more dramatic pose than R/SR.
- SR: clearly attractive and distinctive, with one strong hook such as weapon,
  costume silhouette, hairstyle, or color contrast.
- R: charming and readable, with one memorable motif and moderate costume
  complexity.
- N: approachable and cute, simpler silhouette, lower ornament density.

High rarity does not need to be universally safe or bland. It may be niche,
gothic, glamorous, majestic, sharp, mysterious, or unusually stylized, but it
must catch the eye and feel deliberately designed.

For UR/SSR prompts, explicitly include:

- `premium popular-illustrator social-game card quality`
- a unique silhouette note
- higher detail density in fabric, hair, eyes, and accessories
- clear adult beauty and rarity presence

Recommended stable prompt ending:

```text
Style: polished Japanese anime game character art, soft clean linework,
colorful cel shading, official character illustration quality.
Composition: vertical 2:3 full body from top of head to feet, generous padding,
character centered, no cropping.
Background: perfectly flat solid #00ff00 chroma-key background for background
removal.
Constraints: one character only, no text, no logo, no watermark, no background
objects, no shadows, no floor plane. Do not use #00ff00 anywhere in the
character.
```

## Overlap Management

Before generating a character, compare it with already generated characters and
the master list.

Check for overlap in:

- Hair color and hairstyle.
- Main clothing category.
- Signature held item.
- Element color palette.
- Rarity silhouette intensity.
- Role fantasy, such as nun, knight, shrine maiden, tennis player, flower girl.

If two characters are close, differentiate with at least two of:

- Hairstyle shape or length.
- Accessory placement.
- Costume cut and fabric type.
- Pose language.
- Main item silhouette.
- Accent color ratio.

Never solve overlap by changing the character's core master concept.

## Quality Gate

An image is accepted only if all checks pass:

- Full body is visible from head to feet.
- Character is centered and not cropped.
- One character only.
- Matches the requested `char_id`, stage, pose, element, and costume concept.
- No unwanted text, watermark, UI, badge, or background scene.
- No anatomy defects that are obvious at card size.
- Chroma-key or transparency does not remove parts of the character.
- PNG is saved at the required path.

If one issue is minor, regenerate once with a targeted prompt. If it still fails,
record the character and reason in the completion report.

## File Handling

- Final files must be PNGs.
- Use stable filenames from `image_prompts.json`.
- Do not overwrite unrelated user assets.
- Keep generated source images in `C:\Users\user02\.codex\generated_images\...`
  unless explicitly told to delete them.
- Copy or convert the accepted final image into the project path.

## Completion Report

Every batch must end with:

```text
Success: N
- char_id list

Failed: M
- char_id: reason

Notes:
- consistency or quality caveats
```

For partial batches, report the exact completed count and next `char_id` to
continue from.
