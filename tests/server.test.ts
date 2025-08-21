import request from 'supertest';
import app from '../server/index.js';

function randomTitle(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

// Test helper to create a user and get auth token
async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  const name = 'Test User';

  // Register user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  if (registerRes.status !== 201) {
    throw new Error('Failed to create test user');
  }

  // Login to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (loginRes.status !== 200) {
    throw new Error('Failed to login test user');
  }

  return {
    token: loginRes.body.token,
    user: loginRes.body.user
  };
}

describe('API server', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user for all tests
    const auth = await createTestUser();
    authToken = auth.token;
    testUser = auth.user;
  });

  it('health responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });

  it('creates tutorial and adds steps', async () => {
    const title = randomTitle('Tut');
    const create = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title });
    expect(create.status).toBe(200);
    const { id } = create.body as { id: string };
    expect(id).toBeTruthy();

    const steps = [
      { ts: Date.now(), kind: 'click', selector: '#btn' },
      { ts: Date.now() + 1, kind: 'keydown', key: 'a' },
    ];
    const add = await request(app)
      .post(`/api/tutorials/${id}/steps`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ steps });
    expect(add.status).toBe(200);
    expect(add.body).toHaveProperty('ok', true);

    const get = await request(app)
      .get(`/api/tutorials/${id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(get.status).toBe(200);
    expect(Array.isArray(get.body.steps)).toBe(true);
    expect(get.body.steps.length).toBeGreaterThanOrEqual(2);

    const head = await request(app).head(`/api/tutorials/${id}/media`);
    expect([200, 404]).toContain(head.status);
  });

  it('workflows CRUD works', async () => {
    const create = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: randomTitle('WF'), description: 'desc' });
    expect(create.status).toBe(200);
    const wf = create.body;
    expect(wf.id).toBeTruthy();

    const list = await request(app)
      .get('/api/workflows')
      .set('Authorization', `Bearer ${authToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const put = await request(app)
      .put(`/api/workflows/${wf.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isActive: true, nodes: [
        {
          id: 'node1', type: 'trigger', name: 'Start', description: '', position: { x: 10, y: 20 }, config: {}, connections: [], status: 'idle'
        }
      ]});
    expect(put.status).toBe(200);
    expect(put.body.isActive).toBe(true);
    expect(Array.isArray(put.body.nodes)).toBe(true);

    const del = await request(app)
      .delete(`/api/workflows/${wf.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({ ok: true });
  });

  it('validates tutorial creation', async () => {
    const res = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('validates workflow creation', async () => {
    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('returns 404 for non-existent resources', async () => {
    const res = await request(app)
      .get('/api/tutorials/nonexistent')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('returns 404 for non-existent routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    // Express default 404 doesn't have our custom error format
    expect(res.body).toBeDefined();
  });

  it('includes request ID in responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('handles media HEAD requests', async () => {
    const res = await request(app).head('/api/tutorials/nonexistent/media');
    expect(res.status).toBe(404);
  });

  it('requires authentication for protected routes', async () => {
    const res = await request(app).post('/api/tutorials').send({ title: 'test' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('handles user registration and login', async () => {
    const email = `auth-test-${Date.now()}@example.com`;
    const password = 'TestPass123!';
    const name = 'Auth Test User';

    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe(email);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user.email).toBe(email);

    // Test protected route with token
    const tutorialRes = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ title: 'Test Tutorial' });
    expect(tutorialRes.status).toBe(200);
  });
});