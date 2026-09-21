"""Tiny markdown -> HTML converter for ktzung upstream lessons."""
import re, html

def _inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^\*\n]+)\*(?!\*)", r"<em>\1</em>", s)
    def _img(m):
        src = m.group(2).strip()
        if src.startswith(("http://", "https://", "/", "../", "assets/", "data:")):
            return '<img class="resp" loading="lazy" src="%s" alt="%s">' % (src, m.group(1).strip())
        return m.group(0)
    s = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", _img, s)
    def _link(m):
        href = m.group(2)
        if href.startswith(("http://", "https://", "#", "/")):
            return '<a href="%s" target="_blank" rel="noopener">%s</a>' % (href, m.group(1))
        return m.group(0)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", _link, s)
    return s

def _slug(t, maxlen=60):
    sid = re.sub(r"<[^>]+>", "", t)
    sid = re.sub(r"[^a-zA-Z0-9 ]", "", sid.lower()).strip().replace(" ", "-")
    return (sid[:maxlen] or "sec")

_LANGS = {"js": "JavaScript", "javascript": "JavaScript", "html": "HTML", "css": "CSS", "json": "JSON", "bash": "Terminal", "sh": "Terminal", "python": "Python", "ts": "TypeScript"}

def md_to_html(md):
    lines = md.replace("\r\n", "\n").split("\n")
    out = []
    i, n = 0, len(lines)
    while i < n:
        ln = lines[i]
        st = ln.strip()
        if not st:
            i += 1
            continue
        if st.startswith("```"):
            lang = st[3:].strip()
            buf = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            code = html.escape("\n".join(buf), quote=False)
            lbl = _LANGS.get(lang, lang or "Code")
            out.append('<figure class="code-block"><figcaption>%s</figcaption><pre><code>%s</code></pre></figure>' % (lbl, code))
            continue
        if st in ("---", "***", "___"):
            out.append("<hr>")
            i += 1
            continue
        if st.startswith("#### ") or st.startswith("### "):
            tx = st[5:] if st.startswith("#### ") else st[4:]
            t4 = _inline(tx)
            out.append('<h4 id="%s">%s</h4>' % (_slug(t4, 50), t4))
            i += 1
            continue
        if st.startswith("|") and i + 1 < n and re.match(r"^\|[\s:\-|]+\|?\s*$", lines[i + 1].strip()):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head_cells = "".join("<th>%s</th>" % _inline(c) for c in rows[0])
            body = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % _inline(c) for c in r) for r in rows[2:])
            out.append('<div class="table-card"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (head_cells, body))
            continue
        if st.startswith("# "):
            h2t = _inline(st[2:])
            out.append('<h2 id="%s">%s</h2>' % (_slug(h2t), h2t))
        elif st.startswith("## "):
            t = _inline(st[3:])
            sid = "h-%d-%s" % (len(out), _slug(t))
            out.append('<h3 id="%s">%s<a class="anchor" href="#%s" aria-label="Li\u00ean k\u1ebft m\u1ee5c">#</a></h3>' % (sid, t, sid))
        elif st.startswith("- ") or st.startswith("* "):
            buf = []
            while i < n and (lines[i].strip().startswith("- ") or lines[i].strip().startswith("* ")):
                raw = lines[i].strip()[2:].strip()
                low = raw.lower()
                if low.startswith("[ ] "):
                    buf.append('<span class="task" aria-hidden="true">&#9744;</span> ' + _inline(raw[4:]))
                elif low.startswith("[x] "):
                    buf.append('<span class="task done" aria-hidden="true">&#9745;</span> ' + _inline(raw[4:]))
                else:
                    buf.append(_inline(raw))
                i += 1
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % b for b in buf))
            continue
        elif re.match(r"^\d+\.\s", st):
            buf = []
            while i < n and re.match(r"^\d+\.\s", lines[i].strip()):
                buf.append(_inline(re.sub(r"^\d+\.\s+", "", lines[i].strip())))
                i += 1
            out.append("<ol>%s</ol>" % "".join("<li>%s</li>" % b for b in buf))
            continue
        elif st.startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            body = " ".join(b for b in buf if b)
            if "prompt g\u1eed" in body.lower() or "prompt gui" in body.lower().replace("\u1eed", "u"):
                out.append('<aside class="prompt-card"><span class="prompt-chip">Prompt m\u1eabu</span><p>%s</p></aside>' % _inline(body))
            else:
                out.append('<blockquote><p>%s</p></blockquote>' % _inline(body))
            continue
        else:
            out.append("<p>%s</p>" % _inline(st))
        i += 1
    return "\n".join(out)
