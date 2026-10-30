# kevinnie2003.github.io

Personal site of Mingxuan (Kevin) Nie: 小鸭鸭 in Chinese, Nemesie in English.
Plain HTML, CSS and a little JavaScript, generated from the files in `content/`
by one Python script. Push to `main` and GitHub Pages serves it.

Live at **[kevinnie2003.github.io](https://kevinnie2003.github.io)**

## Structure

```
├── content/                  # everything you edit
│   ├── site.toml             # homepage text and data, Chinese and English
│   ├── games.toml            # game shelf and anime picks
│   ├── games-data.json       # scores and quotes from Bangumi (generated)
│   └── posts/                # one file per post per language
│       ├── <slug>.zh.md      #   new posts in Markdown
│       └── <slug>.zh.html    #   older posts kept as HTML
├── tools/
│   ├── build.py              # builds every page, both feeds and the sitemap
│   ├── update-games.py       # refreshes scores and covers from Bangumi and Steam
│   └── subset-cjk-fonts.py   # cuts the two fonts to the characters in use
├── assets/
│   ├── css/site.css          # the whole design, day and night
│   ├── css/forge.css         # the card validator and the audit widget
│   ├── js/site.js            # day/night switch, language switch, homepage dialog
│   ├── js/forge*.js, audit.js
│   ├── fonts/                # font subsets (KN Heading = Smiley Sans, Noto Sans SC)
│   └── img/                  # avatar, logos, project shots, post covers,
│                             # game and anime covers, link-preview images (og/)
├── index.html, index.zh.html # generated: English and Chinese homepage
├── writing/                  # generated: writing/<slug>.html and <slug>.zh.html
├── feed.xml, feed.zh.xml     # generated RSS
└── sitemap.xml               # generated
```

Never edit the generated files by hand; change `content/` and rebuild.
Pages follow the reader's saved choice or system language, and the theme
follows the system until the reader switches it.

## Writing a post

```bash
python tools/build.py new my-post        # creates content/posts/my-post.zh.md and .en.md
```

1. Fill in both files. The block between the `---` lines is the front matter:
   `title`, `date` (YYYY-MM-DD), `description` (search results and link previews),
   `summary` (the homepage list), `cover`, and `lede` (the paragraph under the title).
   Optional: `widgets: forge` or `widgets: audit` to load one of the widgets.
2. Write the body in Markdown: `##` headings, lists, `**bold**`, `*italic*`,
   `` `code` ``, links, images, fenced code blocks, `>` quotes. HTML blocks pass
   through untouched, e.g. `<div class="aside">…</div>`. Anything after a
   `<!-- foot -->` line becomes the closing note.
3. Link to another post with `{post:slug}` and to the homepage with `{home}`;
   both turn into the right language's address.
4. Put a 1280×720 cover at `assets/img/covers/my-post.webp` (images used inside
   the post can go in `assets/img/posts/my-post/`).
5. Build, then refresh the fonts so any new characters are covered:

```bash
python tools/build.py
python tools/subset-cjk-fonts.py
```

The link-preview image `assets/img/og/my-post.jpg` is cut from the cover on the
first build (needs Pillow; without it the cover itself is used).

## Changing the homepage

Edit `content/site.toml` (both `[zh]` and `[en]`, written separately, not
translated by a tool), then run `python tools/build.py`.

## Updating the game shelf and anime

`content/games.toml` lists what goes on the shelf: the Bangumi subject id, the
Steam app id if there is one, the names in both languages, Steam hours, badges,
and the English quotes. Only games scored 9 or 10 go on it, plus an 8 when it
means something (say why in a badge). Then:

```bash
pip install pillow
python tools/update-games.py     # scores, Chinese quotes, totals, and new covers
python tools/build.py
```

## Fonts

`assets/fonts/` only holds subsets. The full fonts live in `fonts-src/`, which
git ignores: `NotoSansSC[wght].ttf` from Google Fonts and
`SmileySans-Oblique.ttf` from github.com/atelier-anchor/smiley-sans (both OFL).

```bash
pip install fonttools brotli
python tools/subset-cjk-fonts.py
```

## Visit stats

Page views go to GoatCounter. The dashboard is
https://kevinnie2003.goatcounter.com (sign in with the GoatCounter account).
The site code is `goatcounter` under `[analytics]` in `content/site.toml`; leave
it empty to turn counting off. Open the site once with `#toggle-goatcounter` at
the end of the address to stop counting your own browser.

## Deploying

```bash
git add .
git commit -m "describe what changed"
git push
```
