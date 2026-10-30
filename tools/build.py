"""Build the site from content/.

  python tools/build.py              build every page, both feeds and the sitemap
  python tools/build.py new <slug>   start a post: content/posts/<slug>.zh.md and .en.md

Inputs
  content/site.toml        homepage text and data, in Chinese and English
  content/games.toml       game shelf and anime picks
  content/games-data.json  scores and Chinese quotes (tools/update-games.py writes it)
  content/posts/<slug>.<zh|en>.<md|html>
                           one file per post per language: a front matter block,
                           the body, and after a <!-- foot --> line the closing note

Outputs
  index.html (English), index.zh.html (Chinese), writing/<slug>.html and
  writing/<slug>.zh.html, feed.xml, feed.zh.xml, sitemap.xml

No dependencies beyond Python 3.11.
"""
import hashlib
import html
import json
import random
import re
import sys
import tomllib
from datetime import date
from pathlib import Path
from urllib.parse import quote

SITE = Path(__file__).resolve().parent.parent
URL = "https://kevinnie2003.github.io/"
LANGS = ("zh", "en")
HTML_LANG = {"zh": "zh-CN", "en": "en"}


# ── helpers ──────────────────────────────────────────────────────────────

def esc(s):
    return html.escape(str(s), quote=True)


def home_path(lang):
    return "index.zh.html" if lang == "zh" else ""


def post_path(slug, lang):
    return f"writing/{slug}.zh.html" if lang == "zh" else f"writing/{slug}.html"


def resolve(text, lang, root):
    """{post:slug} and {home} in content become links for the right language."""
    text = re.sub(r"\{post:([a-z0-9-]+)\}", lambda m: root + post_path(m.group(1), lang), text)
    return text.replace("{home}", root + home_path(lang) if home_path(lang) else (root or "./"))


def asset_version():
    h = hashlib.sha1()
    for p in sorted((SITE / "assets").glob("*/*.*")):
        if p.suffix in (".css", ".js"):
            h.update(p.read_bytes())
    return h.hexdigest()[:8]


def hours(h, lang, unit):
    if not h or h < 1:
        return ""
    v = f"{h:.1f}".removesuffix(".0")
    return f"<span>{v} {unit}</span>" if lang == "zh" else f"<span>{v}{unit}</span>"


# ── Markdown (the small subset posts need) ───────────────────────────────

CJK = re.compile(r"[　-〿㐀-鿿＀-￯]")


def md_inline(text):
    codes = []

    def keep_code(m):
        codes.append("<code>" + html.escape(m.group(1), quote=False) + "</code>")
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", keep_code, text)
    text = re.sub(r"&(?![a-zA-Z#][a-zA-Z0-9]*;)", "&amp;", text)
    text = re.sub(r"<(?![a-zA-Z/!])", "&lt;", text)
    text = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)',
                  lambda m: f'<img src="{m.group(2)}" alt="{m.group(1)}"' + (f' title="{m.group(3)}"' if m.group(3) else "") + ' loading="lazy" />', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    return re.sub("\x00(\\d+)\x00", lambda m: codes[int(m.group(1))], text)


def join_lines(lines):
    out = ""
    for line in lines:
        line = line.strip()
        if out and not (CJK.search(out[-1]) and CJK.search(line[:1] or " ")):
            out += " "
        out += line
    return out


def markdown(text):
    lines = text.replace("\r\n", "\n").split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            lang = line[3:].strip()
            body = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            cls = f' class="language-{lang}"' if lang else ""
            out.append(f"<pre><code{cls}>" + html.escape("\n".join(body), quote=False) + "</code></pre>")
            continue
        m = re.match(r"(#{1,4})\s+(.*)", line)
        if m:
            level = max(2, len(m.group(1)) + (1 if len(m.group(1)) == 1 else 0))
            out.append(f"<h{level}>{md_inline(m.group(2).strip())}</h{level}>")
            i += 1
            continue
        if re.fullmatch(r"\s*(-{3,}|\*{3,})\s*", line):
            out.append("<hr />")
            i += 1
            continue
        # Everything up to the next blank line is one block
        block = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith("```"):
            block.append(lines[i])
            i += 1
        first = block[0].lstrip()
        if first.startswith("<"):
            out.append("\n".join(block))
        elif first.startswith(">"):
            inner = [re.sub(r"^\s*>\s?", "", b) for b in block]
            out.append("<blockquote>" + markdown("\n".join(inner)) + "</blockquote>")
        elif re.match(r"([-*])\s+", first) or re.match(r"\d+[.)]\s+", first):
            ordered = bool(re.match(r"\d+[.)]\s+", first))
            items, cur = [], []
            for b in block:
                if re.match(r"\s*([-*]|\d+[.)])\s+", b):
                    if cur:
                        items.append(cur)
                    cur = [re.sub(r"^\s*([-*]|\d+[.)])\s+", "", b)]
                else:
                    cur.append(b)
            items.append(cur)
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{md_inline(join_lines(it))}</li>" for it in items) + f"</{tag}>")
        else:
            out.append("<p>" + md_inline(join_lines(block)) + "</p>")
    return "\n\n".join(out)


# ── content ──────────────────────────────────────────────────────────────

def load_posts():
    posts = {}
    for p in sorted((SITE / "content" / "posts").glob("*.*.*")):
        slug, lang, ext = p.name.rsplit(".", 2)
        if lang not in LANGS or ext not in ("md", "html"):
            continue
        text = p.read_text(encoding="utf-8")
        m = re.match(r"---\n(.*?)\n---\n(.*)", text.replace("\r\n", "\n"), re.S)
        if not m:
            raise SystemExit(f"{p.name}: missing the --- front matter block")
        meta = {}
        for line in m.group(1).split("\n"):
            if line.strip():
                k, _, v = line.partition(":")
                meta[k.strip()] = v.strip()
        body, _, foot = m.group(2).partition("<!-- foot -->")
        if ext == "md":
            body, foot = markdown(body), markdown(foot)
            meta["lede"] = md_inline(meta.get("lede", ""))
        for need in ("title", "date", "summary"):
            if not meta.get(need):
                raise SystemExit(f"{p.name}: front matter needs '{need}'")
        meta["widgets"] = [w.strip() for w in meta.get("widgets", "").split(",") if w.strip()]
        posts.setdefault(slug, {})[lang] = {"slug": slug, "lang": lang, "meta": meta,
                                             "body": body.strip(), "foot": foot.strip()}
    for slug, by_lang in posts.items():
        missing = [l for l in LANGS if l not in by_lang]
        if missing:
            raise SystemExit(f"post '{slug}' has no {'/'.join(missing)} version")
    return sorted(posts.values(), key=lambda p: p["zh"]["meta"]["date"], reverse=True)


def read_minutes(post):
    text = re.sub(r"<[^>]+>", " ", post["body"])
    if post["lang"] == "zh":
        n = len(CJK.findall(text)) / 420 + len(re.findall(r"[A-Za-z]+", text)) / 220
    else:
        n = len(re.findall(r"[A-Za-z0-9'’-]+", text)) / 210
    return max(1, round(n))


def fmt_date(iso, lang, short=False):
    y, m, d = (int(x) for x in iso.split("-"))
    if lang == "zh":
        return f"{y}.{m}" if short else f"{y} 年 {m} 月 {d} 日"
    months = ["January", "February", "March", "April", "May", "June", "July", "August",
              "September", "October", "November", "December"]
    return f"{months[m - 1][:3]} {y}" if short else f"{months[m - 1]} {d}, {y}"


# ── shared pieces ────────────────────────────────────────────────────────

DUCK = ('<svg width="34" height="30" viewBox="0 0 34 30" aria-hidden="true"><ellipse cx="18" cy="21" rx="15" ry="8.5" fill="#FFD447"/>'
        '<circle cx="11" cy="11" r="8" fill="#FFD447"/><path d="M2 12 q 2 -3 5 -1 q -2 2 -5 1z" fill="#F08A24"/>'
        '<circle cx="9" cy="9.5" r="1.3" fill="#3A2E29"/><path d="M23 18 q 6 -3 8 2" stroke="#E9A800" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>')
FAVICON = "data:image/svg+xml," + quote(DUCK.replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"').replace('width="34" height="30" ', ""))
SUN = ('<svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>')
MOON = ('<svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>')
CLOUD_A = '<g fill="#fff"><circle cx="50" cy="52" r="28"/><circle cx="92" cy="38" r="36"/><circle cx="138" cy="52" r="26"/><rect x="40" y="52" width="112" height="28" rx="14"/></g>'
CLOUD_B = '<g fill="#fff"><circle cx="55" cy="50" r="26"/><circle cx="98" cy="36" r="34"/><circle cx="140" cy="52" r="24"/><rect x="44" y="50" width="104" height="30" rx="15"/></g>'


def cloud(style, shape, name=""):
    return f'<svg class="cloud {name}" style="{style}" viewBox="0 0 200 80" aria-hidden="true">{shape}</svg>'


def stars(seed=7, n=90):
    rnd = random.Random(seed)
    dots = "".join(f'<circle cx="{rnd.uniform(0, 1200):.0f}" cy="{rnd.uniform(0, 700):.0f}" r="{rnd.uniform(0.6, 1.9):.1f}" opacity="{rnd.uniform(0.35, 1):.2f}"/>'
                   for _ in range(n))
    return f'<svg class="stars" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#FFF6D6">{dots}</g></svg>'


def head(lang, ui, *, title, desc, path, other_path, og_title, og_desc, og_image, root, version, forge=False, og_type="website"):
    other = "en" if lang == "zh" else "zh"
    here = path.rsplit("/", 1)[-1] or "./"
    there = other_path.rsplit("/", 1)[-1] or "./"
    links = [f'<link rel="alternate" hreflang="{HTML_LANG[l]}" href="{URL}{p}" />' for l, p in ((lang, path), (other, other_path))]
    links.append(f'<link rel="alternate" hreflang="x-default" href="{URL}{path if lang == "en" else other_path}" />')
    feed = "feed.zh.xml" if lang == "zh" else "feed.xml"
    css = [f'<link rel="stylesheet" href="{root}assets/fonts/fonts.css?v={version}" />']
    if forge:
        css.append(f'<link rel="stylesheet" href="{root}assets/css/forge.css?v={version}" />')
    css.append(f'<link rel="stylesheet" href="{root}assets/css/site.css?v={version}" />')
    return f"""<!DOCTYPE html>
<html lang="{HTML_LANG[lang]}" data-theme="light">
<head>
<meta charset="UTF-8" />
<script>try{{var p=localStorage.getItem("kn-lang");var w=(p==="zh"||p==="en")?p:(/^zh/i.test(navigator.language||"")?"zh":"en");if(w!=="{lang}"){{try{{sessionStorage.setItem("kn-ref",document.referrer)}}catch(e){{}}location.replace("{there}"+location.hash);}}}}catch(e){{}}</script>
<script>try{{var t=localStorage.getItem("kn-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}</script>
<script>window.KN_LANG = "{lang}"; document.documentElement.classList.add("js");</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="generator" content="tools/build.py" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}" />
<link rel="canonical" href="{URL}{path}" />
{chr(10).join(links)}
<link rel="alternate" type="application/rss+xml" title="{esc(ui['post_ui']['feed_title'])}" href="{URL}{feed}" />
<meta property="og:type" content="{og_type}" />
<meta property="og:title" content="{esc(og_title)}" />
<meta property="og:description" content="{esc(og_desc)}" />
<meta property="og:url" content="{URL}{path}" />
<meta property="og:image" content="{URL}{og_image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{URL}{og_image}" />
<meta name="theme-color" content="#A9D8F5" />
<link rel="icon" type="image/svg+xml" href="{FAVICON}" />
{chr(10).join(css)}
</head>
<body>
<a class="skip" href="#content">{esc(ui['skip'])}</a>
"""


def topbar(lang, ui, *, root, on_home, other_href):
    home = "#" if on_home else (root + home_path(lang) if home_path(lang) else root)
    def nav(key):
        target = f"#{key}" if on_home else f"{home}#{key}" if home != "#" else f"#{key}"
        return f'<a class="nav-link" href="{target}">{esc(ui["nav"][key])}</a>'
    other = "en" if lang == "zh" else "zh"
    return f"""<header class="bar">
  <a class="logo" href="{home}">{DUCK}{esc(ui['site_name'])}</a>
  <nav>{''.join(nav(k) for k in ('work', 'projects', 'posts', 'games', 'anime'))}<button class="pill theme" id="theme" type="button" aria-label="{esc(ui['theme'])}" title="{esc(ui['theme'])}">{SUN}{MOON}</button><a class="pill" href="{other_href}" data-lang="{other}" lang="{HTML_LANG[other]}" aria-label="{esc(ui['other_lang_label'])}">{esc(ui['other_lang'])}</a></nav>
</header>"""


def footer(lang, ui, links, root):
    # The feeds stay available to readers through <link rel="alternate"> in every page head
    f = ui["footer"]
    items = [("mailto:" + links["email"], f["email"]), (links["github"], f["github"]), (links["linkedin"], f["linkedin"]),
             (links["steam"], f["steam"]), (links["xiaoheihe"], f["xiaoheihe"]), (links["bilibili"], f["bilibili"]),
             (links["bangumi"], f["bangumi"])]
    return f"""<footer class="foot">
  <p class="bye">{esc(ui['bye'])}</p>
  <nav>{''.join(f'<a href="{esc(u)}">{esc(t)}</a>' for u, t in items)}</nav>
</footer>"""


def scripts(root, version, count, forge=False, audit=False):
    out = []
    if forge:
        out += [f'<script src="{root}assets/js/forge-data.js?v={version}"></script>', f'<script src="{root}assets/js/forge.js?v={version}"></script>']
    if audit:
        out.append(f'<script src="{root}assets/js/audit.js?v={version}"></script>')
    out.append(f'<script src="{root}assets/js/site.js?v={version}"></script>')
    if count:
        # GoatCounter page views: no cookies, and it skips localhost previews.
        # After a language redirect (see head) report the visitor's own referrer, not our homepage
        out.append('<script>window.goatcounter={referrer:function(r){try{var s=sessionStorage.getItem("kn-ref");if(s!==null){sessionStorage.removeItem("kn-ref");return s}}catch(e){}return r}};</script>')
        out.append(f'<script data-goatcounter="https://{count}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>')
    return "\n".join(out) + "\n</body>\n</html>\n"


# ── homepage ─────────────────────────────────────────────────────────────

def logo_mark(file, size=None):
    # Root-relative: a relative url() inside a custom property would resolve against site.css
    style = f"--logo: url('/assets/img/logos/{file}')"
    if size:
        style += f"; width: {size[0]}px; height: {size[1]}px"
    return f'<span class="logo-mark" style="{style}"></span>'


def section_about(lang, ui, site):
    p = ui["profile"]
    edu = "".join(f'<div class="edu">{logo_mark("ucsd.png")}<div><b>{esc(e[lang]["school"])}{"，" if lang == "zh" else ", "}{esc(e[lang]["degree"])}</b><span>{esc(e[lang]["period"])}</span></div></div>'
                  for e in site["education"])
    skills = "".join(f'<h3>{esc(s[lang])}</h3><div class="chips">{"".join(f"<span>{esc(i)}</span>" for i in s["items"])}</div>' for s in site["skills"])
    links = site["links"]
    return f"""  <section id="about">
    <h2>{esc(ui['titles']['about'])}</h2>
    <div class="panel profile">
      <div>
        <dl class="kv">
          <dt>{esc(p['name_label'])}</dt><dd><b>{esc(p['name'])}</b> <span>{esc(p['name_note'])}</span></dd>
          <dt>{esc(p['doing_label'])}</dt><dd><b>{esc(p['doing'])}</b> <span>{esc(p['doing_note'])}</span></dd>
          <dt>{esc(p['status_label'])}</dt><dd><span class="status">{esc(p['status'])}</span></dd>
          <dt>{esc(p['edu_label'])}</dt><dd>{edu}</dd>
        </dl>
        <div class="links"><a class="btn main" href="mailto:{links['email']}">{esc(p['email'])}</a><a class="btn" href="{links['github']}">GitHub</a><a class="btn" href="{links['linkedin']}">LinkedIn</a></div>
      </div>
      <div class="skills">{skills}</div>
    </div>
  </section>"""


def section_work(lang, ui, site):
    jobs = []
    for job in site["experience"]:
        t = job[lang]
        bullets = "".join(f"<li>{resolve(b, lang, '')}</li>" for b in t["bullets"])
        jobs.append(f"""      <article class="panel job">
        <div class="job-head">{logo_mark(job['logo'], job.get('logo_size'))}<h3>{esc(t['company'])}<span>{esc(t['role'])}</span></h3></div>
        <ul class="list">{bullets}</ul>
        <aside><b>{esc(t['period'])}</b><span>{esc(t['team'])}</span><span>{esc(t['location'])}</span></aside>
        <div class="chips">{''.join(f'<span>{esc(x)}</span>' for x in job['tags'])}</div>
      </article>""")
    return f"""  <section id="work">
    <h2>{esc(ui['titles']['work'])}</h2>
    <div class="jobs">
{chr(10).join(jobs)}
    </div>
  </section>"""


def section_projects(lang, ui, site):
    feats, others = [], []
    for pr in site["projects"]:
        t = pr[lang]
        bullets = "".join(f"<li>{resolve(b, lang, '')}</li>" for b in t["bullets"])
        chips = f'<div class="chips">{"".join(f"<span>{esc(x)}</span>" for x in pr["tags"])}</div>'
        if pr.get("featured"):
            imgs = pr.get("images", [])
            alts = t.get("alt", [])
            links = f'<a class="btn main" href="{pr["github"]}">GitHub</a>'
            if pr.get("post"):
                links += f'<a class="btn" href="{post_path(pr["post"], lang)}">{esc(ui["project_ui"]["how"])}</a>'
            text = f'<h3>{esc(t["name"])}</h3><p class="when">{esc(t["period"])}</p><ul class="list">{bullets}</ul>'
            if pr.get("widget") == "forge":
                left = (text + f'<div class="shot"><img src="assets/img/projects/{imgs[0]}" alt="{esc(alts[0])}" loading="lazy" /></div>'
                        + chips + f'<div class="links">{links}</div>')
                right = '<div class="forge" id="forge"></div>'
                feats.append(f'    <article class="panel feature">\n      <div>{left}</div>\n      {right}\n    </article>')
            else:
                gallery = f'<div class="shot"><img src="assets/img/projects/{imgs[0]}" alt="{esc(alts[0])}" loading="lazy" /></div>'
                if len(imgs) > 1:
                    gallery += '<div class="thumbs">' + "".join(f'<img src="assets/img/projects/{im}" alt="{esc(a)}" loading="lazy" />' for im, a in zip(imgs[1:], alts[1:])) + "</div>"
                feats.append(f'    <article class="panel feature">\n      <div>{gallery}</div>\n      <div>{text}{chips}<div class="links">{links}</div></div>\n    </article>')
        else:
            gh = f'<a class="gh" href="{pr["github"]}">GitHub</a>' if pr.get("github") else ""
            others.append(f'      <article class="panel other"><h3>{esc(t["name"])}</h3><p class="when">{esc(t["period"])}{gh}</p><ul class="list">{bullets}</ul>{chips}</article>')
    return f"""  <section id="projects">
    <h2>{esc(ui['titles']['projects'])}</h2>
{chr(10).join(feats)}
    <div class="others">
{chr(10).join(others)}
    </div>
  </section>"""


def section_posts(lang, ui, posts):
    slots = []
    total = len(posts)
    for n, p in enumerate(posts):
        m = p[lang]["meta"]
        no = f"No.{total - n:02d}"
        slots.append(f'      <a class="panel slot" href="{post_path(p[lang]["slug"], lang)}"><img src="assets/img/covers/{esc(m["cover"])}" alt="" loading="lazy" />'
                     f'<div><div class="no">{no}　{fmt_date(m["date"], lang, short=True)}</div><h3>{esc(m["title"])}</h3><p>{esc(m["summary"])}</p></div></a>')
    return f"""  <section id="posts">
    <h2>{esc(ui['titles']['posts'])}</h2>
    <div class="slots">
{chr(10).join(slots)}
    </div>
  </section>"""


def game_card(lang, entry, info, badges, unit, quote_mode):
    rate = info.get("rate")
    name = entry[lang]
    score = f'<em class="score{" s10" if rate == 10 else ""}">{rate}</em>' if rate else ""
    # A quote_zh in games.toml wins over the first sentence of my Bangumi comment
    quote_text = entry.get("quote_zh", info.get("quote_zh", "")) if lang == "zh" else entry.get("quote_en", "")
    parts = [f'<img src="{{folder}}/{entry["bgm"]}.webp" alt="{esc(name)}" loading="lazy" />', score, f"<b>{esc(name)}</b>"]
    if quote_mode and quote_text:
        parts.append(f"<q>{esc(quote_text)}</q>")
    parts.append(hours(entry.get("hours"), lang, unit))
    if entry.get("badge"):
        parts.append(f'<i>{esc(badges[entry["badge"]][lang])}</i>')
    title = f' title="{esc(quote_text)}"' if (quote_text and not quote_mode) else ""
    return f'          <a class="game" href="https://bgm.tv/subject/{entry["bgm"]}"{title}>' + "".join(parts) + "</a>"


def section_games(lang, ui, site, games, data):
    g = ui["games_ui"]
    st = data["stats"]
    steam = games["steam"]
    shelves = []
    for s in games["shelf"]:
        if s.get("live"):
            tiles = "".join(f'<div class="panel"><img src="assets/img/games/live-{it["key"]}.webp" alt="{esc(it[lang])}" loading="lazy" /><div><b>{esc(it[lang])}</b>'
                            + "".join(f"<span>{esc(n)}</span>" for n in it[f"{lang}_notes"]) + "</div></div>" for it in s["live"])
            shelves.append(f'      <div>\n        <h3 class="shelf-head">{esc(s[lang])}</h3>\n        <div class="live">{tiles}</div>\n      </div>')
            continue
        top = s["id"] == "top"
        cards = "\n".join(game_card(lang, e, data["games"][str(e["bgm"])], games["badges"], g["hours_unit"], top).replace("{folder}", "assets/img/games")
                          for e in s["games"])
        shelves.append(f'      <div>\n        <h3 class="shelf-head">{esc(s[lang])}</h3>\n        <div class="shelf{" top" if top else ""}">\n{cards}\n        </div>\n      </div>')
    creators = "".join(f'<a class="panel" href="{site["links"][c["link"]]}"><b>{esc(c["label"])}</b><strong>{esc(c["value"])}</strong><span>{esc(c["note"])}</span></a>'
                       for c in ui["creator"])
    return f"""  <section id="games">
    <h2>{esc(ui['titles']['games'])}</h2>
    <div class="stats">
      <div><b>{st['games_played']}</b>{esc(g['played'])}</div>
      <div><b>{st['games_10']}</b>{esc(g['tens'])}</div>
      <div><b>{steam['hours']}</b>{esc(g['hours'])}</div>
      <div><b>{steam['achievements']}</b>{esc(g['achievements'])}</div>
      <div><b>{steam['level']}</b>{esc(g['level'])}</div>
    </div>
    <div class="cabinet">
{chr(10).join(shelves)}
    </div>
    <p class="bgm-all"><a class="btn" href="{site['links']['bangumi_games']}">{esc(g['all'].format(n=st['games_played']))}</a></p>
    <div class="creator">{creators}</div>
  </section>"""


def section_anime(lang, ui, site, games, data):
    a = ui["anime_ui"]
    st = data["stats"]
    cards = "\n".join(game_card(lang, e, data["anime"][str(e["bgm"])], games["badges"], "", True).replace("{folder}", "assets/img/anime")
                      for e in games["anime"]["items"])
    return f"""  <section id="anime">
    <h2>{esc(ui['titles']['anime'])}</h2>
    <div class="stats">
      <div><b>{st['anime_watched']}</b>{esc(a['watched'])}</div>
      <div><b>{sum(1 for e in games['anime']['items'] if data['anime'][str(e['bgm'])].get('rate') == 10)}</b>{esc(a['tens'])}</div>
    </div>
    <div class="cabinet">
      <div class="shelf top">
{cards}
      </div>
    </div>
    <p class="bgm-all"><a class="btn" href="{site['links']['bangumi_anime']}">{esc(a['all'].format(n=st['anime_watched']))}</a></p>
  </section>"""


def build_home(lang, site, games, data, posts, version):
    ui = site[lang]
    other = "en" if lang == "zh" else "zh"
    path = home_path(lang) or ""
    other_href = "./" if lang == "zh" else "index.zh.html"
    clouds = (cloud("left:-3%; top:9%; width:300px", CLOUD_A, "c1") + cloud("right:6%; top:13%; width:240px", CLOUD_B, "c2")
              + cloud("right:-4%; top:40%; width:380px", CLOUD_A, "c3") + cloud("left:30%; top:56%; width:200px", CLOUD_B, "c4"))
    choices = "".join(f'<a href="#{k}">{esc(t)}</a>' for k, t in ui["choices"])
    lines = json.dumps(ui["lines"], ensure_ascii=False).replace("</", "<\\/")
    out = head(lang, ui, title=ui["page_title"], desc=ui["description"], path=path, other_path=home_path(other),
               og_title=ui["site_name"], og_desc=ui["description"], og_image=f"assets/img/og/home.{lang}.jpg", root="", version=version, forge=True)
    out += f"""<div class="scene">
  {stars()}<div class="moon" aria-hidden="true"></div>
  {clouds}
  {topbar(lang, ui, root='', on_home=True, other_href=other_href)}
  <div class="title">
    <h1>{esc(ui['site_name'])}</h1>
    <p>{esc(ui['real_name'])}</p>
  </div>
  <nav class="choices" id="choices">{choices}</nav>
  <div class="vn">
    <div class="box" id="box" tabindex="0">
      <img class="face" src="assets/img/avatar.png" alt="{esc(ui['avatar_alt'])}" />
      <div>
        <p class="line" id="line">{esc(ui['lines'][0])}</p>
        <div class="controls"><button type="button" id="skip">{esc(ui['skip_line'])}</button><button type="button" id="log">{esc(ui['log_line'])}</button><a href="{other_href}" data-lang="{other}" lang="{HTML_LANG[other]}">{esc(ui['lang_line'])}</a></div>
      </div>
      <span class="nameplate">{esc(ui['site_name'])}</span>
      <span class="next" id="next" aria-hidden="true">▼</span>
    </div>
  </div>
  <script type="application/json" id="vn-lines">{lines}</script>
</div>

<main class="home" id="content">
{section_about(lang, ui, site)}

{section_work(lang, ui, site)}

{section_projects(lang, ui, site)}

{section_posts(lang, ui, posts)}

{section_games(lang, ui, site, games, data)}

{section_anime(lang, ui, site, games, data)}
</main>

{footer(lang, ui, site['links'], '')}
"""
    out += scripts("", version, site["analytics"]["goatcounter"], forge=True)
    (SITE / ("index.zh.html" if lang == "zh" else "index.html")).write_text(out, encoding="utf-8")


# ── posts ────────────────────────────────────────────────────────────────

def share_image(slug, cover):
    """The 1200x630 link-preview image: cut from the cover the first time (needs Pillow),
    otherwise the cover itself."""
    og = SITE / "assets" / "img" / "og" / f"{slug}.jpg"
    src = SITE / "assets" / "img" / "covers" / cover
    if not og.exists() and src.exists():
        try:
            from PIL import Image
            im = Image.open(src).convert("RGB")
            w, h = im.size
            nh = int(w * 630 / 1200)
            top = max(0, (h - nh) // 2)
            og.parent.mkdir(parents=True, exist_ok=True)
            im.crop((0, top, w, top + nh)).resize((1200, 630), Image.LANCZOS).save(og, quality=86)
        except ImportError:
            pass
    return f"assets/img/og/{slug}.jpg" if og.exists() else f"assets/img/covers/{cover}"


def build_post(post, lang, posts, site, version):
    ui = site[lang]
    me = post[lang]
    m = me["meta"]
    slug = me["slug"]
    other = "en" if lang == "zh" else "zh"
    root = "../"
    widgets = m["widgets"]
    # Two other posts, nearest in time first
    order = [p["zh"]["slug"] for p in posts]
    i = order.index(slug)
    near = sorted((p for p in posts if p["zh"]["slug"] != slug), key=lambda p: abs(order.index(p["zh"]["slug"]) - i))[:2]
    near.sort(key=lambda p: p["zh"]["meta"]["date"], reverse=True)
    total = len(posts)
    more = "".join(
        f'<a class="panel" href="{p[lang]["slug"]}{".zh" if lang == "zh" else ""}.html"><img src="../assets/img/covers/{esc(p[lang]["meta"]["cover"])}" alt="" loading="lazy" />'
        f'<div><span>No.{total - order.index(p["zh"]["slug"]):02d}　{fmt_date(p[lang]["meta"]["date"], lang, short=True)}</span><b>{esc(p[lang]["meta"]["title"])}</b></div></a>'
        for p in near)
    band_clouds = (cloud("left:-2%; top:34%; width:220px", CLOUD_A) + cloud("right:16%; top:20%; width:170px", CLOUD_B)
                   + cloud("right:-3%; top:58%; width:260px", CLOUD_A))
    minutes = ui["post_ui"]["minutes"].format(n=read_minutes(me))
    og_image = share_image(slug, m["cover"])
    lede = f'<p class="lede">{resolve(m["lede"], lang, root)}</p>' if m.get("lede") else ""
    foot = resolve(me["foot"], lang, root)
    out = head(lang, ui, title=f'{m["title"]} | {ui["site_name"]}', desc=m.get("description") or m["summary"], path=post_path(slug, lang),
               other_path=post_path(slug, other), og_title=m["title"], og_desc=m.get("og") or m["summary"],
               og_image=og_image, root=root, version=version, forge=bool(widgets), og_type="article")
    out += f"""<div class="sky-band">
  {stars(seed=len(slug))}<div class="moon" aria-hidden="true"></div>
  {band_clouds}
  {topbar(lang, ui, root=root, on_home=False, other_href=post_path(slug, other).split('/')[-1])}
</div>

<main class="post" id="content">
  <div class="post-cover"><img src="../assets/img/covers/{esc(m['cover'])}" alt="" /></div>
  <header class="post-head">
    <p class="meta"><time datetime="{m['date']}">{fmt_date(m['date'], lang)}</time>　{esc(minutes)}</p>
    <h1>{esc(m['title'])}</h1>
    {lede}
  </header>
  <div class="prose">
{resolve(me['body'], lang, root)}
  </div>
  <footer class="post-foot">
    {foot}
    <h2 class="shelf-head" style="margin-top:1.6rem">{esc(ui['post_ui']['more'])}</h2>
    <nav class="more">{more}</nav>
  </footer>
</main>

{footer(lang, ui, site['links'], root)}
"""
    out += scripts(root, version, site["analytics"]["goatcounter"], forge="forge" in widgets, audit="audit" in widgets)
    target = SITE / post_path(slug, lang)
    target.parent.mkdir(exist_ok=True)
    target.write_text(out, encoding="utf-8")


# ── feeds and sitemap ────────────────────────────────────────────────────

def rfc822(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    day = date(y, m, d)
    return day.strftime("%a, %d %b %Y 00:00:00 +0000")


def build_feed(lang, site, posts):
    ui = site[lang]["post_ui"]
    name = "feed.zh.xml" if lang == "zh" else "feed.xml"
    items = "".join(f"""
  <item>
    <title>{esc(p[lang]['meta']['title'])}</title>
    <link>{URL}{post_path(p[lang]['slug'], lang)}</link>
    <guid>{URL}{post_path(p[lang]['slug'], lang)}</guid>
    <pubDate>{rfc822(p[lang]['meta']['date'])}</pubDate>
    <description>{esc(p[lang]['meta'].get('description') or p[lang]['meta']['summary'])}</description>
  </item>""" for p in posts)
    (SITE / name).write_text(f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{esc(ui['feed_title'])}</title>
  <link>{URL}{home_path(lang)}#posts</link>
  <description>{esc(ui['feed_description'])}</description>
  <language>{HTML_LANG[lang]}</language>
  <atom:link href="{URL}{name}" rel="self" type="application/rss+xml" />{items}
</channel>
</rss>
""", encoding="utf-8")


def build_sitemap(posts):
    today = date.today().isoformat()
    urls = [(URL, today, "1.0"), (URL + "index.zh.html", today, "0.9")]
    for p in posts:
        for lang in LANGS:
            urls.append((URL + post_path(p[lang]["slug"], lang), p[lang]["meta"]["date"], "0.8" if lang == "en" else "0.7"))
    body = "".join(f"\n  <url><loc>{u}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>" for u, d, pr in urls)
    (SITE / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}\n</urlset>\n', encoding="utf-8")


# ── new post ─────────────────────────────────────────────────────────────

def new_post(slug):
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        raise SystemExit("slug: lowercase letters, digits and dashes, e.g. my-new-post")
    today = date.today().isoformat()
    templates = {
        "zh": f"""---
title: 标题
date: {today}
description: 一两句话，搜索结果和分享卡片里显示
summary: 首页文章列表里显示的一两句话
cover: {slug}.webp
lede: 标题下面那段开场白
---
正文用 Markdown 写。空一行是新段落。

## 小标题

- 列表
- **加粗**、*斜体*、`代码`、[链接](https://example.com)

![图片说明](../assets/img/posts/{slug}/1.webp)

<!-- foot -->
结尾那段，可以写相关文章。
""",
        "en": f"""---
title: Title
date: {today}
description: One or two sentences for search results and link previews
summary: One or two sentences for the list on the homepage
cover: {slug}.webp
lede: The opening paragraph under the title
---
Write the body in Markdown. A blank line starts a new paragraph.

## A heading

- A list
- **bold**, *italic*, `code`, [a link](https://example.com)

![What the image shows](../assets/img/posts/{slug}/1.webp)

<!-- foot -->
A closing note, e.g. related posts.
""",
    }
    for lang, text in templates.items():
        p = SITE / "content" / "posts" / f"{slug}.{lang}.md"
        if p.exists():
            raise SystemExit(f"{p.name} already exists")
        p.write_text(text, encoding="utf-8")
        print("created", p.relative_to(SITE))
    print(f"Put a 1280x720 cover at assets/img/covers/{slug}.webp, then run: python tools/build.py")


# ── main ─────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "new":
        new_post(sys.argv[2])
        return
    site = tomllib.loads((SITE / "content" / "site.toml").read_text(encoding="utf-8"))
    games = tomllib.loads((SITE / "content" / "games.toml").read_text(encoding="utf-8"))
    data = json.loads((SITE / "content" / "games-data.json").read_text(encoding="utf-8"))
    posts = load_posts()
    version = asset_version()
    for lang in LANGS:
        build_home(lang, site, games, data, posts, version)
        for p in posts:
            build_post(p, lang, posts, site, version)
        build_feed(lang, site, posts)
    build_sitemap(posts)
    # Drop pages of posts whose source is gone (only pages this script made)
    keep = {SITE / post_path(p[l]["slug"], l) for p in posts for l in LANGS}
    for page in (SITE / "writing").glob("*.html"):
        if page not in keep and 'content="tools/build.py"' in page.read_text(encoding="utf-8", errors="ignore"):
            page.unlink()
            print("removed", page.relative_to(SITE))
    missing = [str(p) for p in [SITE / "assets" / "img" / "covers" / p[l]["meta"]["cover"] for p in posts for l in LANGS] if not p.exists()]
    for m in sorted(set(missing)):
        print("missing cover:", m)
    print(f"built 2 homepages, {len(posts) * 2} posts, 2 feeds, sitemap (assets v={version})")


if __name__ == "__main__":
    main()
