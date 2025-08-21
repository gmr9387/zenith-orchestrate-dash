import { nanoid } from 'nanoid';

class AdvancedCRM {
  constructor(db) {
    this.db = db;
    this.setupDatabase();
  }

  setupDatabase() {
    // Advanced CRM tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS advanced_crm_contacts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT,
        lastName TEXT,
        company TEXT,
        jobTitle TEXT,
        phone TEXT,
        website TEXT,
        leadScore INTEGER DEFAULT 0,
        lifecycleStage TEXT DEFAULT 'lead',
        leadStatus TEXT DEFAULT 'new',
        source TEXT,
        tags TEXT,
        notes TEXT,
        lastContacted TEXT,
        nextFollowUp TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_leads (
        id TEXT PRIMARY KEY,
        contactId TEXT NOT NULL,
        leadScore INTEGER DEFAULT 0,
        leadStatus TEXT DEFAULT 'new',
        source TEXT,
        campaign TEXT,
        assignedTo TEXT,
        expectedRevenue REAL,
        probability REAL DEFAULT 0.1,
        closeDate TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (contactId) REFERENCES advanced_crm_contacts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_deals (
        id TEXT PRIMARY KEY,
        contactId TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        stage TEXT DEFAULT 'prospecting',
        probability REAL DEFAULT 0.1,
        expectedCloseDate TEXT,
        actualCloseDate TEXT,
        assignedTo TEXT,
        pipeline TEXT DEFAULT 'default',
        tags TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        closedAt TEXT,
        FOREIGN KEY (contactId) REFERENCES advanced_crm_contacts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_activities (
        id TEXT PRIMARY KEY,
        contactId TEXT,
        dealId TEXT,
        type TEXT NOT NULL,
        subject TEXT,
        description TEXT,
        dueDate TEXT,
        completedAt TEXT,
        assignedTo TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        duration INTEGER,
        location TEXT,
        attendees TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (contactId) REFERENCES advanced_crm_contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (dealId) REFERENCES advanced_crm_deals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_emails (
        id TEXT PRIMARY KEY,
        contactId TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        sentAt TEXT,
        openedAt TEXT,
        clickedAt TEXT,
        bouncedAt TEXT,
        unsubscribedAt TEXT,
        campaignId TEXT,
        templateId TEXT,
        metadata TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (contactId) REFERENCES advanced_crm_contacts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        status TEXT DEFAULT 'draft',
        type TEXT DEFAULT 'email',
        targetAudience TEXT,
        scheduledAt TEXT,
        sentAt TEXT,
        totalRecipients INTEGER DEFAULT 0,
        openedCount INTEGER DEFAULT 0,
        clickedCount INTEGER DEFAULT 0,
        bouncedCount INTEGER DEFAULT 0,
        unsubscribedCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_pipelines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        stages TEXT NOT NULL,
        isDefault BOOLEAN DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_segments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        criteria TEXT NOT NULL,
        contactCount INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_automations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        trigger TEXT NOT NULL,
        conditions TEXT,
        actions TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS advanced_crm_analytics (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        metric TEXT NOT NULL,
        value REAL NOT NULL,
        segment TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_advanced_crm_contacts_email ON advanced_crm_contacts(email);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_contacts_leadScore ON advanced_crm_contacts(leadScore);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_contacts_lifecycleStage ON advanced_crm_contacts(lifecycleStage);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_deals_stage ON advanced_crm_deals(stage);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_deals_assignedTo ON advanced_crm_deals(assignedTo);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_activities_contactId ON advanced_crm_activities(contactId);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_activities_dueDate ON advanced_crm_activities(dueDate);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_emails_contactId ON advanced_crm_emails(contactId);
      CREATE INDEX IF NOT EXISTS idx_advanced_crm_emails_status ON advanced_crm_emails(status);
    `);

    // Initialize default pipeline
    this.initializeDefaultPipeline();
  }

  initializeDefaultPipeline() {
    const defaultPipeline = {
      name: 'Sales Pipeline',
      description: 'Default sales pipeline',
      stages: JSON.stringify([
        { name: 'Prospecting', probability: 0.1, color: '#ff6b6b' },
        { name: 'Qualification', probability: 0.25, color: '#4ecdc4' },
        { name: 'Proposal', probability: 0.5, color: '#45b7d1' },
        { name: 'Negotiation', probability: 0.75, color: '#96ceb4' },
        { name: 'Closed Won', probability: 1.0, color: '#feca57' },
        { name: 'Closed Lost', probability: 0.0, color: '#ff9ff3' }
      ]),
      isDefault: 1
    };

    this.db.prepare(`
      INSERT OR IGNORE INTO advanced_crm_pipelines (id, name, description, stages, isDefault, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      nanoid(),
      defaultPipeline.name,
      defaultPipeline.description,
      defaultPipeline.stages,
      defaultPipeline.isDefault,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // Contact Management
  createContact(contactData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_contacts (id, email, firstName, lastName, company, jobTitle, phone, website, 
                               leadScore, lifecycleStage, leadStatus, source, tags, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      contactData.email,
      contactData.firstName,
      contactData.lastName,
      contactData.company,
      contactData.jobTitle,
      contactData.phone,
      contactData.website,
      contactData.leadScore || 0,
      contactData.lifecycleStage || 'lead',
      contactData.leadStatus || 'new',
      contactData.source,
      contactData.tags ? JSON.stringify(contactData.tags) : null,
      contactData.notes,
      now,
      now
    );

    return this.getContact(id);
  }

  updateContact(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE advanced_crm_contacts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getContact(id);
  }

  getContact(id) {
    return this.db.prepare('SELECT * FROM advanced_crm_contacts WHERE id = ? AND deletedAt IS NULL').get(id);
  }

  searchContacts(query, filters = {}) {
    let sql = 'SELECT * FROM advanced_crm_contacts WHERE deletedAt IS NULL';
    const params = [];

    if (query) {
      sql += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR company LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.lifecycleStage) {
      sql += ' AND lifecycleStage = ?';
      params.push(filters.lifecycleStage);
    }

    if (filters.leadScore) {
      sql += ' AND leadScore >= ?';
      params.push(filters.leadScore);
    }

    if (filters.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }

    sql += ' ORDER BY leadScore DESC, createdAt DESC';

    return this.db.prepare(sql).all(...params);
  }

  // Lead Scoring
  updateLeadScore(contactId, score, reasons = []) {
    const contact = this.getContact(contactId);
    if (!contact) return null;

    const newScore = Math.max(0, Math.min(100, score));
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE advanced_crm_contacts 
      SET leadScore = ?, updatedAt = ? 
      WHERE id = ?
    `).run(newScore, now, contactId);

    // Log score change
    this.db.prepare(`
      INSERT INTO advanced_crm_activities (id, contactId, type, subject, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      nanoid(),
      contactId,
      'lead_score_change',
      'Lead Score Updated',
      `Score changed from ${contact.leadScore} to ${newScore}. Reasons: ${reasons.join(', ')}`,
      now,
      now
    );

    return this.getContact(contactId);
  }

  // Deal Management
  createDeal(dealData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_deals (id, contactId, name, amount, currency, stage, probability, 
                            expectedCloseDate, assignedTo, pipeline, tags, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dealData.contactId,
      dealData.name,
      dealData.amount,
      dealData.currency || 'USD',
      dealData.stage || 'prospecting',
      dealData.probability || 0.1,
      dealData.expectedCloseDate,
      dealData.assignedTo,
      dealData.pipeline || 'default',
      dealData.tags ? JSON.stringify(dealData.tags) : null,
      dealData.notes,
      now,
      now
    );

    return this.getDeal(id);
  }

  updateDeal(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE advanced_crm_deals SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getDeal(id);
  }

  getDeal(id) {
    return this.db.prepare(`
      SELECT d.*, c.firstName, c.lastName, c.email, c.company 
      FROM advanced_crm_deals d
      LEFT JOIN advanced_crm_contacts c ON d.contactId = c.id
      WHERE d.id = ?
    `).get(id);
  }

  getDealsByStage(stage) {
    return this.db.prepare(`
      SELECT d.*, c.firstName, c.lastName, c.email, c.company 
      FROM advanced_crm_deals d
      LEFT JOIN advanced_crm_contacts c ON d.contactId = c.id
      WHERE d.stage = ? AND d.closedAt IS NULL
      ORDER BY d.expectedCloseDate ASC
    `).all(stage);
  }

  // Email Marketing
  createCampaign(campaignData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_campaigns (id, name, subject, body, status, type, targetAudience, 
                                scheduledAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      campaignData.name,
      campaignData.subject,
      campaignData.body,
      campaignData.status || 'draft',
      campaignData.type || 'email',
      campaignData.targetAudience ? JSON.stringify(campaignData.targetAudience) : null,
      campaignData.scheduledAt,
      now,
      now
    );

    return this.getCampaign(id);
  }

  sendCampaign(campaignId) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign || campaign.status !== 'draft') return null;

    const now = new Date().toISOString();
    
    // Get target audience
    const contacts = this.getContactsBySegment(campaign.targetAudience);
    
    // Send emails
    contacts.forEach(contact => {
      this.sendEmail({
        contactId: contact.id,
        subject: campaign.subject,
        body: campaign.body,
        campaignId: campaignId,
        status: 'sent'
      });
    });

    // Update campaign
    this.db.prepare(`
      UPDATE advanced_crm_campaigns 
      SET status = 'sent', sentAt = ?, totalRecipients = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, contacts.length, now, campaignId);

    return this.getCampaign(campaignId);
  }

  sendEmail(emailData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_emails (id, contactId, subject, body, status, campaignId, templateId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      emailData.contactId,
      emailData.subject,
      emailData.body,
      emailData.status || 'draft',
      emailData.campaignId,
      emailData.templateId,
      now
    );

    return this.getEmail(id);
  }

  getEmail(id) {
    return this.db.prepare(`
      SELECT e.*, c.firstName, c.lastName, c.email 
      FROM advanced_crm_emails e
      LEFT JOIN advanced_crm_contacts c ON e.contactId = c.id
      WHERE e.id = ?
    `).get(id);
  }

  getCampaign(id) {
    return this.db.prepare('SELECT * FROM advanced_crm_campaigns WHERE id = ?').get(id);
  }

  // Segmentation
  createSegment(segmentData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_segments (id, name, description, criteria, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      segmentData.name,
      segmentData.description,
      JSON.stringify(segmentData.criteria),
      now,
      now
    );

    return this.getSegment(id);
  }

  getSegment(id) {
    return this.db.prepare('SELECT * FROM advanced_crm_segments WHERE id = ?').get(id);
  }

  getContactsBySegment(criteria) {
    // Simple segmentation - in production would be more sophisticated
    let sql = 'SELECT * FROM advanced_crm_contacts WHERE deletedAt IS NULL';
    const params = [];

    if (criteria.lifecycleStage) {
      sql += ' AND lifecycleStage = ?';
      params.push(criteria.lifecycleStage);
    }

    if (criteria.minLeadScore) {
      sql += ' AND leadScore >= ?';
      params.push(criteria.minLeadScore);
    }

    if (criteria.source) {
      sql += ' AND source = ?';
      params.push(criteria.source);
    }

    return this.db.prepare(sql).all(...params);
  }

  // Analytics
  getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const stats = {
      totalContacts: this.db.prepare('SELECT COUNT(*) as count FROM advanced_crm_contacts WHERE deletedAt IS NULL').get().count,
      totalDeals: this.db.prepare('SELECT COUNT(*) as count FROM advanced_crm_deals WHERE closedAt IS NULL').get().count,
      totalRevenue: this.db.prepare('SELECT SUM(amount) as total FROM advanced_crm_deals WHERE stage = "Closed Won"').get().total || 0,
      newContactsThisMonth: this.db.prepare('SELECT COUNT(*) as count FROM advanced_crm_contacts WHERE createdAt >= ? AND deletedAt IS NULL').get(thirtyDaysAgo).count,
      dealsWonThisMonth: this.db.prepare('SELECT COUNT(*) as count FROM advanced_crm_deals WHERE closedAt >= ? AND stage = "Closed Won"').get(thirtyDaysAgo).count,
      avgLeadScore: this.db.prepare('SELECT AVG(leadScore) as avg FROM advanced_crm_contacts WHERE deletedAt IS NULL').get().avg || 0
    };

    return stats;
  }

  getPipelineStats() {
    return this.db.prepare(`
      SELECT stage, COUNT(*) as count, SUM(amount) as value
      FROM advanced_crm_deals 
      WHERE closedAt IS NULL 
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'prospecting' THEN 1
          WHEN 'qualification' THEN 2
          WHEN 'proposal' THEN 3
          WHEN 'negotiation' THEN 4
          WHEN 'closed won' THEN 5
          WHEN 'closed lost' THEN 6
        END
    `).all();
  }

  getLeadSourceStats() {
    return this.db.prepare(`
      SELECT source, COUNT(*) as count, AVG(leadScore) as avgScore
      FROM advanced_crm_contacts 
      WHERE deletedAt IS NULL AND source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `).all();
  }

  // Activity Management
  createActivity(activityData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_crm_activities (id, contactId, dealId, type, subject, description, dueDate, 
                                 assignedTo, priority, status, duration, location, attendees, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      activityData.contactId,
      activityData.dealId,
      activityData.type,
      activityData.subject,
      activityData.description,
      activityData.dueDate,
      activityData.assignedTo,
      activityData.priority || 'medium',
      activityData.status || 'pending',
      activityData.duration,
      activityData.location,
      activityData.attendees ? JSON.stringify(activityData.attendees) : null,
      now,
      now
    );

    return this.getActivity(id);
  }

  getActivity(id) {
    return this.db.prepare(`
      SELECT a.*, c.firstName, c.lastName, c.email, c.company
      FROM advanced_crm_activities a
      LEFT JOIN advanced_crm_contacts c ON a.contactId = c.id
      WHERE a.id = ?
    `).get(id);
  }

  getUpcomingActivities(limit = 10) {
    return this.db.prepare(`
      SELECT a.*, c.firstName, c.lastName, c.email, c.company
      FROM advanced_crm_activities a
      LEFT JOIN advanced_crm_contacts c ON a.contactId = c.id
      WHERE a.dueDate >= datetime('now') AND a.status = 'pending'
      ORDER BY a.dueDate ASC
      LIMIT ?
    `).all(limit);
  }
}

export default AdvancedCRM;