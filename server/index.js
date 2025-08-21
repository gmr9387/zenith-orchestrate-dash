// Simple backend API for tutorials and workflows: Express + SQLite + file storage
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'better-sqlite3';
import { z } from 'zod';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Simple request logging
app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const ms = Date.now() - start;
		// eslint-disable-next-line no-console
		console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
	});
	next();
});

// Very basic in-memory rate limiting per-IP per minute
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const ipCounters = new Map();
app.use((req, res, next) => {
	try {
		const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
		const now = Date.now();
		const entry = ipCounters.get(ip) || { count: 0, windowStart: now };
		if (now - entry.windowStart > WINDOW_MS) {
			entry.count = 0;
			entry.windowStart = now;
		}
		entry.count++;
		ipCounters.set(ip, entry);
		if (entry.count > MAX_REQUESTS) {
			return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests. Please try again later.' } });
		}
		next();
	} catch (e) {
		next(e);
	}
});

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
    description TEXT,
    isActive INTEGER NOT NULL DEFAULT 0,
    nodes TEXT NOT NULL,
    lastRun TEXT,
    runCount INTEGER NOT NULL DEFAULT 0,
    successRate INTEGER NOT NULL DEFAULT 100,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Prepared statements for tutorials
const insertTutorial = db.prepare('INSERT INTO tutorials (id, title, createdAt, updatedAt, stepCount) VALUES (?, ?, ?, ?, 0)');
const getTutorial = db.prepare('SELECT * FROM tutorials WHERE id = ?');
const listTutorials = db.prepare('SELECT * FROM tutorials ORDER BY updatedAt DESC');
const updateTutorialCounts = db.prepare('UPDATE tutorials SET stepCount = ?, updatedAt = ? WHERE id = ?');
const insertStep = db.prepare('INSERT INTO steps (tutorialId, ts, kind, selector, key, title) VALUES (?, ?, ?, ?, ?, ?)');
const listSteps = db.prepare('SELECT * FROM steps WHERE tutorialId = ? ORDER BY ts ASC');
const upsertMedia = db.prepare('INSERT INTO media (tutorialId, mimeType, path, size, createdAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(tutorialId) DO UPDATE SET mimeType=excluded.mimeType, path=excluded.path, size=excluded.size, createdAt=excluded.createdAt');
const getMedia = db.prepare('SELECT * FROM media WHERE tutorialId = ?');

// Prepared statements for workflows
const insertWorkflow = db.prepare('INSERT INTO workflows (id, name, description, isActive, nodes, lastRun, runCount, successRate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const listWorkflows = db.prepare('SELECT * FROM workflows ORDER BY updatedAt DESC');
const getWorkflow = db.prepare('SELECT * FROM workflows WHERE id = ?');
const updateWorkflow = db.prepare('UPDATE workflows SET name = ?, description = ?, isActive = ?, nodes = ?, lastRun = ?, runCount = ?, successRate = ?, updatedAt = ? WHERE id = ?');
const deleteWorkflow = db.prepare('DELETE FROM workflows WHERE id = ?');

// Schemas
const TutorialCreateSchema = z.object({
	title: z.string().trim().min(1).max(200)
});

const StepSchema = z.object({
	ts: z.number().int().nonnegative(),
	kind: z.enum(['click', 'keydown', 'mutation', 'note']),
	selector: z.string().optional(),
	key: z.string().optional(),
	title: z.string().optional()
});

const WorkflowNodeSchema = z.object({
	id: z.string(),
	type: z.enum(['trigger', 'action', 'condition', 'delay', 'webhook']),
	name: z.string(),
	description: z.string().optional().default(''),
	position: z.object({ x: z.number(), y: z.number() }),
	config: z.any(),
	connections: z.array(z.string()),
	status: z.enum(['idle', 'running', 'success', 'error', 'disabled'])
});

const WorkflowCreateSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional().default('')
});

const WorkflowUpdateSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	isActive: z.boolean().optional(),
	nodes: z.array(WorkflowNodeSchema).optional(),
	lastRun: z.string().nullable().optional(),
	runCount: z.number().int().nonnegative().optional(),
	successRate: z.number().int().min(0).max(100).optional(),
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Tutorials
app.post('/api/tutorials', (req, res) => {
	const parsed = TutorialCreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: { code: 'invalid_request', message: parsed.error.message } });
	const { title } = parsed.data;
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
	const stepsBody = Array.isArray(req.body?.steps) ? req.body.steps : [];
	const parsed = z.array(StepSchema).safeParse(stepsBody);
	if (!parsed.success) return res.status(400).json({ error: { code: 'invalid_request', message: parsed.error.message } });
	const insert = db.transaction((items) => {
		for (const s of items) insertStep.run(req.params.id, s.ts, s.kind, s.selector ?? null, s.key ?? null, s.title ?? null);
		const count = listSteps.all(req.params.id).length;
		updateTutorialCounts.run(count, Date.now(), req.params.id);
		return count;
	});
	const count = insert(parsed.data);
	res.json({ ok: true, stepCount: count });
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

// HEAD for media existence check
app.head('/api/tutorials/:id/media', (req, res) => {
	const m = getMedia.get(req.params.id);
	if (!m) return res.status(404).end();
	res.setHeader('Content-Type', m.mimeType);
	res.status(200).end();
});

app.get('/api/tutorials/:id/media', (req, res) => {
	const m = getMedia.get(req.params.id);
	if (!m) return res.status(404).json({ error: 'not_found' });
	res.setHeader('Content-Type', m.mimeType);
	fs.createReadStream(m.path).pipe(res);
});

// Workflows CRUD
app.post('/api/workflows', (req, res) => {
	const parsed = WorkflowCreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: { code: 'invalid_request', message: parsed.error.message } });
	const id = nanoid();
	const nowIso = new Date().toISOString();
	insertWorkflow.run(id, parsed.data.name, parsed.data.description ?? '', 0, JSON.stringify([]), null, 0, 100, nowIso, nowIso);
	const row = getWorkflow.get(id);
	res.json({ ...row, isActive: Boolean(row.isActive), nodes: [] });
});

app.get('/api/workflows', (_req, res) => {
	const rows = listWorkflows.all();
	const mapped = rows.map(r => ({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') }));
	res.json(mapped);
});

app.get('/api/workflows/:id', (req, res) => {
	const r = getWorkflow.get(req.params.id);
	if (!r) return res.status(404).json({ error: 'not_found' });
	res.json({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') });
});

app.put('/api/workflows/:id', (req, res) => {
	const existing = getWorkflow.get(req.params.id);
	if (!existing) return res.status(404).json({ error: 'not_found' });
	const parsed = WorkflowUpdateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: { code: 'invalid_request', message: parsed.error.message } });
	const updates = parsed.data;
	const name = updates.name ?? existing.name;
	const description = updates.description ?? existing.description ?? '';
	const isActive = typeof updates.isActive === 'boolean' ? (updates.isActive ? 1 : 0) : existing.isActive;
	const nodesJson = JSON.stringify(updates.nodes ?? JSON.parse(existing.nodes || '[]'));
	const lastRun = updates.lastRun ?? existing.lastRun ?? null;
	const runCount = updates.runCount ?? existing.runCount ?? 0;
	const successRate = updates.successRate ?? existing.successRate ?? 100;
	const updatedAt = new Date().toISOString();
	updateWorkflow.run(name, description, isActive, nodesJson, lastRun, runCount, successRate, updatedAt, req.params.id);
	const r = getWorkflow.get(req.params.id);
	res.json({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') });
});

app.delete('/api/workflows/:id', (req, res) => {
	const r = getWorkflow.get(req.params.id);
	if (!r) return res.status(404).json({ error: 'not_found' });
	deleteWorkflow.run(req.params.id);
	res.json({ ok: true });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
	// eslint-disable-next-line no-console
	console.error('Unhandled error', err);
	res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
});

if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`API listening on http://localhost:${PORT}`);
	});
}

export default app;

