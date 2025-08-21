import sqlite3 from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const __dirnameLocal = path.resolve();
const dataDir = path.join(__dirnameLocal, 'server');
const dbPath = path.join(dataDir, 'data.sqlite');

// Ensure data directory exists
fs.mkdirSync(dataDir, { recursive: true });

const db = sqlite3(dbPath);
db.pragma('journal_mode = WAL');

// Create migrations table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    checksum TEXT NOT NULL
  );
`);

// Migration files
const migrations = [
  {
    version: '001',
    name: 'initial_schema',
    up: `
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
    `,
    down: `
      DROP TABLE IF EXISTS workflows;
      DROP TABLE IF EXISTS media;
      DROP TABLE IF EXISTS steps;
      DROP TABLE IF EXISTS tutorials;
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS user_sessions;
      DROP TABLE IF EXISTS users;
    `
  },
  {
    version: '002',
    name: 'add_workflow_execution_history',
    up: `
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflowId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running',
        startedAt TEXT NOT NULL,
        completedAt TEXT,
        error TEXT,
        result TEXT,
        executionTime INTEGER,
        triggeredBy TEXT,
        FOREIGN KEY (workflowId) REFERENCES workflows(id) ON DELETE CASCADE,
        FOREIGN KEY (triggeredBy) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflowId);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(startedAt);
    `,
    down: `
      DROP TABLE IF EXISTS workflow_executions;
    `
  },
  {
    version: '003',
    name: 'add_tutorial_analytics',
    up: `
      CREATE TABLE IF NOT EXISTS tutorial_views (
        id TEXT PRIMARY KEY,
        tutorialId TEXT NOT NULL,
        userId TEXT,
        ip TEXT,
        userAgent TEXT,
        viewedAt TEXT NOT NULL,
        duration INTEGER,
        completed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (tutorialId) REFERENCES tutorials(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_tutorial_views_tutorial_id ON tutorial_views(tutorialId);
      CREATE INDEX IF NOT EXISTS idx_tutorial_views_viewed_at ON tutorial_views(viewedAt);
      CREATE INDEX IF NOT EXISTS idx_tutorial_views_user_id ON tutorial_views(userId);
    `,
    down: `
      DROP TABLE IF EXISTS tutorial_views;
    `
  },
  {
    version: '004',
    name: 'add_api_keys',
    up: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        keyHash TEXT NOT NULL,
        permissions TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        lastUsed TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(userId);
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(keyHash);
    `,
    down: `
      DROP TABLE IF EXISTS api_keys;
    `
  }
];

// Helper function to calculate checksum
function calculateChecksum(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

// Get applied migrations
function getAppliedMigrations() {
  return db.prepare('SELECT version, name, applied_at, checksum FROM migrations ORDER BY version').all();
}

// Apply migration
function applyMigration(migration) {
  const checksum = calculateChecksum(migration.up);
  
  // Check if migration already applied
  const existing = db.prepare('SELECT version FROM migrations WHERE version = ?').get(migration.version);
  if (existing) {
    console.log(`Migration ${migration.version} (${migration.name}) already applied`);
    return;
  }
  
  // Apply migration
  console.log(`Applying migration ${migration.version} (${migration.name})...`);
  
  const transaction = db.transaction(() => {
    db.exec(migration.up);
    db.prepare('INSERT INTO migrations (version, name, applied_at, checksum) VALUES (?, ?, ?, ?)').run(
      migration.version,
      migration.name,
      new Date().toISOString(),
      checksum
    );
  });
  
  transaction();
  console.log(`✓ Migration ${migration.version} applied successfully`);
}

// Rollback migration
function rollbackMigration(migration) {
  console.log(`Rolling back migration ${migration.version} (${migration.name})...`);
  
  const transaction = db.transaction(() => {
    db.exec(migration.down);
    db.prepare('DELETE FROM migrations WHERE version = ?').run(migration.version);
  });
  
  transaction();
  console.log(`✓ Migration ${migration.version} rolled back successfully`);
}

// Run migrations
function runMigrations() {
  console.log('Running database migrations...');
  
  const applied = getAppliedMigrations();
  const appliedVersions = new Set(applied.map(m => m.version));
  
  // Find pending migrations
  const pending = migrations.filter(m => !appliedVersions.has(m.version));
  
  if (pending.length === 0) {
    console.log('✓ Database is up to date');
    return;
  }
  
  console.log(`Found ${pending.length} pending migration(s):`);
  pending.forEach(m => console.log(`  - ${m.version}: ${m.name}`));
  
  // Apply pending migrations
  pending.forEach(applyMigration);
  
  console.log('✓ All migrations completed successfully');
}

// Rollback last migration
function rollbackLast() {
  const applied = getAppliedMigrations();
  
  if (applied.length === 0) {
    console.log('No migrations to rollback');
    return;
  }
  
  const lastMigration = applied[applied.length - 1];
  const migration = migrations.find(m => m.version === lastMigration.version);
  
  if (!migration) {
    console.log(`Migration ${lastMigration.version} not found in migration files`);
    return;
  }
  
  rollbackMigration(migration);
}

// Show migration status
function showStatus() {
  const applied = getAppliedMigrations();
  const appliedVersions = new Set(applied.map(m => m.version));
  
  console.log('Migration Status:');
  console.log('================');
  
  migrations.forEach(migration => {
    const isApplied = appliedVersions.has(migration.version);
    const status = isApplied ? '✓ Applied' : '⏳ Pending';
    const appliedInfo = isApplied ? 
      applied.find(a => a.version === migration.version) : null;
    
    console.log(`${status} ${migration.version}: ${migration.name}`);
    if (appliedInfo) {
      console.log(`    Applied: ${appliedInfo.applied_at}`);
    }
  });
  
  console.log(`\nTotal: ${migrations.length} migrations, ${applied.length} applied`);
}

// CLI interface
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      runMigrations();
      break;
    case 'down':
      rollbackLast();
      break;
    case 'status':
      showStatus();
      break;
    default:
      console.log('Usage: node migrations.js [up|down|status]');
      console.log('  up     - Apply pending migrations');
      console.log('  down   - Rollback last migration');
      console.log('  status - Show migration status');
  }
}

// Export for use in other modules
export { runMigrations, rollbackLast, showStatus };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}