// Demo data for Zilliance Enterprise Platform
export const demoData = {
  // Platform Statistics
  platformStats: {
    activeWorkflows: 47,
    videoContent: 156,
    apiCollections: 23,
    tutorials: 89,
    activeUsers: 1247,
    revenue: 2300000, // $2.3M ARR
    uptime: 99.9,
    responseTime: 245 // ms
  },

  // Workflow Examples
  workflows: [
    {
      id: 'wf_001',
      name: 'Customer Onboarding Automation',
      description: 'Automated customer onboarding process with CRM integration',
      status: 'active',
      executions: 1247,
      lastExecuted: '2024-01-15T10:30:00Z',
      trigger: 'New customer signup',
      actions: [
        'Send welcome email',
        'Create CRM record',
        'Assign account manager',
        'Schedule onboarding call'
      ],
      conditions: [
        'If customer type = enterprise',
        'If signup source = website'
      ]
    },
    {
      id: 'wf_002',
      name: 'Invoice Processing Workflow',
      description: 'AI-powered invoice processing and approval system',
      status: 'active',
      executions: 892,
      lastExecuted: '2024-01-15T09:15:00Z',
      trigger: 'Invoice received via email',
      actions: [
        'Extract invoice data using AI',
        'Validate against purchase orders',
        'Route for approval',
        'Send payment reminders'
      ],
      conditions: [
        'If invoice amount > $1000',
        'If vendor not in approved list'
      ]
    },
    {
      id: 'wf_003',
      name: 'Social Media Campaign',
      description: 'Automated social media posting and analytics',
      status: 'active',
      executions: 156,
      lastExecuted: '2024-01-15T08:45:00Z',
      trigger: 'New blog post published',
      actions: [
        'Post to LinkedIn',
        'Share on Twitter',
        'Send newsletter',
        'Update analytics dashboard'
      ],
      conditions: [
        'If post category = product',
        'If post engagement > threshold'
      ]
    },
    {
      id: 'wf_004',
      name: 'E-commerce Order Processing',
      description: 'Complete order fulfillment automation',
      status: 'draft',
      executions: 0,
      lastExecuted: null,
      trigger: 'New order received',
      actions: [
        'Send order confirmation email',
        'Update inventory system',
        'Create shipping label',
        'Notify warehouse',
        'Update customer dashboard'
      ],
      conditions: [
        'If order value > $500',
        'If customer is VIP'
      ]
    }
  ],

  // Video Content Examples
  videos: [
    {
      id: 'vid_001',
      title: 'Zilliance Platform Overview',
      description: 'Complete overview of the Zilliance enterprise platform',
      duration: '8:32',
      views: 2847,
      engagement: 87,
      status: 'published',
      category: 'product',
      revenue: 0,
      uploadDate: '2024-01-10T14:30:00Z',
      thumbnail: '/assets/video-thumbnails/platform-overview.jpg'
    },
    {
      id: 'vid_002',
      title: 'Enterprise Automation Masterclass',
      description: '12-part series on advanced workflow automation',
      duration: '45:15',
      views: 15234,
      engagement: 92,
      status: 'published',
      category: 'training',
      revenue: 12450,
      uploadDate: '2024-01-05T10:00:00Z',
      thumbnail: '/assets/video-thumbnails/masterclass.jpg',
      series: {
        episodes: 12,
        totalDuration: '8:45:30'
      }
    },
    {
      id: 'vid_003',
      title: 'Q4 Product Launch',
      description: 'Live product launch event',
      duration: '1:15:30',
      views: 3247,
      engagement: 78,
      status: 'live',
      category: 'event',
      revenue: 0,
      uploadDate: '2024-01-15T15:00:00Z',
      thumbnail: '/assets/video-thumbnails/product-launch.jpg',
      liveViewers: 1247
    },
    {
      id: 'vid_004',
      title: 'API Integration Tutorial',
      description: 'Step-by-step guide to API integration',
      duration: '12:45',
      views: 1892,
      engagement: 85,
      status: 'published',
      category: 'tutorial',
      revenue: 0,
      uploadDate: '2024-01-12T11:30:00Z',
      thumbnail: '/assets/video-thumbnails/api-tutorial.jpg'
    }
  ],

  // API Collections Examples
  apiCollections: [
    {
      id: 'api_001',
      name: 'E-commerce API',
      description: 'Complete e-commerce API with order management',
      endpoints: 23,
      status: 'active',
      usage: 45231,
      performance: 99.9,
      lastUpdated: '2024-01-15T12:00:00Z',
      environment: 'production',
      authentication: 'OAuth2',
      rateLimit: '1000/hour'
    },
    {
      id: 'api_002',
      name: 'CRM Integration',
      description: 'Customer relationship management API',
      endpoints: 18,
      status: 'active',
      usage: 23456,
      performance: 99.8,
      lastUpdated: '2024-01-14T16:30:00Z',
      environment: 'production',
      authentication: 'API Key',
      rateLimit: '500/hour'
    },
    {
      id: 'api_003',
      name: 'Analytics API',
      description: 'Real-time analytics and reporting API',
      endpoints: 15,
      status: 'active',
      usage: 67890,
      performance: 99.7,
      lastUpdated: '2024-01-15T09:15:00Z',
      environment: 'production',
      authentication: 'JWT',
      rateLimit: '2000/hour'
    },
    {
      id: 'api_004',
      name: 'Payment Gateway',
      description: 'Secure payment processing API',
      endpoints: 12,
      status: 'testing',
      usage: 0,
      performance: 0,
      lastUpdated: '2024-01-15T14:00:00Z',
      environment: 'staging',
      authentication: 'OAuth2',
      rateLimit: '5000/hour'
    }
  ],

  // Tutorial Examples
  tutorials: [
    {
      id: 'tut_001',
      title: 'Getting Started with Zilliance',
      description: 'Complete beginner guide to the Zilliance platform',
      students: 2847,
      completionRate: 78,
      rating: 4.8,
      revenue: 15230,
      status: 'published',
      modules: 6,
      duration: '4:30:00',
      category: 'beginner',
      price: 99,
      currency: 'USD'
    },
    {
      id: 'tut_002',
      title: 'Advanced Workflow Automation',
      description: 'Master advanced automation techniques',
      students: 1234,
      completionRate: 85,
      rating: 4.9,
      revenue: 28450,
      status: 'published',
      modules: 8,
      duration: '6:15:00',
      category: 'advanced',
      price: 199,
      currency: 'USD',
      certification: true
    },
    {
      id: 'tut_003',
      title: 'API Development Masterclass',
      description: 'Complete API development and testing course',
      students: 892,
      completionRate: 72,
      rating: 4.7,
      revenue: 18750,
      status: 'published',
      modules: 10,
      duration: '8:45:00',
      category: 'technical',
      price: 299,
      currency: 'USD',
      certification: true
    },
    {
      id: 'tut_004',
      title: 'Video Content Strategy',
      description: 'Creating engaging video content for business',
      students: 567,
      completionRate: 68,
      rating: 4.6,
      revenue: 8900,
      status: 'draft',
      modules: 5,
      duration: '3:20:00',
      category: 'marketing',
      price: 149,
      currency: 'USD'
    }
  ],

  // SMS Statistics
  smsStats: {
    messagesSent: 15234,
    deliveryRate: 99.2,
    verificationCodes: 8456,
    bulkCampaigns: 12,
    averageResponseTime: 2.3,
    totalRevenue: 4560
  },

  // User Analytics
  userAnalytics: {
    totalUsers: 1247,
    activeUsers: 892,
    newUsers: 45,
    churnRate: 2.3,
    averageSession: 28,
    featureAdoption: {
      workflows: 78,
      videos: 65,
      api: 45,
      tutorials: 82
    }
  },

  // Revenue Analytics
  revenueAnalytics: {
    currentARR: 2300000,
    monthlyGrowth: 15.4,
    customerLTV: 8500,
    churnRate: 2.3,
    expansionRevenue: 320000,
    newRevenue: 180000,
    byModule: {
      workflows: 850000,
      videos: 420000,
      api: 380000,
      tutorials: 650000
    }
  },

  // Performance Metrics
  performanceMetrics: {
    uptime: 99.9,
    averageResponseTime: 245,
    errorRate: 0.1,
    throughput: 15000,
    concurrentUsers: 450,
    dataTransfer: 2.5 // TB/day
  },

  // Security & Compliance
  securityMetrics: {
    ssoEnabled: true,
    mfaEnabled: true,
    auditLogging: true,
    dataEncryption: true,
    compliance: ['SOC2', 'GDPR', 'HIPAA'],
    securityScore: 95,
    lastAudit: '2024-01-01T00:00:00Z'
  }
};

// Demo API responses
export const demoApiResponses = {
  // Customer data example
  customer: {
    id: 'cust_123',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-123-4567',
    status: 'active',
    plan: 'enterprise',
    monthlySpend: 2500,
    joinedDate: '2023-06-15T00:00:00Z',
    lastActivity: '2024-01-15T14:30:00Z',
    features: ['workflows', 'videos', 'api', 'tutorials'],
    teamSize: 45
  },

  // Workflow execution example
  workflowExecution: {
    id: 'exec_456',
    workflowId: 'wf_001',
    status: 'completed',
    startTime: '2024-01-15T14:30:00Z',
    endTime: '2024-01-15T14:30:15Z',
    duration: 15,
    steps: [
      {
        name: 'Send welcome email',
        status: 'completed',
        duration: 3
      },
      {
        name: 'Create CRM record',
        status: 'completed',
        duration: 5
      },
      {
        name: 'Assign account manager',
        status: 'completed',
        duration: 2
      },
      {
        name: 'Schedule onboarding call',
        status: 'completed',
        duration: 5
      }
    ]
  },

  // SMS verification example
  smsVerification: {
    phoneNumber: '+1-555-123-4567',
    code: '123456',
    expiresAt: '2024-01-15T15:00:00Z',
    attempts: 0,
    verified: false
  }
};

// Demo notifications
export const demoNotifications = [
  {
    id: 'notif_001',
    type: 'success',
    title: 'Workflow Executed Successfully',
    message: 'Customer onboarding workflow completed for Acme Corp',
    timestamp: '2024-01-15T14:30:15Z',
    read: false
  },
  {
    id: 'notif_002',
    type: 'info',
    title: 'New Video Uploaded',
    message: 'Product demo video has been processed and is ready for review',
    timestamp: '2024-01-15T13:45:00Z',
    read: true
  },
  {
    id: 'notif_003',
    type: 'warning',
    title: 'API Rate Limit Approaching',
    message: 'E-commerce API is at 85% of rate limit',
    timestamp: '2024-01-15T12:30:00Z',
    read: false
  },
  {
    id: 'notif_004',
    type: 'success',
    title: 'Tutorial Published',
    message: 'Advanced Workflow Automation tutorial is now live',
    timestamp: '2024-01-15T11:15:00Z',
    read: true
  }
];

export default demoData;