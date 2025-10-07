# Zilliance Backend Documentation

## Overview

The Zilliance backend is built on **Lovable Cloud** (powered by Supabase), providing a robust, production-ready infrastructure with enterprise-grade security, scalability, and performance.

## Architecture

### Technology Stack
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage (S3-compatible)
- **Edge Functions**: Deno-based serverless functions
- **AI Integration**: Lovable AI Gateway (Gemini & GPT-5 models)
- **Real-time**: WebSocket subscriptions
- **Caching**: Built-in query caching

### Security Features
- Row-Level Security (RLS) on all tables
- Role-based access control (RBAC)
- API key authentication
- Rate limiting
- Input validation
- Audit logging
- Encrypted storage

## Database Schema

### Core Tables

#### `profiles`
User profile information
- **Fields**: id, first_name, last_name, display_name, avatar_url, bio, phone, company, job_title
- **RLS**: Users can view all profiles, update only their own

#### `user_roles`
User authorization and roles
- **Roles**: admin, moderator, user
- **RLS**: Users can view own roles, admins can manage all

#### `tutorials`
Tutorial content management
- **Fields**: title, description, content, steps, status, thumbnail_url, tags, views, likes
- **Statuses**: draft, published, archived
- **RLS**: Users can view published tutorials or own tutorials

#### `videos`
Video platform management
- **Fields**: title, description, filename, file_size, duration, thumbnail_url, status, quality, hls_url, views, watch_time
- **Statuses**: uploading, processing, ready, error
- **Quality**: sd, hd, 4k
- **RLS**: Users can only access own videos

#### `workflows`
Workflow automation engine
- **Fields**: name, description, config, status, last_run_at, next_run_at
- **Statuses**: idle, running, completed, failed, cancelled
- **RLS**: Users can only access own workflows

#### `workflow_executions`
Workflow execution history
- **Fields**: workflow_id, status, trigger_data, result_data, error_message, started_at, completed_at, duration_ms
- **RLS**: Users can only view own executions

#### `contacts`
CRM contact management
- **Fields**: type, first_name, last_name, company_name, email, phone, address, tags, custom_fields
- **Types**: individual, company
- **RLS**: Users can only access own contacts

#### `deals`
CRM deal pipeline
- **Fields**: contact_id, title, description, amount, stage, probability, expected_close_date
- **Stages**: lead, qualified, proposal, negotiation, closed_won, closed_lost
- **RLS**: Users can only access own deals

#### `activities`
CRM activity tracking
- **Fields**: contact_id, deal_id, type, title, description, due_date, completed_at
- **Types**: call, email, meeting, note, task
- **RLS**: Users can only access own activities

#### `api_endpoints`
API Gateway endpoint configuration
- **Fields**: name, path, method, description, target_url, rate_limit, timeout_ms, is_active, headers
- **Methods**: GET, POST, PUT, DELETE, PATCH
- **RLS**: Users can only access own endpoints

#### `api_keys`
API Gateway key management
- **Fields**: name, key_hash, prefix, permissions, rate_limit, expires_at, last_used_at, is_active
- **RLS**: Users can only access own keys

#### `api_requests`
API Gateway request logs
- **Fields**: endpoint_id, api_key_id, method, path, status_code, response_time_ms, request_size, response_size, ip_address, user_agent
- **RLS**: Users can view own requests

#### `app_projects`
App Builder project management
- **Fields**: name, description, template_id, config, components, published_url, is_published
- **RLS**: Users can only access own projects

## Storage Buckets

### `avatars` (Public)
User profile avatars
- **Access**: Publicly readable
- **Upload**: Users can upload to their own folder

### `videos` (Private)
Video file storage
- **Access**: Users can only access own videos
- **Upload**: Users can upload to their own folder

### `thumbnails` (Public)
Video and tutorial thumbnails
- **Access**: Publicly readable
- **Upload**: Users can upload to their own folder

### `tutorials` (Private)
Tutorial content files
- **Access**: Users can only access own tutorials
- **Upload**: Users can upload to their own folder

### `documents` (Private)
General document storage
- **Access**: Users can only access own documents
- **Upload**: Users can upload to their own folder

## Edge Functions

### `generate-tutorial`
AI-powered tutorial generation
- **Auth**: Required (JWT)
- **Input**: { topic, level, steps }
- **AI Model**: google/gemini-2.5-flash
- **Output**: Generated tutorial object
- **Features**: 
  - Creates structured tutorial content
  - Saves to database automatically
  - Rate limit handling
  - Error handling

### `process-video`
Video processing pipeline
- **Auth**: Required (JWT)
- **Input**: { videoId }
- **Output**: Processed video object
- **Features**:
  - Updates video status
  - Generates thumbnails (simulated)
  - Creates HLS streaming URLs
  - Error handling

### `execute-workflow`
Workflow execution engine
- **Auth**: Required (JWT)
- **Input**: { workflowId, triggerData }
- **Output**: Execution result
- **Features**:
  - Executes workflow steps
  - Tracks execution time
  - Saves execution history
  - Error handling with rollback

### `proxy-api-request`
API Gateway request proxy
- **Auth**: API Key (x-api-key header)
- **Input**: Query params (path, method)
- **Output**: Proxied response
- **Features**:
  - API key validation
  - Rate limiting per key
  - Request/response logging
  - Timeout handling
  - Custom headers support

## Authentication

### Sign Up
```typescript
import { auth } from '@/lib/supabase-auth';

const { user, error } = await auth.signUp(email, password, {
  first_name: 'John',
  last_name: 'Doe'
});
```

### Sign In
```typescript
const { user, session, error } = await auth.signIn(email, password);
```

### Sign Out
```typescript
const { error } = await auth.signOut();
```

### Password Reset
```typescript
const { error } = await auth.resetPassword(email);
```

### Get Current User
```typescript
const { user, error } = await auth.getUser();
```

## Authorization

### Role Checking
```typescript
import { roles } from '@/lib/supabase-auth';

const { hasRole, error } = await roles.hasRole(userId, 'admin');
```

### Get User Roles
```typescript
const { roles: userRoles, error } = await roles.getUserRoles(userId);
```

## AI Integration

### Using Lovable AI
All AI features use the Lovable AI Gateway with pre-configured API keys.

**Available Models**:
- `google/gemini-2.5-flash` (default, free during beta)
- `google/gemini-2.5-pro` (advanced reasoning)
- `google/gemini-2.5-flash-lite` (fastest)
- `openai/gpt-5` (premium)
- `openai/gpt-5-mini` (balanced)

**Example Edge Function**:
```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "You are a helpful assistant" },
      { role: "user", content: prompt }
    ],
  }),
});
```

## Performance Optimizations

### Database Indexes
- User ID indexes on all user-scoped tables
- Status indexes for filtering
- Timestamp indexes for time-based queries
- Composite indexes for common query patterns

### Caching Strategy
- React Query with 5-minute stale time
- Browser localStorage for session persistence
- Edge function response caching

### Query Optimization
- Select only required fields
- Use `.single()` for single-row queries
- Use `.maybeSingle()` to avoid errors on empty results
- Batch operations where possible

## Monitoring & Logging

### Database Logs
Access via Supabase Dashboard:
- Query performance
- Error rates
- Table statistics

### Edge Function Logs
```bash
# View logs in Lovable Cloud tab
# Filter by function name
# Search for errors
```

### API Request Logs
All API Gateway requests are logged in `api_requests` table with:
- Response times
- Status codes
- Request/response sizes
- IP addresses
- User agents

## Rate Limiting

### API Gateway
- Per-key rate limits (customizable)
- Per-endpoint rate limits
- 429 responses on limit exceeded

### Authentication
- Brute force protection (built-in)
- Email rate limiting
- Password reset throttling

## Error Handling

### Standard Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

## Deployment

### Automatic Deployment
All changes are automatically deployed when you:
1. Run migrations (database changes)
2. Create/update edge functions
3. Update storage policies

### Environment Variables
Available in edge functions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`

### Production Checklist
- ✅ RLS enabled on all tables
- ✅ Secure storage policies
- ✅ Role-based access control
- ✅ API rate limiting
- ✅ Error handling
- ✅ Input validation
- ✅ Audit logging
- ✅ Backup strategy
- ✅ Monitoring setup

## Best Practices

### Security
1. Always use RLS policies
2. Never expose service role key
3. Validate all user inputs
4. Use prepared statements
5. Implement rate limiting
6. Log security events

### Performance
1. Use indexes on frequently queried columns
2. Limit result sets with pagination
3. Cache frequently accessed data
4. Use CDN for static assets
5. Optimize images and videos

### Reliability
1. Handle errors gracefully
2. Implement retries with exponential backoff
3. Use transactions for multi-step operations
4. Monitor error rates
5. Set up alerting

## Scaling

### Database
- Automatic connection pooling
- Read replicas (available)
- Horizontal scaling (contact support)

### Storage
- Unlimited storage capacity
- Global CDN distribution
- Automatic backups

### Edge Functions
- Auto-scaling based on load
- Global edge network
- Cold start optimization

## Support

For issues or questions:
1. Check Lovable Cloud documentation
2. Review function logs
3. Check database logs
4. Contact support@lovable.dev
