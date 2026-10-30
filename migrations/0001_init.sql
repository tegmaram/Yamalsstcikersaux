-- Initial schema for Yamal's Stickers AUX
CREATE TABLE IF NOT EXISTS stickers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT,
  image TEXT NOT NULL,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price_vb TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  user_agent TEXT,
  referrer TEXT,
  lang TEXT,
  items_json TEXT NOT NULL,
  offered_price REAL,
  contact TEXT,
  message TEXT,
  turnstile_ok INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- Seed initial stickers (mirrors app.js STICKERS)
INSERT OR IGNORE INTO stickers (id,title,tag,image,description,stock,price_vb,active,created_at,updated_at) VALUES
('ulrich-biesinger-tribuene','Ulrich-Biesinger-Tribüne – „Es geht nur gemeinsam“','FCA','./assets/stickers/ulrich-biesinger-tribuene.jpg','Dunkelgrün, Weinrot und Weiß mit umlaufendem Doppelrahmen',10,'VB',1,datetime('now'),datetime('now')),
('gruppe-fuggerstadt','Gruppe Fuggerstadt (GF19)','Augsburg','./assets/stickers/gruppe-fuggerstadt.jpg','Breiter Rot-Grün-Weißer Streifenkleber mit Riss-Schriftzug und Zirbelnuss-Wappenmotiv',10,'VB',1,datetime('now'),datetime('now')),
('fuggerstadt-wappen','Fuggerstadt – Stadtwappen & Lorbeerkranz','Augsburg','./assets/stickers/fuggerstadt-wappen.jpg','Tiefschwarzer Streifen-Sticker mit Augsburger Zirbelnuss-Stadtwappen im Lorbeerkranz',10,'VB',1,datetime('now'),datetime('now')),
('la-07-adler','LA 07 – Doppeladler & Zirbelnuss','LA','./assets/stickers/la-07-adler.jpg','Weinrot-Grün-Weißer Streifen mit „LA 07“-Schriftzug und Doppeladler inkl. Zirbelnuss-Brustschild',10,'VB',1,datetime('now'),datetime('now')),
('la-adler','L A – Doppeladler Klassik','LA','./assets/stickers/la-adler.jpg','Kompakter weinroter Streifen-Aufkleber mit grün-weißer Kante und zentralem Doppeladler',10,'VB',1,datetime('now'),datetime('now'));
