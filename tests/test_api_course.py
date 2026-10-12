"""Standalone three-session reading: content, static assets and local destinations."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "demo/tu-hoc-api"


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.checks = []
        self.readings = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])
        if "data-complete" in attrs:
            self.checks.append(attrs["data-complete"])
        if "data-reading" in attrs:
            self.readings.append(attrs["data-reading"])


class ApiCourseTests(unittest.TestCase):
    def test_all_destinations_and_unique_ids(self):
        for file in COURSE.glob("*.html"):
            page = Page(file.read_text(encoding="utf-8"))
            self.assertEqual(len(page.ids), len(set(page.ids)), file.name)
            for link in page.links:
                parts = urlsplit(link)
                if parts.scheme or parts.netloc:
                    continue
                target = (file.parent / unquote(parts.path)).resolve() if parts.path else file
                with self.subTest(file=file.name, link=link):
                    self.assertTrue(target.is_file(), target)
                    self.assertTrue(target.is_relative_to(ROOT))
                    if parts.fragment:
                        destination = Page(target.read_text(encoding="utf-8"))
                        self.assertIn(unquote(parts.fragment), destination.ids)

    def test_reading_scope_and_demo_controls(self):
        source = (COURSE / "index.html").read_text(encoding="utf-8")
        page = Page(source)
        self.assertEqual(len(page.readings), 17)
        self.assertEqual(page.readings, page.checks)
        self.assertGreater(len(source), 50000)
        for topic in ["Web APIs", "Event Loop", "Callback", "Promise", "REST", "HTTP", "JSON", "CORS", "AbortController", "Dashboard"]:
            self.assertIn(topic, source)
        for html, js in [("index.html", "course.js"), ("project.html", "project.js")]:
            ids = Page((COURSE / html).read_text(encoding="utf-8")).ids
            script = (COURSE / js).read_text(encoding="utf-8")
            for element_id in re.findall(r"\$\('([a-z][a-z0-9-]*[a-z0-9])'\)", script):
                self.assertIn(element_id, ids, f"{js}: {element_id}")

    def test_local_json_contract_and_home_entry(self):
        doctors = json.loads((COURSE / "data/doctors.json").read_text(encoding="utf-8"))
        self.assertEqual(len(doctors), 6)
        self.assertEqual(len({d["id"] for d in doctors}), 6)
        for doctor in doctors:
            self.assertIsInstance(doctor["id"], int)
            self.assertIsInstance(doctor["name"], str)
            self.assertIsInstance(doctor["specialty"], str)
            self.assertGreater(doctor["fee"], 0)
        self.assertEqual(json.loads((COURSE / "data/empty.json").read_text()), [])
        with self.assertRaises(json.JSONDecodeError):
            json.loads((COURSE / "data/not-json.txt").read_text(encoding="utf-8"))
        for file in [ROOT / "index.html", ROOT / "tools/build_site.py"]:
            self.assertIn('href="demo/tu-hoc-api/index.html"', file.read_text(encoding="utf-8"))
        self.assertIn("cp -R assets baidoc data demo ebook slides", (ROOT / ".github/workflows/deploy.yml").read_text())

    def test_remaining_syllabus_has_explanations_and_responsive_visuals(self):
        source = (COURSE / "index.html").read_text(encoding="utf-8")
        page = Page(source)
        for section in ["ban-do-noi-dung", "search-pagination", "components", "lab-search", "lab-component"]:
            self.assertIn(section, page.ids)
        for topic in ["Shared state", "Routing", "React", "Vue", "Angular", "Server-side", "Client-side", "URLSearchParams", "Math.ceil", "slice", "Props", "Payload", "Schema"]:
            with self.subTest(topic=topic):
                self.assertIn(topic, source)
        self.assertGreaterEqual(source.count('class="visual-map"'), 8)
        self.assertGreaterEqual(source.count('class="reading-coach"'), 14)
        self.assertIn('không tạo request mới', source)
        self.assertIn('không gọi HTTP, không đặt lịch, không lưu storage', source)
        self.assertIn('không dán vào Console hoặc script thường', source)
        self.assertIn('Số chương trong đề cương', source)
        self.assertNotIn('href="../../ebook/chuong-7.html">JavaScript', source)


if __name__ == "__main__":
    unittest.main()