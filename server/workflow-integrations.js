import { nanoid } from 'nanoid';

class WorkflowIntegrations {
  constructor() {
    this.integrations = this.setupIntegrations();
  }

  setupIntegrations() {
    return {
      // Communication & Collaboration
      slack: {
        name: 'Slack',
        icon: '💬',
        category: 'Communication',
        triggers: ['message_received', 'channel_created', 'member_joined'],
        actions: ['send_message', 'create_channel', 'invite_user'],
        auth: { type: 'oauth2', scopes: ['chat:write', 'channels:read'] }
      },
      discord: {
        name: 'Discord',
        icon: '🎮',
        category: 'Communication',
        triggers: ['message_received', 'member_joined', 'reaction_added'],
        actions: ['send_message', 'create_channel', 'add_role'],
        auth: { type: 'bot_token' }
      },
      teams: {
        name: 'Microsoft Teams',
        icon: '👥',
        category: 'Communication',
        triggers: ['message_received', 'meeting_started', 'file_shared'],
        actions: ['send_message', 'create_meeting', 'share_file'],
        auth: { type: 'oauth2' }
      },

      // Email & Marketing
      gmail: {
        name: 'Gmail',
        icon: '📧',
        category: 'Email',
        triggers: ['email_received', 'email_sent', 'label_added'],
        actions: ['send_email', 'create_draft', 'add_label'],
        auth: { type: 'oauth2', scopes: ['https://www.googleapis.com/auth/gmail.modify'] }
      },
      outlook: {
        name: 'Outlook',
        icon: '📨',
        category: 'Email',
        triggers: ['email_received', 'calendar_event', 'contact_updated'],
        actions: ['send_email', 'create_event', 'create_contact'],
        auth: { type: 'oauth2' }
      },
      mailchimp: {
        name: 'Mailchimp',
        icon: '📢',
        category: 'Marketing',
        triggers: ['subscriber_added', 'campaign_sent', 'email_opened'],
        actions: ['add_subscriber', 'send_campaign', 'create_segment'],
        auth: { type: 'api_key' }
      },
      sendgrid: {
        name: 'SendGrid',
        icon: '📤',
        category: 'Email',
        triggers: ['email_delivered', 'email_opened', 'email_clicked'],
        actions: ['send_email', 'create_template', 'add_contact'],
        auth: { type: 'api_key' }
      },

      // CRM & Sales
      salesforce: {
        name: 'Salesforce',
        icon: '☁️',
        category: 'CRM',
        triggers: ['lead_created', 'opportunity_won', 'contact_updated'],
        actions: ['create_lead', 'update_opportunity', 'create_contact'],
        auth: { type: 'oauth2' }
      },
      hubspot: {
        name: 'HubSpot',
        icon: '🟠',
        category: 'CRM',
        triggers: ['contact_created', 'deal_won', 'email_opened'],
        actions: ['create_contact', 'create_deal', 'send_email'],
        auth: { type: 'oauth2' }
      },
      pipedrive: {
        name: 'Pipedrive',
        icon: '📊',
        category: 'CRM',
        triggers: ['deal_won', 'person_added', 'activity_logged'],
        actions: ['create_deal', 'add_person', 'log_activity'],
        auth: { type: 'api_key' }
      },

      // Social Media
      twitter: {
        name: 'Twitter',
        icon: '🐦',
        category: 'Social',
        triggers: ['tweet_posted', 'mention_received', 'follow_received'],
        actions: ['post_tweet', 'send_dm', 'follow_user'],
        auth: { type: 'oauth2' }
      },
      linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        category: 'Social',
        triggers: ['post_published', 'connection_request', 'message_received'],
        actions: ['publish_post', 'send_message', 'connect_user'],
        auth: { type: 'oauth2' }
      },
      facebook: {
        name: 'Facebook',
        icon: '📘',
        category: 'Social',
        triggers: ['post_published', 'comment_received', 'page_liked'],
        actions: ['publish_post', 'reply_comment', 'send_message'],
        auth: { type: 'oauth2' }
      },
      instagram: {
        name: 'Instagram',
        icon: '📷',
        category: 'Social',
        triggers: ['post_published', 'comment_received', 'story_posted'],
        actions: ['publish_post', 'reply_comment', 'send_dm'],
        auth: { type: 'oauth2' }
      },

      // File Storage & Cloud
      dropbox: {
        name: 'Dropbox',
        icon: '📁',
        category: 'Storage',
        triggers: ['file_created', 'file_modified', 'folder_shared'],
        actions: ['upload_file', 'create_folder', 'share_file'],
        auth: { type: 'oauth2' }
      },
      google_drive: {
        name: 'Google Drive',
        icon: '📂',
        category: 'Storage',
        triggers: ['file_created', 'file_modified', 'permission_changed'],
        actions: ['upload_file', 'create_folder', 'share_file'],
        auth: { type: 'oauth2' }
      },
      onedrive: {
        name: 'OneDrive',
        icon: '☁️',
        category: 'Storage',
        triggers: ['file_created', 'file_modified', 'folder_shared'],
        actions: ['upload_file', 'create_folder', 'share_file'],
        auth: { type: 'oauth2' }
      },

      // Project Management
      trello: {
        name: 'Trello',
        icon: '📋',
        category: 'Project Management',
        triggers: ['card_created', 'card_moved', 'list_created'],
        actions: ['create_card', 'move_card', 'create_list'],
        auth: { type: 'oauth2' }
      },
      asana: {
        name: 'Asana',
        icon: '✅',
        category: 'Project Management',
        triggers: ['task_created', 'task_completed', 'project_created'],
        actions: ['create_task', 'update_task', 'create_project'],
        auth: { type: 'oauth2' }
      },
      jira: {
        name: 'Jira',
        icon: '🐛',
        category: 'Project Management',
        triggers: ['issue_created', 'issue_updated', 'sprint_started'],
        actions: ['create_issue', 'update_issue', 'create_sprint'],
        auth: { type: 'oauth2' }
      },
      notion: {
        name: 'Notion',
        icon: '📝',
        category: 'Productivity',
        triggers: ['page_created', 'database_updated', 'comment_added'],
        actions: ['create_page', 'update_database', 'add_comment'],
        auth: { type: 'oauth2' }
      },

      // E-commerce
      shopify: {
        name: 'Shopify',
        icon: '🛒',
        category: 'E-commerce',
        triggers: ['order_created', 'product_updated', 'customer_created'],
        actions: ['create_order', 'update_product', 'create_customer'],
        auth: { type: 'oauth2' }
      },
      woocommerce: {
        name: 'WooCommerce',
        icon: '🛍️',
        category: 'E-commerce',
        triggers: ['order_created', 'product_updated', 'customer_created'],
        actions: ['create_order', 'update_product', 'create_customer'],
        auth: { type: 'api_key' }
      },
      stripe: {
        name: 'Stripe',
        icon: '💳',
        category: 'Payments',
        triggers: ['payment_succeeded', 'payment_failed', 'subscription_created'],
        actions: ['create_payment', 'refund_payment', 'create_subscription'],
        auth: { type: 'api_key' }
      },
      paypal: {
        name: 'PayPal',
        icon: '💰',
        category: 'Payments',
        triggers: ['payment_received', 'refund_processed', 'subscription_created'],
        actions: ['create_payment', 'process_refund', 'create_subscription'],
        auth: { type: 'oauth2' }
      },

      // Development & Code
      github: {
        name: 'GitHub',
        icon: '🐙',
        category: 'Development',
        triggers: ['push_received', 'pull_request_created', 'issue_created'],
        actions: ['create_repository', 'create_issue', 'create_branch'],
        auth: { type: 'oauth2' }
      },
      gitlab: {
        name: 'GitLab',
        icon: '🦊',
        category: 'Development',
        triggers: ['push_received', 'merge_request_created', 'issue_created'],
        actions: ['create_project', 'create_issue', 'create_branch'],
        auth: { type: 'oauth2' }
      },
      bitbucket: {
        name: 'Bitbucket',
        icon: '🔵',
        category: 'Development',
        triggers: ['push_received', 'pull_request_created', 'issue_created'],
        actions: ['create_repository', 'create_issue', 'create_branch'],
        auth: { type: 'oauth2' }
      },

      // Analytics & Monitoring
      google_analytics: {
        name: 'Google Analytics',
        icon: '📊',
        category: 'Analytics',
        triggers: ['goal_completed', 'event_tracked', 'page_view'],
        actions: ['track_event', 'create_goal', 'export_data'],
        auth: { type: 'oauth2' }
      },
      mixpanel: {
        name: 'Mixpanel',
        icon: '📈',
        category: 'Analytics',
        triggers: ['event_tracked', 'funnel_completed', 'user_created'],
        actions: ['track_event', 'create_funnel', 'export_data'],
        auth: { type: 'api_key' }
      },
      amplitude: {
        name: 'Amplitude',
        icon: '📊',
        category: 'Analytics',
        triggers: ['event_tracked', 'cohort_created', 'user_identified'],
        actions: ['track_event', 'create_cohort', 'export_data'],
        auth: { type: 'api_key' }
      },

      // Customer Support
      zendesk: {
        name: 'Zendesk',
        icon: '🎫',
        category: 'Support',
        triggers: ['ticket_created', 'ticket_updated', 'comment_added'],
        actions: ['create_ticket', 'update_ticket', 'add_comment'],
        auth: { type: 'oauth2' }
      },
      intercom: {
        name: 'Intercom',
        icon: '💬',
        category: 'Support',
        triggers: ['conversation_started', 'message_received', 'user_created'],
        actions: ['send_message', 'create_user', 'create_conversation'],
        auth: { type: 'oauth2' }
      },
      freshdesk: {
        name: 'Freshdesk',
        icon: '🎫',
        category: 'Support',
        triggers: ['ticket_created', 'ticket_updated', 'reply_added'],
        actions: ['create_ticket', 'update_ticket', 'add_reply'],
        auth: { type: 'api_key' }
      },

      // Calendar & Scheduling
      google_calendar: {
        name: 'Google Calendar',
        icon: '📅',
        category: 'Calendar',
        triggers: ['event_created', 'event_updated', 'reminder_sent'],
        actions: ['create_event', 'update_event', 'send_invitation'],
        auth: { type: 'oauth2' }
      },
      outlook_calendar: {
        name: 'Outlook Calendar',
        icon: '📅',
        category: 'Calendar',
        triggers: ['event_created', 'event_updated', 'meeting_scheduled'],
        actions: ['create_event', 'update_event', 'schedule_meeting'],
        auth: { type: 'oauth2' }
      },
      calendly: {
        name: 'Calendly',
        icon: '📅',
        category: 'Scheduling',
        triggers: ['booking_created', 'event_scheduled', 'invitee_responded'],
        actions: ['create_booking', 'schedule_event', 'send_invitation'],
        auth: { type: 'oauth2' }
      },

      // Forms & Surveys
      typeform: {
        name: 'Typeform',
        icon: '📝',
        category: 'Forms',
        triggers: ['response_received', 'form_completed', 'survey_submitted'],
        actions: ['create_form', 'send_form', 'export_responses'],
        auth: { type: 'oauth2' }
      },
      google_forms: {
        name: 'Google Forms',
        icon: '📋',
        category: 'Forms',
        triggers: ['response_received', 'form_created', 'survey_submitted'],
        actions: ['create_form', 'send_form', 'export_responses'],
        auth: { type: 'oauth2' }
      },
      survey_monkey: {
        name: 'SurveyMonkey',
        icon: '📊',
        category: 'Forms',
        triggers: ['response_received', 'survey_completed', 'collector_created'],
        actions: ['create_survey', 'send_survey', 'export_responses'],
        auth: { type: 'oauth2' }
      },

      // Database & Storage
      airtable: {
        name: 'Airtable',
        icon: '📊',
        category: 'Database',
        triggers: ['record_created', 'record_updated', 'field_changed'],
        actions: ['create_record', 'update_record', 'create_base'],
        auth: { type: 'api_key' }
      },
      mongo_db: {
        name: 'MongoDB',
        icon: '🍃',
        category: 'Database',
        triggers: ['document_created', 'document_updated', 'collection_changed'],
        actions: ['insert_document', 'update_document', 'create_collection'],
        auth: { type: 'connection_string' }
      },
      postgresql: {
        name: 'PostgreSQL',
        icon: '🐘',
        category: 'Database',
        triggers: ['row_inserted', 'row_updated', 'table_created'],
        actions: ['insert_row', 'update_row', 'create_table'],
        auth: { type: 'connection_string' }
      },

      // AI & Machine Learning
      openai: {
        name: 'OpenAI',
        icon: '🤖',
        category: 'AI',
        triggers: ['completion_generated', 'image_created', 'embedding_created'],
        actions: ['generate_text', 'create_image', 'create_embedding'],
        auth: { type: 'api_key' }
      },
      anthropic: {
        name: 'Anthropic',
        icon: '🤖',
        category: 'AI',
        triggers: ['completion_generated', 'message_sent', 'conversation_created'],
        actions: ['generate_text', 'send_message', 'create_conversation'],
        auth: { type: 'api_key' }
      },
      huggingface: {
        name: 'Hugging Face',
        icon: '🤗',
        category: 'AI',
        triggers: ['model_inference', 'dataset_created', 'model_deployed'],
        actions: ['run_inference', 'create_dataset', 'deploy_model'],
        auth: { type: 'api_key' }
      },

      // Communication APIs
      twilio: {
        name: 'Twilio',
        icon: '📞',
        category: 'Communication',
        triggers: ['sms_received', 'call_received', 'webhook_received'],
        actions: ['send_sms', 'make_call', 'send_whatsapp'],
        auth: { type: 'api_key' }
      },
      sendgrid: {
        name: 'SendGrid',
        icon: '📤',
        category: 'Email',
        triggers: ['email_delivered', 'email_opened', 'email_clicked'],
        actions: ['send_email', 'create_template', 'add_contact'],
        auth: { type: 'api_key' }
      },

      // Weather & Location
      openweather: {
        name: 'OpenWeather',
        icon: '🌤️',
        category: 'Weather',
        triggers: ['weather_alert', 'forecast_updated', 'location_changed'],
        actions: ['get_weather', 'get_forecast', 'get_air_quality'],
        auth: { type: 'api_key' }
      },
      google_maps: {
        name: 'Google Maps',
        icon: '🗺️',
        category: 'Location',
        triggers: ['location_updated', 'route_calculated', 'place_found'],
        actions: ['get_directions', 'find_places', 'geocode_address'],
        auth: { type: 'api_key' }
      }
    };
  }

  // Get all integrations grouped by category
  getIntegrationsByCategory() {
    const categories = {};
    
    Object.entries(this.integrations).forEach(([key, integration]) => {
      if (!categories[integration.category]) {
        categories[integration.category] = [];
      }
      categories[integration.category].push({
        key,
        ...integration
      });
    });

    return categories;
  }

  // Get integration by key
  getIntegration(key) {
    return this.integrations[key];
  }

  // Get integrations by category
  getIntegrationsByCategory(category) {
    return Object.entries(this.integrations)
      .filter(([key, integration]) => integration.category === category)
      .map(([key, integration]) => ({ key, ...integration }));
  }

  // Search integrations
  searchIntegrations(query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    Object.entries(this.integrations).forEach(([key, integration]) => {
      if (
        integration.name.toLowerCase().includes(searchTerm) ||
        integration.category.toLowerCase().includes(searchTerm) ||
        integration.triggers.some(t => t.toLowerCase().includes(searchTerm)) ||
        integration.actions.some(a => a.toLowerCase().includes(searchTerm))
      ) {
        results.push({ key, ...integration });
      }
    });

    return results;
  }

  // Get popular integrations (most commonly used)
  getPopularIntegrations(limit = 10) {
    const popular = [
      'gmail', 'slack', 'salesforce', 'github', 'stripe',
      'google_drive', 'trello', 'zendesk', 'shopify', 'mailchimp'
    ];

    return popular.slice(0, limit).map(key => ({
      key,
      ...this.integrations[key]
    }));
  }

  // Get recently added integrations
  getRecentIntegrations(limit = 5) {
    const recent = [
      'openai', 'anthropic', 'huggingface', 'notion', 'calendly'
    ];

    return recent.slice(0, limit).map(key => ({
      key,
      ...this.integrations[key]
    }));
  }

  // Get integration authentication info
  getAuthInfo(integrationKey) {
    const integration = this.integrations[integrationKey];
    if (!integration) return null;

    return {
      type: integration.auth.type,
      scopes: integration.auth.scopes || [],
      instructions: this.getAuthInstructions(integration.auth.type)
    };
  }

  // Get authentication instructions
  getAuthInstructions(authType) {
    const instructions = {
      oauth2: 'Click to authorize with OAuth 2.0. You\'ll be redirected to the service to grant permissions.',
      api_key: 'Enter your API key from the service dashboard. Keep it secure and never share it.',
      bot_token: 'Enter your bot token from the service developer portal.',
      connection_string: 'Enter your database connection string. Format: protocol://username:password@host:port/database'
    };

    return instructions[authType] || 'Authentication method not specified.';
  }

  // Get integration triggers
  getTriggers(integrationKey) {
    const integration = this.integrations[integrationKey];
    return integration ? integration.triggers : [];
  }

  // Get integration actions
  getActions(integrationKey) {
    const integration = this.integrations[integrationKey];
    return integration ? integration.actions : [];
  }

  // Validate integration configuration
  validateConfig(integrationKey, config) {
    const integration = this.integrations[integrationKey];
    if (!integration) return { valid: false, error: 'Integration not found' };

    // Basic validation based on auth type
    switch (integration.auth.type) {
      case 'oauth2':
        return { valid: true }; // OAuth handled separately
      case 'api_key':
        return { 
          valid: config.apiKey && config.apiKey.length > 0,
          error: config.apiKey ? null : 'API key is required'
        };
      case 'bot_token':
        return {
          valid: config.botToken && config.botToken.length > 0,
          error: config.botToken ? null : 'Bot token is required'
        };
      case 'connection_string':
        return {
          valid: config.connectionString && config.connectionString.includes('://'),
          error: config.connectionString ? null : 'Valid connection string is required'
        };
      default:
        return { valid: false, error: 'Unknown authentication type' };
    }
  }
}

export default WorkflowIntegrations;