#!/usr/bin/env bash
# Rebuild the showcase manifest from the PNGs present in resources/img/services/.
# Add/remove a PNG, run this script, refresh the browser — the card stack updates.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMG_DIR="$DIR/resources/img/services"
OUT="$IMG_DIR/manifest.json"

entries=()
for f in "$IMG_DIR"/*.png; do
  [ -e "$f" ] || continue              # no PNGs -> empty manifest, not a literal glob
  file="$(basename "$f")"
  title="${file%.png}"                 # filename (sans .png) becomes the window title
  title="${title//-/ }"; title="${title//_/ }"
  entries+=("{\"title\": \"$title\", \"file\": \"$file\"}")
done

{
  printf '[\n'
  for i in "${!entries[@]}"; do
    sep=','; [ "$i" -eq $((${#entries[@]} - 1)) ] && sep=''
    printf '  %s%s\n' "${entries[$i]}" "$sep"
  done
  printf ']\n'
} > "$OUT"

echo "wrote $OUT (${#entries[@]} services)"
