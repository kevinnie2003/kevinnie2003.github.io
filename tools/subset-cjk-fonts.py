"""Subset the Chinese web fonts to the characters the site actually uses.

The full fonts are far too large to serve (Noto Sans SC is ~17 MB, Smiley Sans ~1 MB),
so assets/fonts/ only holds subsets. Re-run this after changing any Chinese text
(assets/js/i18n.js, writing/*.zh.html, index.html).

  pip install fonttools brotli
  python tools/subset-cjk-fonts.py <folder with NotoSansSC[wght].ttf and SmileySans-Oblique.ttf>

Sources (both SIL Open Font License):
  Noto Sans SC   https://github.com/google/fonts/tree/main/ofl/notosanssc
  Smiley Sans    https://github.com/atelier-anchor/smiley-sans
"""
import glob
import os
import subprocess
import sys

site = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]

files = [os.path.join(site, "assets", "js", "i18n.js"), os.path.join(site, "index.html")]
files += glob.glob(os.path.join(site, "writing", "*.zh.html"))
chars = set()
for f in files:
    chars |= {c for c in open(f, encoding="utf-8").read() if ord(c) > 0x7F}
# Common punctuation and digits in full-width form, so small edits rarely need a re-run
chars |= set("，。、；：？！「」『』（）《》〈〉【】—…·～“”‘’０１２３４５６７８９％＋－×÷")
text = "".join(sorted(chars))
out = os.path.join(site, "assets", "fonts")
print(len(text), "characters")

jobs = [
    # Body text: the variable font, so every weight the site uses is real
    ("NotoSansSC[wght].ttf", "noto-sans-sc.woff2", ["--layout-features=*"]),
    # Headings
    ("SmileySans-Oblique.ttf", "kn-heading-cjk.woff2", ["--layout-features=*"]),
]
for name, target, extra in jobs:
    subprocess.check_call([sys.executable, "-m", "fontTools.subset", os.path.join(src, name),
                           "--text=" + text, "--flavor=woff2", "--output-file=" + os.path.join(out, target)] + extra)
    print(target, os.path.getsize(os.path.join(out, target)) // 1024, "KB")

# A subset is a modified version under the OFL, and Smiley Sans reserves the names
# "Smiley" and "得意黑", so the subset gets its own name (CSS calls it 'KN Heading').
from fontTools.ttLib import TTFont
path = os.path.join(out, "kn-heading-cjk.woff2")
font = TTFont(path)
for rec in font["name"].names:
    if rec.nameID in (1, 3, 4, 6, 16, 17, 21, 22):
        rec.string = {6: "KNHeading-Oblique", 3: "KNHeading-Oblique-subset"}.get(rec.nameID, "KN Heading")
font.flavor = "woff2"
font.save(path)
print("renamed", path)
