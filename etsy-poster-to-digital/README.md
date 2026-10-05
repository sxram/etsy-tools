# Etsy Poster → Digital v0.2

This version groups local printable files and creates one **digital Etsy draft** from one existing physical poster listing.

## Your filename example

```text
Yellow Alien Space Poster_Pip_Comet_3x4_60x80cm_300dpi.jpg
Yellow Alien Space Poster_Pip_Comet_4x3_80x60cm_300dpi.jpg
```

Both are grouped as one digital product: `Yellow Alien Space Poster_Pip_Comet`. Spaces in filenames are fine.

## Upgrade from v0.1

Copy your existing `.env` and `.etsy-token.json` into this folder. Add:

```dotenv
DIGITAL_PRICE=4.49
DIGITAL_FILES_DIR=./digital
DIGITAL_TITLE_SUFFIX= | Printable Wall Art | Digital Download
```

## Scan

```bash
npm run digital:scan -- --dir ./digital
```

## Preview one physical listing

```bash
npm run digital:preview -- --listing 1234567890 --dir ./digital
```

If ambiguous:

```bash
npm run digital:preview -- --listing 1234567890 --dir ./digital --group "Yellow Alien Space Poster_Pip_Comet"
```

## Create one digital draft

```bash
npm run digital:create -- --listing 1234567890 --dir ./digital
```

It reuses the source listing images, creates a new digital **draft**, uploads every grouped file, and does not publish it.


## v0.2.1 matching improvement

The matcher now gives priority to the **main listing title before the first `|`**.

Example:

```text
Purple Alien Space Poster | Cute Alien & Cosmic Cat | Kids Room Wall Art | Galaxy Nursery Decor | Giggle Cosmos
```

The script first extracts:

```text
Purple Alien Space Poster
```

and strongly prefers file groups that start with exactly that phrase, such as:

```text
Purple Alien Space Poster_Nova_Luna
```

This fixes cases where a generic word-overlap matcher would otherwise confuse it with something like `Cute Alien Space Poster_Milo_Cosmo`.

# v0.3 additions

## Better digital titles

The title generator now keeps the complete digital suffix and removes lower-priority source-title segments when necessary. It never deliberately cuts `Digital Download` in the middle.

Example source:

```text
Purple Alien Space Poster | Cute Alien & Cosmic Cat | Kids Room Wall Art | Galaxy Nursery Decor | Giggle Cosmos
```

Typical generated title:

```text
Purple Alien Space Poster | Cute Alien & Cosmic Cat | Galaxy Nursery Decor | Printable Wall Art | Digital Download
```

## Preview every physical poster in one command

```bash
npm run digital:preview-all -- --dir ./originals
```

The table shows:

- Etsy listing ID
- matching status
- match score and gap to the second-best match
- local file group
- number of files
- generated digital title

Statuses:

- `READY`: safe automatic match
- `AMBIGUOUS`: needs manual review
- `GROUP_REUSED`: same local group matched multiple Etsy listings
- `EXISTS`: a listing with the generated digital title already exists

## Create all safe matches in one run

First inspect the plan:

```bash
npm run digital:create-all -- --dir ./originals
```

This still writes nothing.

Then create all `READY` listings as Etsy drafts:

```bash
npm run digital:create-all -- --dir ./originals --confirm
```

The batch continues if one listing fails and prints a result table at the end. No listing is automatically published.

## Single-listing commands are unchanged

```bash
npm run digital:preview -- --listing 4589225523 --dir ./originals
npm run digital:create  -- --listing 4589225523 --dir ./originals
```

The single create command also guards against accidentally creating the same generated digital title twice. Use `--force` only if a duplicate is intentional.


## v0.3.1 — descriptions and tags

Digital drafts no longer copy the physical printing/shipping text blindly.

### Description conversion

Given a physical description like:

```text
[unique artwork description]

Perfect for:
- ...

Print details
[physical paper / printing / shipping / available sizes]
```

v0.3.1 keeps everything before `Print details`, then replaces the rest with a digital-specific block containing:

- the number of downloadable files
- detected aspect ratio/orientation and maximum size from filenames
- download/printing instructions
- no-physical-item notice
- frame/color/personal-use notes

### Generated tags

The original tags are not copied. Up to 13 new tags are generated from:

1. Etsy title phrases
2. useful phrases in the `Perfect for` bullets
3. fixed digital tags from `.env`

Default constants:

```dotenv
DIGITAL_CONSTANT_TAGS=digital download,printable wall art,nursery printable,kids room decor
```

Each generated tag is limited to Etsy's 20-character tag length.

`digital:preview` now prints the generated title, tags and complete new description before anything is written to Etsy.


## v0.3.2 tag improvements

- avoids low-quality near-duplicate tags such as `kids room wall`
- adds stronger theme-aware tags when relevant, for example `space nursery decor`, `galaxy nursery decor`, `alien nursery art`
- suppresses blocked tags via `.env` with `DIGITAL_BLOCKED_TAGS`
- lets you prioritize niche tags via `.env` with `DIGITAL_PREFERRED_TAGS`


## v0.3.3 fix

- fixes Etsy listing-image retrieval endpoint used by batch creation
- `getListingImages` now calls `/application/listings/{listing_id}/images`
- batch failures now report the processing stage, e.g. `loading listing images`, `creating Etsy draft`, or `uploading digital files`


## v0.3.4 upload fix

Etsy requires a separate multipart `name` field when uploading a new digital listing file. v0.3.4 now sends `file`, `name`, and `rank` for each file.

If v0.3.3 already created a draft before the upload failed, inspect Etsy drafts before retrying to avoid keeping an orphan draft.


## v0.3.5: resume failed draft uploads

If Etsy created a draft but a later file upload failed, do **not** create another draft. Resume the existing one:

```bash
npm run digital:resume -- \
  --listing 4589225523 \
  --dir ./originals
```

The command derives the expected digital title, searches your Etsy drafts, and uploads the grouped files to the matching draft.

If more than one matching draft exists, it refuses to guess and prints their IDs. Pick one explicitly:

```bash
npm run digital:resume -- \
  --listing 4589225523 \
  --dir ./originals \
  --draft 1234567890
```

v0.3.5 also uploads grouped files with explicit ranks 1, 2, ... instead of giving every file the same rank.

## v0.3.6 digital finalization + verification

After file upload the tool now:

1. PATCHes the Etsy listing with `type=download`.
2. Reads the listing back.
3. Reads `/shops/{shop_id}/listings/{listing_id}/files`.
4. Verifies every expected filename is attached.
5. Prints the files Etsy reports.

`digital:resume` also checks existing Etsy filenames first and skips them, so a previously successful upload is not duplicated.

For a draft that already has files but did not appear as digital in Etsy, run:

```bash
npm run digital:resume -- --listing SOURCE_LISTING_ID --dir ./originals
```

This will skip existing files, set the draft to `download`, and verify the final state.


## v0.3.7 resume fix

Etsy returns an empty file list for listings that are still marked physical. `digital:resume` now sets the existing draft to `type=download` before checking which files are already attached. This prevents duplicate-upload errors after an earlier upload succeeded but finalization failed.


## v0.3.8 — Instant Download fix

The physical Gelato/POD source listings can have:

```text
when_made=made_to_order
```

Copying that value to a digital Etsy listing makes Etsy treat it as **"made to order" digital**, so uploaded files are not shown as an instant download.

v0.3.8 fixes this by using:

```dotenv
DIGITAL_WHEN_MADE=2020_2026
```

for generated digital listings and by patching resumed drafts with:

- `type=download`
- `when_made=2020_2026` (configurable)
- `is_supply=false`

This means generated digital posters are configured as **instant-download digital items**, not made-to-order digital items.

For an existing draft created by an earlier version, run:

```bash
npm run digital:resume -- \
  --listing <PHYSICAL_SOURCE_LISTING_ID> \
  --dir ./originals
```

The resume step repairs the digital mode and keeps/upload-verifies the files.


## v0.3.9 — Etsy filename normalization

Etsy may store an uploaded digital filename without spaces, for example:

```text
Local:
Purple Alien Space Poster_Nova_Luna_3x4_60x80cm_300dpi.jpg

Etsy:
PurpleAlienSpacePoster_Nova_Luna_3x4_60x80cm_300dpi.jpg
```

The resume and verification logic now compare normalized filenames and ignore spaces,
underscores and hyphens. Existing files are therefore recognized and are not uploaded twice.
