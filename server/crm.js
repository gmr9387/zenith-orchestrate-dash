import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';

class CRMSystem {
  constructor(db, config = {}) {
    this.db = db;
    this.config = {
      ...config
    };

    this.router = express.Router();
    this.setupDatabase();
    this.setupRoutes();
  }

  setupDatabase() {
    // CRM database schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        jobTitle TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        country TEXT,
        tags TEXT, -- JSON array
        notes TEXT,
        source TEXT, -- how they were acquired
        status TEXT DEFAULT 'active', -- active, inactive, archived
        assignedTo TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS crm_leads (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        jobTitle TEXT,
        source TEXT, -- website, referral, cold call, etc.
        status TEXT DEFAULT 'new', -- new, contacted, qualified, unqualified, converted
        priority TEXT DEFAULT 'medium', -- low, medium, high
        notes TEXT,
        assignedTo TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS crm_deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        stage TEXT DEFAULT 'prospecting', -- prospecting, qualification, proposal, negotiation, closed-won, closed-lost
        probability INTEGER DEFAULT 0, -- 0-100
        expectedCloseDate TEXT,
        contactId TEXT,
        leadId TEXT,
        assignedTo TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        FOREIGN KEY (contactId) REFERENCES crm_contacts(id) ON DELETE SET NULL,
        FOREIGN KEY (leadId) REFERENCES crm_leads(id) ON DELETE SET NULL,
        FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS crm_activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- call, meeting, email, note, task
        subject TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending', -- pending, completed, cancelled
        dueDate TEXT,
        dealId TEXT,
        contactId TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        FOREIGN KEY (dealId) REFERENCES crm_deals(id) ON DELETE SET NULL,
        FOREIGN KEY (contactId) REFERENCES crm_contacts(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON crm_contacts(createdBy);
      CREATE INDEX IF NOT EXISTS idx_deals_stage ON crm_deals(stage);
      CREATE INDEX IF NOT EXISTS idx_activities_status ON crm_activities(status);
    `);

    // Prepared statements
    this.insertContact = this.db.prepare(`
      INSERT INTO crm_contacts (id, firstName, lastName, email, phone, company, jobTitle, address, city, state, zipCode, country, tags, notes, source, assignedTo, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getContact = this.db.prepare('SELECT * FROM crm_contacts WHERE id = ? AND deletedAt IS NULL');
    this.listContacts = this.db.prepare('SELECT * FROM crm_contacts WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    this.updateContact = this.db.prepare(`
      UPDATE crm_contacts SET firstName = ?, lastName = ?, email = ?, phone = ?, company = ?, jobTitle = ?, address = ?, city = ?, state = ?, zipCode = ?, country = ?, tags = ?, notes = ?, source = ?, status = ?, assignedTo = ?, updatedAt = ?
      WHERE id = ?
    `);

    this.insertLead = this.db.prepare(`
      INSERT INTO crm_leads (id, firstName, lastName, email, phone, company, jobTitle, source, status, priority, notes, assignedTo, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getLead = this.db.prepare('SELECT * FROM crm_leads WHERE id = ? AND deletedAt IS NULL');
    this.listLeads = this.db.prepare('SELECT * FROM crm_leads WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    this.updateLead = this.db.prepare(`
      UPDATE crm_leads SET firstName = ?, lastName = ?, email = ?, phone = ?, company = ?, jobTitle = ?, source = ?, status = ?, priority = ?, notes = ?, assignedTo = ?, updatedAt = ?
      WHERE id = ?
    `);

    this.insertDeal = this.db.prepare(`
      INSERT INTO crm_deals (id, title, description, amount, currency, stage, probability, expectedCloseDate, contactId, leadId, assignedTo, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getDeal = this.db.prepare('SELECT * FROM crm_deals WHERE id = ? AND deletedAt IS NULL');
    this.listDeals = this.db.prepare('SELECT * FROM crm_deals WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    this.updateDeal = this.db.prepare(`
      UPDATE crm_deals SET title = ?, description = ?, amount = ?, currency = ?, stage = ?, probability = ?, expectedCloseDate = ?, contactId = ?, leadId = ?, assignedTo = ?, updatedAt = ?
      WHERE id = ?
    `);

    this.insertActivity = this.db.prepare(`
      INSERT INTO crm_activities (id, type, subject, description, contactId, leadId, dealId, assignedTo, dueDate, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getActivity = this.db.prepare('SELECT * FROM crm_activities WHERE id = ?');
    this.listActivities = this.db.prepare('SELECT * FROM crm_activities ORDER BY createdAt DESC');
    this.updateActivity = this.db.prepare(`
      UPDATE crm_activities SET type = ?, subject = ?, description = ?, contactId = ?, leadId = ?, dealId = ?, assignedTo = ?, dueDate = ?, completedAt = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `);
  }

  sanitizeContact(contact, user) {
    if (!user || (user.role !== 'admin' && user.role !== 'enterprise')) {
      const maskedEmail = contact.email ? contact.email.replace(/(^.).*(@.*$)/, '$1***$2') : null;
      const maskedPhone = contact.phone ? contact.phone.replace(/.(?=.{2})/g, '*') : null;
      return { ...contact, email: maskedEmail, phone: maskedPhone };
    }
    return contact;
  }

  setupRoutes() {
    // Contact routes
    this.router.post('/contacts', this.authenticateUser, (req, res) => {
      const schema = z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
        assignedTo: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const contactData = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertContact.run(
          id,
          contactData.firstName,
          contactData.lastName,
          contactData.email || null,
          contactData.phone || null,
          contactData.company || null,
          contactData.jobTitle || null,
          contactData.address || null,
          contactData.city || null,
          contactData.state || null,
          contactData.zipCode || null,
          contactData.country || null,
          contactData.tags ? JSON.stringify(contactData.tags) : null,
          contactData.notes || null,
          contactData.source || null,
          contactData.assignedTo || null,
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          ...contactData,
          status: 'active',
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create contact'
          }
        });
      }
    });

    this.router.get('/contacts', this.authenticateUser, (req, res) => {
      const list = this.db.prepare('SELECT * FROM crm_contacts WHERE deletedAt IS NULL AND (createdBy = ? OR ? = 1) ORDER BY createdAt DESC');
      const isAdmin = req.user.role === 'admin' || req.user.role === 'enterprise' ? 1 : 0;
      const contacts = list.all(req.user.id, isAdmin).map(c => this.sanitizeContact(c, req.user));
      res.json(contacts);
    });

    this.router.get('/contacts/:id', this.authenticateUser, (req, res) => {
      const get = this.db.prepare('SELECT * FROM crm_contacts WHERE id = ?');
      const contact = get.get(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: { code: 'not_found', message: 'Contact not found' } });
      }
      if (req.user.role !== 'admin' && contact.createdBy !== req.user.id) {
        return res.status(403).json({ error: { code: 'forbidden', message: 'Access denied' } });
      }
      res.json(this.sanitizeContact(contact, req.user));
    });

    this.router.put('/contacts/:id', this.authenticateUser, (req, res) => {
      const schema = z.object({
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional(),
        assignedTo: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      // Load existing contact and merge
      const existing = this.getContact.get(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: { code: 'not_found', message: 'Contact not found' } });
      }

      const contactData = { ...existing, ...parsed.data };
      const now = new Date().toISOString();

      try {
        this.updateContact.run(
          contactData.firstName,
          contactData.lastName,
          contactData.email || null,
          contactData.phone || null,
          contactData.company || null,
          contactData.jobTitle || null,
          contactData.address || null,
          contactData.city || null,
          contactData.state || null,
          contactData.zipCode || null,
          contactData.country || null,
          contactData.tags ? JSON.stringify(contactData.tags) : existing.tags,
          contactData.notes || null,
          contactData.source || null,
          contactData.status || existing.status || 'active',
          contactData.assignedTo || null,
          now,
          req.params.id
        );

        res.json({ status: 'updated' });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'update_failed',
            message: 'Failed to update contact'
          }
        });
      }
    });

    // Lead routes
    this.router.post('/leads', this.authenticateUser, (req, res) => {
      const schema = z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        notes: z.string().optional(),
        assignedTo: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const leadData = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertLead.run(
          id,
          leadData.firstName,
          leadData.lastName,
          leadData.email || null,
          leadData.phone || null,
          leadData.company || null,
          leadData.jobTitle || null,
          leadData.source || null,
          leadData.status || 'new',
          leadData.priority || 'medium',
          leadData.notes || null,
          leadData.assignedTo || null,
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          ...leadData,
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create lead'
          }
        });
      }
    });

    this.router.get('/leads', this.authenticateUser, (req, res) => {
      const leads = this.listLeads.all();
      res.json(leads);
    });

    this.router.get('/leads/:id', this.authenticateUser, (req, res) => {
      const lead = this.getLead.get(req.params.id);
      if (!lead) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Lead not found'
          }
        });
      }

      res.json(lead);
    });

    // Deal routes
    this.router.post('/deals', this.authenticateUser, (req, res) => {
      const schema = z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        amount: z.number().positive().optional(),
        currency: z.string().optional(),
        stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
        probability: z.number().int().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        contactId: z.string().optional(),
        leadId: z.string().optional(),
        assignedTo: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const dealData = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertDeal.run(
          id,
          dealData.title,
          dealData.description || null,
          dealData.amount || null,
          dealData.currency || 'USD',
          dealData.stage || 'prospecting',
          dealData.probability || 0,
          dealData.expectedCloseDate || null,
          dealData.contactId || null,
          dealData.leadId || null,
          dealData.assignedTo || null,
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          ...dealData,
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create deal'
          }
        });
      }
    });

    this.router.get('/deals', this.authenticateUser, (req, res) => {
      const deals = this.listDeals.all();
      res.json(deals);
    });

    this.router.get('/deals/:id', this.authenticateUser, (req, res) => {
      const deal = this.getDeal.get(req.params.id);
      if (!deal) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Deal not found'
          }
        });
      }

      res.json(deal);
    });

    // Activity routes
    this.router.post('/activities', this.authenticateUser, (req, res) => {
      const schema = z.object({
        type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
        subject: z.string().min(1).max(200),
        description: z.string().optional(),
        contactId: z.string().optional(),
        leadId: z.string().optional(),
        dealId: z.string().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const activityData = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertActivity.run(
          id,
          activityData.type,
          activityData.subject,
          activityData.description || null,
          activityData.contactId || null,
          activityData.leadId || null,
          activityData.dealId || null,
          activityData.assignedTo || null,
          activityData.dueDate || null,
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          ...activityData,
          status: 'pending',
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create activity'
          }
        });
      }
    });

    this.router.get('/activities', this.authenticateUser, (req, res) => {
      const activities = this.listActivities.all();
      res.json(activities);
    });

    // CRM Dashboard analytics
    this.router.get('/dashboard', this.authenticateUser, (req, res) => {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = {
        contacts: {
          total: this.db.prepare('SELECT COUNT(*) as count FROM crm_contacts WHERE deletedAt IS NULL').get().count,
          new: this.db.prepare('SELECT COUNT(*) as count FROM crm_contacts WHERE createdAt >= ? AND deletedAt IS NULL').get(startDate.toISOString()).count,
          byStatus: this.db.prepare('SELECT status, COUNT(*) as count FROM crm_contacts WHERE deletedAt IS NULL GROUP BY status').all()
        },
        leads: {
          total: this.db.prepare('SELECT COUNT(*) as count FROM crm_leads WHERE deletedAt IS NULL').get().count,
          new: this.db.prepare('SELECT COUNT(*) as count FROM crm_leads WHERE createdAt >= ? AND deletedAt IS NULL').get(startDate.toISOString()).count,
          byStatus: this.db.prepare('SELECT status, COUNT(*) as count FROM crm_leads WHERE deletedAt IS NULL GROUP BY status').all(),
          bySource: this.db.prepare('SELECT source, COUNT(*) as count FROM crm_leads WHERE deletedAt IS NULL GROUP BY source').all()
        },
        deals: {
          total: this.db.prepare('SELECT COUNT(*) as count FROM crm_deals WHERE deletedAt IS NULL').get().count,
          totalValue: this.db.prepare('SELECT SUM(amount) as total FROM crm_deals WHERE deletedAt IS NULL AND stage != "closed-lost"').get().total || 0,
          byStage: this.db.prepare('SELECT stage, COUNT(*) as count, SUM(amount) as value FROM crm_deals WHERE deletedAt IS NULL GROUP BY stage').all(),
          won: this.db.prepare('SELECT COUNT(*) as count, SUM(amount) as value FROM crm_deals WHERE stage = "closed-won" AND deletedAt IS NULL').get()
        },
        activities: {
          total: this.db.prepare('SELECT COUNT(*) as count FROM crm_activities').get().count,
          pending: this.db.prepare('SELECT COUNT(*) as count FROM crm_activities WHERE status = "pending"').get().count,
          byType: this.db.prepare('SELECT type, COUNT(*) as count FROM crm_activities GROUP BY type').all()
        }
      };

      res.json(analytics);
    });
  }

  authenticateUser(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Authentication required'
        }
      });
    }
    next();
  }

  getRouter() {
    return this.router;
  }
}

export default CRMSystem;