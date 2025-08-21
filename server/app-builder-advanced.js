import { nanoid } from 'nanoid';

class AdvancedAppBuilder {
  constructor(db) {
    this.db = db;
    this.setupDatabase();
  }

  setupDatabase() {
    // Advanced App Builder tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS advanced_app_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        status TEXT DEFAULT 'draft',
        version TEXT DEFAULT '1.0.0',
        settings TEXT,
        databaseSchema TEXT,
        workflows TEXT,
        pages TEXT,
        components TEXT,
        styles TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        publishedAt TEXT,
        deletedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS advanced_app_pages (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        type TEXT DEFAULT 'page',
        layout TEXT DEFAULT 'default',
        content TEXT,
        settings TEXT,
        isHomePage BOOLEAN DEFAULT 0,
        isPublished BOOLEAN DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES advanced_app_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_app_components (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        icon TEXT,
        properties TEXT,
        styles TEXT,
        events TEXT,
        dataBindings TEXT,
        isCustom BOOLEAN DEFAULT 0,
        isReusable BOOLEAN DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES advanced_app_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_app_databases (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        tables TEXT NOT NULL,
        relationships TEXT,
        indexes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES advanced_app_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_app_workflows (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        trigger TEXT NOT NULL,
        steps TEXT NOT NULL,
        conditions TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES advanced_app_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_app_deployments (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        version TEXT NOT NULL,
        platform TEXT DEFAULT 'web',
        status TEXT DEFAULT 'building',
        buildLog TEXT,
        deployUrl TEXT,
        settings TEXT,
        createdAt TEXT NOT NULL,
        deployedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES advanced_app_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS advanced_app_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        icon TEXT,
        preview TEXT,
        content TEXT NOT NULL,
        isOfficial BOOLEAN DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_advanced_app_projects_createdBy ON advanced_app_projects(createdBy);
      CREATE INDEX IF NOT EXISTS idx_advanced_app_pages_projectId ON advanced_app_pages(projectId);
      CREATE INDEX IF NOT EXISTS idx_advanced_app_components_projectId ON advanced_app_components(projectId);
      CREATE INDEX IF NOT EXISTS idx_advanced_app_databases_projectId ON advanced_app_databases(projectId);
      CREATE INDEX IF NOT EXISTS idx_advanced_app_workflows_projectId ON advanced_app_workflows(projectId);
    `);

    // Initialize default components
    this.initializeDefaultComponents();
    this.initializeDefaultTemplates();
  }

  initializeDefaultComponents() {
    const defaultComponents = [
      {
        name: 'Button',
        type: 'button',
        category: 'Basic',
        icon: '🔘',
        properties: {
          text: { type: 'string', default: 'Click me' },
          variant: { type: 'select', options: ['primary', 'secondary', 'outline'], default: 'primary' },
          size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
          disabled: { type: 'boolean', default: false }
        },
        events: ['click', 'hover', 'focus'],
        isCustom: false
      },
      {
        name: 'Input',
        type: 'input',
        category: 'Form',
        icon: '📝',
        properties: {
          placeholder: { type: 'string', default: 'Enter text...' },
          type: { type: 'select', options: ['text', 'email', 'password', 'number'], default: 'text' },
          required: { type: 'boolean', default: false },
          disabled: { type: 'boolean', default: false }
        },
        events: ['change', 'focus', 'blur'],
        isCustom: false
      },
      {
        name: 'Card',
        type: 'card',
        category: 'Layout',
        icon: '🃏',
        properties: {
          title: { type: 'string', default: 'Card Title' },
          subtitle: { type: 'string', default: '' },
          padding: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
          shadow: { type: 'select', options: ['none', 'sm', 'md', 'lg'], default: 'md' }
        },
        events: ['click'],
        isCustom: false
      },
      {
        name: 'Data Table',
        type: 'datatable',
        category: 'Data',
        icon: '📊',
        properties: {
          dataSource: { type: 'datasource', default: null },
          columns: { type: 'array', default: [] },
          pagination: { type: 'boolean', default: true },
          search: { type: 'boolean', default: true }
        },
        events: ['rowClick', 'sort', 'filter'],
        isCustom: false
      },
      {
        name: 'Modal',
        type: 'modal',
        category: 'Overlay',
        icon: '🪟',
        properties: {
          title: { type: 'string', default: 'Modal Title' },
          size: { type: 'select', options: ['sm', 'md', 'lg', 'xl'], default: 'md' },
          closeOnOverlay: { type: 'boolean', default: true },
          showCloseButton: { type: 'boolean', default: true }
        },
        events: ['open', 'close'],
        isCustom: false
      },
      {
        name: 'Chart',
        type: 'chart',
        category: 'Data',
        icon: '📈',
        properties: {
          type: { type: 'select', options: ['line', 'bar', 'pie', 'doughnut'], default: 'line' },
          dataSource: { type: 'datasource', default: null },
          title: { type: 'string', default: 'Chart Title' },
          height: { type: 'number', default: 300 }
        },
        events: ['pointClick', 'legendClick'],
        isCustom: false
      }
    ];

    defaultComponents.forEach(component => {
      this.db.prepare(`
        INSERT OR IGNORE INTO advanced_app_components (id, name, type, category, icon, properties, events, isCustom, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nanoid(),
        component.name,
        component.type,
        component.category,
        component.icon,
        JSON.stringify(component.properties),
        JSON.stringify(component.events),
        component.isCustom ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );
    });
  }

  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'E-commerce Store',
        description: 'Complete online store with product catalog, cart, and checkout',
        category: 'E-commerce',
        icon: '🛒',
        content: {
          pages: [
            { name: 'Home', slug: 'home', type: 'page' },
            { name: 'Products', slug: 'products', type: 'page' },
            { name: 'Product Detail', slug: 'product', type: 'page' },
            { name: 'Cart', slug: 'cart', type: 'page' },
            { name: 'Checkout', slug: 'checkout', type: 'page' }
          ],
          database: {
            tables: [
              {
                name: 'products',
                fields: [
                  { name: 'id', type: 'id', primary: true },
                  { name: 'name', type: 'text', required: true },
                  { name: 'description', type: 'text' },
                  { name: 'price', type: 'number', required: true },
                  { name: 'image', type: 'file' },
                  { name: 'category', type: 'text' },
                  { name: 'stock', type: 'number', default: 0 }
                ]
              },
              {
                name: 'orders',
                fields: [
                  { name: 'id', type: 'id', primary: true },
                  { name: 'customerId', type: 'reference', table: 'customers' },
                  { name: 'items', type: 'json' },
                  { name: 'total', type: 'number' },
                  { name: 'status', type: 'text', default: 'pending' },
                  { name: 'createdAt', type: 'datetime' }
                ]
              }
            ]
          }
        },
        isOfficial: true
      },
      {
        name: 'Task Management',
        description: 'Project management app with tasks, teams, and progress tracking',
        category: 'Productivity',
        icon: '✅',
        content: {
          pages: [
            { name: 'Dashboard', slug: 'dashboard', type: 'page' },
            { name: 'Projects', slug: 'projects', type: 'page' },
            { name: 'Tasks', slug: 'tasks', type: 'page' },
            { name: 'Team', slug: 'team', type: 'page' }
          ],
          database: {
            tables: [
              {
                name: 'projects',
                fields: [
                  { name: 'id', type: 'id', primary: true },
                  { name: 'name', type: 'text', required: true },
                  { name: 'description', type: 'text' },
                  { name: 'status', type: 'text', default: 'active' },
                  { name: 'dueDate', type: 'datetime' }
                ]
              },
              {
                name: 'tasks',
                fields: [
                  { name: 'id', type: 'id', primary: true },
                  { name: 'projectId', type: 'reference', table: 'projects' },
                  { name: 'title', type: 'text', required: true },
                  { name: 'description', type: 'text' },
                  { name: 'assigneeId', type: 'reference', table: 'users' },
                  { name: 'status', type: 'text', default: 'todo' },
                  { name: 'priority', type: 'text', default: 'medium' },
                  { name: 'dueDate', type: 'datetime' }
                ]
              }
            ]
          }
        },
        isOfficial: true
      },
      {
        name: 'Blog Platform',
        description: 'Content management system for blogs and articles',
        category: 'Content',
        icon: '📝',
        content: {
          pages: [
            { name: 'Home', slug: 'home', type: 'page' },
            { name: 'Blog', slug: 'blog', type: 'page' },
            { name: 'Article', slug: 'article', type: 'page' },
            { name: 'Admin', slug: 'admin', type: 'page' }
          ],
          database: {
            tables: [
              {
                name: 'posts',
                fields: [
                  { name: 'id', type: 'id', primary: true },
                  { name: 'title', type: 'text', required: true },
                  { name: 'slug', type: 'text', required: true, unique: true },
                  { name: 'content', type: 'text' },
                  { name: 'excerpt', type: 'text' },
                  { name: 'authorId', type: 'reference', table: 'users' },
                  { name: 'status', type: 'text', default: 'draft' },
                  { name: 'publishedAt', type: 'datetime' },
                  { name: 'tags', type: 'json' }
                ]
              }
            ]
          }
        },
        isOfficial: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.db.prepare(`
        INSERT OR IGNORE INTO advanced_app_templates (id, name, description, category, icon, content, isOfficial, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nanoid(),
        template.name,
        template.description,
        template.category,
        template.icon,
        JSON.stringify(template.content),
        template.isOfficial ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );
    });
  }

  // Project Management
  createProject(projectData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_app_projects (id, name, description, icon, settings, databaseSchema, workflows, pages, components, styles, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      projectData.name,
      projectData.description,
      projectData.icon,
      JSON.stringify(projectData.settings || {}),
      JSON.stringify(projectData.databaseSchema || {}),
      JSON.stringify(projectData.workflows || []),
      JSON.stringify(projectData.pages || []),
      JSON.stringify(projectData.components || []),
      JSON.stringify(projectData.styles || {}),
      projectData.createdBy,
      now,
      now
    );

    return this.getProject(id);
  }

  updateProject(id, updates) {
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

    this.db.prepare(`UPDATE advanced_app_projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getProject(id);
  }

  getProject(id) {
    return this.db.prepare('SELECT * FROM advanced_app_projects WHERE id = ? AND deletedAt IS NULL').get(id);
  }

  getUserProjects(userId) {
    return this.db.prepare(`
      SELECT * FROM advanced_app_projects 
      WHERE createdBy = ? AND deletedAt IS NULL 
      ORDER BY updatedAt DESC
    `).all(userId);
  }

  // Page Management
  createPage(pageData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_app_pages (id, projectId, name, slug, type, layout, content, settings, isHomePage, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pageData.projectId,
      pageData.name,
      pageData.slug,
      pageData.type || 'page',
      pageData.layout || 'default',
      JSON.stringify(pageData.content || {}),
      JSON.stringify(pageData.settings || {}),
      pageData.isHomePage || false,
      now,
      now
    );

    return this.getPage(id);
  }

  updatePage(id, updates) {
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

    this.db.prepare(`UPDATE advanced_app_pages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getPage(id);
  }

  getPage(id) {
    return this.db.prepare('SELECT * FROM advanced_app_pages WHERE id = ?').get(id);
  }

  getProjectPages(projectId) {
    return this.db.prepare(`
      SELECT * FROM advanced_app_pages 
      WHERE projectId = ? 
      ORDER BY isHomePage DESC, name ASC
    `).all(projectId);
  }

  // Component Management
  createComponent(componentData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_app_components (id, projectId, name, type, category, icon, properties, styles, events, dataBindings, isCustom, isReusable, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      componentData.projectId,
      componentData.name,
      componentData.type,
      componentData.category,
      componentData.icon,
      JSON.stringify(componentData.properties || {}),
      JSON.stringify(componentData.styles || {}),
      JSON.stringify(componentData.events || []),
      JSON.stringify(componentData.dataBindings || {}),
      componentData.isCustom || false,
      componentData.isReusable || false,
      now,
      now
    );

    return this.getComponent(id);
  }

  getComponent(id) {
    return this.db.prepare('SELECT * FROM advanced_app_components WHERE id = ?').get(id);
  }

  getProjectComponents(projectId) {
    return this.db.prepare(`
      SELECT * FROM advanced_app_components 
      WHERE projectId = ? OR projectId IS NULL
      ORDER BY category, name
    `).all(projectId);
  }

  getComponentTemplates() {
    return this.db.prepare(`
      SELECT * FROM advanced_app_components 
      WHERE projectId IS NULL 
      ORDER BY category, name
    `).all();
  }

  // Database Management
  createDatabase(databaseData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_app_databases (id, projectId, name, description, tables, relationships, indexes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      databaseData.projectId,
      databaseData.name,
      databaseData.description,
      JSON.stringify(databaseData.tables || []),
      JSON.stringify(databaseData.relationships || []),
      JSON.stringify(databaseData.indexes || []),
      now,
      now
    );

    return this.getDatabase(id);
  }

  getDatabase(id) {
    return this.db.prepare('SELECT * FROM advanced_app_databases WHERE id = ?').get(id);
  }

  getProjectDatabase(projectId) {
    return this.db.prepare('SELECT * FROM advanced_app_databases WHERE projectId = ?').get(projectId);
  }

  // Workflow Management
  createWorkflow(workflowData) {
    const id = nanoid();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO advanced_app_workflows (id, projectId, name, description, trigger, steps, conditions, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      workflowData.projectId,
      workflowData.name,
      workflowData.description,
      JSON.stringify(workflowData.trigger || {}),
      JSON.stringify(workflowData.steps || []),
      JSON.stringify(workflowData.conditions || []),
      workflowData.isActive !== false,
      now,
      now
    );

    return this.getWorkflow(id);
  }

  getWorkflow(id) {
    return this.db.prepare('SELECT * FROM advanced_app_workflows WHERE id = ?').get(id);
  }

  getProjectWorkflows(projectId) {
    return this.db.prepare(`
      SELECT * FROM advanced_app_workflows 
      WHERE projectId = ? 
      ORDER BY name
    `).all(projectId);
  }

  // Template Management
  getTemplates(category = null) {
    let sql = 'SELECT * FROM advanced_app_templates ORDER BY isOfficial DESC, downloads DESC';
    const params = [];

    if (category) {
      sql = 'SELECT * FROM advanced_app_templates WHERE category = ? ORDER BY isOfficial DESC, downloads DESC';
      params.push(category);
    }

    return this.db.prepare(sql).all(...params);
  }

  getTemplate(id) {
    return this.db.prepare('SELECT * FROM advanced_app_templates WHERE id = ?').get(id);
  }

  createProjectFromTemplate(templateId, projectData) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const templateContent = JSON.parse(template.content);
    
    // Create project
    const project = this.createProject({
      ...projectData,
      databaseSchema: templateContent.database,
      pages: templateContent.pages
    });

    // Create pages from template
    templateContent.pages.forEach(pageData => {
      this.createPage({
        ...pageData,
        projectId: project.id
      });
    });

    // Update template download count
    this.db.prepare(`
      UPDATE advanced_app_templates 
      SET downloads = downloads + 1 
      WHERE id = ?
    `).run(templateId);

    return project;
  }

  // Build and Deploy
  buildProject(projectId) {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const pages = this.getProjectPages(projectId);
    const components = this.getProjectComponents(projectId);
    const database = this.getProjectDatabase(projectId);
    const workflows = this.getProjectWorkflows(projectId);

    // Generate build artifacts
    const build = {
      project: project,
      pages: pages,
      components: components,
      database: database,
      workflows: workflows,
      generatedAt: new Date().toISOString()
    };

    return build;
  }

  deployProject(projectId, platform = 'web') {
    const deploymentId = nanoid();
    const now = new Date().toISOString();
    
    // Create deployment record
    this.db.prepare(`
      INSERT INTO advanced_app_deployments (id, projectId, version, platform, status, settings, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      deploymentId,
      projectId,
      '1.0.0',
      platform,
      'building',
      JSON.stringify({ platform }),
      now
    );

    // Simulate build process
    setTimeout(() => {
      const deployUrl = `https://app-${projectId}.yourplatform.com`;
      
      this.db.prepare(`
        UPDATE advanced_app_deployments 
        SET status = 'deployed', deployUrl = ?, deployedAt = ?
        WHERE id = ?
      `).run('deployed', deployUrl, new Date().toISOString(), deploymentId);
    }, 2000);

    return this.getDeployment(deploymentId);
  }

  getDeployment(id) {
    return this.db.prepare('SELECT * FROM advanced_app_deployments WHERE id = ?').get(id);
  }

  getProjectDeployments(projectId) {
    return this.db.prepare(`
      SELECT * FROM advanced_app_deployments 
      WHERE projectId = ? 
      ORDER BY createdAt DESC
    `).all(projectId);
  }

  // Code Generation
  generateCode(projectId) {
    const project = this.getProject(projectId);
    const pages = this.getProjectPages(projectId);
    const components = this.getProjectComponents(projectId);
    const database = this.getProjectDatabase(projectId);

    // Generate React components
    const reactComponents = this.generateReactComponents(components);
    
    // Generate pages
    const reactPages = this.generateReactPages(pages);
    
    // Generate database schema
    const databaseSchema = this.generateDatabaseSchema(database);

    return {
      react: {
        components: reactComponents,
        pages: reactPages
      },
      database: databaseSchema,
      packageJson: this.generatePackageJson(project),
      readme: this.generateReadme(project)
    };
  }

  generateReactComponents(components) {
    return components.map(component => {
      const props = JSON.parse(component.properties || '{}');
      const events = JSON.parse(component.events || '[]');
      
      return {
        name: component.name,
        code: `import React from 'react';

export const ${component.name} = ({ ${Object.keys(props).join(', ')}, ...props }) => {
  return (
    <div className="${component.type}-component" {...props}>
      {/* ${component.name} component implementation */}
    </div>
  );
};`
      };
    });
  }

  generateReactPages(pages) {
    return pages.map(page => {
      const content = JSON.parse(page.content || '{}');
      
      return {
        name: page.name,
        slug: page.slug,
        code: `import React from 'react';

export const ${page.name.replace(/\s+/g, '')}Page = () => {
  return (
    <div className="page ${page.slug}-page">
      <h1>${page.name}</h1>
      {/* Page content implementation */}
    </div>
  );
};`
      };
    });
  }

  generateDatabaseSchema(database) {
    if (!database) return null;
    
    const tables = JSON.parse(database.tables || '[]');
    
    return {
      tables: tables.map(table => ({
        name: table.name,
        fields: table.fields,
        sql: this.generateTableSQL(table)
      }))
    };
  }

  generateTableSQL(table) {
    const fields = table.fields.map(field => {
      let sql = `${field.name} ${field.type.toUpperCase()}`;
      if (field.primary) sql += ' PRIMARY KEY';
      if (field.required) sql += ' NOT NULL';
      if (field.default !== undefined) sql += ` DEFAULT ${field.default}`;
      return sql;
    }).join(',\n  ');

    return `CREATE TABLE ${table.name} (
  ${fields}
);`;
  }

  generatePackageJson(project) {
    return {
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: project.version,
      description: project.description,
      main: 'src/index.js',
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        'react-router-dom': '^6.0.0'
      }
    };
  }

  generateReadme(project) {
    return `# ${project.name}

${project.description || 'Generated by App Builder'}

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm start\`
3. Build for production: \`npm run build\`

## Features

- Responsive design
- Component-based architecture
- Database integration
- Workflow automation

Generated on ${new Date().toLocaleDateString()}
`;
  }
}

export default AdvancedAppBuilder;