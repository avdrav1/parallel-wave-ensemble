#!/usr/bin/env bash
# Resizes, grades and compresses the site photos into assets/img/photos/.
# Usage: tools/process-photos.sh <folder with originals>
# Edit the PHOTOS list to add or rename images. Strips all metadata (incl. GPS).
set -euo pipefail
SRC="${1:?folder with original photos}"
OUT="$(dirname "$0")/../assets/img/photos"
mkdir -p "$OUT"

# name : source file : WebP quality : grain (already-textured nature shots get none)
PHOTOS=(
  "listening:PWE2.jpeg:74:0.12"
  "rooftop:PWE3.jpeg:74:0.12"
  "winter:PWE1.jpeg:74:0.12"
  "lake:PWE-image1.jpeg:64:0"
  "leaf:PWE-image2.jpeg:62:0"
)
WIDTHS=(640 1024 1600)

# One warm, slightly matte grade for every photo so they read as a set.
# Muted colour, warm highlights, lifted blacks — a soft film look.
GRADE=(-modulate 102,70,100
       -channel R -evaluate multiply 1.03 -channel B -evaluate multiply 0.93 +channel
       -sigmoidal-contrast 2,45%
       +level 6%,97%)

for entry in "${PHOTOS[@]}"; do
  IFS=: read -r name source quality grain <<< "$entry"; file="$SRC/$source"
  src_w=$(magick "$file" -auto-orient -format '%w' info:)
  for w in "${WIDTHS[@]}"; do
    (( w > src_w )) && w=$src_w
    magick "$file" -auto-orient -strip -colorspace sRGB "${GRADE[@]}" \
      -resize "${w}x>" -attenuate "$grain" +noise Gaussian \
      -quality "$quality" -define webp:method=6 "$OUT/$name-$w.webp"
  done
  echo "$name: $(magick "$OUT/$name-${WIDTHS[0]}.webp" -format '%wx%h' info:) … ${src_w}px source"
done

# Social preview (1200×630 JPEG) from the rooftop performance.
magick "$SRC/PWE3.jpeg" -auto-orient -strip "${GRADE[@]}" -resize 1200x -gravity center -crop 1200x630+0+0 +repage \
  -quality 82 "$OUT/../social-preview.jpg"
echo "social-preview.jpg written"
