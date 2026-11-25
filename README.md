# /// Next Gen Apparel — website

Static site (HTML/CSS/vanilla JS, no build dependencies).

- `index.html`, `shop.html`, `collections.html`, `about.html` — the built pages (open directly or serve the folder).
- `src/<page>.src.html` + `src/partials/*.html` — source; run `python3 build.py` to regenerate every page. `<!-- @page shop -->` in a shell marks that nav item (`data-nav="shop"`) as the current page.
- Shop page: `css|js/shop-hero.*` (banner + category tabs), `css|js/shop-listing.*` (filters, product data, grid, pagination), `css/shop-band.css`.
- Collections / About: `src/partials/<page>.html`, `css/<page>.css`, `js/<page>.js`; their banners reuse the shop banner classes from `css/shop-hero.css`. Tabs and sidebar talk via `shop:category` / `shop:category-sync` events on `document`; `?category=` and `?sort=newest|popular` URLs work.
- `css/base.css` — design tokens (colors, fonts, motion) shared by every section; `css/{header,hero,categories,contact}.css` — one file per section.
- `js/main.js` — scroll reveal; `js/{header,hero,categories,contact}.js` — per-section behavior (sticky header, menu/search overlays, hero carousel, footer arrow draw-in).
- `assets/img/` — images (copied from `streetwear-assets/`).
- `shot.sh <out.png> [w] [h] [page.html]` — headless Chrome screenshot (note: Chrome won't lay out narrower than ~500px headless).

Local preview: `python3 -m http.server 5173` then open http://localhost:5173.
