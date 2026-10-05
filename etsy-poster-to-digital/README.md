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
