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
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 0,
    lastRun INTEGER,
    runCount INTEGER NOT NULL DEFAULT 0,
    successRate INTEGER NOT NULL DEFAULT 100,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_schemas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schema TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnailUrl TEXT,
    status TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS api_collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS api_requests (
    id TEXT PRIMARY KEY,
    collectionId TEXT,
    name TEXT NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    headers TEXT,
    params TEXT,
    body TEXT,
    description TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    executionCount INTEGER NOT NULL DEFAULT 0,
    averageResponseTime REAL NOT NULL DEFAULT 0,
    successRate REAL NOT NULL DEFAULT 100,
    FOREIGN KEY (collectionId) REFERENCES api_collections(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
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

// Video uploads (metadata)
const listVideos = db.prepare('SELECT * FROM videos ORDER BY createdAt DESC');
const insertVideo = db.prepare('INSERT INTO videos (id, title, url, thumbnailUrl, status, views, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
app.get('/api/videos', (_req, res) => res.json({ success: true, data: listVideos.all() }));
app.post('/api/videos', (req, res) => {
  const { title, url, thumbnailUrl } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  insertVideo.run(id, String(title||'Untitled Video'), String(url||''), String(thumbnailUrl||''), 'ready', 0, now);
  const item = { id, title: String(title||'Untitled Video'), url: String(url||''), thumbnailUrl: String(thumbnailUrl||''), status: 'ready', views: 0, createdAt: now };
  res.json({ success: true, data: item });
});

// API hub persistence (collections/requests) and proxy (simulated execute)
const listCollections = db.prepare('SELECT * FROM api_collections ORDER BY updatedAt DESC');
const insertCollection = db.prepare('INSERT INTO api_collections (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
app.get('/api/apihub/collections', (_req, res) => res.json({ success: true, data: listCollections.all() }));
app.post('/api/apihub/collections', (req, res) => {
  const { name, description } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  insertCollection.run(id, String(name||'Collection'), String(description||''), now, now);
  res.json({ success: true, data: { id, name: String(name||'Collection'), description: String(description||''), createdAt: now, updatedAt: now } });
});
const listRequests = db.prepare('SELECT * FROM api_requests ORDER BY updatedAt DESC');
const insertRequest = db.prepare('INSERT INTO api_requests (id, collectionId, name, method, url, headers, params, body, description, createdAt, updatedAt, executionCount, averageResponseTime, successRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
app.get('/api/apihub/requests', (_req, res) => res.json({ success: true, data: listRequests.all() }));
app.post('/api/apihub/requests', (req, res) => {
  const id = nanoid();
  const now = Date.now();
  const {
    collectionId = null,
    name = 'Request', method = 'GET', url = '', headers = {}, params = {}, body = '', description = ''
  } = req.body || {};
  insertRequest.run(
    id,
    collectionId ? String(collectionId) : null,
    String(name), String(method), String(url), JSON.stringify(headers), JSON.stringify(params), String(body), String(description), now, now, 0, 0, 100
  );
  res.json({ success: true, data: { id, collectionId, name, method, url, headers, params, body, description, createdAt: now, updatedAt: now, executionCount: 0, averageResponseTime: 0, successRate: 100 } });
});
app.post('/api/apihub/execute', async (req, res) => {
  // Demo: do not call arbitrary external URLs; return simulated response
  const response = { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, body: { ok: true, message: 'Executed (simulated)' }, responseTime: 123, size: 256 };
  res.json({ success: true, data: response });
});

// CRM contacts
const listContacts = db.prepare('SELECT * FROM contacts ORDER BY updatedAt DESC');
const insertContact = db.prepare('INSERT INTO contacts (id, firstName, lastName, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
const updateContact = db.prepare('UPDATE contacts SET firstName=?, lastName=?, email=?, updatedAt=? WHERE id=?');
const deleteContact = db.prepare('DELETE FROM contacts WHERE id=?');
app.get('/api/crm/contacts', (_req, res) => res.json({ success: true, data: listContacts.all() }));
app.post('/api/crm/contacts', (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  insertContact.run(id, String(firstName||''), String(lastName||''), String(email||''), now, now);
  res.json({ success: true, data: { id, firstName: String(firstName||''), lastName: String(lastName||''), email: String(email||''), createdAt: now, updatedAt: now } });
});
app.put('/api/crm/contacts/:id', (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  updateContact.run(String(firstName||''), String(lastName||''), String(email||''), Date.now(), req.params.id);
  res.json({ success: true });
});
app.delete('/api/crm/contacts/:id', (req, res) => {
  deleteContact.run(req.params.id);
  res.json({ success: true });
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

// Workflow CRUD (db-backed)
const listWorkflows = db.prepare('SELECT * FROM workflows ORDER BY updatedAt DESC');
const insertWorkflow = db.prepare('INSERT INTO workflows (id, name, description, isActive, lastRun, runCount, successRate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const updateWorkflow = db.prepare('UPDATE workflows SET name=?, description=?, isActive=?, lastRun=?, runCount=?, successRate=?, updatedAt=? WHERE id=?');
const deleteWorkflowStmt = db.prepare('DELETE FROM workflows WHERE id=?');
app.get('/api/workflows', (_req, res) => {
  res.json({ success: true, message: 'ok', data: listWorkflows.all() });
});
app.post('/api/workflows', (req, res) => {
  const { name, description } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  insertWorkflow.run(id, String(name||'Untitled'), String(description||''), 0, null, 0, 100, now, now);
  res.json({ success: true, message: 'created', data: { id, name: String(name||'Untitled'), description: String(description||''), isActive: 0, lastRun: null, runCount: 0, successRate: 100, createdAt: now, updatedAt: now } });
});
app.put('/api/workflows/:id', (req, res) => {
  const { name, description, isActive, lastRun, runCount, successRate } = req.body || {};
  updateWorkflow.run(name ?? '', description ?? '', isActive ? 1 : 0, lastRun ?? null, runCount ?? 0, successRate ?? 100, Date.now(), req.params.id);
  res.json({ success: true, message: 'updated' });
});
app.delete('/api/workflows/:id', (req, res) => {
  deleteWorkflowStmt.run(req.params.id);
  res.json({ success: true, message: 'deleted' });
});

// App Builder: schema storage in DB
const listAppSchemas = db.prepare('SELECT * FROM app_schemas ORDER BY updatedAt DESC');
const insertAppSchema = db.prepare('INSERT INTO app_schemas (id, name, schema, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
const updateAppSchema = db.prepare('UPDATE app_schemas SET name=?, schema=?, updatedAt=? WHERE id=?');
const deleteAppSchema = db.prepare('DELETE FROM app_schemas WHERE id=?');
app.get('/api/app-schemas', (_req, res) => {
  const rows = listAppSchemas.all().map(r => ({ ...r, schema: JSON.parse(r.schema) }));
  res.json({ success: true, message: 'ok', data: rows });
});
app.post('/api/app-schemas', (req, res) => {
  const { name, schema } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  insertAppSchema.run(id, String(name||'Untitled App'), JSON.stringify(schema ?? {}), now, now);
  res.json({ success: true, message: 'created', data: { id, name: String(name||'Untitled App'), schema: schema ?? {}, createdAt: now, updatedAt: now } });
});
app.put('/api/app-schemas/:id', (req, res) => {
  const { name, schema } = req.body || {};
  updateAppSchema.run(String(name||'Untitled App'), JSON.stringify(schema ?? {}), Date.now(), req.params.id);
  res.json({ success: true, message: 'updated' });
});
app.delete('/api/app-schemas/:id', (req, res) => {
  deleteAppSchema.run(req.params.id);
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

