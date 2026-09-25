# CSE122 - Basic Web Application Development (K67)

Static course website for GitHub Pages: Ebook (9 chapters) + slide viewer + live demos.

## Structure
- `index.html` - landing page with 9 chapter cards + search
- `ebook/` - Ebook chapter pages (ASCII diagrams + live demos + visual slide gallery)
- `slides/` - slide viewer: 163 visual JPGs grouped by chapter; `bai.html` = Bai 1-44 title index
- `demo/` - runnable HTML/CSS/JS examples (Box Model, CSS guide, CampusConnect, interactive syllabus at `demo/de-cuong/`) plus per-chapter teaching demos `demo/chuong-1.html` … `chuong-9.html` (hub: `demo/index.html#demo-theo-chuong`, shared widgets in `demo/chuong.css`)
- `assets/` - css/js + `img/trucquan/*.jpg` (converted from PNG via `tools/convert_trucquan.py`)
- `data/` - `decks.json` (38 CSE122 decks), `bai.json` (Bai 1-44 titles)

## Rebuild
The current generator and Markdown converter are now retained in this repository
under `tools/`, alongside the generated HTML. The 64 upstream Markdown lessons
and original demo sources are still external workspace inputs, **not** bundled
here. A standalone clone can serve and test the site; rebuilding lessons requires
the upstream directory. Do not run the old `gen.py` / `gen_part*.py` concatenated
generator to publish: its templates predate these learning fixes.

For this Windows workspace, rebuild course pages without replacing the demos:
```powershell
$repo = 'c:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\cse122-repo'
$upstream = 'c:\Users\N4G\OneDrive\1. TLU\1.Giao An\NTW 2025-2026\K67\_tmp_upstream\course-lessons\vi'
python -B -X utf8 "$repo\tools\build_site.py" --output "$repo" --upstream "$upstream" --content-only
```
CSS, JavaScript, quiz JSON and `data/learning_guides.json` are maintained directly.
The chapter 1–5 learning guides are rendered from that JSON by the generator;
edit their source and rebuild rather than editing generated chapter HTML.

## Deploy
Push this folder (with `.github/workflows/deploy.yml`) to a GitHub repo, enable GitHub Pages via Actions.

## Validate slide ordering
From the repository root, run the standard-library tests (no dependencies):
```powershell
python -m unittest discover -s tests -v
```
The Pages workflow runs these checks before deployment. They verify numeric slide
order (`4.1`, `4.2`, ..., `4.9`, `4.10`) across all nine chapters, matching Ebook
galleries, and complete image coverage with valid links. Legacy filenames such as
`3;11.jpg` and `7,3.jpg` keep their URLs and sort by their chapter/slide numbers.

## Learning Phase 1 — chapters 1–5 release

The local preview was approved for publication on 21 September 2026. Only `main`
may deploy to Pages, including manual workflow dispatches. The workflow validates
the site before uploading only public assets and pages, excluding tests, tools and
local preview reports. Check the latest successful Actions run for deployment status.

- All 27 quiz questions have explanations and local review links. Answer positions
  are balanced in the data and shuffled on each attempt; all content uses text nodes.
- Correct/wrong feedback is explicit, announced to assistive technology, and does
  not rely on color alone. Retry resets the attempt and returns keyboard focus.
- All 44 lesson lookup anchors exist; all 64 reading TOCs precede the article body.
- Nine chapters expose theory → slides → practice → self-check navigation.
- Chapters 1–5 additionally include learning goals, key concepts, timed practice
  guidance, links to source lessons and concrete self-review criteria. No new
  progress keys or external dependencies are needed for these sections.
- Resume uses `cse122-resume-v1` across home/lesson/Ebook indexes. Old `cse122-last`
  and `cse122-last-lesson` keys remain intact; migration prefers a real legacy lesson
  because old keys contain no timestamps. Visiting a new lesson/chapter then wins.
- Existing `cse122-done`, `cse122-font`, and `cse122-quiz-N` storage remain compatible.
  Progress is local to the browser/origin, not a grade or a cross-device account.
- Lightbox reopens with keyboard handling, traps Tab, makes the background inert,
  and restores focus on close. Mobile TOCs start collapsed but are expandable.

### Run all checks

Use Python 3.13 and Node 24. No pip/npm dependencies are required.
Set `$repo` as above, then:

```powershell
python -B -X utf8 -m unittest discover -s "$repo\tests" -v
node --check "$repo\assets\js\app.js"
node --test "$repo\tests\test_runtime.cjs"
node "$repo\tests\browser_smoke.cjs"
```

The browser test auto-detects Chrome/Edge on Windows or Chrome/Chromium on Linux.
Set `CSE122_BROWSER` to an absolute executable path to override. It launches an
isolated temporary browser profile and a loopback-only server, preserving your
personal browser data. It uses real Chromium at desktop and mobile viewport sizes,
not a physical phone or a screen-reader audit. Screenshots and the JSON report are
written to ignored `.preview/`; the temporary profile/server are removed on exit.
Pages runs the Python, Node and Chrome checks before deployment.

### View locally

```powershell
python -m http.server 8122 --bind 127.0.0.1 --directory "$repo"
```

Open http://127.0.0.1:8122/ (Ctrl+C stops the server). Do not use `file://`: quiz
loading needs HTTP. Local preview progress is separate from the live Pages origin.
Production: https://hieutachi.github.io/cse122-k67/
