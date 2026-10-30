"""Subset the two web fonts to the characters the site actually uses.

The full fonts are far too large to serve (Noto Sans SC is ~17 MB, Smiley Sans ~1 MB),
so assets/fonts/ only holds subsets. Re-run this after tools/build.py whenever the
text changes, so new characters are in the fonts.

  pip install fonttools brotli
  python tools/subset-cjk-fonts.py [folder]

The folder holds the full NotoSansSC[wght].ttf and SmileySans-Oblique.ttf;
it defaults to fonts-src/ in the repo, which git ignores.

Sources (both SIL Open Font License):
  Noto Sans SC   https://github.com/google/fonts/tree/main/ofl/notosanssc
  Smiley Sans    https://github.com/atelier-anchor/smiley-sans
"""
import glob
import os
import subprocess
import sys

site = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(site, "fonts-src")

files = glob.glob(os.path.join(site, "index*.html")) + glob.glob(os.path.join(site, "writing", "*.html"))
files += glob.glob(os.path.join(site, "assets", "js", "*.js"))
chars = set()
for f in files:
    chars |= set(open(f, encoding="utf-8").read())
# All of printable ASCII and Latin-1, plus common punctuation in both widths,
# so small edits rarely need a re-run
chars |= {chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0xA0, 0x100)}
chars |= set("，。、；：？！「」『』（）《》〈〉【】—–…·～“”‘’０１２３４５６７８９％＋－×÷→←↑↓±σ✓✗★☆▼")
chars = {c for c in chars if c >= " " and c not in "\x7f"}
text = "".join(sorted(chars))
out = os.path.join(site, "assets", "fonts")
print(len(text), "characters")

jobs = [
    # Body text: the variable font, so every weight the site uses is real
    ("NotoSansSC[wght].ttf", "noto-sans-sc.woff2"),
    # Headings
    ("SmileySans-Oblique.ttf", "kn-heading.woff2"),
]
for name, target in jobs:
    subprocess.check_call([sys.executable, "-m", "fontTools.subset", os.path.join(src, name),
                           "--text=" + text, "--flavor=woff2", "--layout-features=*",
                           "--output-file=" + os.path.join(out, target)])
    print(target, os.path.getsize(os.path.join(out, target)) // 1024, "KB")

# A subset is a modified version under the OFL, and Smiley Sans reserves the names
# "Smiley" and "得意黑", so the subset gets its own name (CSS calls it 'KN Heading').
from fontTools.ttLib import TTFont
path = os.path.join(out, "kn-heading.woff2")
font = TTFont(path)
for rec in font["name"].names:
    if rec.nameID in (1, 3, 4, 6, 16, 17, 21, 22):
        rec.string = {6: "KNHeading-Oblique", 3: "KNHeading-Oblique-subset"}.get(rec.nameID, "KN Heading")
font.flavor = "woff2"
font.save(path)
print("renamed", path)
