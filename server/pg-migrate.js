#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const client = new Client({ connectionString: url });

const upSQL = `
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	passwordHash TEXT NOT NULL,
	name TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'user',
	isActive BOOLEAN NOT NULL DEFAULT true,
	emailVerified BOOLEAN NOT NULL DEFAULT false,
	lastLogin TIMESTAMPTZ,
	createdAt TIMESTAMPTZ NOT NULL,
	updatedAt TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
	id TEXT PRIMARY KEY,
	userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	tokenHash TEXT NOT NULL,
	expiresAt TIMESTAMPTZ NOT NULL,
	createdAt TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
	id TEXT PRIMARY KEY,
	userId TEXT,
	action TEXT NOT NULL,
	resource TEXT,
	resourceId TEXT,
	details JSONB,
	ipAddress TEXT,
	userAgent TEXT,
	createdAt TIMESTAMPTZ NOT NULL
);
`;

const downSQL = `
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
`;

const cmd = process.argv[2] || 'up';

(async () => {
	await client.connect();
	try {
		if (cmd === 'up') {
			await client.query('BEGIN');
			await client.query(upSQL);
			await client.query('COMMIT');
			console.log('Postgres migrations applied');
		} else if (cmd === 'down') {
			await client.query('BEGIN');
			await client.query(downSQL);
			await client.query('COMMIT');
			console.log('Postgres migrations rolled back');
		} else {
			console.log('Unknown command');
		}
	} catch (e) {
		await client.query('ROLLBACK');
		console.error('Migration failed', e);
		process.exit(1);
	} finally {
		await client.end();
	}
})();