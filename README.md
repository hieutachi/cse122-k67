# CSE122 - Basic Web Application Development (K67)

Static course website for GitHub Pages: Ebook (9 chapters) + slide viewer + live demos.

## Structure
- `index.html` - landing page with 9 chapter cards + search
- `ebook/` - Ebook chapter pages (ASCII diagrams + live demos + visual slide gallery)
- `slides/` - slide viewer: 163 visual JPGs grouped by chapter; `bai.html` = Bai 1-44 title index
- `demo/` - runnable HTML/CSS/JS examples (Box Model, CSS guide, CampusConnect)
- `assets/` - css/js + `img/trucquan/*.jpg` (converted from PNG via `tools/convert_trucquan.py`)
- `data/` - `decks.json` (38 CSE122 decks), `bai.json` (Bai 1-44 titles)

## Rebuild
```powershell
python -X utf8 tools/build_site.py
```

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
