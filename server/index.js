// Simple backend API for tutorials: Express + SQLite + file storage
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import compression from 'compression';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'better-sqlite3';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true,
}));
app.set('trust proxy', 1);
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));
app.use(express.json({ limit: '5mb' }));

const __dirnameLocal = path.resolve();
const dataDir = path.join(__dirnameLocal, 'server');
const storageDir = path.join(dataDir, 'storage');
const dbPath = path.join(dataDir, 'data.sqlite');
fs.mkdirSync(storageDir, { recursive: true });

const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS tutorials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    stepCount INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutorialId TEXT NOT NULL,
    ts INTEGER NOT NULL,
    kind TEXT NOT NULL,
    selector TEXT,
    key TEXT,
    title TEXT,
    FOREIGN KEY (tutorialId) REFERENCES tutorials(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS media (
    tutorialId TEXT PRIMARY KEY,
    mimeType TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (tutorialId) REFERENCES tutorials(id) ON DELETE CASCADE
  );
`);

const insertTutorial = db.prepare('INSERT INTO tutorials (id, title, createdAt, updatedAt, stepCount) VALUES (?, ?, ?, ?, 0)');
const getTutorial = db.prepare('SELECT * FROM tutorials WHERE id = ?');
const listTutorials = db.prepare('SELECT * FROM tutorials ORDER BY updatedAt DESC');
const updateTutorialCounts = db.prepare('UPDATE tutorials SET stepCount = ?, updatedAt = ? WHERE id = ?');
const insertStep = db.prepare('INSERT INTO steps (tutorialId, ts, kind, selector, key, title) VALUES (?, ?, ?, ?, ?, ?)');
const listSteps = db.prepare('SELECT * FROM steps WHERE tutorialId = ? ORDER BY ts ASC');
const upsertMedia = db.prepare('INSERT INTO media (tutorialId, mimeType, path, size, createdAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(tutorialId) DO UPDATE SET mimeType=excluded.mimeType, path=excluded.path, size=excluded.size, createdAt=excluded.createdAt');
const getMedia = db.prepare('SELECT * FROM media WHERE tutorialId = ?');

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Simple Reports Endpoints for frontend features
app.get('/api/reports/metrics', (req, res) => {
  const range = (req.query.range || '30d').toString();
  res.json({
    success: true,
    message: 'ok',
    data: {
      totalUsers: 1234,
      activeUsers: 892,
      totalTutorials: 156,
      completionRate: 78.5,
      averageTime: 847,
      revenue: 45670,
      growth: { users: 12, tutorials: 8, revenue: 23 },
      range,
    }
  });
});

app.get('/api/reports/tutorials', (req, res) => {
  const data = [
    { id: '1', title: 'Getting Started Guide', views: 2456, completions: 1987, averageTime: 12.5, rating: 4.8, dropoffRate: 8.2 },
    { id: '2', title: 'Advanced Features', views: 1876, completions: 1234, averageTime: 18.7, rating: 4.6, dropoffRate: 15.3 },
    { id: '3', title: 'Integration Setup', views: 1543, completions: 987, averageTime: 25.4, rating: 4.4, dropoffRate: 22.1 }
  ];
  res.json({ success: true, message: 'ok', data });
});

app.get('/api/reports/users', (req, res) => {
  const data = {
    totalUsers: 1234,
    activeUsers: 892,
    newUsers: 156,
    retentionRate: 84.2,
    topRegions: [
      { region: 'North America', count: 567 },
      { region: 'Europe', count: 345 },
      { region: 'Asia Pacific', count: 234 }
    ]
  };
  res.json({ success: true, message: 'ok', data });
});

app.get('/api/reports/export', (req, res) => {
  const type = (req.query.type || 'overview').toString();
  const range = (req.query.range || '30d').toString();
  const payload = { type, range, generatedAt: new Date().toISOString() };
  res.json({ success: true, message: 'ok', data: payload });
});

app.post('/api/tutorials', (req, res) => {
  const title = (req.body?.title || '').toString().trim() || 'Untitled Tutorial';
  const id = nanoid();
  const now = Date.now();
  insertTutorial.run(id, title, now, now);
  res.json({ id, title, createdAt: now, updatedAt: now, stepCount: 0 });
});

app.get('/api/tutorials', (_req, res) => {
  const rows = listTutorials.all();
  res.json(rows);
});

app.get('/api/tutorials/:id', (req, res) => {
  const t = getTutorial.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  const steps = listSteps.all(req.params.id);
  res.json({ ...t, steps });
});

app.post('/api/tutorials/:id/steps', (req, res) => {
  const t = getTutorial.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];
  const insert = db.transaction((items) => {
    for (const s of items) insertStep.run(req.params.id, s.ts, s.kind, s.selector ?? null, s.key ?? null, s.title ?? null);
    const count = listSteps.all(req.params.id).length;
    updateTutorialCounts.run(count, Date.now(), req.params.id);
    return count;
  });
  const count = insert(steps);
  res.json({ ok: true, stepCount: count });
});

// Tutorial generation endpoint
app.post('/api/tutorials/generate', (req, res) => {
  const title = (req.body?.title || 'Automated Tutorial').toString();
  const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
  const id = nanoid();
  const now = Date.now();
  insertTutorial.run(id, title, now, now);
  const insert = db.transaction((items) => {
    for (const a of items) insertStep.run(id, now, a.type || 'note', a.selector || null, a.key || null, a.title || null);
    const count = listSteps.all(id).length;
    updateTutorialCounts.run(count, Date.now(), id);
    return count;
  });
  insert(actions);
  res.json({ success: true, message: 'generated', data: { id } });
});

// Video uploads (metadata only for demo)
let videos = [];
app.get('/api/videos', (_req, res) => res.json({ success: true, data: videos }));
app.post('/api/videos', (req, res) => {
  const { title, url, thumbnailUrl } = req.body || {};
  const item = { id: nanoid(), title: String(title||'Untitled Video'), url: String(url||''), thumbnailUrl: String(thumbnailUrl||''), createdAt: Date.now(), status: 'ready', views: 0 };
  videos.unshift(item);
  res.json({ success: true, data: item });
});

// API hub persistence (collections/requests) and proxy (demo-safe)
let apiCollections = [];
let apiRequests = [];
app.get('/api/apihub/collections', (_req, res) => res.json({ success: true, data: apiCollections }));
app.post('/api/apihub/collections', (req, res) => {
  const { name, description } = req.body || {};
  const c = { id: nanoid(), name: String(name||'Collection'), description: String(description||''), requests: [], createdAt: Date.now(), updatedAt: Date.now() };
  apiCollections.unshift(c);
  res.json({ success: true, data: c });
});
app.get('/api/apihub/requests', (_req, res) => res.json({ success: true, data: apiRequests }));
app.post('/api/apihub/requests', (req, res) => {
  const r = { id: nanoid(), ...(req.body||{}), createdAt: Date.now(), updatedAt: Date.now(), executionCount: 0, successRate: 100, averageResponseTime: 0 };
  apiRequests.unshift(r);
  res.json({ success: true, data: r });
});
app.post('/api/apihub/execute', async (req, res) => {
  // Demo: do not call arbitrary external URLs; return simulated response
  const response = { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, body: { ok: true, message: 'Executed (simulated)' }, responseTime: 123, size: 256 };
  res.json({ success: true, data: response });
});

// CRM minimal endpoints
let contacts = [];
app.get('/api/crm/contacts', (_req, res) => res.json({ success: true, data: contacts }));
app.post('/api/crm/contacts', (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  const c = { id: nanoid(), firstName: String(firstName||''), lastName: String(lastName||''), email: String(email||''), createdAt: Date.now(), updatedAt: Date.now() };
  contacts.unshift(c);
  res.json({ success: true, data: c });
});

const upload = multer({ dest: storageDir, limits: { fileSize: 100 * 1024 * 1024 } });
app.post('/api/tutorials/:id/media', upload.single('file'), (req, res) => {
  const t = getTutorial.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  if (!req.file) return res.status(400).json({ error: 'file_required' });
  const filePath = path.join(storageDir, `${req.params.id}-${Date.now()}`);
  fs.renameSync(req.file.path, filePath);
  upsertMedia.run(req.params.id, req.file.mimetype || 'application/octet-stream', filePath, req.file.size, Date.now());
  res.json({ ok: true });
});

app.get('/api/tutorials/:id/media', (req, res) => {
  const m = getMedia.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'not_found' });
  res.setHeader('Content-Type', m.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', `${m.tutorialId}-${m.size}-${m.createdAt}`);
  fs.createReadStream(m.path).pipe(res);
});

// Basic Workflow CRUD in-memory for demo
let workflows = [];
app.get('/api/workflows', (_req, res) => {
  res.json({ success: true, message: 'ok', data: workflows });
});
app.post('/api/workflows', (req, res) => {
  const { name, description } = req.body || {};
  const wf = { id: nanoid(), name: String(name||'Untitled'), description: String(description||''), nodes: [], isActive: false, lastRun: null, runCount: 0, successRate: 100, createdAt: Date.now(), updatedAt: Date.now() };
  workflows.unshift(wf);
  res.json({ success: true, message: 'created', data: wf });
});
app.put('/api/workflows/:id', (req, res) => {
  const idx = workflows.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'not_found' });
  workflows[idx] = { ...workflows[idx], ...req.body, updatedAt: Date.now() };
  res.json({ success: true, message: 'updated', data: workflows[idx] });
});
app.delete('/api/workflows/:id', (req, res) => {
  const before = workflows.length;
  workflows = workflows.filter(w => w.id !== req.params.id);
  if (workflows.length === before) return res.status(404).json({ success: false, message: 'not_found' });
  res.json({ success: true, message: 'deleted' });
});

// App Builder: simple schema storage in memory
let appSchemas = [];
app.get('/api/app-schemas', (_req, res) => {
  res.json({ success: true, message: 'ok', data: appSchemas });
});
app.post('/api/app-schemas', (req, res) => {
  const { name, schema } = req.body || {};
  const item = { id: nanoid(), name: String(name||'Untitled App'), schema: schema ?? {}, createdAt: Date.now(), updatedAt: Date.now() };
  appSchemas.unshift(item);
  res.json({ success: true, message: 'created', data: item });
});
app.put('/api/app-schemas/:id', (req, res) => {
  const idx = appSchemas.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'not_found' });
  appSchemas[idx] = { ...appSchemas[idx], ...req.body, updatedAt: Date.now() };
  res.json({ success: true, message: 'updated', data: appSchemas[idx] });
});
app.delete('/api/app-schemas/:id', (req, res) => {
  const before = appSchemas.length;
  appSchemas = appSchemas.filter(a => a.id !== req.params.id);
  if (appSchemas.length === before) return res.status(404).json({ success: false, message: 'not_found' });
  res.json({ success: true, message: 'deleted' });
});

// Serve frontend build with strong caching for assets
const distDir = path.join(__dirnameLocal, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (/\.(js|css|png|jpe?g|webp|avif|svg)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  // SPA fallback
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

