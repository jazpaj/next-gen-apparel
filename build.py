"""Assemble pages from src/<page>.src.html + src/partials/*.html.

Each page shell may declare its active nav item with <!-- @page shop -->;
links in partials marked data-nav="shop" then get aria-current="page".
"""
import pathlib, re
root = pathlib.Path(__file__).parent

def inc(m):
    p = root / "src/partials" / m.group(1)
    return p.read_text().rstrip() if p.exists() else f"<!-- missing {m.group(1)} -->"

for src in sorted((root / "src").glob("*.src.html")):
    html = src.read_text()
    page = re.search(r"<!-- @page (\S+) -->\n?", html)
    html = re.sub(r"<!-- @include (\S+) -->", inc, html)
    if page:
        html = html.replace(page.group(0), "")
        html = html.replace(f'data-nav="{page.group(1)}"', f'data-nav="{page.group(1)}" aria-current="page"')
    out = root / src.name.replace(".src.html", ".html")
    out.write_text(html)
    print("built", out.name)
