#!/bin/zsh
# Usage: ./shot.sh <out.png> [width] [height] [page.html]  — rebuilds index.html and screenshots it headlessly
cd "$(dirname "$0")" && python3 build.py >/dev/null
W=${2:-1440}; H=${3:-1580}
P=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$P" \
  --window-size=$W,$H --virtual-time-budget=4000 --screenshot="$1" "file://$PWD/${4:-index.html}" 2>/dev/null
rm -rf "$P"; echo "saved $1"
