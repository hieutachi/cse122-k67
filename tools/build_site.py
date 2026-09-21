"""Generator for CSE122 static GitHub Pages site."""
import os, json, shutil, re, sys, html

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mdconv import md_to_html

ROOT = "cse122-site"
UPSTREAM = "_tmp_upstream/course-lessons/vi"
TRUC = os.path.join(ROOT, "assets", "img", "trucquan")
DATA = os.path.join(ROOT, "data")

CHAPTERS = [
 (1,"chuong-1","Chương 1. Nhập môn Web, Internet, môi trường dev","Kiến trúc Web, client–server, HTTP request–response, trình duyệt, VS Code, DevTools, Git/GitHub workflow.",["Intro.pptx"],"1.",[1,13,14]),
 (2,"chuong-2","Chương 2. HTML cơ bản: cấu trúc, văn bản, liên kết, ảnh","Tài liệu HTML5, heading, paragraph, thẻ a, img, đường dẫn tuyệt đối/tương đối.",["HTML 0.pptx","HTML 1.pptx","HTML 2.pptx"],"2.",[1,2]),
 (3,"chuong-3","Chương 3. HTML nâng cao: bảng, biểu mẫu, đa phương tiện","Table, form/input/select/textarea, validation, iframe, video/audio, semantic + accessibility.",["HTML 3.pptx","HTML 4.pptx","HTML 5.pptx"],"3.",[3]),
 (4,"chuong-4","Chương 4. CSS cơ bản: selector, màu, nền, chữ","Cú pháp CSS, 3 cách nhúng, selectors, specificity, màu sắc, background, typography, variables.",["CSS 1.pptx","CSS 2.pptx","CSS 3.pptx"],"4.",[4,5]),
 (5,"chuong-5","Chương 5. CSS Layout: Box Model, Flexbox, Grid","Box model, display, float/clear, position, Flexbox, Grid, chọn công cụ layout.",["CSS 4.pptx","CSS 5.pptx","CSS 6.pptx","CSS 7.pptx"],"5.",[6,7,8]),
 (6,"chuong-6","Chương 6. Responsive, Animation, nhập môn Bootstrap","Media queries, mobile-first, fluid, transitions/animations, Bootstrap grid + utilities.",["CSS 8.pptx","CSS 9.pptx","Bootstrap 1.pptx"],"6.",[8,9,10]),
 (7,"chuong-7","Chương 7. Bootstrap Components","Spacing/colors, buttons/badges, navbar, cards, forms/validation, modal/offcanvas/accordion.",["Bootstrap 2.pptx","Bootstrap 3.pptx","Bootstrap 4.pptx","Bootstrap 5.pptx"],"7.",[9,10,11,12]),
 (8,"chuong-8","Chương 8. JavaScript cơ bản và DOM","let/const, arrow functions, array methods, object/JSON, DOM, events, validation, localStorage.",["JS 01.pptx","JS 02.pptx","JS 03.pptx","JS 04.pptx","JS 05.pptx"],"8.",[15,16,17,18,19,20,21,22,23,24]),
 (9,"chuong-9","Chương 9. JS nâng cao: Fetch API và dự án","Fetch/async-await, mock API, loading/error, multi-step booking, dashboard, deploy, CV.",["JS 06.pptx","JS 07.pptx","JS 08.pptx","JS 09.pptx","JS 10.pptx","Bootstrap 6-9.pptx"],"9.",[25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44]),
]

def imgs_for(prefix):
    # Compare chapter/slide numbers, including legacy names like 3;11 and 7,3.
    files = sorted(os.listdir(TRUC), key=lambda f: (tuple(map(int, re.findall(r"\d+", f))), f))
    if prefix == "3.":
        return [f for f in files if f.startswith("3.") or f.startswith("3;")]
    if prefix == "7.":
        return [f for f in files if f.startswith("7.") or f.startswith("7,")]
    return [f for f in files if f.startswith(prefix)]

def head(title, depth=0):
    pre = "../" * depth
    tpl = """<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>@TITLE@ | CSE122</title>
<meta name="description" content="CSE122 – Phát triển ứng dụng Web cơ bản: học liệu số gồm ebook 9 chương, slide trực quan và demo HTML/CSS/JS chạy trực tiếp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;600&subset=vietnamese&display=swap">
<link rel="stylesheet" href="@PRE@assets/css/style.css?v=20260921-phase1">
<meta name="theme-color" content="#0f172a">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8C%90%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
</head><body>
<a class="skip" href="#main">Bỏ qua tới nội dung chính</a>
<div id="readbar" aria-hidden="true"></div>
<button id="totop" aria-label="Về đầu trang" title="Về đầu trang">&#8593;</button>
<header class="topbar"><div class="wrap">
<div class="brand">CSE122 – Phát triển ứng dụng Web cơ bản<small>Basic Web Application Development · 3TC (2-0-1)</small></div>
<nav class="nav" aria-label="Main"><a href="@PRE@index.html">Trang chủ</a><a href="@PRE@ebook/index.html">Ebook</a><a href="@PRE@baidoc/index.html">Bài giảng</a><a href="@PRE@slides/index.html">Slide</a><a href="@PRE@demo/index.html">Demo</a></nav>
</div></header><main class="wrap" id="main">"""
    return tpl.replace("@PRE@", pre).replace("@TITLE@", title)

FOOT = """</main><footer><div class="wrap"><span>CSE122 – Khoa Công nghệ thông tin, Đại học Thủy Lợi</span><span>Nguồn: 38 decks CSE122_ · Bài 1–44 · 163 ảnh trực quan · ViDU + upstream 64 bài</span><span id="year"></span><nav class="footer-nav" aria-label="Liên kết nhanh"><a href="#main">Về đầu trang ↑</a></nav></div></footer><script src="@PRE@assets/js/app.js?v=20260919f"></script></body></html>"""

def foot(depth=0):
    return FOOT.replace("@PRE@", "../" * depth).replace("v=20260919f", "v=20260921-phase1")

UP_MODULES = {
    "01-welcome-and-ai-workflow": "Nhập môn & AI workflow",
    "02-prompt-engineering": "Prompt engineering cho frontend",
    "03-html5-semantic": "HTML5 semantic",
    "04-css3-foundations": "CSS3 foundations",
    "05-css-layout": "CSS Layout",
    "06-responsive-and-animation": "Responsive & animation",
    "07-bootstrap-grid-and-utilities": "Bootstrap grid & utilities",
    "08-bootstrap-components": "Bootstrap components",
    "09-javascript-basics": "JavaScript cơ bản",
    "10-dom-and-events": "DOM & events",
    "11-async-javascript": "Async JavaScript",
    "12-highland-hospital-project": "Dự án Highland Hospital",
    "13-bonus-prompt-engineering-frontend": "Bonus: Figma → Bootstrap",
}

def reading_time(text):
    words = len(re.sub(r"<[^>]+>", " ", text).split())
    return max(2, round(words / 190))

def slugify_vi(s):
    s = s.lower()
    for a, b in [("ă","a"),("â","a"),("á","a"),("à","a"),("ả","a"),("ã","a"),("ạ","a"),("đ","d"),("ê","e"),("é","e"),("è","e"),("ẻ","e"),("ẽ","e"),("ẹ","e"),("î","i"),("í","i"),("ì","i"),("ỉ","i"),("ĩ","i"),("ị","i"),("ô","o"),("ơ","o"),("ó","o"),("ò","o"),("ỏ","o"),("õ","o"),("ọ","o"),("ư","u"),("ú","u"),("ù","u"),("ủ","u"),("ũ","u"),("ụ","u"),("ư","u"),("ý","y"),("ỳ","y"),("ỷ","y"),("ỹ","y"),("ỵ","y")]:
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:70]

def build_lessons():
    os.makedirs(os.path.join(ROOT, "baidoc"), exist_ok=True)
    chapters = {c[0]: c for c in CHAPTERS}
    cj = json.load(open(os.path.join(DATA, "chapters.json"), encoding="utf-8"))
    per_ch = {}
    for c in cj["chapters"]:
        cid = c["id"]
        seen = set()
        for spec in c.get("upstream", []):
            parts = spec.split("/")
            mdir, rng = parts[0], (parts[1] if len(parts) > 1 else None)
            if mdir not in UP_MODULES or not os.path.isdir(os.path.join(UPSTREAM, mdir)):
                continue
            mtitle = UP_MODULES[mdir]
            mpath = os.path.join(UPSTREAM, mdir)
            allf = sorted(f for f in os.listdir(mpath) if f.endswith(".md"))
            files = [f for f in allf if (not rng or rng.split("-")[0] <= f[:2] <= rng.split("-")[1])]
            entries = []
            for fname in files:
                if (mdir, fname) in seen:
                    continue
                seen.add((mdir, fname))
                md = open(os.path.join(mpath, fname), encoding="utf-8").read()
                m = re.match(r"^#\s+(.+)$", md.strip(), re.M)
                ltitle = m.group(1).strip() if m else fname
                entries.append({"file": fname, "title": ltitle, "num": allf.index(fname) + 1, "total": len(allf), "mdir": mdir, "mtitle": mtitle, "cid": cid})
            if entries:
                per_ch.setdefault(cid, []).append((mdir, mtitle, entries))
    # index page: lessons grouped by chapter
    toc = ""
    for cid in sorted(per_ch):
        _, _, _, _, _, _, _ = chapters[cid]
        ch_title = chapters[cid][2]
        toc += '<section class="lesson-ch" id="ch%d"><span class="chip">%02d</span><h3>%s</h3>' % (cid, cid, ch_title)
        for mdir, mtitle, entries in per_ch[cid]:
            toc += '<div class="lesson-mod"><h4>%s</h4><ol class="lesson-list">' % mtitle
            for e in entries:
                words = len(open(os.path.join(UPSTREAM, mdir, e["file"]), encoding="utf-8").read().split())
                fn_e = "%s-%s.html" % (mdir, slugify_vi(e["title"]))
                toc += '<li data-lesson="%s"><a href="%s">%s</a><span class="meta">~%d phút</span></li>' % (fn_e, fn_e, e["title"], max(2, round(words / 190)))
            toc += "</ol></div>"
        toc += "</section>"
    page = head("Bài giảng gốc", 1) + """
<h1>Bài giảng gốc <em>(upstream ktzung)</em></h1>
<a class="btn ghost resume-link hidden" data-last-lesson href="../ebook/chuong-1.html">&#8634; <span>Tiếp tục học</span></a>
<div class="toolbar"><input id="q" type="search" placeholder="Tìm bài giảng... (bấm / để focus)" aria-label="Tìm bài giảng"><span class="count" id="count"></span></div>
<p class="meta" id="lesson-progress"></p>
<p class="meta">64 bài học tiếng Việt từ repo gốc &#8212; bản chuyển đổi markdown &#8594; HTML giữ nguyên nội dung, trình bày lại cho dễ đọc. Mỗi chương CSE122 ghép 1&#8211;3 module upstream tương ứng.</p>
""" + toc + foot(1)
    open(os.path.join(ROOT, "baidoc", "index.html"), "w", encoding="utf-8").write(page)
    print("lessons index ok")

    # lesson pages
    flat = []
    for cid in sorted(per_ch):
        for mdir, mtitle, entries in per_ch[cid]:
            for e in entries:
                flat.append((cid, mdir, mtitle, e))
    for idx, (cid, mdir, mtitle, e) in enumerate(flat):
        md = open(os.path.join(UPSTREAM, mdir, e["file"]), encoding="utf-8").read()
        body = md_to_html(md)
        mins = reading_time(body)
        fn = "%s-%s.html" % (mdir, slugify_vi(e["title"]))
        toc_items = re.findall(r'<h3 id="([^"]+)">([^<]+)', body)
        if toc_items:
            lis = "".join('<li><a href="#%s">%s</a></li>' % (hid, ht) for hid, ht in toc_items)
            toc_html = '<details class="lesson-toc" open><summary>Mục lục bài này <span class="meta">%d mục</span></summary><ol>%s</ol></details>' % (len(toc_items), lis)
        else:
            toc_html = ""
        if idx > 0:
            pf = "%s-%s.html" % (flat[idx-1][1], slugify_vi(flat[idx-1][3]["title"]))
            prev_link = '<a href="%s" rel="prev"><span aria-hidden="true">&#8592;</span><span><small>Bài trước</small><strong>%s</strong></span></a>' % (pf, flat[idx-1][3]["title"])
        else:
            prev_link = '<span></span>'
        if idx < len(flat) - 1:
            nf = "%s-%s.html" % (flat[idx+1][1], slugify_vi(flat[idx+1][3]["title"]))
            next_link = '<a href="%s" rel="next"><span><small>Bài sau</small><strong>%s</strong></span><span aria-hidden="true">&#8594;</span></a>' % (nf, flat[idx+1][3]["title"])
        else:
            next_link = '<a href="index.html"><span><small>Hoàn thành</small><strong>Về danh sách bài</strong></span><span aria-hidden="true">&#8594;</span></a>'
        ch_title = chapters[cid][2]
        page = head(e["title"], 1) + """<article class="lesson">
<p class="lesson-crumbs"><a href="index.html">Bài giảng</a> &rsaquo; <a href="../ebook/%s.html">Chương %d</a> &rsaquo; %s &rsaquo; Bài %d/%d</p>
<h1 class="lesson-title">%s</h1>
<div class="lesson-actions" role="toolbar" aria-label="Tùy chọn đọc"><button type="button" data-font="dec" aria-label="Giảm cỡ chữ">A&minus;</button><button type="button" data-font="inc" aria-label="Tăng cỡ chữ">A+</button><button type="button" data-done-toggle aria-pressed="false">Đánh dấu đã học &#10003;</button><button type="button" data-copylink>Copy link</button></div>
<p class="lesson-meta"><span>Bài %d/%d</span><span>Module: %s</span><span>~%d phút đọc</span></p>
%s
<div class="lesson-body">
%s
</div></article>
<nav class="ebook-nav" data-prevnext>%s%s</nav>""" % (chapters[cid][1], cid, mtitle, e["num"], e["total"], e["title"], e["num"], e["total"], mtitle, mins, toc_html, body, prev_link, next_link) + foot(1)
        open(os.path.join(ROOT, "baidoc", fn), "w", encoding="utf-8").write(page)
    print("lessons pages ok:", len(flat))

def build_index():
    cards = ""
    for cid, slug, title, desc, decks, prefix, bai in CHAPTERS:
        n_img = len(imgs_for(prefix))
        cards += ('<article class="card" id="c%d"><span class="chip">%02d</span><h3><a href="ebook/%s.html">%s</a></h3>'
                  '<p>%s</p><p class="meta"><strong>%d</strong> ảnh trực quan &#8226; Deck: %s &#8226; Bài: %s</p></article>') % (
            cid, cid, slug, title, desc, n_img, ", ".join(decks), ", ".join(map(str, bai)))
    page = head("Trang chủ", 0) + """
<section class="hero"><div class="wrap"><span class="kicker">Học liệu số &#8226; Khóa 67</span>
<h1>CSE122 &mdash; <em>Phát triển ứng dụng Web cơ bản</em></h1>
<p>Học liệu số tích hợp: Ebook 9 chương với sơ đồ ASCII và demo HTML chạy trực tiếp, 163 slide trực quan theo chương, 44 bài slide gốc và bộ demo HTML/CSS/JS.</p>
<div class="hero-stats" aria-label="Thống kê học liệu"><span><strong>9</strong> chương</span><span><strong>64</strong> bài giảng</span><span><strong>163</strong> slide trực quan</span><span><strong>38</strong> decks</span></div>
<p><a class="btn" href="ebook/chuong-1.html">Bắt đầu học Chương 1 &#8594;</a><a class="btn ghost" href="slides/index.html">Xem slide trực quan</a></p></div></section>
<div class="sec-head"><h2>Nội dung học phần</h2><span class="meta">9 chương &#8226; 38 decks &#8226; 163 slide trực quan</span></div>
<a class="btn ghost resume-link hidden" data-last-lesson href="ebook/chuong-1.html">&#8634; <span>Tiếp tục học</span></a>
<div class="toolbar"><input id="q" type="search" placeholder="Tìm kiếm chương, chủ đề, công nghệ... (bấm / để focus)" aria-label="Tìm kiếm"><span class="count" id="count"></span></div>
<div class="grid" id="grid">""" + cards + """</div>
<div class="sec-head"><h2>Tài liệu gốc</h2></div>
<div class="grid">
<article class="card"><h3>Slide giảng viên (38 decks)</h3><p>Intro, HTML 0&#8211;8, CSS 1&#8211;9, Bootstrap 1&#8211;9, JS 01&#8211;10 &#8212; toàn bộ decks CSE122_.</p></article>
<article class="card"><h3><a href="slides/bai.html">Bài 1&#8211;44 &#8212; tra cứu tiêu đề</a></h3><p>Bảng tra cứu nhanh tiêu đề từng bài slide học thử.</p></article>
<article class="card"><h3><a href="baidoc/index.html">Bài giảng upstream (64 bài)</a></h3><p>Nội dung gốc từ repo ktzung, chuyển markdown &#8594; web với trình đọc tối ưu: font serif, code block, callout prompt, thời gian đọc ước lượng.</p></article>
<article class="card"><h3><a href="demo/index.html">Demo chạy được</a></h3><p>Ví dụ HTML/CSS/JS thực tế, kể cả dự án CampusConnect hoàn chỉnh.</p></article>
</div>
""" + foot(0)
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(page)

def render_learning_guide(guide, practice):
    def items(values):
        return "".join("<li>%s</li>" % html.escape(value) for value in values)

    concepts = "".join("<h3>%s</h3><p>%s</p>" % (
        html.escape(item["title"]), html.escape(item["text"])) for item in guide["concepts"])
    return f"""<section class="chapter-guide" aria-labelledby="chapter-goals">
<h2 id="chapter-goals">Sau chương này, bạn làm được gì?</h2>
<ul>{items(guide['goals'])}</ul>
<h2 id="chapter-theory">Kiến thức cần nắm</h2>{concepts}
<h2 id="chapter-practice">Thực hành có hướng dẫn</h2>
<p class="meta">Thời gian thực hành gợi ý: {int(guide['minutes'])} phút, có thể chia thành nhiều lượt.</p>
<p><strong>{html.escape(guide['task'])}</strong></p>
<ol class="practice-steps">{items(guide['steps'])}</ol>
<p><a href="../baidoc/{html.escape(practice, quote=True)}">Mở bài hướng dẫn gốc và ví dụ chi tiết →</a></p>
<h3 id="chapter-checklist">Tự kiểm tra bài làm trước khi chuyển chương</h3>
<ul>{items(guide['checks'])}</ul>
<p class="meta">Quiz bên dưới chỉ kiểm tra nhanh kiến thức. Hãy đối chiếu cả sản phẩm thực hành; điểm quiz không phải điểm học phần.</p>
</section>"""


def build_ebook():
    os.makedirs(os.path.join(ROOT, "ebook"), exist_ok=True)
    with open(os.path.join(DATA, "learning_guides.json"), encoding="utf-8") as source:
        guides = json.load(source)
    practice = {
        1: "01-welcome-and-ai-workflow-thi-t-l-p-moi-tru-ng-lam-vi-c.html#h-15-thc-hnh",
        2: "03-html5-semantic-c-u-truc-tai-li-u-web-chu-n.html#h-14-thc-hnh",
        3: "03-html5-semantic-lab-landing-page-semantic.html",
        4: "04-css3-foundations-lab-d-ng-hero-section.html",
        5: "05-css-layout-lab-lu-i-doctor-cards.html",
        6: "06-responsive-and-animation-lab-hero-responsive.html",
        7: "08-bootstrap-components-lab-faq-d-t-lich-tinh.html",
        8: "10-dom-and-events-lab-b-loc-bac-si-theo-chuyen-khoa.html",
        9: "11-async-javascript-lab-d-t-lich-kham-hoan-chinh.html",
    }
    toc = "".join('<li><a href="%s.html">%s</a></li>' % (slug, title) for _, slug, title, *_ in CHAPTERS)
    for i, (cid, slug, title, desc, decks, prefix, bnums) in enumerate(CHAPTERS):
        prev_link = '<a href="%s.html">&#8592; Chương trước</a>' % CHAPTERS[i-1][1] if i > 0 else '<span></span>'
        next_link = '<a href="%s.html">Chương sau &#8594;</a>' % CHAPTERS[i+1][1] if i < len(CHAPTERS)-1 else '<a href="../index.html">Về trang chủ &#8594;</a>'
        imgs = imgs_for(prefix)
        gallery = "".join('<figure><img loading="lazy" src="../assets/img/trucquan/%s" alt="Slide %s"><figcaption>%s</figcaption></figure>' % (f, f, f.replace(".jpg","")) for f in imgs)
        bai_tags = " ".join('<a class="tag" href="../slides/bai.html#bai%d">Bài %d</a>' % (n, n) for n in bnums) if bnums else ""
        demo = ""
        if cid == 4:
            demo = """<h3>Demo: 3 cách nhúng CSS</h3>
<div class="demo">
<h4>1. Inline</h4><pre><code>&lt;p style="color:#2563eb"&gt;Chữ xanh inline&lt;/p&gt;</code></pre>
<p style="color:#2563eb">Kết quả: chữ này màu xanh (inline).</p>
<h4>2. Internal</h4><pre><code>&lt;style&gt;p.x{color:#15803d}&lt;/style&gt;</code></pre>
<p style="color:#15803d">Kết quả: chữ này màu xanh lá (internal).</p>
<h4>3. External</h4><pre><code>&lt;link rel="stylesheet" href="style.css"&gt;</code></pre>
<p>File <code>assets/css/style.css</code> của site này chính là external CSS.</p>
</div>
<div class="note">Box Model: content &rarr; padding &rarr; border &rarr; margin. Xem demo đầy đủ tại <a href="../demo/ba-cach-nhung-css.html">trang Demo</a>.</div>"""
        if cid == 1:
            demo = """<h3>Sơ đồ: Client – Server</h3>
<pre><code>+----------+   HTTP request    +-----------+
| Browser  | ----------------&gt; |  Server   |
| (client) | &lt;---------------- | (HTTP res)|
+----------+   HTML/CSS/JS    +-----------+
     |                                   |
     | render DOM                        | file / DB / API
     v                                   v
  Người đọc                       Backend (học phần sau)</code></pre>
<div class="note">Chrome DevTools: F12 &rarr; tab Network để thấy từng request–response thực tế.</div>"""
        if cid == 5:
            demo = """<h3>Sơ đồ: Box Model</h3>
<pre><code>+--------------------------- margin
|  +-----------------------+  border
|  |  +------------------+ |  padding
|  |  |     CONTENT      | |
|  |  +------------------+ |
|  +-----------------------+
+---------------------------</code></pre>"""
        if cid == 8:
            demo = """<h3>Demo JS nhỏ: đổi chữ khi click</h3>
<div class="demo">
<button class="btn" id="demoBtn">Bấm vào đây</button>
<p id="demoOut">Chưa bấm.</p>
</div>
<pre><code>const btn = document.querySelector('#demoBtn');
btn.addEventListener('click', () =&gt; {
  document.querySelector('#demoOut').textContent = 'Đã bấm ' + new Date().toLocaleTimeString();
});</code></pre>
<script>
document.addEventListener('DOMContentLoaded', function(){
  var b = document.getElementById('demoBtn');
  if (b) b.addEventListener('click', function(){
    var o = document.getElementById('demoOut');
    if (o) o.textContent = 'Đã bấm lúc ' + new Date().toLocaleTimeString();
  });
});
</script>
<h3>Nếu bạn còn thắc mắc, hãy tham khảo:</h3>
<ol>
<li>Slide trực quan của chương bên dưới (bấm vào ảnh để xem lớn, dùng &larr;/&rarr; để chuyển ảnh).</li>
<li>Các demo HTML/CSS/JS chạy trực tiếp tại trang <a href="../demo/index.html">Demo</a>.</li>
<li>Chương tiếp theo để nhìn bức tranh tổng thể trước khi đi sâu vào chi tiết.</li>
</ol>
<div class="note">Mẹo: bấm <code>/</code> ở trang chủ để tìm nhanh chương, dùng nút <strong>Copy</strong> trên góc mỗi khối code để chép ví dụ vào VS Code thử ngay.</div>"""
        guide = guides.get(str(cid))
        practice_href = "#chapter-practice" if guide else "../baidoc/" + practice[cid]
        learning_path = f"""<nav class="learning-path" aria-label="Lộ trình học chương {cid}">
<h2>Học chương này như thế nào?</h2>
<ol><li><a href="../baidoc/index.html#ch{cid}"><strong>1. Đọc lý thuyết</strong><span>Bài giảng của chương</span></a></li>
<li><a href="#chapter-slides"><strong>2. Xem slide</strong><span>{len(imgs)} ảnh trực quan</span></a></li>
<li><a href="{practice_href}"><strong>3. Thực hành</strong><span>Làm bài tập theo hướng dẫn</span></a></li>
<li><a href="#quiz"><strong>4. Tự kiểm tra</strong><span>Trả lời và xem giải thích</span></a></li></ol>
<p class="meta">Đi theo thứ tự gợi ý hoặc chọn ngay phần bạn cần. Tiến độ chỉ lưu trên trình duyệt này, không tự đồng bộ giữa các thiết bị.</p></nav>"""
        if guide:
            learning_path += render_learning_guide(guide, practice[cid])
        page = head(title, 1) + """
<h1>%s</h1><p class="meta">%s</p>
<nav><a href="index.html">&#8592; Mục lục Ebook</a></nav>
%s
%s
<div class="note">Bài giảng gốc liên quan: %s <a class="tag" href="../baidoc/index.html#ch%d">Bài đọc upstream &#8594;</a></div>
<div class="sec-head"><h2 id="chapter-slides">Slide trực quan của chương</h2><span class="meta">%d ảnh &#8226; click để xem lớn</span></div>
<div class="slide-grid">%s</div>
<div class="quiz-panel" id="quiz" data-chapter="%d"><h3>Tự kiểm tra nhanh – Chương %d</h3><p class="meta">Bài tự luyện, không phải điểm đánh giá học phần. Sau mỗi câu có giải thích và mục đọc lại.</p><div id="quiz-body"><p class="meta">Đang tải câu hỏi…</p></div></div>
<div class="ebook-nav">%s%s</div>
""" % (title, desc, learning_path, demo, (bai_tags or '<span class="meta">không có bài giảng trực tiếp</span>'), cid, len(imgs), gallery, cid, cid, prev_link, next_link) + foot(1)
        open(os.path.join(ROOT, "ebook", slug + ".html"), "w", encoding="utf-8").write(page)
    idx = head("Ebook CSE122", 1) + """<h1>Ebook CSE122</h1><p class="meta">9 chương &#8226; đọc tuần tự hoặc chọn chương bất kỳ. Mỗi chương gồm lý thuyết, sơ đồ, demo, quiz tự kiểm tra và slide trực quan.</p>
<a class="btn ghost resume-link hidden" data-last-lesson href="chuong-1.html">&#8634; <span>Tiếp tục học</span></a>
<ol class="toc">""" + toc + "</ol>" + foot(1)
    open(os.path.join(ROOT, "ebook", "index.html"), "w", encoding="utf-8").write(idx)

def build_slides():
    os.makedirs(os.path.join(ROOT, "slides"), exist_ok=True)
    bai = []
    p = os.path.join(DATA, "bai.json")
    if os.path.exists(p):
        with open(p, encoding="utf-8") as source:
            bai = json.load(source)
    rows = ""
    for b in bai:
        first = html.escape(b["lines"][0] if b["lines"] else "").replace("|", " &#124; ")
        rows += '<tr id="bai%d"><td><a href="bai.html#bai%d">Bài %d</a></td><td>%s</td><td>%d</td></tr>' % (b["num"], b["num"], b["num"], first, len(b["lines"]))
    secs = ""
    for cid, slug, title, desc, decks, prefix, bnums in CHAPTERS:
        imgs = imgs_for(prefix)
        if not imgs:
            continue
        g = "".join('<figure><img loading="lazy" src="../assets/img/trucquan/%s" alt="%s"><figcaption>%s</figcaption></figure>' % (f, f, f.replace(".jpg","")) for f in imgs)
        secs += '<div class="sec-head"><h2 id="%s">%s</h2><span class="meta"><a href="#%s">liên kết nhanh</a></span></div><div class="slide-grid">%s</div>' % (slug, title, slug, g)
    page = head("Slide trực quan", 1) + """
<h1>Slide viewer – ảnh trực quan theo chương</h1>
<p class="meta">Nguồn: CSE122_Baigiang_Trucquan (163 ảnh PNG đã convert sang JPG nhẹ hơn). File .pptx gốc nằm trong CSE122_ và Slide, không public trên Pages vì dung lượng lớn.</p>
""" + secs + foot(1)
    with open(os.path.join(ROOT, "slides", "index.html"), "w", encoding="utf-8") as output:
        output.write(page)
    bpage = head("Bài 1–44", 1) + """<h1>Slide Bài 1&#8211;44</h1><p class="meta">Bảng tra cứu tiêu đề của 44 bài slide học thử.</p><div class="table-card"><table><thead><tr><th>Bài</th><th>Tiêu đề dòng đầu</th><th>Số dòng text</th></tr></thead><tbody>""" + rows + "</tbody></table></div>" + foot(1)
    with open(os.path.join(ROOT, "slides", "bai.html"), "w", encoding="utf-8") as output:
        output.write(bpage)
    print("slides ok")

def rmtree_win(path):
    try:
        if os.path.isdir(path):
            shutil.rmtree(path, onexc=lambda f, p, e: (os.chmod(p, 0o777), f(p)))
    except Exception as e:
        print("rmtree warn:", e)

def build_demo():
    os.makedirs(os.path.join(ROOT, "demo"), exist_ok=True)
    src = "ViDU"
    for f in ["ba-cach-nhung-css.html", "style.css", "huong-dan-css-co-ban.html"]:
        s = os.path.join(src, f)
        if os.path.exists(s):
            shutil.copy(s, os.path.join(ROOT, "demo", f))
    if os.path.isdir(os.path.join(src, "CNTT2")):
        dst2 = os.path.join(ROOT, "demo", "CNTT2")
        rmtree_win(dst2)
        shutil.copytree(os.path.join(src, "CNTT2"), dst2)
    page = head("Demo", 1) + """
<h1>Demo HTML/CSS/JS</h1>
<p class="meta">Các ví dụ chạy trực tiếp trong trình duyệt, không cần build.</p>
<div class="grid">
<article class="card"><h3><a href="ba-cach-nhung-css.html">3 cách nhúng CSS + Box Model</a></h3><p>Inline, internal, external; minh họa 4 lớp content/padding/border/margin.</p></article>
<article class="card"><h3><a href="huong-dan-css-co-ban.html">Hướng dẫn CSS cơ bản</a></h3><p>Tài liệu HTML tự chứa CSS, phù hợp chương 4.</p></article>
<article class="card"><h3><a href="CNTT2/index.html">CampusConnect (thuần HTML/CSS/JS)</a></h3><p>Landing page responsive, menu mobile, bộ lọc sự kiện, form validation – mẫu cho chương 7–9.</p></article>
</div>
""" + foot(1)
    open(os.path.join(ROOT, "demo", "index.html"), "w", encoding="utf-8").write(page)
    print("demo ok")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=ROOT, help="Existing site directory with assets and data")
    parser.add_argument("--upstream", default=UPSTREAM, help="Directory containing Vietnamese upstream lesson modules")
    parser.add_argument("--content-only", action="store_true", help="Preserve demo assets; rebuild course pages only")
    args = parser.parse_args()
    ROOT = os.path.abspath(args.output)
    UPSTREAM = os.path.abspath(args.upstream)
    TRUC = os.path.join(ROOT, "assets", "img", "trucquan")
    DATA = os.path.join(ROOT, "data")
    if not os.path.isdir(UPSTREAM) or not os.path.isfile(os.path.join(DATA, "chapters.json")):
        parser.error("Missing upstream lessons or site data; refusing to generate an incomplete site")
    build_lessons()
    build_index()
    build_ebook()
    build_slides()
    if not args.content_only:
        build_demo()
    print("BUILD DONE")