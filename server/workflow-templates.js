import { nanoid } from 'nanoid';

class WorkflowTemplates {
  constructor() {
    this.templates = this.setupTemplates();
  }

  setupTemplates() {
    return {
      // Lead Management Templates
      'lead-to-customer': {
        id: 'lead-to-customer',
        name: 'Lead to Customer Conversion',
        description: 'Automatically nurture leads and convert them to customers',
        category: 'Sales & Marketing',
        difficulty: 'Beginner',
        estimatedTime: '15 minutes',
        tags: ['sales', 'lead-generation', 'automation'],
        icon: '🎯',
        popularity: 95,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Lead Created',
            config: {
              integration: 'hubspot',
              trigger: 'contact_created',
              conditions: {
                leadScore: { operator: 'gte', value: 50 }
              }
            }
          },
          {
            id: 'email',
            type: 'action',
            name: 'Send Welcome Email',
            config: {
              integration: 'mailchimp',
              action: 'send_email',
              template: 'welcome-series-1',
              delay: 0
            }
          },
          {
            id: 'slack',
            type: 'action',
            name: 'Notify Sales Team',
            config: {
              integration: 'slack',
              action: 'send_message',
              channel: '#sales-leads',
              message: 'New high-value lead: {{contact.name}} (Score: {{contact.leadScore}})'
            }
          },
          {
            id: 'calendar',
            type: 'action',
            name: 'Schedule Follow-up',
            config: {
              integration: 'google_calendar',
              action: 'create_event',
              title: 'Follow up with {{contact.name}}',
              description: 'High-value lead from {{contact.source}}',
              startTime: '{{addDays(now, 2)}}',
              duration: 30
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'email' },
          { from: 'trigger', to: 'slack' },
          { from: 'trigger', to: 'calendar' }
        ]
      },

      // Customer Support Templates
      'support-ticket-escalation': {
        id: 'support-ticket-escalation',
        name: 'Support Ticket Escalation',
        description: 'Automatically escalate urgent support tickets',
        category: 'Customer Support',
        difficulty: 'Intermediate',
        estimatedTime: '20 minutes',
        tags: ['support', 'escalation', 'automation'],
        icon: '🚨',
        popularity: 88,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Support Ticket',
            config: {
              integration: 'zendesk',
              trigger: 'ticket_created'
            }
          },
          {
            id: 'priority-check',
            type: 'condition',
            name: 'Check Priority',
            config: {
              conditions: [
                { field: 'priority', operator: 'eq', value: 'urgent' },
                { field: 'tags', operator: 'contains', value: 'escalate' }
              ]
            }
          },
          {
            id: 'escalate',
            type: 'action',
            name: 'Escalate to Manager',
            config: {
              integration: 'zendesk',
              action: 'update_ticket',
              assignee: 'manager@company.com',
              priority: 'urgent',
              tags: ['escalated', 'auto-escalated']
            }
          },
          {
            id: 'notify-manager',
            type: 'action',
            name: 'Notify Manager',
            config: {
              integration: 'slack',
              action: 'send_message',
              channel: '#support-escalations',
              message: '🚨 URGENT: Ticket #{{ticket.id}} escalated automatically'
            }
          },
          {
            id: 'customer-update',
            type: 'action',
            name: 'Update Customer',
            config: {
              integration: 'zendesk',
              action: 'add_comment',
              message: 'Your ticket has been escalated to our senior support team. We\'ll get back to you within 2 hours.'
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'priority-check' },
          { from: 'priority-check', to: 'escalate', condition: true },
          { from: 'escalate', to: 'notify-manager' },
          { from: 'escalate', to: 'customer-update' }
        ]
      },

      // E-commerce Templates
      'order-fulfillment': {
        id: 'order-fulfillment',
        name: 'Order Fulfillment Automation',
        description: 'Automate order processing and fulfillment',
        category: 'E-commerce',
        difficulty: 'Intermediate',
        estimatedTime: '25 minutes',
        tags: ['ecommerce', 'fulfillment', 'orders'],
        icon: '📦',
        popularity: 92,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Order',
            config: {
              integration: 'shopify',
              trigger: 'order_created'
            }
          },
          {
            id: 'inventory-check',
            type: 'condition',
            name: 'Check Inventory',
            config: {
              conditions: [
                { field: 'inventory_quantity', operator: 'gt', value: 0 }
              ]
            }
          },
          {
            id: 'process-order',
            type: 'action',
            name: 'Process Order',
            config: {
              integration: 'shopify',
              action: 'update_order',
              status: 'processing',
              tags: ['auto-processed']
            }
          },
          {
            id: 'notify-warehouse',
            type: 'action',
            name: 'Notify Warehouse',
            config: {
              integration: 'slack',
              action: 'send_message',
              channel: '#warehouse',
              message: '📦 New order ready for fulfillment: #{{order.number}}'
            }
          },
          {
            id: 'customer-email',
            type: 'action',
            name: 'Send Confirmation',
            config: {
              integration: 'mailchimp',
              action: 'send_email',
              template: 'order-confirmation',
              to: '{{customer.email}}'
            }
          },
          {
            id: 'out-of-stock',
            type: 'action',
            name: 'Handle Out of Stock',
            config: {
              integration: 'shopify',
              action: 'update_order',
              status: 'cancelled',
              tags: ['out-of-stock', 'auto-cancelled']
            }
          },
          {
            id: 'notify-customer',
            type: 'action',
            name: 'Notify Customer',
            config: {
              integration: 'mailchimp',
              action: 'send_email',
              template: 'out-of-stock-notification',
              to: '{{customer.email}}'
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'inventory-check' },
          { from: 'inventory-check', to: 'process-order', condition: true },
          { from: 'process-order', to: 'notify-warehouse' },
          { from: 'process-order', to: 'customer-email' },
          { from: 'inventory-check', to: 'out-of-stock', condition: false },
          { from: 'out-of-stock', to: 'notify-customer' }
        ]
      },

      // Social Media Templates
      'social-media-automation': {
        id: 'social-media-automation',
        name: 'Social Media Automation',
        description: 'Automatically post and engage across social platforms',
        category: 'Social Media',
        difficulty: 'Beginner',
        estimatedTime: '15 minutes',
        tags: ['social-media', 'automation', 'marketing'],
        icon: '📱',
        popularity: 85,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Blog Post',
            config: {
              integration: 'wordpress',
              trigger: 'post_published'
            }
          },
          {
            id: 'generate-content',
            type: 'action',
            name: 'Generate Social Content',
            config: {
              integration: 'openai',
              action: 'generate_text',
              prompt: 'Create engaging social media posts for: {{post.title}}',
              maxTokens: 150
            }
          },
          {
            id: 'post-twitter',
            type: 'action',
            name: 'Post to Twitter',
            config: {
              integration: 'twitter',
              action: 'post_tweet',
              content: '{{generated_content.twitter}}',
              delay: 0
            }
          },
          {
            id: 'post-linkedin',
            type: 'action',
            name: 'Post to LinkedIn',
            config: {
              integration: 'linkedin',
              action: 'publish_post',
              content: '{{generated_content.linkedin}}',
              delay: 300 // 5 minutes
            }
          },
          {
            id: 'post-facebook',
            type: 'action',
            name: 'Post to Facebook',
            config: {
              integration: 'facebook',
              action: 'publish_post',
              content: '{{generated_content.facebook}}',
              delay: 600 // 10 minutes
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'generate-content' },
          { from: 'generate-content', to: 'post-twitter' },
          { from: 'generate-content', to: 'post-linkedin' },
          { from: 'generate-content', to: 'post-facebook' }
        ]
      },

      // HR & Recruitment Templates
      'recruitment-automation': {
        id: 'recruitment-automation',
        name: 'Recruitment Automation',
        description: 'Automate the hiring process from application to onboarding',
        category: 'HR & Recruitment',
        difficulty: 'Advanced',
        estimatedTime: '30 minutes',
        tags: ['hr', 'recruitment', 'automation'],
        icon: '👥',
        popularity: 78,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Job Application',
            config: {
              integration: 'lever',
              trigger: 'application_created'
            }
          },
          {
            id: 'screening',
            type: 'condition',
            name: 'Initial Screening',
            config: {
              conditions: [
                { field: 'experience_years', operator: 'gte', value: 3 },
                { field: 'skills', operator: 'contains', value: 'required_skills' }
              ]
            }
          },
          {
            id: 'send-assessment',
            type: 'action',
            name: 'Send Assessment',
            config: {
              integration: 'mailchimp',
              action: 'send_email',
              template: 'technical-assessment',
              to: '{{candidate.email}}'
            }
          },
          {
            id: 'schedule-interview',
            type: 'action',
            name: 'Schedule Interview',
            config: {
              integration: 'calendly',
              action: 'create_booking',
              eventType: 'technical-interview',
              inviteeEmail: '{{candidate.email}}'
            }
          },
          {
            id: 'notify-team',
            type: 'action',
            name: 'Notify Hiring Team',
            config: {
              integration: 'slack',
              action: 'send_message',
              channel: '#hiring',
              message: '🎯 New qualified candidate: {{candidate.name}} for {{position.title}}'
            }
          },
          {
            id: 'rejection',
            type: 'action',
            name: 'Send Rejection',
            config: {
              integration: 'mailchimp',
              action: 'send_email',
              template: 'application-rejection',
              to: '{{candidate.email}}'
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'screening' },
          { from: 'screening', to: 'send-assessment', condition: true },
          { from: 'screening', to: 'schedule-interview', condition: true },
          { from: 'screening', to: 'notify-team', condition: true },
          { from: 'screening', to: 'rejection', condition: false }
        ]
      },

      // Data Processing Templates
      'data-sync-automation': {
        id: 'data-sync-automation',
        name: 'Data Sync Automation',
        description: 'Automatically sync data between different systems',
        category: 'Data & Analytics',
        difficulty: 'Advanced',
        estimatedTime: '35 minutes',
        tags: ['data', 'sync', 'automation'],
        icon: '🔄',
        popularity: 82,
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            name: 'New Contact in CRM',
            config: {
              integration: 'salesforce',
              trigger: 'contact_created'
            }
          },
          {
            id: 'enrich-data',
            type: 'action',
            name: 'Enrich Contact Data',
            config: {
              integration: 'openai',
              action: 'generate_text',
              prompt: 'Analyze and enrich contact data: {{contact.company}}',
              maxTokens: 100
            }
          },
          {
            id: 'update-crm',
            type: 'action',
            name: 'Update CRM',
            config: {
              integration: 'salesforce',
              action: 'update_contact',
              fields: {
                company_description: '{{enriched_data}}',
                last_enriched: '{{now}}'
              }
            }
          },
          {
            id: 'sync-email',
            type: 'action',
            name: 'Sync to Email Platform',
            config: {
              integration: 'mailchimp',
              action: 'add_contact',
              email: '{{contact.email}}',
              firstName: '{{contact.firstName}}',
              lastName: '{{contact.lastName}}',
              company: '{{contact.company}}'
            }
          },
          {
            id: 'log-sync',
            type: 'action',
            name: 'Log Sync Activity',
            config: {
              integration: 'airtable',
              action: 'create_record',
              table: 'Data Sync Logs',
              fields: {
                contact_id: '{{contact.id}}',
                sync_type: 'contact_created',
                timestamp: '{{now}}',
                status: 'success'
              }
            }
          }
        ],
        connections: [
          { from: 'trigger', to: 'enrich-data' },
          { from: 'enrich-data', to: 'update-crm' },
          { from: 'update-crm', to: 'sync-email' },
          { from: 'sync-email', to: 'log-sync' }
        ]
      }
    };
  }

  // Get all templates
  getAllTemplates() {
    return Object.values(this.templates);
  }

  // Get template by ID
  getTemplate(id) {
    return this.templates[id];
  }

  // Get templates by category
  getTemplatesByCategory(category) {
    return Object.values(this.templates).filter(template => 
      template.category === category
    );
  }

  // Search templates
  searchTemplates(query) {
    const searchTerm = query.toLowerCase();
    return Object.values(this.templates).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Get popular templates
  getPopularTemplates(limit = 10) {
    return Object.values(this.templates)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Get templates by difficulty
  getTemplatesByDifficulty(difficulty) {
    return Object.values(this.templates).filter(template =>
      template.difficulty === difficulty
    );
  }

  // Get categories
  getCategories() {
    const categories = new Set();
    Object.values(this.templates).forEach(template => {
      categories.add(template.category);
    });
    return Array.from(categories);
  }

  // Get tags
  getTags() {
    const tags = new Set();
    Object.values(this.templates).forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  // Create workflow from template
  createWorkflowFromTemplate(templateId, userId, customizations = {}) {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error('Template not found');
    }

    const workflowId = nanoid();
    const workflow = {
      id: workflowId,
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      templateId: templateId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      nodes: template.nodes.map(node => ({
        ...node,
        id: nanoid(),
        config: {
          ...node.config,
          ...customizations[node.id]
        }
      })),
      connections: template.connections.map(conn => ({
        ...conn,
        id: nanoid()
      }))
    };

    return workflow;
  }

  // Get template statistics
  getTemplateStats() {
    const stats = {
      total: Object.keys(this.templates).length,
      byCategory: {},
      byDifficulty: {},
      averagePopularity: 0
    };

    let totalPopularity = 0;

    Object.values(this.templates).forEach(template => {
      // Category stats
      if (!stats.byCategory[template.category]) {
        stats.byCategory[template.category] = 0;
      }
      stats.byCategory[template.category]++;

      // Difficulty stats
      if (!stats.byDifficulty[template.difficulty]) {
        stats.byDifficulty[template.difficulty] = 0;
      }
      stats.byDifficulty[template.difficulty]++;

      totalPopularity += template.popularity;
    });

    stats.averagePopularity = Math.round(totalPopularity / stats.total);

    return stats;
  }
}

export default WorkflowTemplates;