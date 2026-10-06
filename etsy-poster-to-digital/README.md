# Etsy Poster → Digital

TypeScript CLI for converting existing physical Etsy poster listings into **digital instant-download draft listings**.

The tool is designed for a workflow where the physical poster already exists on Etsy and the high-resolution printable files are stored locally.

Current state:
- Poster matching works
- Portrait + landscape files can be grouped automatically
- Digital drafts can be created
- Existing drafts can be resumed safely
- Digital files are uploaded and verified
- Listings are configured as **instant downloads**, not "made to order"
- Titles, descriptions and tags are generated/adapted automatically
- Batch preview / creation is supported
- Draft prices can be changed separately with `price-drafts.ts`

---

## Requirements

- Node.js 20+  
- Etsy Developer App
- Etsy API Key / Keystring
- Etsy Shared Secret
- OAuth access to your own Etsy shop

---

## Installation

```bash
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Example:

```dotenv
ETSY_API_KEY=your_keystring
ETSY_SHARED_SECRET=your_shared_secret

ETSY_REDIRECT_URI=http://localhost:3003/oauth/callback
ETSY_SCOPES=shops_r listings_r listings_w

POSTER_KEYWORDS=poster,wall art,nursery,print

DIGITAL_PRICE=2.49
DIGITAL_FILES_DIR=./originals
DIGITAL_TITLE_SUFFIX= | Printable Wall Art | Digital Download

# Important: do not use made_to_order for instant digital downloads.
DIGITAL_WHEN_MADE=2020_2026

DIGITAL_CONSTANT_TAGS=digital download,printable wall art,nursery printable,kids room decor

# Optional
DIGITAL_PREFERRED_TAGS=
DIGITAL_BLOCKED_TAGS=kids room wall,kids room wall art,nursery and kids bedroom decor,alien cosmic
```

---

# Etsy OAuth

Authenticate once:

```bash
npm run auth
```

The browser opens Etsy authorization.

The token is stored locally in:

```text
.etsy-token.json
```

Do not commit `.env` or `.etsy-token.json`.

Check the connected Etsy shop:

```bash
npm run whoami
```

---

# Read Etsy listings

List all active listings:

```bash
npm run list
```

Find physical poster listings:

```bash
npm run posters
```

Exports are written to `out/`.

---

# Local printable files

Place the high-resolution files in a directory such as:

```text
originals/
```

Example:

```text
Purple Alien Space Poster_Nova_Luna_3x4_60x80cm_300dpi.jpg
Purple Alien Space Poster_Nova_Luna_4x3_80x60cm_300dpi.jpg

Yellow Alien Space Poster_Pip_Comet_3x4_60x80cm_300dpi.jpg
Yellow Alien Space Poster_Pip_Comet_4x3_80x60cm_300dpi.jpg
```

Spaces in filenames are fine.

The two Purple Alien files are grouped automatically into one digital product:

```text
Purple Alien Space Poster_Nova_Luna
```

The tool recognizes suffixes such as:

```text
_3x4_60x80cm_300dpi
_4x3_80x60cm_300dpi
_2x3_40x60cm_300dpi
_4x5_40x50cm_300dpi
_portrait
_landscape
_vertical
_horizontal
_hochformat
_querformat
```

---

# Scan local files

```bash
npm run digital:scan -- --dir ./originals
```

Example:

```text
✓ Purple Alien Space Poster_Nova_Luna
  - Purple Alien Space Poster_Nova_Luna_3x4_60x80cm_300dpi.jpg
  - Purple Alien Space Poster_Nova_Luna_4x3_80x60cm_300dpi.jpg
```

---

# Matching logic

For Etsy titles such as:

```text
Purple Alien Space Poster | Cute Alien & Cosmic Cat | Kids Room Wall Art | Galaxy Nursery Decor | Giggle Cosmos
```

the matcher first uses the main title:

```text
Purple Alien Space Poster
```

and strongly prefers:

```text
Purple Alien Space Poster_Nova_Luna
```

over unrelated groups such as:

```text
Cute Alien Space Poster_Milo_Cosmo
```

If matching is not clear enough, the script refuses to guess.

Manual override:

```bash
npm run digital:preview -- \
  --listing 4589225523 \
  --dir ./originals \
  --group "Purple Alien Space Poster_Nova_Luna"
```

---

# Preview one digital listing

```bash
npm run digital:preview -- \
  --listing 4589225523 \
  --dir ./originals
```

Nothing is changed on Etsy.

The preview shows:

- source listing
- matched local files
- generated digital title
- price
- generated tags
- generated digital description

---

# Generated title

The physical Etsy title is adapted for a digital listing.

Example:

```text
Purple Alien Space Poster | Cute Alien & Cosmic Cat | Kids Room Wall Art | Galaxy Nursery Decor | Printable Wall Art | Digital Download
```

The tool keeps the title below Etsy's 140-character limit and avoids cutting words in half.

---

# Description conversion

The unique artwork description is preserved.

Everything starting at:

```text
Print details
```

is removed.

For example, the physical print-specific parts are removed:

- paper type
- GSM
- shipping
- print-on-demand details
- physical size selector
- physical production notes

They are replaced with a digital section such as:

```text
DIGITAL DOWNLOAD

You will receive 2 high-resolution files.

Included files:
- 3:4 portrait — 60 × 80 cm — 300 dpi
- 4:3 landscape — 80 × 60 cm — 300 dpi

How to print
- Download the files after purchase.
- Print at home, at a local print shop, or upload the file to an online printing service.
- Use the file with the aspect ratio matching the intended print size.
- Files can be printed at the listed maximum size or smaller.

Please note
- This is a digital product. No physical item will be shipped.
- Frame is not included.
- Colors may vary depending on screen, printer, paper and print settings.
- Digital files are for personal use unless otherwise stated in the shop terms.
```

---

# Tag generation

Tags are generated automatically from:

- Etsy title
- artwork description
- `Perfect for` bullet points
- theme detection
- fixed digital tags

The tool avoids weak/redundant tags such as:

```text
kids room wall
```

and can create stronger theme tags such as:

```text
alien nursery art
space nursery decor
galaxy nursery decor
space poster
purple alien
cosmic cat
kids room decor
digital download
printable wall art
nursery printable
```

Maximum:

```text
13 tags
```

Each tag is limited to Etsy's maximum length.

Optional `.env` tuning:

```dotenv
DIGITAL_PREFERRED_TAGS=space nursery decor,galaxy nursery decor,alien nursery art
DIGITAL_BLOCKED_TAGS=kids room wall,kids room wall art,alien cosmic
```

---

# Create one digital draft

After checking the preview:

```bash
npm run digital:create -- \
  --listing 4589225523 \
  --dir ./originals
```

The command:

1. reads the physical source listing
2. finds the local printable files
3. generates title
4. generates description
5. generates tags
6. copies listing images
7. creates a new Etsy draft
8. configures it as a digital product
9. uploads all associated files
10. configures it as an **instant download**
11. verifies the uploaded files

It does **not publish** the listing.

---

# Instant Download vs. "Made to order"

This is important.

Physical POD listings often contain:

```text
when_made=made_to_order
```

That value must **not** be copied to the digital listing.

Otherwise Etsy enables:

```text
This digital item is made to order
```

and the uploaded files do not appear as normal instant-download files.

Generated digital listings therefore use:

```text
type=download
when_made=2020_2026
is_supply=false
```

The year range can be configured:

```dotenv
DIGITAL_WHEN_MADE=2020_2026
```

---

# Resume an existing draft

If a draft was already created but a later step failed:

```bash
npm run digital:resume -- \
  --listing 4589225523 \
  --dir ./originals
```

Resume will:

1. find the existing digital draft
2. configure instant-download mode
3. query existing files
4. skip files already attached
5. upload only missing files
6. verify all files

The script also accounts for Etsy changing filenames.

Example:

Local:

```text
Purple Alien Space Poster_Nova_Luna_3x4_60x80cm_300dpi.jpg
```

Etsy may store:

```text
PurpleAlienSpacePoster_Nova_Luna_3x4_60x80cm_300dpi.jpg
```

Spaces, `_` and `-` are ignored when comparing existing files.

---

# Preview all posters

Before creating everything:

```bash
npm run digital:preview-all -- --dir ./originals
```

The batch preview shows all physical posters and their local matches.

Possible statuses include:

```text
READY
AMBIGUOUS
GROUP_REUSED
EXISTS
```

Only safe matches should be created automatically.

---

# Create all safe digital drafts

After reviewing the batch preview:

```bash
npm run digital:create-all -- \
  --dir ./originals \
  --confirm
```

The batch processes all safe matches.

A failure on one product does not stop the remaining products.

No listing is automatically published.

---

# Change prices of digital drafts

The separate helper:

```text
src/price-drafts.ts
```

can change the price of existing digital drafts without modifying descriptions, tags or files.

Preview first:

```bash
npx tsx src/price-drafts.ts preview --price 2.49
```

Apply:

```bash
npx tsx src/price-drafts.ts update --price 2.49 --confirm
```

Only matching **draft listings** are changed.

Published products are not modified.

Listings that are already at the requested price are skipped.

Current recommended launch price:

```text
2.49 €
```

---

# Typical workflow

For new physical posters:

```bash
npm run digital:preview-all -- --dir ./originals
```

Review the matches.

Then:

```bash
npm run digital:create-all -- --dir ./originals --confirm
```

If something fails halfway:

```bash
npm run digital:resume -- \
  --listing PHYSICAL_LISTING_ID \
  --dir ./originals
```

If prices need adjusting later:

```bash
npx tsx src/price-drafts.ts preview --price 2.49
npx tsx src/price-drafts.ts update --price 2.49 --confirm
```

---

# Safety principles

The scripts intentionally:

- create drafts only
- do not publish automatically
- refuse ambiguous filename matches
- prevent obvious duplicate digital drafts
- detect reused file groups
- skip already uploaded files during resume
- require `--confirm` for batch creation and price updates
- leave failed drafts unpublished for manual inspection

---

# Files that should never be committed

```text
.env
.etsy-token.json
node_modules/
out/
```

Recommended `.gitignore`:

```gitignore
node_modules/
.env
.etsy-token.json
out/
dist/
.DS_Store
```
