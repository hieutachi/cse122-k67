"""Keep generator sorting and emitted anchors covered in the publishing repo."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import json
import re

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("course_generator", ROOT / "tools/build_site.py")
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class GeneratorTests(unittest.TestCase):
    def test_learning_guide_escapes_content_and_matches_generated_pages(self):
        guides = json.loads((ROOT / "data/learning_guides.json").read_text(encoding="utf-8"))
        for chapter, guide in guides.items():
            with self.subTest(chapter=chapter):
                page = (ROOT / f"ebook/chuong-{chapter}.html").read_text(encoding="utf-8")
                practice = re.search(r'<a href="../baidoc/([^"]+)">Mở bài hướng dẫn gốc', page)[1]
                rendered = generator.render_learning_guide(guide, practice)
                self.assertIn(rendered, page)
        hostile = dict(guides["1"], task='<img src=x onerror="alert(1)">')
        rendered = generator.render_learning_guide(hostile, 'lesson.html" onclick="alert(1)')
        self.assertIn('&lt;img', rendered)
        self.assertNotIn('<img', rendered)
        self.assertNotIn('" onclick="', rendered)

    def test_numeric_sort_preserves_legacy_urls_and_ties(self):
        cases = [
            ("4.", ["4.10.jpg", "4.2.jpg", "4.9.jpg"], ["4.2.jpg", "4.9.jpg", "4.10.jpg"]),
            ("3.", ["3;11.jpg", "3.2.jpg", "3.11.jpg"], ["3.2.jpg", "3.11.jpg", "3;11.jpg"]),
            ("7.", ["7.10.jpg", "7.3.jpg", "7,3.jpg"], ["7,3.jpg", "7.3.jpg", "7.10.jpg"]),
            ("1.", ["10.1.jpg", "1.1.jpg", "1.0.jpg"], ["1.0.jpg", "1.1.jpg"]),
            ("9.", ["1.0.jpg"], []),
        ]
        for prefix, files, expected in cases:
            with self.subTest(prefix=prefix), patch.object(generator.os, "listdir", return_value=files):
                self.assertEqual(generator.imgs_for(prefix), expected)

    def test_generated_lookup_anchor_and_escaped_title(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            (directory / "data").mkdir()
            (directory / "images").mkdir()
            (directory / "data/bai.json").write_text(json.dumps([
                {"num": 1, "lines": ['<img src=x> & HTML']}
            ]), encoding="utf-8")
            with patch.object(generator, "ROOT", str(directory)), \
                    patch.object(generator, "DATA", str(directory / "data")), \
                    patch.object(generator, "TRUC", str(directory / "images")):
                generator.build_slides()
            text = (directory / "slides/bai.html").read_text(encoding="utf-8")
            self.assertIn('<tr id="bai1">', text)
            self.assertIn('&lt;img src=x&gt; &amp; HTML', text)
            self.assertNotIn('<img src=x>', text)


if __name__ == "__main__":
    unittest.main()