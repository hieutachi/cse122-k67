"""Validate the slide order in the static pages before publishing to Pages."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]


class SlideGalleryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.galleries = []
        self.grid_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div":
            if self.grid_depth:
                self.grid_depth += 1
            elif "slide-grid" in attrs.get("class", "").split():
                self.galleries.append([])
                self.grid_depth = 1
        elif tag == "img" and self.grid_depth:
            self.galleries[-1].append(unquote(attrs["src"]))

    def handle_endtag(self, tag):
        if tag == "div" and self.grid_depth:
            self.grid_depth -= 1


def galleries_in(path):
    parser = SlideGalleryParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.galleries


class PublishedSlideOrderTests(unittest.TestCase):
    def test_slide_viewer_uses_numeric_order_for_all_chapters(self):
        galleries = galleries_in(ROOT / "slides" / "index.html")
        self.assertEqual(len(galleries), 9)
        images = list((ROOT / "assets" / "img" / "trucquan").glob("*.jpg"))
        for chapter, gallery in enumerate(galleries, start=1):
            with self.subTest(chapter=chapter):
                # Treat legacy comma/semicolon separators as chapter.slide too.
                pattern = re.compile(rf"{chapter}[.,;](\d+)\.jpg")
                numbered = [(int(match[1]), image.name) for image in images
                            if (match := pattern.fullmatch(image.name))]
                self.assertTrue(numbered, "Chapter must have slide images")
                expected = [f"../assets/img/trucquan/{name}"
                            for _, name in sorted(numbered)]
                self.assertEqual(gallery, expected)

    def test_ebook_galleries_match_slide_viewer(self):
        galleries = galleries_in(ROOT / "slides" / "index.html")
        self.assertEqual(len(galleries), 9)
        for chapter, gallery in enumerate(galleries, start=1):
            with self.subTest(chapter=chapter):
                ebook = ROOT / "ebook" / f"chuong-{chapter}.html"
                self.assertEqual(galleries_in(ebook), [gallery])

    def test_every_image_is_included_once_and_links_exist(self):
        page = ROOT / "slides" / "index.html"
        sources = [src for gallery in galleries_in(page) for src in gallery]
        actual = [(page.parent / src).resolve() for src in sources]
        expected = [p.resolve() for p in
                    (ROOT / "assets" / "img" / "trucquan").glob("*.jpg")]
        self.assertTrue(expected)
        self.assertCountEqual(actual, expected)
        for image in actual:
            with self.subTest(image=image.name):
                self.assertTrue(image.is_file())


if __name__ == "__main__":
    unittest.main()