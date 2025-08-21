// Simple backend API for tutorials and workflows: Express + SQLite + file storage
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'better-sqlite3';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// pino will be loaded dynamically to avoid test runner resolution issues


// Import video processor, API gateway, CRM system, and App Builder
// Lazy-load video processor to avoid test env ffmpeg resolution issues
let VideoProcessor = null;
import ApiGateway from './api-gateway.js';
import CRMSystem from './crm.js';
import AppBuilder from './app-builder.js';
import { createRateLimiter } from './rate-limit.js';
import WorkflowEngine from './workflow-engine.js';
import VideoQueue from './video-queue.js';
import StorageManager from './storage-manager.js';

// Import advanced features
import VideoAI from './video-ai.js';
import VideoAnalytics from './video-analytics.js';
import WorkflowIntegrations from './workflow-integrations.js';
import WorkflowTemplates from './workflow-templates.js';
import AdvancedCRM from './crm-advanced.js';
import AdvancedAppBuilder from './app-builder-advanced.js';

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const app = express();

// Logger (dynamic to play nice with test runners)
(async () => {
	try {
		const { default: pino } = await import('pino');
		const { default: pinoHttp } = await import('pino-http');
		const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
		app.use(pinoHttp({
			logger,
			customLogLevel: function (req, res, err) {
				if (res.statusCode >= 500 || err) return 'error';
				if (res.statusCode >= 400) return 'warn';
				return 'info';
			},
			genReqId: function (req) {
				return req.headers['x-request-id'] || nanoid(8);
			},
			serializers: {
				req(req) { return { id: req.id, method: req.method, url: req.url }; },
				res(res) { return { statusCode: res.statusCode }; }
			}
		}));
	} catch (e) {
		// Fallback: basic request id header without pino
		app.use((req, res, next) => {
			res.setHeader('X-Request-ID', req.headers['x-request-id'] || nanoid(8));
			next();
		});
	}
})();


// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Disable x-powered-by
app.disable('x-powered-by');

// CORS with strict origin
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = nanoid(8);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Structured request logging
app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const ms = Date.now() - start;
		const log = {
			id: req.id,
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			duration: ms,
			ip: req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown',
			userAgent: req.headers['user-agent']?.substring(0, 100),
			userId: req.user?.id || null,
		};
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(log));
	});
	next();
});

// Global rate limit (fallbacks to memory if no Redis)
app.use(createRateLimiter({ limitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MIN || '600') }));

const __dirnameLocal = path.resolve();
const dataDir = path.join(__dirnameLocal, 'server');
const storageDir = path.join(dataDir, 'storage');
const dbPath = path.join(dataDir, 'data.sqlite');
fs.mkdirSync(storageDir, { recursive: true });

const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

// Database schema with users and audit tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    isActive INTEGER NOT NULL DEFAULT 1,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    lastLogin TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tokenHash TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resourceId TEXT,
    details TEXT,
    ip TEXT,
    userAgent TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
  );
  
  CREATE TABLE IF NOT EXISTS tutorials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT,
    createdBy TEXT NOT NULL,
    isPublic INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    stepCount INTEGER NOT NULL DEFAULT 0,
    deletedAt TEXT,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
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
  
  CREATE INDEX IF NOT EXISTS idx_steps_tutorial_ts ON steps(tutorialId, ts);
  CREATE INDEX IF NOT EXISTS idx_tutorials_created_by ON tutorials(createdBy);
  CREATE INDEX IF NOT EXISTS idx_tutorials_deleted_at ON tutorials(deletedAt);
  
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
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(createdBy);
  CREATE INDEX IF NOT EXISTS idx_workflows_deleted_at ON workflows(deletedAt);
`);

// Initialize API gateway
const apiGateway = new ApiGateway(db, {
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000
});

const crmSystem = new CRMSystem(db, {});
const advancedCRM = new AdvancedCRM(db);

const appBuilder = new AppBuilder(db, {});
const advancedAppBuilder = new AdvancedAppBuilder(db);

const workflowEngine = new WorkflowEngine(db);

// Initialize advanced features
const videoAI = new VideoAI({
  openaiApiKey: process.env.OPENAI_API_KEY
});
const videoAnalytics = new VideoAnalytics(db);
const workflowIntegrations = new WorkflowIntegrations();
const workflowTemplates = new WorkflowTemplates();

const videoQueue = new VideoQueue(db, { concurrency: 2 });

const storageManager = new StorageManager({
  provider: process.env.STORAGE_PROVIDER || 'local',
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  bucket: process.env.STORAGE_BUCKET,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
});

// Enhanced video database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    originalPath TEXT NOT NULL,
    processedPaths TEXT, -- JSON object with quality:path mappings
    thumbnailPaths TEXT, -- JSON array of thumbnail paths
    metadata TEXT, -- JSON object with video metadata
    duration REAL,
    size INTEGER,
    status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
    processingProgress INTEGER DEFAULT 0,
    createdBy TEXT NOT NULL,
    isPublic INTEGER NOT NULL DEFAULT 0,
    views INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_videos_created_by ON videos(createdBy);
  CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
  CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(createdAt);
`);

// Prepared statements for users
const insertUser = db.prepare('INSERT INTO users (id, email, passwordHash, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ? AND isActive = 1');
const getUserById = db.prepare('SELECT * FROM users WHERE id = ? AND isActive = 1');
const updateUserLastLogin = db.prepare('UPDATE users SET lastLogin = ?, updatedAt = ? WHERE id = ?');
const insertSession = db.prepare('INSERT INTO user_sessions (id, userId, tokenHash, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)');
const getSession = db.prepare('SELECT * FROM user_sessions WHERE id = ? AND expiresAt > ?');
const deleteSession = db.prepare('DELETE FROM user_sessions WHERE id = ?');
const insertAuditLog = db.prepare('INSERT INTO audit_logs (id, userId, action, resource, resourceId, details, ip, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

// Prepared statements for tutorials
const insertTutorial = db.prepare('INSERT INTO tutorials (id, title, description, category, tags, createdBy, isPublic, createdAt, updatedAt, stepCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)');
const getTutorial = db.prepare('SELECT * FROM tutorials WHERE id = ? AND deletedAt IS NULL');
const listTutorials = db.prepare('SELECT * FROM tutorials WHERE deletedAt IS NULL ORDER BY updatedAt DESC');
const listTutorialsByUser = db.prepare('SELECT * FROM tutorials WHERE createdBy = ? AND deletedAt IS NULL ORDER BY updatedAt DESC');
const updateTutorialCounts = db.prepare('UPDATE tutorials SET stepCount = ?, updatedAt = ? WHERE id = ?');
const softDeleteTutorial = db.prepare('UPDATE tutorials SET deletedAt = ?, updatedAt = ? WHERE id = ?');
const insertStep = db.prepare('INSERT INTO steps (tutorialId, ts, kind, selector, key, title) VALUES (?, ?, ?, ?, ?, ?)');
const listSteps = db.prepare('SELECT * FROM steps WHERE tutorialId = ? ORDER BY ts ASC');
const upsertMedia = db.prepare('INSERT INTO media (tutorialId, mimeType, path, size, createdAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(tutorialId) DO UPDATE SET mimeType=excluded.mimeType, path=excluded.path, size=excluded.size, createdAt=excluded.createdAt');
const getMedia = db.prepare('SELECT * FROM media WHERE tutorialId = ?');

// Prepared statements for workflows
const insertWorkflow = db.prepare('INSERT INTO workflows (id, name, description, isActive, nodes, lastRun, runCount, successRate, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const listWorkflows = db.prepare('SELECT * FROM workflows WHERE deletedAt IS NULL ORDER BY updatedAt DESC');
const listWorkflowsByUser = db.prepare('SELECT * FROM workflows WHERE createdBy = ? AND deletedAt IS NULL ORDER BY updatedAt DESC');
const getWorkflow = db.prepare('SELECT * FROM workflows WHERE id = ? AND deletedAt IS NULL');
const updateWorkflow = db.prepare('UPDATE workflows SET name = ?, description = ?, isActive = ?, nodes = ?, lastRun = ?, runCount = ?, successRate = ?, updatedAt = ? WHERE id = ?');
const softDeleteWorkflow = db.prepare('UPDATE workflows SET deletedAt = ?, updatedAt = ? WHERE id = ?');

// Video prepared statements
const insertVideo = db.prepare('INSERT INTO videos (id, title, description, originalPath, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
const getVideo = db.prepare('SELECT * FROM videos WHERE id = ? AND deletedAt IS NULL');
const listVideos = db.prepare('SELECT * FROM videos WHERE deletedAt IS NULL ORDER BY createdAt DESC');
const listVideosByUser = db.prepare('SELECT * FROM videos WHERE createdBy = ? AND deletedAt IS NULL ORDER BY createdAt DESC');
const updateVideo = db.prepare('UPDATE videos SET title = ?, description = ?, processedPaths = ?, thumbnailPaths = ?, metadata = ?, duration = ?, size = ?, status = ?, processingProgress = ?, updatedAt = ? WHERE id = ?');
const updateVideoViews = db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?');
const softDeleteVideo = db.prepare('UPDATE videos SET deletedAt = ?, updatedAt = ? WHERE id = ?');
const incrementVideoViews = db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?');

// Schemas
const UserCreateSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(1).max(100)
});

const UserLoginSchema = z.object({
	email: z.string().email(),
	password: z.string()
});

const TutorialCreateSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().optional(),
	category: z.string().optional(),
	tags: z.string().optional(),
	isPublic: z.boolean().optional().default(false)
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ 
			error: { 
				code: 'unauthorized', 
				message: 'Access token required',
				requestId: req.id
			} 
		});
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		const session = getSession.get(decoded.sessionId, new Date().toISOString());
		
		if (!session) {
			return res.status(401).json({ 
				error: { 
					code: 'unauthorized', 
					message: 'Invalid or expired session',
					requestId: req.id
				} 
			});
		}

		const user = getUserById.get(session.userId);
		if (!user) {
			return res.status(401).json({ 
				error: { 
					code: 'unauthorized', 
					message: 'User not found',
					requestId: req.id
				} 
			});
		}

		req.user = user;
		next();
	} catch (err) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Invalid token',
				requestId: req.id
			} 
		});
	}
};

// Role-based access control middleware
const requireRole = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ 
				error: { 
					code: 'unauthorized', 
					message: 'Authentication required',
					requestId: req.id
				} 
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ 
				error: { 
					code: 'forbidden', 
					message: 'Insufficient permissions',
					requestId: req.id
				} 
			});
		}

		next();
	};
};

// Audit logging helper
const logAudit = (userId, action, resource, resourceId, details, req) => {
	try {
		insertAuditLog.run(
			nanoid(),
			userId,
			action,
			resource,
			resourceId,
			details ? JSON.stringify(details) : null,
			req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown',
			req.headers['user-agent']?.substring(0, 100),
			new Date().toISOString()
		);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Failed to log audit event:', e);
	}
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
	const parsed = UserCreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});

	const { email, password, name } = parsed.data;
	
	// Check if user already exists
	const existingUser = getUserByEmail.get(email);
	if (existingUser) {
		return res.status(409).json({ 
			error: { 
				code: 'user_exists', 
				message: 'User with this email already exists',
				requestId: req.id
			} 
		});
	}

	// Hash password
	const passwordHash = await bcrypt.hash(password, 12);
	const userId = nanoid();
	const now = new Date().toISOString();

	insertUser.run(userId, email, passwordHash, name, 'user', now, now);
	
	logAudit(userId, 'user_created', 'users', userId, { email, name }, req);

	res.status(201).json({ 
		message: 'User created successfully',
		user: { id: userId, email, name, role: 'user' }
	});
});

app.post('/api/auth/login', async (req, res) => {
	const parsed = UserLoginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});

	const { email, password } = parsed.data;
	
	const user = getUserByEmail.get(email);
	if (!user) {
		return res.status(401).json({ 
			error: { 
				code: 'invalid_credentials', 
				message: 'Invalid email or password',
				requestId: req.id
			} 
		});
	}

	const isValidPassword = await bcrypt.compare(password, user.passwordHash);
	if (!isValidPassword) {
		return res.status(401).json({ 
			error: { 
				code: 'invalid_credentials', 
				message: 'Invalid email or password',
				requestId: req.id
			} 
		});
	}

	// Create session
	const sessionId = nanoid();
	const tokenHash = await bcrypt.hash(sessionId, 12);
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
	const now = new Date().toISOString();

	insertSession.run(sessionId, user.id, tokenHash, expiresAt, now);
	updateUserLastLogin.run(now, now, user.id);

	// Generate JWT
	const token = jwt.sign({ 
		userId: user.id, 
		sessionId,
		role: user.role 
	}, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

	logAudit(user.id, 'user_login', 'users', user.id, { email }, req);

	res.json({ 
		token,
		user: { 
			id: user.id, 
			email: user.email, 
			name: user.name, 
			role: user.role 
		}
	});
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		deleteSession.run(decoded.sessionId);
		logAudit(req.user.id, 'user_logout', 'users', req.user.id, {}, req);
	} catch (err) {
		// Token might be expired, but we still want to clear any existing session
	}

	res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
	res.json({ 
		user: { 
			id: req.user.id, 
			email: req.user.email, 
			name: req.user.name, 
			role: req.user.role 
		}
	});
});

// Tutorials (now with authentication)
app.post('/api/tutorials', authenticateToken, (req, res) => {
	const parsed = TutorialCreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});
	
	const { title, description, category, tags, isPublic } = parsed.data;
	const id = nanoid();
	const now = Date.now();
	
	insertTutorial.run(id, title, description || '', category || '', tags || '', req.user.id, isPublic ? 1 : 0, now, now);
	
	logAudit(req.user.id, 'tutorial_created', 'tutorials', id, { title, isPublic }, req);
	
	res.json({ id, title, description, category, tags, isPublic, createdAt: now, updatedAt: now, stepCount: 0 });
});

app.get('/api/tutorials', authenticateToken, (req, res) => {
	const rows = req.user.role === 'admin' ? listTutorials.all() : listTutorialsByUser.all(req.user.id);
	res.json(rows);
});

app.get('/api/tutorials/:id', authenticateToken, (req, res) => {
	const t = getTutorial.get(req.params.id);
	if (!t) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Tutorial not found',
			requestId: req.id
		} 
	});
	
	// Check if user can access this tutorial
	if (req.user.role !== 'admin' && t.createdBy !== req.user.id && !t.isPublic) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	const steps = listSteps.all(req.params.id);
	res.json({ ...t, steps });
});

app.post('/api/tutorials/:id/steps', authenticateToken, (req, res) => {
	const t = getTutorial.get(req.params.id);
	if (!t) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Tutorial not found',
			requestId: req.id
		} 
	});
	
	// Check if user can modify this tutorial
	if (req.user.role !== 'admin' && t.createdBy !== req.user.id) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	const stepsBody = Array.isArray(req.body?.steps) ? req.body.steps : [];
	const parsed = z.array(StepSchema).safeParse(stepsBody);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});
	
	const insert = db.transaction((items) => {
		for (const s of items) insertStep.run(req.params.id, s.ts, s.kind, s.selector ?? null, s.key ?? null, s.title ?? null);
		const count = listSteps.all(req.params.id).length;
		updateTutorialCounts.run(count, Date.now(), req.params.id);
		return count;
	});
	
	const count = insert(parsed.data);
	
	logAudit(req.user.id, 'steps_added', 'tutorials', req.params.id, { stepCount: count }, req);
	
	res.json({ ok: true, stepCount: count });
});

const upload = multer({ dest: storageDir, limits: { fileSize: 100 * 1024 * 1024 } });
app.post('/api/tutorials/:id/media', authenticateToken, upload.single('file'), (req, res) => {
	const t = getTutorial.get(req.params.id);
	if (!t) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Tutorial not found',
			requestId: req.id
		} 
	});
	
	// Check if user can modify this tutorial
	if (req.user.role !== 'admin' && t.createdBy !== req.user.id) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	if (!req.file) return res.status(400).json({ 
		error: { 
			code: 'file_required', 
			message: 'No file uploaded',
			requestId: req.id
		} 
	});
	
	const filePath = path.join(storageDir, `${req.params.id}-${Date.now()}`);
	fs.renameSync(req.file.path, filePath);
	upsertMedia.run(req.params.id, req.file.mimetype || 'application/octet-stream', filePath, req.file.size, Date.now());
	
	logAudit(req.user.id, 'media_uploaded', 'tutorials', req.params.id, { fileName: req.file.originalname, size: req.file.size }, req);
	
	res.json({ ok: true });
});

// HEAD for media existence check
app.head('/api/tutorials/:id/media', (req, res) => {
	const m = getMedia.get(req.params.id);
	if (!m) return res.status(404).end();
	res.setHeader('Content-Type', m.mimeType);
	res.setHeader('Content-Length', m.size);
	res.setHeader('ETag', `"${m.tutorialId}-${m.createdAt}"`);
	res.setHeader('Cache-Control', 'public, max-age=3600');
	res.status(200).end();
});

app.get('/api/tutorials/:id/media', (req, res) => {
	const m = getMedia.get(req.params.id);
	if (!m) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Media not found',
			requestId: req.id
		} 
	});
	
	// Basic Range request support
	const range = req.headers.range;
	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : m.size - 1;
		const chunksize = (end - start) + 1;
		
		res.writeHead(206, {
			'Content-Range': `bytes ${start}-${end}/${m.size}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': m.mimeType,
			'ETag': `"${m.tutorialId}-${m.createdAt}"`,
			'Cache-Control': 'public, max-age=3600',
		});
		
		const stream = fs.createReadStream(m.path, { start, end });
		stream.pipe(res);
	} else {
		res.setHeader('Content-Type', m.mimeType);
		res.setHeader('Content-Length', m.size);
		res.setHeader('ETag', `"${m.tutorialId}-${m.createdAt}"`);
		res.setHeader('Cache-Control', 'public, max-age=3600');
		fs.createReadStream(m.path).pipe(res);
	}
});

// Workflows CRUD (now with authentication)
app.post('/api/workflows', authenticateToken, (req, res) => {
	const parsed = WorkflowCreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});
	
	const id = nanoid();
	const nowIso = new Date().toISOString();
	insertWorkflow.run(id, parsed.data.name, parsed.data.description ?? '', 0, JSON.stringify([]), null, 0, 100, req.user.id, nowIso, nowIso);
	
	const row = getWorkflow.get(id);
	
	logAudit(req.user.id, 'workflow_created', 'workflows', id, { name: parsed.data.name }, req);
	
	res.json({ ...row, isActive: Boolean(row.isActive), nodes: [] });
});

app.get('/api/workflows', authenticateToken, (req, res) => {
	const rows = req.user.role === 'admin' ? listWorkflows.all() : listWorkflowsByUser.all(req.user.id);
	const mapped = rows.map(r => ({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') }));
	res.json(mapped);
});

app.get('/api/workflows/:id', authenticateToken, (req, res) => {
	const r = getWorkflow.get(req.params.id);
	if (!r) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Workflow not found',
			requestId: req.id
		} 
	});
	
	// Check if user can access this workflow
	if (req.user.role !== 'admin' && r.createdBy !== req.user.id) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	res.json({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') });
});

app.put('/api/workflows/:id', authenticateToken, (req, res) => {
	const existing = getWorkflow.get(req.params.id);
	if (!existing) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Workflow not found',
			requestId: req.id
		} 
	});
	
	// Check if user can modify this workflow
	if (req.user.role !== 'admin' && existing.createdBy !== req.user.id) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	const parsed = WorkflowUpdateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ 
		error: { 
			code: 'invalid_request', 
			message: parsed.error.message,
			requestId: req.id
		} 
	});
	
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
	
	logAudit(req.user.id, 'workflow_updated', 'workflows', req.params.id, { name, isActive }, req);
	
	res.json({ ...r, isActive: Boolean(r.isActive), nodes: JSON.parse(r.nodes || '[]') });
});

app.delete('/api/workflows/:id', authenticateToken, (req, res) => {
	const r = getWorkflow.get(req.params.id);
	if (!r) return res.status(404).json({ 
		error: { 
			code: 'not_found', 
			message: 'Workflow not found',
			requestId: req.id
		} 
	});
	
	// Check if user can delete this workflow
	if (req.user.role !== 'admin' && r.createdBy !== req.user.id) {
		return res.status(403).json({ 
			error: { 
				code: 'forbidden', 
				message: 'Access denied',
				requestId: req.id
			} 
		});
	}
	
	softDeleteWorkflow.run(new Date().toISOString(), new Date().toISOString(), req.params.id);
	
	logAudit(req.user.id, 'workflow_deleted', 'workflows', req.params.id, { name: r.name }, req);
	
	res.json({ ok: true });
});

// Execute workflow
app.post('/api/workflows/:id/execute', authenticateToken, async (req, res) => {
  const workflow = getWorkflow.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Workflow not found',
        requestId: req.id
      } 
    });
  }

  // Check if user can access this workflow
  if (req.user.role !== 'admin' && workflow.createdBy !== req.user.id) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  try {
    const { input = {} } = req.body;
    const result = await workflowEngine.executeWorkflow(req.params.id, input, req.user.id);
    
    logAudit(req.user.id, 'workflow_executed', 'workflows', req.params.id, { input }, req);

    res.json(result);
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ 
      error: { 
        code: 'execution_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});

// Get workflow execution history
app.get('/api/workflows/:id/executions', authenticateToken, (req, res) => {
  const workflow = getWorkflow.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Workflow not found',
        requestId: req.id
      } 
    });
  }

  // Check if user can access this workflow
  if (req.user.role !== 'admin' && workflow.createdBy !== req.user.id) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  const limit = parseInt(req.query.limit) || 10;
  const executions = workflowEngine.getExecutionHistory(req.params.id, limit);
  
  const processed = executions.map(execution => ({
    ...execution,
    result: execution.result ? JSON.parse(execution.result) : null,
    logs: execution.logs ? JSON.parse(execution.logs) : []
  }));

  res.json(processed);
});

// Get execution details
app.get('/api/executions/:id', authenticateToken, (req, res) => {
  const execution = workflowEngine.getExecutionDetails(req.params.id);
  if (!execution) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Execution not found',
        requestId: req.id
      } 
    });
  }

  // Check if user can access this execution
  const workflow = getWorkflow.get(execution.workflowId);
  if (!workflow || (req.user.role !== 'admin' && workflow.createdBy !== req.user.id)) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  res.json(execution);
});

// Enhanced video upload with processing
app.post('/api/videos/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: { 
          code: 'video_required', 
          message: 'No video file uploaded',
          requestId: req.id
        } 
      });
    }

    const { title, description, isPublic = false } = req.body;
    const videoId = nanoid();
    const now = new Date().toISOString();

    // Save original file
    const originalPath = path.join(storageDir, `${videoId}-original${path.extname(req.file.originalname)}`);
    fs.renameSync(req.file.path, originalPath);

    // Insert video record
    insertVideo.run(videoId, title || 'Untitled Video', description || '', originalPath, req.user.id, now, now);

    // Start processing in background
    videoQueue.addVideoJob(videoId, originalPath, {
      generateThumbnails: true,
      qualities: ['720p', '480p'],
      hls: true
    });

    logAudit(req.user.id, 'video_uploaded', 'videos', videoId, { title, originalName: req.file.originalname }, req);

    res.status(201).json({ 
      id: videoId, 
      message: 'Video uploaded and processing started',
      requestId: req.id
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      error: { 
        code: 'upload_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});



// Get video processing status
app.get('/api/videos/:id/status', authenticateToken, async (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video not found',
        requestId: req.id
      } 
    });
  }

  if (req.user.role !== 'admin' && video.createdBy !== req.user.id) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  try {
    const queueStatus = await videoQueue.getJobStatus(req.params.id);
    const dbStatus = {
      status: video.status,
      processingProgress: video.processingProgress,
      processedPaths: video.processedPaths ? JSON.parse(video.processedPaths) : null,
      thumbnailPaths: video.thumbnailPaths ? JSON.parse(video.thumbnailPaths) : null,
      metadata: video.metadata ? JSON.parse(video.metadata) : null
    };

    res.json({
      ...dbStatus,
      queue: queueStatus
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: { 
        code: 'status_check_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});

// Get queue statistics
app.get('/api/videos/queue/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Admin access required',
        requestId: req.id
      } 
    });
  }

  try {
    const stats = await videoQueue.getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ 
      error: { 
        code: 'stats_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});

// Enhanced video listing
app.get('/api/videos', authenticateToken, (req, res) => {
  const videos = req.user.role === 'admin' ? listVideos.all() : listVideosByUser.all(req.user.id);
  
  const processedVideos = videos.map(video => ({
    ...video,
    processedPaths: video.processedPaths ? JSON.parse(video.processedPaths) : {},
    thumbnailPaths: video.thumbnailPaths ? JSON.parse(video.thumbnailPaths) : [],
    metadata: video.metadata ? JSON.parse(video.metadata) : null
  }));

  res.json(processedVideos);
});

// Get video with signed URLs
app.get('/api/videos/:id', authenticateToken, async (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video not found',
        requestId: req.id
      } 
    });
  }

  if (req.user.role !== 'admin' && video.createdBy !== req.user.id && !video.isPublic) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  // Increment view count
  incrementVideoViews.run(video.id);

  // Generate signed URLs if using S3 storage
  let signedUrls = null;
  if (storageManager.config.provider !== 'local' && video.processedPaths) {
    try {
      const processedPaths = JSON.parse(video.processedPaths);
      signedUrls = {};
      
      for (const [quality, path] of Object.entries(processedPaths)) {
        if (quality !== 'hls' && path) {
          signedUrls[quality] = await storageManager.getSignedUrl(path, 'getObject', 3600);
        }
      }
    } catch (error) {
      console.error('Failed to generate signed URLs:', error);
    }
  }

  const result = {
    ...video,
    processedPaths: video.processedPaths ? JSON.parse(video.processedPaths) : null,
    thumbnailPaths: video.thumbnailPaths ? JSON.parse(video.thumbnailPaths) : null,
    metadata: video.metadata ? JSON.parse(video.metadata) : null,
    signedUrls
  };

  res.json(result);
});

// Stream video (with quality selection)
app.get('/api/videos/:id/stream', (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video not found',
        requestId: req.id
      } 
    });
  }

  const quality = req.query.quality || '720p';
  const processedPaths = video.processedPaths ? JSON.parse(video.processedPaths) : {};
  
  let videoPath = video.originalPath;
  if (processedPaths[quality]) {
    videoPath = processedPaths[quality].path || processedPaths[quality];
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video file not found',
        requestId: req.id
      } 
    });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Get video thumbnail
app.get('/api/videos/:id/thumbnail', (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video not found',
        requestId: req.id
      } 
    });
  }

  const thumbnailPaths = video.thumbnailPaths ? JSON.parse(video.thumbnailPaths) : [];
  const thumbnailIndex = parseInt(req.query.index) || 0;
  
  if (thumbnailPaths.length === 0 || !thumbnailPaths[thumbnailIndex]) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Thumbnail not found',
        requestId: req.id
      } 
    });
  }

  const thumbnailPath = thumbnailPaths[thumbnailIndex];
  if (!fs.existsSync(thumbnailPath)) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Thumbnail file not found',
        requestId: req.id
      } 
    });
  }

  res.setHeader('Content-Type', 'image/jpeg');
  fs.createReadStream(thumbnailPath).pipe(res);
});

// Get HLS manifest URL
app.get('/api/videos/:id/hls', authenticateToken, (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Video not found', requestId: req.id } });
  }
  if (req.user.role !== 'admin' && video.createdBy !== req.user.id && !video.isPublic) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Access denied', requestId: req.id } });
  }
  const processed = video.processedPaths ? JSON.parse(video.processedPaths) : {};
  const hlsInfo = processed.hls;
  if (!hlsInfo || !hlsInfo.manifestPath) {
    return res.status(404).json({ error: { code: 'not_found', message: 'HLS manifest not available', requestId: req.id } });
  }
  const hlsDir = path.join(dataDir, 'hls');
  const rel = hlsInfo.manifestPath.startsWith(hlsDir) ? hlsInfo.manifestPath.substring(hlsDir.length) : path.basename(hlsInfo.manifestPath);
  const url = `/hls${rel.startsWith('/') ? rel : '/' + rel}`;
  res.json({ manifestUrl: url });
});

// Storage management endpoints
app.get('/api/storage/health', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const health = {
      provider: storageManager.config.provider,
      available: storageManager.client !== null,
      bucket: storageManager.config.bucket
    };
    
    if (storageManager.config.provider !== 'local') {
      // Test connection
      const testKey = `health-check-${Date.now()}`;
      const testData = 'health-check';
      const fs = await import('fs');
      const tempPath = `/tmp/${testKey}`;
      fs.writeFileSync(tempPath, testData);
      
      try {
        await storageManager.uploadFile(tempPath, testKey);
        await storageManager.deleteFile(testKey);
        fs.unlinkSync(tempPath);
        health.connection = 'ok';
      } catch (error) {
        health.connection = 'failed';
        health.error = error.message;
      }
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'health_check_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});

// Get signed URL for video asset
app.post('/api/videos/:id/signed-url', authenticateToken, async (req, res) => {
  const video = getVideo.get(req.params.id);
  if (!video) {
    return res.status(404).json({ 
      error: { 
        code: 'not_found', 
        message: 'Video not found',
        requestId: req.id
      } 
    });
  }

  if (req.user.role !== 'admin' && video.createdBy !== req.user.id) {
    return res.status(403).json({ 
      error: { 
        code: 'forbidden', 
        message: 'Access denied',
        requestId: req.id
      } 
    });
  }

  const { key, operation = 'getObject', expiresIn = 3600 } = req.body;
  
  if (!key) {
    return res.status(400).json({ 
      error: { 
        code: 'invalid_request', 
        message: 'Key is required',
        requestId: req.id
      } 
    });
  }

  try {
    const signedUrl = await storageManager.getSignedUrl(key, operation, expiresIn);
    res.json({ signedUrl, expiresIn });
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'signed_url_failed', 
        message: error.message,
        requestId: req.id
      } 
    });
  }
});

// API Gateway routes
app.use('/api/gateway', apiGateway.getRouter());

// CRM routes
app.use('/api/crm', crmSystem.getRouter());

// App Builder routes
app.use('/api/app-builder', appBuilder.getRouter());

// Advanced Video Platform routes
app.post('/api/videos/:id/ai/captions', authenticateToken, async (req, res) => {
  try {
    const video = getVideo.get(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const captions = await videoAI.generateCaptions(video.originalPath, req.body.language || 'en');
    res.json(captions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos/:id/ai/scenes', authenticateToken, async (req, res) => {
  try {
    const video = getVideo.get(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = await videoAI.detectScenes(video.originalPath);
    res.json(scenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos/:id/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const video = getVideo.get(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const analysis = await videoAI.analyzeContent(video.originalPath);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Analytics routes
app.post('/api/videos/:id/analytics/track', (req, res) => {
  try {
    const { sessionId, eventType, eventData, timestamp } = req.body;
    videoAnalytics.trackEngagement(req.params.id, sessionId, eventType, eventData, timestamp);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/videos/:id/analytics', authenticateToken, (req, res) => {
  try {
    const analytics = videoAnalytics.getVideoAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/videos/analytics/trending', (req, res) => {
  try {
    const trending = videoAnalytics.getTrendingVideos(10, req.query.period || '7d');
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced Workflow routes
app.get('/api/workflows/integrations', authenticateToken, (req, res) => {
  try {
    const categories = workflowIntegrations.getIntegrationsByCategory();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workflows/integrations/search', authenticateToken, (req, res) => {
  try {
    const results = workflowIntegrations.searchIntegrations(req.query.q || '');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workflows/templates', authenticateToken, (req, res) => {
  try {
    const templates = workflowTemplates.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workflows/templates/:id', authenticateToken, (req, res) => {
  try {
    const template = workflowTemplates.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflows/templates/:id/create', authenticateToken, (req, res) => {
  try {
    const workflow = workflowTemplates.createWorkflowFromTemplate(
      req.params.id, 
      req.user.id, 
      req.body.customizations || {}
    );
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced CRM routes
app.get('/api/crm/advanced/dashboard', authenticateToken, (req, res) => {
  try {
    const stats = advancedCRM.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/crm/advanced/pipeline', authenticateToken, (req, res) => {
  try {
    const pipeline = advancedCRM.getPipelineStats();
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crm/advanced/contacts', authenticateToken, (req, res) => {
  try {
    const contact = advancedCRM.createContact(req.body);
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/crm/advanced/contacts', authenticateToken, (req, res) => {
  try {
    const contacts = advancedCRM.searchContacts(req.query.q, req.query.filters);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crm/advanced/deals', authenticateToken, (req, res) => {
  try {
    const deal = advancedCRM.createDeal(req.body);
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crm/advanced/campaigns', authenticateToken, (req, res) => {
  try {
    const campaign = advancedCRM.createCampaign(req.body);
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crm/advanced/campaigns/:id/send', authenticateToken, (req, res) => {
  try {
    const campaign = advancedCRM.sendCampaign(req.params.id);
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced App Builder routes
app.get('/api/app-builder/advanced/templates', authenticateToken, (req, res) => {
  try {
    const templates = advancedAppBuilder.getTemplates(req.query.category);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-builder/advanced/templates/:id/create', authenticateToken, (req, res) => {
  try {
    const project = advancedAppBuilder.createProjectFromTemplate(
      req.params.id,
      { ...req.body, createdBy: req.user.id }
    );
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-builder/advanced/projects', authenticateToken, (req, res) => {
  try {
    const project = advancedAppBuilder.createProject({
      ...req.body,
      createdBy: req.user.id
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/app-builder/advanced/projects', authenticateToken, (req, res) => {
  try {
    const projects = advancedAppBuilder.getUserProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-builder/advanced/projects/:id/build', authenticateToken, (req, res) => {
  try {
    const build = advancedAppBuilder.buildProject(req.params.id);
    res.json(build);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-builder/advanced/projects/:id/deploy', authenticateToken, (req, res) => {
  try {
    const deployment = advancedAppBuilder.deployProject(req.params.id, req.body.platform);
    res.json(deployment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/app-builder/advanced/projects/:id/code', authenticateToken, (req, res) => {
  try {
    const code = advancedAppBuilder.generateCode(req.params.id);
    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static(storageDir));
app.use('/thumbnails', express.static(path.join(dataDir, 'thumbnails')));
app.use('/processed-videos', express.static(path.join(dataDir, 'processed-videos')));
app.use('/hls', express.static(path.join(dataDir, 'hls')));
app.use('/apps', express.static(path.join(dataDir, 'generated-apps')));
app.use('/storage', express.static(path.join(dataDir, 'storage')));

// Admin routes
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
	const users = db.prepare('SELECT id, email, name, role, isActive, emailVerified, lastLogin, createdAt FROM users ORDER BY createdAt DESC').all();
	res.json(users);
});

app.get('/api/admin/audit-logs', authenticateToken, requireRole(['admin']), (req, res) => {
	const logs = db.prepare('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 100').all();
	res.json(logs);
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
	// eslint-disable-next-line no-console
	console.error('Unhandled error', err);
	res.status(500).json({ 
		error: { 
			code: 'internal_error', 
			message: 'Something went wrong',
			requestId: _req.id
		} 
	});
});

if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`API listening on http://localhost:${PORT}`);
	});
}

export default app;

