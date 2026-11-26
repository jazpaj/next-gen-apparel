#!/usr/bin/env python3
"""Generate js/products.js — the full shop catalog (260 products).

The 24 hand-written products below keep their copy; the rest are generated
deterministically (fixed seed) so re-running produces the same file.
Category totals are intentionally uneven. Run:  python3 tools/gen_products.py
"""
import json, random, re, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
rng = random.Random(260)

TARGET = {'tees': 72, 'hoodies': 58, 'pants': 49, 'jackets': 43, 'accessories': 38}  # = 260
ALL = ['XS', 'S', 'M', 'L', 'XL', '2XL']
OS = ['OS']
COLORS = ['black', 'grey', 'cream', 'orange', 'olive']
COLOR_LABEL = {'black': 'Black', 'grey': 'Grey', 'cream': 'Bone', 'orange': 'Signal', 'olive': 'Olive'}

# [id, name, category, price, colors, sizes, stock, date, popularity, image, desc]
BASE = [
  ['v01-tech-hoodie', 'V-01 Tech Hoodie', 'hoodies', 139, ['black', 'grey'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-11-20', 95, 'hoodie', 'Our signature 420gsm brushed-back fleece with a scuba hood, bonded zip pockets and the /// mark at the chest. Boxy through the body, dropped at the shoulder.'],
  ['graphic-tee-02', 'Graphic Tee 02', 'tees', 79, ['black'], ALL, 'in-stock', '2026-11-18', 88, 'tee', 'Heavyweight 260gsm cotton tee with a cracked-ink X graphic screen-printed by hand. Boxy cut with a tight ribbed collar that holds its shape.'],
  ['cargo-pants', 'Cargo Pants', 'pants', 179, ['black'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-11-15', 90, 'cargo', 'Wide-leg cargos in a dense cotton twill with bellowed thigh pockets and adjustable ankle cinches. Built to stack over sneakers.'],
  ['utility-jacket', 'Utility Jacket', 'jackets', 229, ['cream'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-11-12', 84, 'jacket', 'A water-resistant shell in bone with taped seams, storm flap and four utility pockets. Light enough to layer, tough enough for weather.'],
  ['signature-cap', 'Signature Cap', 'accessories', 49, ['black'], OS, 'in-stock', '2026-11-10', 92, 'cap', 'Six-panel structured cap with the /// mark embroidered in 3D. Curved brim and an adjustable metal clasp at the back.'],
  ['tech-sling-bag', 'Tech Sling Bag', 'accessories', 89, ['black', 'orange'], OS, 'in-stock', '2026-11-08', 80, 'sling', 'A 4L crossbody in coated ripstop with a signal-orange zip channel, quick-release buckle and padded phone sleeve.'],
  ['v02-shell-hoodie', 'V-02 Shell Hoodie', 'hoodies', 149, ['grey'], ['XS', 'S', 'M', 'L', 'XL'], 'in-stock', '2026-11-05', 70, 'hoodie', 'A hooded overlayer in a soft-shell bonded fleece that blocks wind and sheds light rain. Laser-cut vents under the arms.'],
  ['graphic-tee-03-bone', 'Graphic Tee 03 — Bone', 'tees', 75, ['cream'], ALL, 'in-stock', '2026-11-02', 66, 'tee', 'The 03 graphic in tonal ink on an undyed bone body. Heavyweight 260gsm cotton, garment-washed for a lived-in hand.'],
  ['ripstop-cargo-olive', 'Ripstop Cargo — Olive', 'pants', 189, ['olive'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-10-29', 74, 'cargo', 'Olive ripstop cargos with articulated knees, hidden zip pockets and a gusseted crotch for full range of movement.'],
  ['field-jacket-olive', 'Field Utility Jacket — Olive', 'jackets', 239, ['olive'], ['M', 'L', 'XL', '2XL'], 'in-stock', '2026-10-25', 61, 'jacket', 'A four-pocket field jacket in waxed olive cotton with a corduroy-lined collar and snap-down storm cuffs.'],
  ['core-cap-orange', 'Core Logo Cap — Orange', 'accessories', 45, ['orange'], OS, 'in-stock', '2026-10-22', 58, 'cap', 'The core six-panel in signal orange with a tonal embroidered logo and an unstructured, broken-in crown.'],
  ['crossbody-sling-grey', 'Crossbody Sling — Grey', 'accessories', 79, ['grey'], OS, 'in-stock', '2026-10-19', 52, 'sling', 'A slim crossbody in grey nylon with two zip compartments and a webbing strap that adjusts with one pull.'],
  ['v01-tech-hoodie-signal', 'V-01 Tech Hoodie — Signal', 'hoodies', 139, ['orange'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-10-15', 77, 'hoodie', 'The V-01 Tech Hoodie in signal orange — same brushed-back fleece, scuba hood and bonded pockets, louder colour.'],
  ['boxy-tee-01', 'Boxy Tee 01', 'tees', 65, ['black', 'grey'], ALL, 'in-stock', '2026-10-12', 63, 'tee', 'An everyday boxy tee in 220gsm combed cotton. Short body, wide sleeves, no graphics — the base layer for everything.'],
  ['tech-jogger', 'Tech Jogger', 'pants', 159, ['black'], ['XS', 'S', 'M', 'L', 'XL'], 'in-stock', '2026-10-08', 69, 'cargo', 'A tapered jogger in four-way stretch nylon with zip hand pockets and a bungee-cinch hem. Moves like sweats, looks sharper.'],
  ['storm-shell-jacket', 'Storm Shell Jacket', 'jackets', 259, ['black'], ['S', 'M', 'L', 'XL', '2XL'], 'in-stock', '2026-10-04', 81, 'jacket', 'A 3-layer waterproof shell rated 20K with fully taped seams, pit zips and a helmet-compatible hood.'],
  ['heavyweight-hoodie-bone', 'Heavyweight Hoodie — Bone', 'hoodies', 129, ['cream'], ALL, 'in-stock', '2026-09-30', 72, 'hoodie', 'A 500gsm loopback hoodie in undyed bone with a double-layer hood and no drawcords for a clean, heavy drape.'],
  ['utility-tee-grey', 'Utility Tee — Grey', 'tees', 69, ['grey'], ['S', 'M', 'L', 'XL'], 'in-stock', '2026-09-26', 49, 'tee', 'A grey marl tee with a reinforced chest utility pocket and bar-tacked seams. Heavyweight cotton, relaxed fit.'],
  ['six-pocket-pant', 'Six-Pocket Pant — Black', 'pants', 199, ['black'], ['M', 'L', 'XL', '2XL'], 'in-stock', '2026-09-22', 56, 'cargo', 'Black six-pocket pants in brushed cotton sateen with a straight leg and an adjustable buckle waist.'],
  ['waxed-cap-olive', 'Waxed Cap — Olive', 'accessories', 55, ['olive'], OS, 'in-stock', '2026-09-18', 44, 'cap', 'A waxed cotton cap in olive that sheds light rain and patinas with wear. Leather strap with a brass buckle.'],
  ['v03-gore-hoodie', 'V-03 Gore Hoodie', 'hoodies', 169, ['black'], ['S', 'M', 'L', 'XL'], 'pre-order', '2026-12-10', 85, 'hoodie', 'The V-03 in a waterproof membrane fleece with welded seams and a laminated chest pocket. Shipping with the December drop.'],
  ['expedition-parka', 'Expedition Parka', 'jackets', 329, ['black', 'olive'], ['M', 'L', 'XL', '2XL'], 'pre-order', '2026-12-05', 83, 'jacket', 'An insulated expedition parka with a 700-fill synthetic core, removable hood baffle and eight pockets. Built for real cold.'],
  ['graphic-tee-04-signal', 'Graphic Tee 04 — Signal', 'tees', 85, ['orange'], ALL, 'pre-order', '2026-12-01', 60, 'tee', 'The 04 graphic printed in black on a signal-orange heavyweight body. Limited run, shipping with the December drop.'],
  ['modular-sling-pack', 'Modular Sling Pack', 'accessories', 119, ['grey', 'olive'], OS, 'pre-order', '2026-11-28', 64, 'sling', 'A modular sling with a detachable hip pouch, MOLLE webbing and a weather-sealed main zip. Wear it three ways.'],
]

# Per-category name parts, price band, image and copy fragments.
SPEC = {
  'tees': {
    'img': 'tee', 'price': (55, 95),
    'models': ['Graphic Tee', 'Boxy Tee', 'Heavyweight Tee', 'Pocket Tee', 'Long Sleeve Tee', 'Mock Neck Tee', 'Oversized Tee', 'Raglan Tee', 'Thermal Long Sleeve', 'Logo Tee', 'Ringer Tee', 'Muscle Tee'],
    'series': ['Core', 'Signal', 'Concrete', 'Grid', 'Static', 'Terrain', 'Drop 07', 'Archive', '///', 'Night Shift', 'Summit', 'Overpass'],
    'fabric': ['260gsm heavyweight cotton', '220gsm combed cotton', 'garment-dyed 240gsm jersey', 'slub cotton jersey', 'brushed cotton-modal', 'organic 250gsm cotton'],
    'detail': ['a hand-pulled screen print on the back', 'a tonal puff-print /// mark at the chest', 'a double-needle hem and taped shoulder seams', 'a thick ribbed collar that holds its shape', 'a cracked-ink graphic across the chest', 'a woven brand label at the side seam'],
    'fit': ['Boxy, cropped body with dropped shoulders.', 'Relaxed through the body with wide sleeves.', 'Oversized fit — size down for a closer cut.', 'Regular fit that layers under everything.'],
  },
  'hoodies': {
    'img': 'hoodie', 'price': (109, 189),
    'models': ['Tech Hoodie', 'Heavyweight Hoodie', 'Zip Hoodie', 'Half-Zip Fleece', 'Pullover Hoodie', 'Shell Hoodie', 'Scuba Hoodie', 'Cropped Hoodie', 'Fleece Crewneck', 'Thermal Hoodie'],
    'series': ['V-04', 'V-05', 'V-06', 'Core', 'Signal', 'Concrete', 'Terrain', 'Drop 07', 'Archive', 'Night Shift', 'Summit'],
    'fabric': ['420gsm brushed-back fleece', '500gsm loopback cotton', 'bonded soft-shell fleece', 'polar grid fleece', 'garment-dyed French terry', 'recycled tech fleece'],
    'detail': ['a scuba hood and bonded zip pockets', 'a double-layer hood with no drawcords', 'a kangaroo pocket with a hidden phone sleeve', 'thumbhole cuffs and a ribbed hem', 'laser-cut underarm vents', 'an embroidered /// mark at the chest'],
    'fit': ['Boxy through the body, dropped at the shoulder.', 'Relaxed fit with a slightly cropped length.', 'Oversized fit built for layering.', 'Regular fit with a clean, heavy drape.'],
  },
  'pants': {
    'img': 'cargo', 'price': (129, 219),
    'models': ['Cargo Pant', 'Tech Jogger', 'Ripstop Cargo', 'Parachute Pant', 'Utility Trouser', 'Carpenter Pant', 'Track Pant', 'Wide-Leg Cargo', 'Cargo Short', 'Fleece Sweatpant'],
    'series': ['Core', 'Signal', 'Concrete', 'Terrain', 'Grid', 'Drop 07', 'Archive', 'Night Shift', 'Overpass'],
    'fabric': ['dense cotton twill', 'four-way stretch nylon', 'olive ripstop cotton', 'crinkle nylon', 'brushed cotton sateen', 'heavyweight loopback fleece'],
    'detail': ['bellowed thigh pockets and ankle cinches', 'articulated knees and a gusseted crotch', 'zip hand pockets and a bungee-cinch hem', 'a buckle waist and hidden zip pockets', 'a hammer loop and reinforced knee panels', 'adjustable toggles at the hem'],
    'fit': ['Wide leg that stacks over sneakers.', 'Tapered leg with room through the thigh.', 'Straight leg, mid rise.', 'Relaxed fit with an elastic back waist.'],
  },
  'jackets': {
    'img': 'jacket', 'price': (189, 349),
    'models': ['Utility Jacket', 'Shell Jacket', 'Field Jacket', 'Coach Jacket', 'Puffer Jacket', 'Overshirt', 'Bomber Jacket', 'Windbreaker', 'Insulated Vest', 'Rain Parka', 'Work Jacket'],
    'series': ['Core', 'Signal', 'Concrete', 'Terrain', 'Storm', 'Drop 07', 'Archive', 'Night Shift', 'Summit', 'Expedition'],
    'fabric': ['a water-resistant nylon shell', 'a 3-layer waterproof membrane', 'waxed cotton canvas', 'recycled ripstop with synthetic fill', 'a brushed cotton drill', 'packable 20D nylon'],
    'detail': ['taped seams and a storm flap', 'four bellowed utility pockets', 'pit zips and a helmet-compatible hood', 'a corduroy-lined collar and snap cuffs', 'a two-way zip and an internal stash pocket', 'reflective /// trims on the back'],
    'fit': ['Boxy fit with room to layer.', 'Regular fit, hip length.', 'Relaxed fit with dropped shoulders.', 'Cropped, boxy cut.'],
  },
  'accessories': {
    'img': None, 'price': (29, 129),
    'models': [('Six-Panel Cap', 'cap'), ('Dad Cap', 'cap'), ('Camp Cap', 'cap'), ('Nylon Cap', 'cap'), ('Trucker Cap', 'cap'), ('Sling Bag', 'sling'), ('Crossbody Pouch', 'sling'), ('Hip Pack', 'sling'), ('Utility Pouch', 'sling'), ('Chest Rig', 'sling')],
    'series': ['Core', 'Signal', 'Concrete', 'Terrain', 'Drop 07', 'Archive', 'Night Shift', 'Summit', 'Grid'],
    'fabric': ['coated ripstop', 'washed cotton twill', 'waxed canvas', 'recycled 600D nylon', 'brushed nylon', 'heavy cotton drill'],
    'detail': ['an embroidered /// mark', 'a quick-release buckle', 'a weather-sealed zip', 'an adjustable metal clasp', 'MOLLE webbing on the front', 'a padded phone sleeve'],
    'fit': ['One size, fully adjustable.', 'Fits most — adjusts with one pull.', 'One size with an adjustable strap.'],
  },
}

def slug(s):
    s = s.replace('///', 'mark').replace('—', ' ')
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def pick_sizes(cat):
    if cat == 'accessories':
        return OS
    start = rng.choice([0, 0, 1, 1, 1])
    end = rng.choice([4, 5, 5, 6, 6])
    return ALL[start:end]

PICKED = {}

def gen(cat, n, used_ids, used_names):
    s = SPEC[cat]
    out = []
    today = datetime.date(2026, 11, 24)
    while len(out) < n:
        model = rng.choice(s['models'])
        img = s['img']
        if isinstance(model, tuple):
            model, img = model
        series = rng.choice(s['series'])
        colors = rng.sample(COLORS, rng.choice([1, 1, 1, 2, 2, 3]))
        name = f"{series} {model} — {COLOR_LABEL[colors[0]]}"
        if name in used_names:
            continue
        pid = slug(f"{series} {model} {COLOR_LABEL[colors[0]]}")
        if pid in used_ids:
            continue
        used_names.add(name); used_ids.add(pid)
        lo, hi = s['price']
        price = rng.randrange(lo // 10, hi // 10 + 1) * 10 + rng.choice([5, 9])
        pre = rng.random() < 0.08
        if pre:
            date = datetime.date(2026, 11, 26) + datetime.timedelta(days=rng.randrange(0, 60))
        else:
            date = today - datetime.timedelta(days=rng.randrange(0, 210))
        pop = rng.randrange(8, 95)
        noun = model.lower()
        # Same rng call order as before, so the catalog itself doesn't change.
        fabric, detail, fit = rng.choice(s['fabric']), rng.choice(s['detail']), rng.choice(s['fit'])
        desc = (f"The {series} {noun} in {' / '.join(COLOR_LABEL[c].lower() for c in colors)}, cut from "
                f"{fabric} with {detail}. {fit}")
        if pre:
            desc += ' Ships with the next drop.'
        out.append([pid, name, cat, price, colors, pick_sizes(cat), 'pre-order' if pre else 'in-stock',
                    date.isoformat(), pop, img, desc])
        PICKED[pid] = {'fabric': fabric, 'detail': detail, 'fit': fit}
    return out

used_ids = {p[0] for p in BASE}
used_names = {p[1] for p in BASE}
products = list(BASE)
for cat, total in TARGET.items():
    have = sum(1 for p in BASE if p[2] == cat)
    products += gen(cat, total - have, used_ids, used_names)

assert len(products) == 260 and len({p[0] for p in products}) == 260

# ---------------------------------------------------------------- Extras
# Rating, review count and a spec list per product. Seeded per id so these
# never shift the catalog above.
BASE_SPEC = {  # hand-written products: material + key features
  'v01-tech-hoodie': ('420gsm brushed-back fleece', ['Scuba hood with no drawcords', 'Bonded zip hand pockets', 'Embroidered /// mark at the chest']),
  'graphic-tee-02': ('260gsm heavyweight cotton', ['Hand-pulled cracked-ink X graphic', 'Tight 1x1 ribbed collar', 'Double-needle hem']),
  'cargo-pants': ('dense cotton twill', ['Bellowed thigh pockets', 'Adjustable ankle cinches', 'Reinforced belt loops']),
  'utility-jacket': ('a water-resistant nylon shell', ['Fully taped seams', 'Storm flap over the zip', 'Four utility pockets']),
  'signature-cap': ('washed cotton twill', ['3D-embroidered /// mark', 'Structured six-panel crown', 'Adjustable metal clasp']),
  'tech-sling-bag': ('coated ripstop', ['4L main compartment', 'Signal-orange zip channel', 'Padded phone sleeve and quick-release buckle']),
  'v02-shell-hoodie': ('bonded soft-shell fleece', ['Wind-blocking, sheds light rain', 'Laser-cut underarm vents', 'Zip chest pocket']),
  'graphic-tee-03-bone': ('260gsm heavyweight cotton', ['Tonal 03 graphic', 'Undyed bone body', 'Garment-washed for a soft hand']),
  'ripstop-cargo-olive': ('olive ripstop cotton', ['Articulated knees', 'Hidden zip pockets', 'Gusseted crotch']),
  'field-jacket-olive': ('waxed cotton canvas', ['Corduroy-lined collar', 'Four bellowed pockets', 'Snap-down storm cuffs']),
  'core-cap-orange': ('washed cotton twill', ['Tonal embroidered logo', 'Unstructured, broken-in crown', 'Adjustable strap']),
  'crossbody-sling-grey': ('brushed nylon', ['Two zip compartments', 'One-pull adjustable webbing strap', 'Slim, low-profile body']),
  'v01-tech-hoodie-signal': ('420gsm brushed-back fleece', ['Scuba hood with no drawcords', 'Bonded zip hand pockets', 'Signal-orange body']),
  'boxy-tee-01': ('220gsm combed cotton', ['Short, boxy body', 'Wide sleeves', 'No graphics — clean base layer']),
  'tech-jogger': ('four-way stretch nylon', ['Zip hand pockets', 'Bungee-cinch hem', 'Elastic waist with internal drawcord']),
  'storm-shell-jacket': ('a 3-layer waterproof membrane', ['20K waterproof rating, fully taped seams', 'Pit zips', 'Helmet-compatible hood']),
  'heavyweight-hoodie-bone': ('500gsm loopback cotton', ['Double-layer hood', 'No drawcords for a clean drape', 'Ribbed cuffs and hem']),
  'utility-tee-grey': ('260gsm heavyweight cotton', ['Reinforced chest utility pocket', 'Bar-tacked stress points', 'Grey marl body']),
  'six-pocket-pant': ('brushed cotton sateen', ['Six pockets', 'Straight leg', 'Adjustable buckle waist']),
  'waxed-cap-olive': ('waxed canvas', ['Sheds light rain', 'Leather strap with brass buckle', 'Patinas with wear']),
  'v03-gore-hoodie': ('waterproof membrane fleece', ['Welded seams', 'Laminated chest pocket', 'Shipping with the December drop']),
  'expedition-parka': ('recycled ripstop with synthetic fill', ['700-fill synthetic core', 'Removable hood baffle', 'Eight pockets']),
  'graphic-tee-04-signal': ('260gsm heavyweight cotton', ['Black 04 graphic on signal orange', 'Limited run', 'Double-needle hem']),
  'modular-sling-pack': ('recycled 600D nylon', ['Detachable hip pouch', 'MOLLE webbing', 'Weather-sealed main zip']),
}
BASE_FIT = {'tees': 'Boxy, cropped body with dropped shoulders.', 'hoodies': 'Boxy through the body, dropped at the shoulder.',
            'pants': 'Relaxed through the thigh with room to stack.', 'jackets': 'Boxy fit with room to layer.',
            'accessories': 'One size, fully adjustable.'}
COMPOSITION = [  # (substring of fabric, composition) — first match wins
  ('waxed', '100% cotton, paraffin wax finish'), ('membrane fleece', 'Polyester fleece bonded to a waterproof membrane'),
  ('recycled 600D', '100% recycled nylon'),
  ('membrane', 'Nylon face, waterproof membrane, tricot backer'), ('soft-shell', '94% polyester, 6% elastane'),
  ('polar', '100% recycled polyester'), ('tech fleece', '70% recycled polyester, 30% cotton'),
  ('fleece', '80% cotton, 20% recycled polyester'), ('loopback', '100% cotton'), ('terry', '100% cotton'),
  ('modal', '60% cotton, 40% modal'), ('cotton', '100% cotton'), ('jersey', '100% cotton'),
  ('stretch nylon', '88% nylon, 12% elastane'), ('nylon', '100% nylon'), ('ripstop with', '100% recycled polyester shell and fill'),
  ('ripstop', '100% nylon ripstop'), ('membrane', 'Nylon face, waterproof membrane, tricot backer'),
  ('waxed', '100% cotton, paraffin wax finish'), ('twill', '100% cotton'), ('drill', '100% cotton'), ('canvas', '100% cotton'),
]
EXTRA = {
  'tees': ['Pre-shrunk — keeps its size after washing', 'Taped neck and shoulder seams', 'Woven /// label at the hem'],
  'hoodies': ['Ribbed cuffs and hem that hold their shape', 'Pre-shrunk, garment-washed body', 'Woven /// label at the hem'],
  'pants': ['YKK zip fly', 'Bar-tacked pocket corners', 'Woven /// label at the back pocket'],
  'jackets': ['YKK two-way front zip', 'Internal stash pocket', 'Adjustable hem drawcord'],
  'accessories': ['YKK zips and hardware', 'Woven /// label', 'Reinforced stitching at stress points'],
}
USE = {
  'tees': ['Wear it alone through the Manila heat or under an overshirt when the night cools down.',
           'Pairs with wide cargos and a cap for the full uniform.',
           'Built thick enough to wear on its own, soft enough to sleep in.',
           'Holds its shape wash after wash — no twisting side seams.'],
  'hoodies': ['Heavy enough for aircon offices and late rides, breathable enough for the commute.',
              'Layer it under a shell when the rain comes in sideways.',
              'Gets softer every wash without losing its structure.',
              'Pairs with tech joggers for a clean all-black fit.'],
  'pants': ['Made to move — from the jeepney to the skate spot.',
            'Pockets sit flat when empty, so the silhouette stays clean.',
            'Pairs with a boxy tee and chunky sneakers.',
            'Tough enough for everyday wear, easy to wash and dry.'],
  'jackets': ['Light enough to pack, tough enough for wet-season downpours.',
              'Cut to fit over a hoodie without bunching at the shoulders.',
              'Throw it on over anything — it does the heavy lifting.',
              'Built to take a beating and look better for it.'],
  'accessories': ['The finishing piece for any fit.',
                  'Small enough to forget it is there, tough enough to last years.',
                  'Built to carry the essentials and nothing else.',
                  'Matches the rest of the line in fabric and hardware.'],
}
SIZES_TXT = ['XS', 'S', 'M', 'L', 'XL']

def care_for(cat, fabric):
    if 'waxed' in fabric:
        return 'Wipe clean with a damp cloth; re-wax when it dries out. Do not machine wash.'
    if 'membrane' in fabric or 'shell' in fabric or 'soft-shell' in fabric:
        return 'Machine wash cold on gentle, no softener. Tumble dry low to refresh water repellency.'
    if cat == 'accessories':
        return 'Spot clean with a damp cloth. Air dry.'
    if cat in ('tees', 'hoodies'):
        return 'Machine wash cold, inside out. Hang dry. Do not iron prints or embroidery.'
    return 'Machine wash cold with like colors. Hang dry.'

def comp_for(fabric):
    for key, comp in COMPOSITION:
        if key in fabric:
            return comp
    return '100% cotton'

today = datetime.date(2026, 11, 24)
for p in products:
    pid, cat, pop, stock = p[0], p[2], p[8], p[6]
    r = random.Random('extras:' + pid)
    if pid in BASE_SPEC:
        fabric, feats = BASE_SPEC[pid]
        fit = BASE_FIT[cat]
    else:
        pk = PICKED[pid]
        fabric, fit = pk['fabric'], pk['fit']
        other = r.choice([d for d in SPEC[cat]['detail'] if d != pk['detail']])
        feats = [pk['detail'][0].upper() + pk['detail'][1:].removeprefix('a ').removeprefix('an '),
                 other[0].upper() + other[1:]]
        feats = [f.replace('A ', '', 1) if f.startswith('A ') else f for f in feats]
        feats = [f[0].upper() + f[1:] for f in feats]
        feats.append(r.choice(EXTRA[cat]))
        p[10] = p[10].replace(' Ships with the next drop.', '') + f" Finished with {other}." + \
            (' Ships with the next drop.' if stock == 'pre-order' else '')
    p[10] += ' ' + r.choice(USE[cat])

    if stock == 'pre-order':
        rating, reviews = 0, 0
    else:
        age = (today - datetime.date.fromisoformat(p[7])).days
        rating = round(min(5.0, max(3.6, 3.95 + pop / 95 * 0.85 + r.gauss(0, 0.18))), 1)
        reviews = max(3, int(pop * (0.35 + min(age, 200) / 200 * 1.6) * r.uniform(0.6, 1.4)))

    material = fabric.removeprefix('a ').removeprefix('an ')
    spec = [['Material', f"{material[0].upper() + material[1:]} — {comp_for(fabric)}"]]
    if cat != 'accessories':
        size = r.choice(SIZES_TXT[1:]) if 'Oversized' not in fit else r.choice(['S', 'M'])
        h = r.choice([170, 173, 175, 178, 180, 183, 185])
        spec.append(['Fit', f"{fit} Model is {h} cm and wears {size}."])
    else:
        spec.append(['Size', fit])
    spec.append(['Features', feats])
    spec.append(['Care', care_for(cat, fabric)])
    spec.append(['Made', f"Designed in Manila. Produced in a run of {r.choice([150, 200, 250, 300, 400])} pieces."])
    p += [rating, reviews, spec]

counts = {c: sum(1 for p in products if p[2] == c) for c in TARGET}
avail = {a: sum(1 for p in products if p[6] == a) for a in ('in-stock', 'pre-order')}

rows = ',\n'.join('  ' + json.dumps(p, ensure_ascii=False) for p in products)
js = f"""/* GENERATED by tools/gen_products.py — do not edit by hand; edit the script and re-run.
   NGProducts: the full shop catalog ({len(products)} products).
   Row: [id, name, category, price, colors, sizes, stock, date, popularity, image, description,
        rating (0 = no reviews yet), reviews, spec [[label, text | [features]]]]
   Category totals: {json.dumps(counts)} · availability: {json.dumps(avail)} */
window.NGProducts = [
{rows}
];
"""
(ROOT / 'js' / 'products.js').write_text(js, encoding='utf-8')

# Keep the no-JS filter counts in the shop partial in step with the data.
part = ROOT / 'src' / 'partials' / 'shop-listing.html'
html = part.read_text(encoding='utf-8')
labels = {'hoodies': 'Hoodies', 'jackets': 'Jackets', 'tees': 'Tees', 'pants': 'Pants', 'accessories': 'Accessories'}
for c, label in labels.items():
    in_stock = sum(1 for p in products if p[2] == c and p[6] == 'in-stock')  # default filter: in-stock only
    html = re.sub(rf'{label} \(\d+\)', f'{label} ({in_stock})', html)
html = re.sub(r'In Stock \(\d+\)', f"In Stock ({avail['in-stock']})", html)
html = re.sub(r'Pre-Order \(\d+\)', f"Pre-Order ({avail['pre-order']})", html)
html = re.sub(r'data-apply-count>\d+<', f"data-apply-count>{avail['in-stock']}<", html)
html = re.sub(r'data-count>\d+ Products<', f"data-count>{avail['in-stock']} Products<", html)
part.write_text(html, encoding='utf-8')

print(len(products), counts, avail)
