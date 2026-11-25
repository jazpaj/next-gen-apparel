/* NGOrders — shared order store for checkout.html (creates orders) and
   contact.html (order tracking). Preview store: orders live in this browser's
   localStorage ("nga-orders"); nothing is sent to a server.

   Order shape:
   {
     id: "NGA-482913",           // "NGA-" + 6 digits
     email: "name@example.com",   // lower-cased
     createdAt: 1764057600000,    // ms timestamp
     items: [{ id, name, price, image, size, color, qty }],   // NGCart items
     subtotal, discount, shipping, total,                      // numbers (USD)
     promo: "NEXTGEN10" | null,
     shippingMethod: "standard" | "express",
     address: { firstName, lastName, phone, line1, line2, city, region, postal, country },
     payment: "cod" | "card-preview"
   }

   API (window.NGOrders):
     create(data) -> order        assigns id + createdAt, saves, returns the order
     find(id, email) -> order|null  case-insensitive id, email must match
     get(id) -> order|null
     all() -> order[]
     status(order, now?) -> { steps: [{key, label, at, done}], current: key, eta }
     SHIPPING: { standard: {...}, express: {...} }
     money(n) -> "$139.00"
*/
window.NGOrders = window.NGOrders || (() => {
  const KEY = 'nga-orders';
  const DAY = 864e5, HOUR = 36e5;

  const SHIPPING = {
    standard: { label: 'Standard', detail: '3–5 business days', price: 8, freeOver: 150, days: [3, 5] },
    express:  { label: 'Express',  detail: '1–2 business days', price: 18, freeOver: null, days: [1, 2] },
  };

  let memory = [];
  const load = () => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch { return memory; }
  };
  const save = (list) => {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked: keep in memory */ }
  };

  // A sample order so tracking can be previewed without buying anything.
  const DEMO = {
    id: 'NGA-100248', email: 'demo@nextgenapparel.ph', demo: true,
    createdAt: Date.now() - 2 * DAY - 5 * HOUR,
    items: [
      { id: 'v01-tech-hoodie', name: 'V-01 Tech Hoodie', price: 139, image: 'assets/img/product-tech-hoodie.webp', size: 'M', color: 'Black', qty: 1 },
      { id: 'signature-cap', name: 'Signature Cap', price: 49, image: 'assets/img/product-signature-cap.webp', size: 'One size', color: 'Black', qty: 1 },
    ],
    subtotal: 188, discount: 0, shipping: 0, total: 188, promo: null,
    shippingMethod: 'standard',
    address: { firstName: 'Demo', lastName: 'Customer', phone: '', line1: '123 Sample St.', line2: '', city: 'Makati', region: 'Metro Manila', postal: '1200', country: 'Philippines' },
    payment: 'cod',
  };

  const all = () => load();
  const get = (id) => {
    const key = String(id || '').trim().toUpperCase();
    if (key === DEMO.id) return DEMO;
    return load().find((o) => o.id === key) || null;
  };
  const find = (id, email) => {
    const o = get(id);
    return o && o.email === String(email || '').trim().toLowerCase() ? o : null;
  };

  const newId = () => {
    const taken = new Set(load().map((o) => o.id).concat(DEMO.id));
    let id;
    do { id = 'NGA-' + String(Math.floor(100000 + Math.random() * 900000)); } while (taken.has(id));
    return id;
  };

  const create = (data) => {
    const order = { ...data, id: newId(), createdAt: Date.now(), email: String(data.email || '').trim().toLowerCase() };
    save(load().concat(order));
    return order;
  };

  // Business-day math for delivery estimates (skips Sat/Sun).
  const addBusinessDays = (ts, n) => {
    const d = new Date(ts);
    while (n > 0) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n--; }
    return d.getTime();
  };

  // Status timeline derived from the order's age (a preview stand-in for a carrier feed).
  const status = (order, now = Date.now()) => {
    const m = SHIPPING[order.shippingMethod] || SHIPPING.standard;
    const t0 = order.createdAt;
    const deliver = addBusinessDays(t0, m.days[1]);
    const shipped = Math.min(t0 + 1 * DAY, deliver - 1 * DAY);
    const steps = [
      { key: 'placed',     label: 'Order placed',      at: t0 },
      { key: 'processing', label: 'Processing',        at: t0 + 2 * HOUR },
      { key: 'shipped',    label: 'Shipped',           at: Math.max(shipped, t0 + 3 * HOUR) },
      { key: 'out',        label: 'Out for delivery',  at: deliver - 6 * HOUR },
      { key: 'delivered',  label: 'Delivered',         at: deliver },
    ].map((s) => ({ ...s, done: now >= s.at }));
    const current = [...steps].reverse().find((s) => s.done)?.key || 'placed';
    return { steps, current, eta: { from: addBusinessDays(t0, m.days[0]), to: deliver } };
  };

  const money = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return { create, find, get, all, status, SHIPPING, money, DEMO_ID: DEMO.id, DEMO_EMAIL: DEMO.email };
})();
