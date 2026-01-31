import { test, expect } from '@playwright/test';

// API tests using Playwright's APIRequestContext
// Testing against public APIs: JSONPlaceholder (CRUD) and httpbin (echo service)

test.describe('Swagger / REST API Tests', () => {
  // Base URL for JSONPlaceholder (fake REST API)
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  test('PROJ-201 GET /posts - fetch all posts', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts?_limit=5`);
    expect(response.status()).toBe(200);
    const posts = await response.json();
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts.length).toBeGreaterThan(0);
    console.log(`✓ Fetched ${posts.length} posts`);
  });

  test('PROJ-202 GET /posts/:id - fetch single post', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    expect(response.status()).toBe(200);
    const post = await response.json();
    expect(post.id).toBe(1);
    expect(post.userId).toBeDefined();
    expect(post.title).toBeDefined();
    console.log(`✓ Fetched post: ${post.title}`);
  });

  test('PROJ-203 POST /posts - create new post', async ({ request }) => {
    const newPost = {
      title: 'Test API Post',
      body: 'This is a test post created via Playwright API testing.',
      userId: 1,
    };
    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost,
    });
    expect(response.status()).toBe(201);
    const createdPost = await response.json();
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.id).toBeDefined();
    console.log(`✓ Created post with ID: ${createdPost.id}`);
  });

  test('PROJ-204 PUT /posts/:id - update existing post', async ({ request }) => {
    const updatedPost = {
      id: 1,
      title: 'Updated Post Title',
      body: 'Updated body content',
      userId: 1,
    };
    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost,
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.title).toBe(updatedPost.title);
    console.log(`✓ Updated post ID 1`);
  });

  test('PROJ-205 DELETE /posts/:id - delete post', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`);
    expect(response.status()).toBe(200);
    console.log(`✓ Deleted post ID 1`);
  });

  test('PROJ-206 GET /users - fetch all users', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users`);
    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
    console.log(`✓ Fetched ${users.length} users`);
  });

  test('PROJ-207 POST with headers - create post with custom headers', async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'PlaywrightAPITest',
      },
      data: {
        title: 'Post with custom headers',
        body: 'Testing header injection',
        userId: 2,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post.id).toBeDefined();
    console.log(`✓ Created post with custom headers, ID: ${post.id}`);
  });

  test('PROJ-208 httpbin echo - POST echo service', async ({ request }) => {
    const payload = {
      name: 'Playwright Test',
      timestamp: new Date().toISOString(),
      testType: 'API',
    };
    const response = await request.post('https://httpbin.org/post', {
      data: payload,
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.json.name).toBe(payload.name);
    console.log(`✓ Echo service confirmed payload: ${result.json.name}`);
  });

  test('PROJ-209 httpbin headers - verify request headers', async ({ request }) => {
    const response = await request.get('https://httpbin.org/headers', {
      headers: {
        'X-Test-Header': 'PlaywrightHeaders',
      },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.headers['X-Test-Header']).toBe('PlaywrightHeaders');
    console.log(`✓ Custom header verified in echo`);
  });

  test('PROJ-210 API error handling - test 404 response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`);
    // JSONPlaceholder returns 404 for non-existent IDs
    expect(response.status()).toBe(404);
    console.log(`✓ Correctly received 404 for non-existent resource`);
  });
});
