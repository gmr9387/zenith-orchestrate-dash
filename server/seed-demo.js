#!/usr/bin/env node
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const db = new Database('server/data.sqlite');

function now() { return new Date().toISOString(); }

const email = 'demo@zilliance.com';
const password = 'demo123';
const name = 'Demo User';

const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
let userId = existing?.id;
if (!existing) {
	userId = nanoid();
	const hash = await bcrypt.hash(password, 12);
	db.prepare('INSERT INTO users (id,email,passwordHash,name,role,isActive,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,1,1,1,?,?)')
		.run(userId, email, hash, name, now(), now());
	console.log('Created demo user');
} else {
	console.log('Demo user exists');
}

// Seed a few contacts
const insertContact = db.prepare(`INSERT INTO crm_contacts (id,firstName,lastName,email,phone,company,jobTitle,address,city,state,zipCode,country,tags,notes,source,status,assignedTo,createdBy,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const i of [1,2,3,4,5]) {
	const id = nanoid();
	insertContact.run(id, `Contact${i}`, 'Demo', `contact${i}@example.com`, null, 'Acme', 'Manager', null, null, null, null, null, JSON.stringify(['demo']), null, 'seed', 'active', null, userId, now(), now());
}
console.log('Seeded contacts');

// Seed a project
const insertProject = db.prepare(`INSERT INTO app_projects (id,name,description,template,config,components,styles,scripts,createdBy,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
try {
	const id = nanoid();
	insertProject.run(id, 'Demo Project', 'Seeded demo project', 'blank', '{}', '[]', '{}', '{}', userId, now(), now());
	console.log('Seeded app project');
} catch {
	console.log('Project table or record exists');
}

console.log('Demo seed complete');