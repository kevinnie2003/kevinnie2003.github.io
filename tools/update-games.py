"""Refresh the game shelf and anime picks from Bangumi and Steam.

Reads content/games.toml, then:
  * pulls my scores and comments from Bangumi (user xiaoyaya), plus the totals
    shown above the shelf (games played, anime watched, perfect 10s);
  * downloads each cover (Steam's portrait art when there is a Steam app id,
    otherwise the Bangumi image) and the app icons for the games I still play,
    and saves small webp copies under assets/img/games/ and assets/img/anime/;
  * writes content/games-data.json, which tools/build.py reads.

  pip install pillow
  python tools/update-games.py            # only download covers that are missing
  python tools/update-games.py --covers   # download every cover again
"""
import io
import json
import re
import sys
import time
import tomllib
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parent.parent
USER = "xiaoyaya"
UA = {"User-Agent": "kevinnie2003.github.io (https://github.com/kevinnie2003)"}
COVER = (240, 360)
ICON = (128, 128)


def get(url, raw=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        data = r.read()
    return data if raw else json.loads(data.decode("utf-8"))


def collections(subject_type, kinds):
    """All of my Bangumi collections of one subject type (4 games, 2 anime)."""
    out = []
    for kind in kinds:
        offset = 0
        while True:
            d = get(f"https://api.bgm.tv/v0/users/{USER}/collections?subject_type={subject_type}&type={kind}&limit=50&offset={offset}")
            out += d.get("data", [])
            offset += 50
            if offset >= d.get("total", 0):
                break
            time.sleep(0.2)
    return out


def first_sentence(text):
    text = re.sub(r"\s+", " ", (text or "").strip())
    m = re.search(r"[。！？!?]", text)
    return (text[:m.end()] if m else text).strip()


def steam_covers(app_ids):
    """Portrait library art for each Steam app (newer apps use hashed file names)."""
    q = {"ids": [{"appid": i} for i in app_ids], "context": {"language": "english", "country_code": "US"},
         "data_request": {"include_assets": True}}
    d = get("https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=" + urllib.parse.quote(json.dumps(q)))
    covers = {}
    for item in d["response"].get("store_items", []):
        a = item.get("assets") or {}
        if a.get("library_capsule"):
            covers[item["appid"]] = ("https://shared.cloudflare.steamstatic.com/store_item_assets/"
                                     + a["asset_url_format"].split("?")[0].replace("${FILENAME}", a["library_capsule"]))
    return covers


def bangumi_image(subject_id):
    try:
        d = get(f"https://api.bgm.tv/v0/subjects/{subject_id}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Bangumi subject {subject_id} is hidden ({e.code}); give it a Steam id in games.toml") from e
    img = d.get("images") or {}
    return img.get("large") or img.get("common")


def save_image(url, target, size):
    im = Image.open(io.BytesIO(get(url, raw=True))).convert("RGB")
    # Crop to the target shape around the middle, then scale down
    w, h = im.size
    want = size[0] / size[1]
    if w / h > want:
        nw = int(h * want)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / want)
        top = (h - nh) // 3 if size[0] == size[1] else (h - nh) // 2
        im = im.crop((0, top, w, top + nh))
    im = im.resize(size, Image.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target, quality=82, method=6)


def main():
    refresh = "--covers" in sys.argv
    cfg = tomllib.loads((SITE / "content" / "games.toml").read_text(encoding="utf-8"))
    games = collections(4, [2, 3])
    anime = collections(2, [2])
    by_id = {c["subject_id"]: c for c in games + anime}

    entries = [g for s in cfg["shelf"] for g in s.get("games", [])]
    covers = steam_covers(sorted({g["steam"] for g in entries if g.get("steam")}))

    data = {
        "updated": date.today().isoformat(),
        "stats": {
            "games_played": sum(1 for c in games if c["type"] == 2),
            "games_10": sum(1 for c in games if c.get("rate") == 10),
            "anime_watched": len(anime),
            "anime_10": sum(1 for c in anime if c.get("rate") == 10),
        },
        "games": {},
        "anime": {},
    }

    def record(kind, entry, folder):
        c = by_id.get(entry["bgm"])
        if c is None:
            raise SystemExit(f"{entry['zh']} ({entry['bgm']}) is not in my Bangumi collection")
        target = SITE / "assets" / "img" / folder / f"{entry['bgm']}.webp"
        if refresh or not target.exists():
            url = covers.get(entry.get("steam")) or bangumi_image(entry["bgm"])
            save_image(url, target, COVER)
            time.sleep(0.15)
        quote = entry["quote_zh"] if "quote_zh" in entry else first_sentence(c.get("comment"))
        data[kind][str(entry["bgm"])] = {"rate": c.get("rate"), "quote_zh": quote}

    for entry in entries:
        record("games", entry, "games")
    for entry in cfg["anime"]["items"]:
        record("anime", entry, "anime")
    for s in cfg["shelf"]:
        for item in s.get("live", []):
            target = SITE / "assets" / "img" / "games" / f"live-{item['key']}.webp"
            if refresh or not target.exists():
                save_image(item["icon"], target, ICON)

    out = SITE / "content" / "games-data.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(data['games'])} games, {len(data['anime'])} anime -> {out.relative_to(SITE)}")
    print("stats:", data["stats"])


if __name__ == "__main__":
    main()
