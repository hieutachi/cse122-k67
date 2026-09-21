"""Content and navigation regression checks, using only the standard library."""
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = []
        self.links = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])


class LearningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {p.resolve(): Page(p) for p in ROOT.rglob("*.html")}
        cls.quiz = json.loads((ROOT / "data/quiz.json").read_text(encoding="utf-8"))["chapters"]

    def assert_link(self, source, href):
        url = urlsplit(href)
        if url.scheme or url.netloc:
            return
        target = (source.parent / unquote(url.path)).resolve() if url.path else source.resolve()
        if target.is_dir():
            target = target / "index.html"
        self.assertTrue(target.exists(), f"Missing page: {source.name} -> {href}")
        if url.fragment and target in self.pages:
            self.assertIn(unquote(url.fragment), self.pages[target].ids,
                          f"Missing anchor: {source.name} -> {href}")

    def test_internal_course_links_and_anchors(self):
        for path, page in self.pages.items():
            if path.relative_to(ROOT).parts[0] == "demo":
                continue  # Preserve self-contained teaching demos.
            with self.subTest(page=path.name):
                self.assertEqual(len(page.ids), len(set(page.ids)), "Duplicate IDs")
                for link in page.links:
                    self.assert_link(path, link)

    def test_all_44_lookup_rows_have_destinations(self):
        page = self.pages[(ROOT / "slides/bai.html").resolve()]
        self.assertEqual({i for i in page.ids if re.fullmatch(r"bai\d+", i)},
                         {f"bai{i}" for i in range(1, 45)})

    def test_all_64_tocs_are_before_lesson_body(self):
        lessons = [p for p in (ROOT / "baidoc").glob("*.html") if p.name != "index.html"]
        self.assertEqual(len(lessons), 64)
        for path in lessons:
            with self.subTest(page=path.name):
                text = path.read_text(encoding="utf-8")
                self.assertEqual(text.count('class="lesson-toc"'), 1)
                self.assertLess(text.index('class="lesson-toc"'), text.index('class="lesson-body"'))

    def test_every_chapter_has_four_learning_steps(self):
        for chapter in range(1, 10):
            text = (ROOT / f"ebook/chuong-{chapter}.html").read_text(encoding="utf-8")
            with self.subTest(chapter=chapter):
                route = re.search(r'<nav class="learning-path".*?</nav>', text, re.S)[0]
                self.assertEqual(route.count('<li>'), 4)
                self.assertIn(f'../baidoc/index.html#ch{chapter}', route)
                self.assertIn('href="#chapter-slides"', route)
                self.assertIn('href="#quiz"', route)
                self.assertLess(text.index('class="slide-grid"'), text.index('id="quiz"'))

    def test_lesson_previous_next_follows_reading_order(self):
        index = self.pages[(ROOT / "baidoc/index.html").resolve()]
        lessons = [href for href in index.links if re.fullmatch(r"\d\d-.*\.html", href)]
        self.assertEqual(len(lessons), 64)
        self.assertEqual(len(set(lessons)), 64)
        for position, lesson in enumerate(lessons):
            with self.subTest(lesson=lesson):
                text = (ROOT / "baidoc" / lesson).read_text(encoding="utf-8")
                nav = re.search(r'<nav class="ebook-nav" data-prevnext>(.*?)</nav>', text, re.S)[1]
                links = re.findall(r'<a href="([^"]+)"(?: rel="([^"]+)")?', nav)
                expected = []
                if position:
                    expected.append((lessons[position - 1], "prev"))
                if position < len(lessons) - 1:
                    expected.append((lessons[position + 1], "next"))
                else:
                    expected.append(("index.html", ""))  # Return link is not a next lesson.
                self.assertEqual(links, expected)

    def test_quiz_explanations_answers_and_review_links(self):
        self.assertEqual(set(self.quiz), {str(i) for i in range(1, 10)})
        answers = []
        for chapter, questions in self.quiz.items():
            self.assertEqual(len(questions), 3)
            for index, question in enumerate(questions):
                with self.subTest(chapter=chapter, question=index):
                    self.assertEqual(len(question["opts"]), 4)
                    self.assertEqual(len(set(question["opts"])), 4)
                    self.assertIs(type(question["a"]), int)
                    self.assertIn(question["a"], range(4))
                    self.assertGreater(len(question["explanation"]), 60)
                    self.assertTrue(question["review"]["label"])
                    self.assertFalse(urlsplit(question["review"]["href"]).scheme)
                    self.assert_link(ROOT / f"ebook/chuong-{chapter}.html", question["review"]["href"])
                    answers.append(question["a"])
        counts = Counter(answers)
        self.assertEqual(set(counts), set(range(4)))
        self.assertLessEqual(max(counts.values()) - min(counts.values()), 1)

    def test_first_five_chapters_have_complete_learning_guides(self):
        guides = json.loads((ROOT / "data/learning_guides.json").read_text(encoding="utf-8"))
        self.assertEqual(set(guides), {str(i) for i in range(1, 6)})
        for chapter, guide in guides.items():
            with self.subTest(chapter=chapter):
                self.assertIn(guide["minutes"], range(30, 91))
                for key in ("goals", "steps", "checks"):
                    self.assertGreaterEqual(len(guide[key]), 3)
                    self.assertTrue(all(len(text) > 30 for text in guide[key]))
                self.assertGreater(len(guide["task"]), 30)
                self.assertGreaterEqual(len(guide["concepts"]), 3)
                for concept in guide["concepts"]:
                    self.assertTrue(concept["title"])
                    self.assertGreater(len(concept["text"]), 100)
                path = ROOT / f"ebook/chuong-{chapter}.html"
                page = self.pages[path.resolve()]
                for anchor in ("chapter-goals", "chapter-theory", "chapter-practice", "chapter-checklist"):
                    self.assertIn(anchor, page.ids)
                text = path.read_text(encoding="utf-8")
                route = re.search(r'<nav class="learning-path".*?</nav>', text, re.S)[0]
                self.assertIn('href="#chapter-practice"', route)
                self.assertLess(text.index('id="chapter-practice"'), text.index('id="quiz"'))


if __name__ == "__main__":
    unittest.main()