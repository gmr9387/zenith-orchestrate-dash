import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

class AppBuilder {
  constructor(db, config = {}) {
    this.db = db;
    this.config = {
      outputDir: config.outputDir || 'server/generated-apps',
      templatesDir: config.templatesDir || 'server/app-templates',
      ...config
    };

    this.router = express.Router();
    this.setupDatabase();
    this.setupTemplates();
    this.setupRoutes();
  }

  setupDatabase() {
    // App Builder database schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        template TEXT DEFAULT 'blank',
        config TEXT NOT NULL, -- JSON object with app configuration
        components TEXT NOT NULL, -- JSON array of components
        styles TEXT, -- JSON object with custom styles
        scripts TEXT, -- JSON object with custom scripts
        isPublished INTEGER NOT NULL DEFAULT 0,
        publishedUrl TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS app_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        thumbnail TEXT,
        config TEXT NOT NULL, -- JSON object with template configuration
        components TEXT NOT NULL, -- JSON array of default components
        styles TEXT, -- JSON object with default styles
        scripts TEXT, -- JSON object with default scripts
        isActive INTEGER NOT NULL DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS app_components (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- button, input, card, etc.
        category TEXT,
        description TEXT,
        icon TEXT,
        config TEXT NOT NULL, -- JSON object with component configuration
        props TEXT NOT NULL, -- JSON object with component properties
        styles TEXT, -- JSON object with component styles
        isActive INTEGER NOT NULL DEFAULT 1,
        isCustom INTEGER NOT NULL DEFAULT 0,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS app_deployments (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT DEFAULT 'building', -- building, deployed, failed
        buildLog TEXT,
        deployedUrl TEXT,
        deployedAt TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES app_projects(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_app_projects_created_by ON app_projects(createdBy);
      CREATE INDEX IF NOT EXISTS idx_app_projects_is_published ON app_projects(isPublished);
      CREATE INDEX IF NOT EXISTS idx_app_templates_category ON app_templates(category);
      CREATE INDEX IF NOT EXISTS idx_app_components_type ON app_components(type);
      CREATE INDEX IF NOT EXISTS idx_app_components_category ON app_components(category);
    `);

    // Prepared statements
    this.insertProject = this.db.prepare(`
      INSERT INTO app_projects (id, name, description, template, config, components, styles, scripts, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getProject = this.db.prepare('SELECT * FROM app_projects WHERE id = ? AND deletedAt IS NULL');
    this.listProjects = this.db.prepare('SELECT * FROM app_projects WHERE createdBy = ? AND deletedAt IS NULL ORDER BY updatedAt DESC');
    this.updateProject = this.db.prepare(`
      UPDATE app_projects SET name = ?, description = ?, config = ?, components = ?, styles = ?, scripts = ?, updatedAt = ?
      WHERE id = ?
    `);
    this.publishProject = this.db.prepare('UPDATE app_projects SET isPublished = ?, publishedUrl = ?, updatedAt = ? WHERE id = ?');

    this.insertTemplate = this.db.prepare(`
      INSERT INTO app_templates (id, name, description, category, thumbnail, config, components, styles, scripts, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getTemplate = this.db.prepare('SELECT * FROM app_templates WHERE id = ? AND isActive = 1');
    this.listTemplates = this.db.prepare('SELECT * FROM app_templates WHERE isActive = 1 ORDER BY createdAt DESC');

    this.insertComponent = this.db.prepare(`
      INSERT INTO app_components (id, name, type, category, description, icon, config, props, styles, isCustom, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getComponent = this.db.prepare('SELECT * FROM app_components WHERE id = ? AND isActive = 1');
    this.listComponents = this.db.prepare('SELECT * FROM app_components WHERE isActive = 1 ORDER BY category, name');

    this.insertDeployment = this.db.prepare(`
      INSERT INTO app_deployments (id, projectId, version, status, buildLog, createdBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  }

  setupTemplates() {
    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    fs.mkdirSync(this.config.templatesDir, { recursive: true });

    // Initialize default templates if they don't exist
    this.initializeDefaultTemplates();
    this.initializeDefaultComponents();
  }

  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'blank',
        name: 'Blank App',
        description: 'Start with a clean slate',
        category: 'basic',
        config: JSON.stringify({
          title: 'My App',
          theme: 'light',
          layout: 'single-page'
        }),
        components: JSON.stringify([]),
        styles: JSON.stringify({}),
        scripts: JSON.stringify({})
      },
      {
        id: 'landing-page',
        name: 'Landing Page',
        description: 'Professional landing page template',
        category: 'marketing',
        config: JSON.stringify({
          title: 'Welcome to Our Platform',
          theme: 'light',
          layout: 'single-page'
        }),
        components: JSON.stringify([
          {
            id: 'header-1',
            type: 'header',
            props: {
              title: 'Welcome to Our Platform',
              subtitle: 'The best solution for your business needs',
              showNav: true
            }
          },
          {
            id: 'hero-1',
            type: 'hero',
            props: {
              title: 'Transform Your Business',
              subtitle: 'Get started today and see the difference',
              buttonText: 'Get Started',
              buttonLink: '#contact'
            }
          },
          {
            id: 'features-1',
            type: 'features',
            props: {
              title: 'Why Choose Us',
              features: [
                { title: 'Easy to Use', description: 'Intuitive interface' },
                { title: 'Fast Performance', description: 'Lightning fast loading' },
                { title: '24/7 Support', description: 'Always here to help' }
              ]
            }
          }
        ]),
        styles: JSON.stringify({
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af'
        }),
        scripts: JSON.stringify({})
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Analytics and data visualization dashboard',
        category: 'business',
        config: JSON.stringify({
          title: 'Analytics Dashboard',
          theme: 'dark',
          layout: 'sidebar'
        }),
        components: JSON.stringify([
          {
            id: 'sidebar-1',
            type: 'sidebar',
            props: {
              title: 'Dashboard',
              menuItems: [
                { label: 'Overview', icon: 'home' },
                { label: 'Analytics', icon: 'chart' },
                { label: 'Reports', icon: 'file' },
                { label: 'Settings', icon: 'settings' }
              ]
            }
          },
          {
            id: 'stats-1',
            type: 'stats',
            props: {
              title: 'Key Metrics',
              stats: [
                { label: 'Revenue', value: '$50,000', change: '+12%' },
                { label: 'Users', value: '2,500', change: '+8%' },
                { label: 'Orders', value: '1,200', change: '+15%' }
              ]
            }
          },
          {
            id: 'chart-1',
            type: 'chart',
            props: {
              title: 'Revenue Trend',
              type: 'line',
              data: [
                { month: 'Jan', value: 4000 },
                { month: 'Feb', value: 5000 },
                { month: 'Mar', value: 6000 }
              ]
            }
          }
        ]),
        styles: JSON.stringify({
          primaryColor: '#1f2937',
          secondaryColor: '#374151'
        }),
        scripts: JSON.stringify({})
      }
    ];

    for (const template of defaultTemplates) {
      try {
        this.insertTemplate.run(
          template.id,
          template.name,
          template.description,
          template.category,
          template.thumbnail || null,
          template.config,
          template.components,
          template.styles,
          template.scripts,
          'system',
          new Date().toISOString(),
          new Date().toISOString()
        );
      } catch (error) {
        // Template might already exist
        console.log(`Template ${template.id} already exists`);
      }
    }
  }

  initializeDefaultComponents() {
    const defaultComponents = [
      {
        id: 'button',
        name: 'Button',
        type: 'button',
        category: 'basic',
        description: 'Clickable button component',
        icon: 'mouse-pointer',
        config: JSON.stringify({
          variants: ['primary', 'secondary', 'outline', 'ghost'],
          sizes: ['sm', 'md', 'lg']
        }),
        props: JSON.stringify({
          text: { type: 'string', default: 'Click me' },
          variant: { type: 'select', options: ['primary', 'secondary', 'outline', 'ghost'], default: 'primary' },
          size: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
          disabled: { type: 'boolean', default: false },
          onClick: { type: 'function', default: 'console.log("Button clicked")' }
        }),
        styles: JSON.stringify({
          primary: { backgroundColor: '#3b82f6', color: 'white' },
          secondary: { backgroundColor: '#6b7280', color: 'white' },
          outline: { border: '1px solid #3b82f6', color: '#3b82f6' },
          ghost: { color: '#3b82f6' }
        })
      },
      {
        id: 'input',
        name: 'Input',
        type: 'input',
        category: 'form',
        description: 'Text input field',
        icon: 'type',
        config: JSON.stringify({
          types: ['text', 'email', 'password', 'number', 'tel']
        }),
        props: JSON.stringify({
          placeholder: { type: 'string', default: 'Enter text...' },
          type: { type: 'select', options: ['text', 'email', 'password', 'number', 'tel'], default: 'text' },
          value: { type: 'string', default: '' },
          required: { type: 'boolean', default: false },
          disabled: { type: 'boolean', default: false },
          onChange: { type: 'function', default: 'console.log("Input changed")' }
        }),
        styles: JSON.stringify({
          default: { border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 12px' },
          focus: { borderColor: '#3b82f6', outline: 'none' }
        })
      },
      {
        id: 'card',
        name: 'Card',
        type: 'card',
        category: 'layout',
        description: 'Container with shadow and padding',
        icon: 'square',
        config: JSON.stringify({
          variants: ['default', 'elevated', 'outlined']
        }),
        props: JSON.stringify({
          title: { type: 'string', default: 'Card Title' },
          content: { type: 'string', default: 'Card content goes here' },
          variant: { type: 'select', options: ['default', 'elevated', 'outlined'], default: 'default' },
          padding: { type: 'select', options: ['sm', 'md', 'lg'], default: 'md' }
        }),
        styles: JSON.stringify({
          default: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
          elevated: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
          outlined: { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }
        })
      },
      {
        id: 'header',
        name: 'Header',
        type: 'header',
        category: 'layout',
        description: 'Page header with navigation',
        icon: 'menu',
        config: JSON.stringify({
          variants: ['simple', 'with-nav', 'hero']
        }),
        props: JSON.stringify({
          title: { type: 'string', default: 'My App' },
          subtitle: { type: 'string', default: '' },
          showNav: { type: 'boolean', default: false },
          navItems: { type: 'array', default: ['Home', 'About', 'Contact'] },
          variant: { type: 'select', options: ['simple', 'with-nav', 'hero'], default: 'simple' }
        }),
        styles: JSON.stringify({
          simple: { padding: '1rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' },
          hero: { padding: '4rem 2rem', backgroundColor: '#f8fafc', textAlign: 'center' }
        })
      }
    ];

    for (const component of defaultComponents) {
      try {
        this.insertComponent.run(
          component.id,
          component.name,
          component.type,
          component.category,
          component.description,
          component.icon,
          component.config,
          component.props,
          component.styles,
          0, // isCustom = false
          'system',
          new Date().toISOString(),
          new Date().toISOString()
        );
      } catch (error) {
        // Component might already exist
        console.log(`Component ${component.id} already exists`);
      }
    }
  }

  setupRoutes() {
    // Project routes
    this.router.post('/projects', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        template: z.string().optional(),
        config: z.record(z.any()).optional(),
        components: z.array(z.any()).optional(),
        styles: z.record(z.any()).optional(),
        scripts: z.record(z.any()).optional()
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

      const { name, description, template, config, components, styles, scripts } = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      // Get template if specified
      let templateData = null;
      if (template && template !== 'blank') {
        templateData = this.getTemplate.get(template);
      }

      const defaultConfig = {
        title: name,
        theme: 'light',
        layout: 'single-page'
      };

      const projectConfig = {
        ...defaultConfig,
        ...(templateData ? JSON.parse(templateData.config) : {}),
        ...(config || {})
      };

      const projectComponents = components || (templateData ? JSON.parse(templateData.components) : []);
      const projectStyles = styles || (templateData ? JSON.parse(templateData.styles) : {});
      const projectScripts = scripts || (templateData ? JSON.parse(templateData.scripts) : {});

      try {
        this.insertProject.run(
          id,
          name,
          description || '',
          template || 'blank',
          JSON.stringify(projectConfig),
          JSON.stringify(projectComponents),
          JSON.stringify(projectStyles),
          JSON.stringify(projectScripts),
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          name,
          description,
          template,
          config: projectConfig,
          components: projectComponents,
          styles: projectStyles,
          scripts: projectScripts,
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create project'
          }
        });
      }
    });

    this.router.get('/projects', this.authenticateUser, (req, res) => {
      const projects = this.listProjects.all(req.user.id);
      const processed = projects.map(project => ({
        ...project,
        config: JSON.parse(project.config),
        components: JSON.parse(project.components),
        styles: JSON.parse(project.styles),
        scripts: JSON.parse(project.scripts)
      }));
      res.json(processed);
    });

    this.router.get('/projects/:id', this.authenticateUser, (req, res) => {
      const project = this.getProject.get(req.params.id);
      if (!project) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Project not found'
          }
        });
      }

      // Check if user can access this project
      if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'forbidden',
            message: 'Access denied'
          }
        });
      }

      const processed = {
        ...project,
        config: JSON.parse(project.config),
        components: JSON.parse(project.components),
        styles: JSON.parse(project.styles),
        scripts: JSON.parse(project.scripts)
      };

      res.json(processed);
    });

    this.router.put('/projects/:id', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        config: z.record(z.any()).optional(),
        components: z.array(z.any()).optional(),
        styles: z.record(z.any()).optional(),
        scripts: z.record(z.any()).optional()
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

      const project = this.getProject.get(req.params.id);
      if (!project) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Project not found'
          }
        });
      }

      // Check if user can access this project
      if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'forbidden',
            message: 'Access denied'
          }
        });
      }

      const { name, description, config, components, styles, scripts } = parsed.data;
      const now = new Date().toISOString();

      try {
        this.updateProject.run(
          name || project.name,
          description || project.description,
          config ? JSON.stringify(config) : project.config,
          components ? JSON.stringify(components) : project.components,
          styles ? JSON.stringify(styles) : project.styles,
          scripts ? JSON.stringify(scripts) : project.scripts,
          now,
          req.params.id
        );

        res.json({ status: 'updated' });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'update_failed',
            message: 'Failed to update project'
          }
        });
      }
    });

    // Template routes
    this.router.get('/templates', this.authenticateUser, (req, res) => {
      const templates = this.listTemplates.all();
      const processed = templates.map(template => ({
        ...template,
        config: JSON.parse(template.config),
        components: JSON.parse(template.components),
        styles: JSON.parse(template.styles),
        scripts: JSON.parse(template.scripts)
      }));
      res.json(processed);
    });

    this.router.get('/templates/:id', this.authenticateUser, (req, res) => {
      const template = this.getTemplate.get(req.params.id);
      if (!template) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Template not found'
          }
        });
      }

      const processed = {
        ...template,
        config: JSON.parse(template.config),
        components: JSON.parse(template.components),
        styles: JSON.parse(template.styles),
        scripts: JSON.parse(template.scripts)
      };

      res.json(processed);
    });

    // Component routes
    this.router.get('/components', this.authenticateUser, (req, res) => {
      const components = this.listComponents.all();
      const processed = components.map(component => ({
        ...component,
        config: JSON.parse(component.config),
        props: JSON.parse(component.props),
        styles: JSON.parse(component.styles)
      }));
      res.json(processed);
    });

    this.router.get('/components/:id', this.authenticateUser, (req, res) => {
      const component = this.getComponent.get(req.params.id);
      if (!component) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Component not found'
          }
        });
      }

      const processed = {
        ...component,
        config: JSON.parse(component.config),
        props: JSON.parse(component.props),
        styles: JSON.parse(component.styles)
      };

      res.json(processed);
    });

    // Custom component creation
    this.router.post('/components', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100),
        type: z.string().min(1).max(50),
        category: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        config: z.record(z.any()).optional(),
        props: z.record(z.any()).optional(),
        styles: z.record(z.any()).optional()
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

      const componentData = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertComponent.run(
          id,
          componentData.name,
          componentData.type,
          componentData.category || 'custom',
          componentData.description || '',
          componentData.icon || 'component',
          JSON.stringify(componentData.config || {}),
          JSON.stringify(componentData.props || {}),
          JSON.stringify(componentData.styles || {}),
          1, // isCustom = true
          req.user.id,
          now,
          now
        );

        res.status(201).json({
          id,
          ...componentData,
          isCustom: true,
          createdAt: now
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create component'
          }
        });
      }
    });

    // Build and deploy routes
    this.router.post('/projects/:id/build', this.authenticateUser, async (req, res) => {
      const project = this.getProject.get(req.params.id);
      if (!project) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Project not found'
          }
        });
      }

      // Check if user can access this project
      if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'forbidden',
            message: 'Access denied'
          }
        });
      }

      const deploymentId = nanoid();
      const version = `v${Date.now()}`;
      const now = new Date().toISOString();

      try {
        // Create deployment record
        this.insertDeployment.run(
          deploymentId,
          req.params.id,
          version,
          'building',
          'Build started...',
          req.user.id,
          now
        );

        // Start build process
        this.buildProject(project, deploymentId);

        res.json({
          deploymentId,
          version,
          status: 'building',
          message: 'Build started'
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'build_failed',
            message: 'Failed to start build'
          }
        });
      }
    });

    this.router.get('/deployments/:id', this.authenticateUser, (req, res) => {
      const deployment = this.db.prepare('SELECT * FROM app_deployments WHERE id = ?').get(req.params.id);
      if (!deployment) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Deployment not found'
          }
        });
      }

      res.json(deployment);
    });

    // Publish project
    this.router.post('/projects/:id/publish', this.authenticateUser, (req, res) => {
      const plan = req.user?.plan || 'pro';
      if (plan === 'free') {
        return res.status(403).json({ error: { code: 'entitlement_required', message: 'Publish requires Pro plan' } });
      }
      const project = this.getProject.get(req.params.id);
      if (!project) {
        return res.status(404).json({
          error: {
            code: 'not_found',
            message: 'Project not found'
          }
        });
      }

      // Check if user can access this project
      if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'forbidden',
            message: 'Access denied'
          }
        });
      }

      const publishedUrl = `${req.protocol}://${req.get('host')}/apps/${req.params.id}`;
      const now = new Date().toISOString();

      try {
        this.publishProject.run(1, publishedUrl, now, req.params.id);

        res.json({
          status: 'published',
          url: publishedUrl
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'publish_failed',
            message: 'Failed to publish project'
          }
        });
      }
    });
  }

  async buildProject(project, deploymentId) {
    try {
      const config = JSON.parse(project.config);
      const components = JSON.parse(project.components);
      const styles = JSON.parse(project.styles);
      const scripts = JSON.parse(project.scripts);

      // Generate HTML
      const html = this.generateHTML(config, components);
      
      // Generate CSS
      const css = this.generateCSS(styles, components);
      
      // Generate JavaScript
      const js = this.generateJS(scripts, components);

      // Create build directory
      const buildDir = path.join(this.config.outputDir, project.id);
      fs.mkdirSync(buildDir, { recursive: true });

      // Write files
      fs.writeFileSync(path.join(buildDir, 'index.html'), html);
      fs.writeFileSync(path.join(buildDir, 'styles.css'), css);
      fs.writeFileSync(path.join(buildDir, 'script.js'), js);

      // Update deployment status
      this.db.prepare(`
        UPDATE app_deployments 
        SET status = ?, deployedUrl = ?, deployedAt = ?, buildLog = ?
        WHERE id = ?
      `).run('deployed', `/apps/${project.id}`, new Date().toISOString(), 'Build completed successfully', deploymentId);

    } catch (error) {
      console.error('Build failed:', error);
      
      // Update deployment status
      this.db.prepare(`
        UPDATE app_deployments 
        SET status = ?, buildLog = ?
        WHERE id = ?
      `).run('failed', `Build failed: ${error.message}`, deploymentId);
    }
  }

  generateHTML(config, components) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title || 'My App'}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">`;

    for (const component of components) {
      html += this.renderComponent(component);
    }

    html += `
    </div>
    <script src="script.js"></script>
</body>
</html>`;

    return html;
  }

  renderComponent(component) {
    const { type, props } = component;
    
    switch (type) {
      case 'button':
        return `<button class="btn btn-${props.variant || 'primary'}" onclick="${props.onClick || ''}">${props.text || 'Click me'}</button>`;
      
      case 'input':
        return `<input type="${props.type || 'text'}" placeholder="${props.placeholder || ''}" value="${props.value || ''}" class="input" ${props.required ? 'required' : ''} ${props.disabled ? 'disabled' : ''}>`;
      
      case 'card':
        return `<div class="card card-${props.variant || 'default'}">
          <h3>${props.title || 'Card Title'}</h3>
          <p>${props.content || 'Card content'}</p>
        </div>`;
      
      case 'header':
        return `<header class="header header-${props.variant || 'simple'}">
          <h1>${props.title || 'My App'}</h1>
          ${props.subtitle ? `<p>${props.subtitle}</p>` : ''}
          ${props.showNav ? `<nav><ul>${(props.navItems || []).map(item => `<li><a href="#${item.toLowerCase()}">${item}</a></li>`).join('')}</ul></nav>` : ''}
        </header>`;
      
      case 'hero':
        return `<section class="hero">
          <h1>${props.title || 'Hero Title'}</h1>
          <p>${props.subtitle || 'Hero subtitle'}</p>
          ${props.buttonText ? `<button class="btn btn-primary">${props.buttonText}</button>` : ''}
        </section>`;
      
      default:
        return `<div class="component-${type}">${props.content || ''}</div>`;
    }
  }

  generateCSS(styles, components) {
    let css = `
/* Generated CSS */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  min-height: 100vh;
}

/* Button styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: ${styles.primaryColor || '#3b82f6'};
  color: white;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid ${styles.primaryColor || '#3b82f6'};
  color: ${styles.primaryColor || '#3b82f6'};
}

/* Input styles */
.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: ${styles.primaryColor || '#3b82f6'};
}

/* Card styles */
.card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.card-default {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-elevated {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card-outlined {
  border: 1px solid #e5e7eb;
}

/* Header styles */
.header {
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-hero {
  padding: 4rem 2rem;
  background-color: #f8fafc;
  text-align: center;
}

.header nav ul {
  list-style: none;
  display: flex;
  gap: 2rem;
}

.header nav a {
  text-decoration: none;
  color: #333;
}

/* Hero styles */
.hero {
  padding: 4rem 2rem;
  text-align: center;
  background-color: #f8fafc;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
}
`;

    return css;
  }

  generateJS(scripts, components) {
    let js = `
// Generated JavaScript
console.log('App loaded');

// Component event handlers
`;

    for (const component of components) {
      if (component.props.onClick) {
        js += `
// ${component.type} click handler
function handle${component.type}Click() {
  ${component.props.onClick}
}
`;
      }
    }

    return js;
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

export default AppBuilder;