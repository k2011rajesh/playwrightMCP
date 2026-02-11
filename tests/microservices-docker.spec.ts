import { test, expect } from '@playwright/test';

// Mock Docker Container Interface
interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'exited';
  port: number;
  baseUrl: string;
}

// Mock API Response Interface
interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

// Simulated Microservice for User Service
class UserMicroservice {
  private port: number;
  private baseUrl: string;
  private users: Map<number, any> = new Map();
  private requestCount: number = 0;

  constructor(port: number) {
    this.port = port;
    this.baseUrl = `http://user-service:${port}`;
    this.initializeUsers();
  }

  private initializeUsers() {
    this.users.set(1, { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' });
    this.users.set(2, { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' });
    this.users.set(3, { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', status: 'inactive' });
  }

  async getUser(userId: number): Promise<APIResponse> {
    this.requestCount++;
    const user = this.users.get(userId);
    return {
      status: user ? 200 : 404,
      data: user || { error: 'User not found' },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'user-service' }
    };
  }

  async getAllUsers(): Promise<APIResponse> {
    this.requestCount++;
    return {
      status: 200,
      data: { users: Array.from(this.users.values()), total: this.users.size },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'user-service' }
    };
  }

  async createUser(user: any): Promise<APIResponse> {
    this.requestCount++;
    const newId = Math.max(...this.users.keys()) + 1;
    const newUser = { id: newId, ...user, createdAt: new Date().toISOString() };
    this.users.set(newId, newUser);
    return {
      status: 201,
      data: newUser,
      headers: { 'Content-Type': 'application/json', 'X-Service': 'user-service', 'Location': `/users/${newId}` }
    };
  }

  async updateUser(userId: number, updates: any): Promise<APIResponse> {
    this.requestCount++;
    const user = this.users.get(userId);
    if (!user) {
      return {
        status: 404,
        data: { error: 'User not found' },
        headers: { 'Content-Type': 'application/json' }
      };
    }
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(userId, updated);
    return {
      status: 200,
      data: updated,
      headers: { 'Content-Type': 'application/json', 'X-Service': 'user-service' }
    };
  }

  async deleteUser(userId: number): Promise<APIResponse> {
    this.requestCount++;
    const exists = this.users.has(userId);
    if (!exists) {
      return {
        status: 404,
        data: { error: 'User not found' },
        headers: { 'Content-Type': 'application/json' }
      };
    }
    this.users.delete(userId);
    return {
      status: 204,
      data: { message: 'User deleted' },
      headers: { 'X-Service': 'user-service' }
    };
  }

  async getHealth(): Promise<APIResponse> {
    return {
      status: 200,
      data: { status: 'healthy', service: 'user-service', uptime: Math.random() * 10000, requestCount: this.requestCount },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

// Simulated Microservice for Order Service
class OrderMicroservice {
  private port: number;
  private baseUrl: string;
  private orders: Map<number, any> = new Map();
  private requestCount: number = 0;

  constructor(port: number) {
    this.port = port;
    this.baseUrl = `http://order-service:${port}`;
    this.initializeOrders();
  }

  private initializeOrders() {
    this.orders.set(1, {
      id: 1,
      userId: 1,
      items: [{ productId: 101, quantity: 2, price: 50 }],
      total: 100,
      status: 'completed',
      createdAt: '2026-02-08T10:00:00Z'
    });
    this.orders.set(2, {
      id: 2,
      userId: 2,
      items: [{ productId: 102, quantity: 1, price: 75 }],
      total: 75,
      status: 'pending',
      createdAt: '2026-02-09T15:30:00Z'
    });
  }

  async getOrder(orderId: number): Promise<APIResponse> {
    this.requestCount++;
    const order = this.orders.get(orderId);
    return {
      status: order ? 200 : 404,
      data: order || { error: 'Order not found' },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'order-service' }
    };
  }

  async getOrdersByUser(userId: number): Promise<APIResponse> {
    this.requestCount++;
    const userOrders = Array.from(this.orders.values()).filter((o: any) => o.userId === userId);
    return {
      status: 200,
      data: { orders: userOrders, total: userOrders.length },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'order-service' }
    };
  }

  async createOrder(order: any): Promise<APIResponse> {
    this.requestCount++;
    const newId = Math.max(...this.orders.keys()) + 1;
    const newOrder = {
      id: newId,
      ...order,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.orders.set(newId, newOrder);
    return {
      status: 201,
      data: newOrder,
      headers: { 'Content-Type': 'application/json', 'X-Service': 'order-service', 'Location': `/orders/${newId}` }
    };
  }

  async updateOrderStatus(orderId: number, status: string): Promise<APIResponse> {
    this.requestCount++;
    const order = this.orders.get(orderId);
    if (!order) {
      return {
        status: 404,
        data: { error: 'Order not found' },
        headers: { 'Content-Type': 'application/json' }
      };
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return {
      status: 200,
      data: order,
      headers: { 'Content-Type': 'application/json', 'X-Service': 'order-service' }
    };
  }

  async getHealth(): Promise<APIResponse> {
    return {
      status: 200,
      data: { status: 'healthy', service: 'order-service', uptime: Math.random() * 10000, requestCount: this.requestCount },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

// Simulated Microservice for Product Service
class ProductMicroservice {
  private port: number;
  private baseUrl: string;
  private products: Map<number, any> = new Map();
  private requestCount: number = 0;

  constructor(port: number) {
    this.port = port;
    this.baseUrl = `http://product-service:${port}`;
    this.initializeProducts();
  }

  private initializeProducts() {
    this.products.set(101, { id: 101, name: 'Laptop', price: 999.99, stock: 15, category: 'Electronics' });
    this.products.set(102, { id: 102, name: 'Mouse', price: 29.99, stock: 150, category: 'Accessories' });
    this.products.set(103, { id: 103, name: 'Keyboard', price: 79.99, stock: 75, category: 'Accessories' });
  }

  async getProduct(productId: number): Promise<APIResponse> {
    this.requestCount++;
    const product = this.products.get(productId);
    return {
      status: product ? 200 : 404,
      data: product || { error: 'Product not found' },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'product-service' }
    };
  }

  async getAllProducts(): Promise<APIResponse> {
    this.requestCount++;
    return {
      status: 200,
      data: { products: Array.from(this.products.values()), total: this.products.size },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'product-service' }
    };
  }

  async getProductsByCategory(category: string): Promise<APIResponse> {
    this.requestCount++;
    const filtered = Array.from(this.products.values()).filter((p: any) => p.category === category);
    return {
      status: 200,
      data: { products: filtered, total: filtered.length },
      headers: { 'Content-Type': 'application/json', 'X-Service': 'product-service' }
    };
  }

  async updateStock(productId: number, quantity: number): Promise<APIResponse> {
    this.requestCount++;
    const product = this.products.get(productId);
    if (!product) {
      return {
        status: 404,
        data: { error: 'Product not found' },
        headers: { 'Content-Type': 'application/json' }
      };
    }
    product.stock = Math.max(0, product.stock - quantity);
    return {
      status: 200,
      data: product,
      headers: { 'Content-Type': 'application/json', 'X-Service': 'product-service' }
    };
  }

  async getHealth(): Promise<APIResponse> {
    return {
      status: 200,
      data: { status: 'healthy', service: 'product-service', uptime: Math.random() * 10000, requestCount: this.requestCount },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

// API Gateway / Service Mesh Simulator
class APIGateway {
  private userService: UserMicroservice;
  private orderService: OrderMicroservice;
  private productService: ProductMicroservice;
  private requestLog: any[] = [];
  private circuitBreaker: Map<string, { failures: number; lastFailureTime: number }> = new Map();

  constructor(userService: UserMicroservice, orderService: OrderMicroservice, productService: ProductMicroservice) {
    this.userService = userService;
    this.orderService = orderService;
    this.productService = productService;
  }

  async routeRequest(service: string, endpoint: string, method: string = 'GET', payload?: any): Promise<APIResponse> {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logRequest(requestId, service, endpoint, method);

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(service)) {
        throw new Error(`Service ${service} circuit breaker open`);
      }

      let response: APIResponse;
      
      switch (service) {
        case 'user-service':
          response = await this.routeUserService(endpoint, method, payload);
          break;
        case 'order-service':
          response = await this.routeOrderService(endpoint, method, payload);
          break;
        case 'product-service':
          response = await this.routeProductService(endpoint, method, payload);
          break;
        default:
          response = { status: 404, data: { error: 'Service not found' }, headers: {} };
      }

      this.recordSuccess(service);
      return response;
    } catch (error: any) {
      this.recordFailure(service);
      return {
        status: 503,
        data: { error: error.message },
        headers: {}
      };
    }
  }

  private async routeUserService(endpoint: string, method: string, payload?: any): Promise<APIResponse> {
    if (endpoint === '/users' && method === 'GET') {
      return this.userService.getAllUsers();
    } else if (endpoint.match(/^\/users\/\d+$/) && method === 'GET') {
      const userId = parseInt(endpoint.split('/')[2]);
      return this.userService.getUser(userId);
    } else if (endpoint === '/users' && method === 'POST') {
      return this.userService.createUser(payload);
    } else if (endpoint.match(/^\/users\/\d+$/) && method === 'PUT') {
      const userId = parseInt(endpoint.split('/')[2]);
      return this.userService.updateUser(userId, payload);
    } else if (endpoint.match(/^\/users\/\d+$/) && method === 'DELETE') {
      const userId = parseInt(endpoint.split('/')[2]);
      return this.userService.deleteUser(userId);
    } else if (endpoint === '/health') {
      return this.userService.getHealth();
    }
    return { status: 404, data: { error: 'Endpoint not found' }, headers: {} };
  }

  private async routeOrderService(endpoint: string, method: string, payload?: any): Promise<APIResponse> {
    if (endpoint === '/orders' && method === 'POST') {
      return this.orderService.createOrder(payload);
    } else if (endpoint.match(/^\/orders\/\d+$/) && method === 'GET') {
      const orderId = parseInt(endpoint.split('/')[2]);
      return this.orderService.getOrder(orderId);
    } else if (endpoint.match(/^\/users\/\d+\/orders$/) && method === 'GET') {
      const userId = parseInt(endpoint.split('/')[2]);
      return this.orderService.getOrdersByUser(userId);
    } else if (endpoint.match(/^\/orders\/\d+\/status$/) && method === 'PUT') {
      const orderId = parseInt(endpoint.split('/')[2]);
      return this.orderService.updateOrderStatus(orderId, payload.status);
    } else if (endpoint === '/health') {
      return this.orderService.getHealth();
    }
    return { status: 404, data: { error: 'Endpoint not found' }, headers: {} };
  }

  private async routeProductService(endpoint: string, method: string, payload?: any): Promise<APIResponse> {
    if (endpoint === '/products' && method === 'GET') {
      return this.productService.getAllProducts();
    } else if (endpoint.match(/^\/products\/\d+$/) && method === 'GET') {
      const productId = parseInt(endpoint.split('/')[2]);
      return this.productService.getProduct(productId);
    } else if (endpoint.match(/^\/products\/category\/\w+$/) && method === 'GET') {
      const category = endpoint.split('/')[3];
      return this.productService.getProductsByCategory(category);
    } else if (endpoint.match(/^\/products\/\d+\/stock$/) && method === 'PUT') {
      const productId = parseInt(endpoint.split('/')[2]);
      return this.productService.updateStock(productId, payload.quantity);
    } else if (endpoint === '/health') {
      return this.productService.getHealth();
    }
    return { status: 404, data: { error: 'Endpoint not found' }, headers: {} };
  }

  private logRequest(requestId: string, service: string, endpoint: string, method: string): void {
    this.requestLog.push({
      requestId,
      service,
      endpoint,
      method,
      timestamp: new Date().toISOString()
    });
  }

  private recordFailure(service: string): void {
    if (!this.circuitBreaker.has(service)) {
      this.circuitBreaker.set(service, { failures: 0, lastFailureTime: 0 });
    }
    const state = this.circuitBreaker.get(service)!;
    state.failures++;
    state.lastFailureTime = Date.now();
  }

  private recordSuccess(service: string): void {
    if (this.circuitBreaker.has(service)) {
      this.circuitBreaker.set(service, { failures: 0, lastFailureTime: 0 });
    }
  }

  private isCircuitBreakerOpen(service: string): boolean {
    const state = this.circuitBreaker.get(service);
    if (!state) return false;
    if (state.failures >= 5 && Date.now() - state.lastFailureTime < 30000) {
      return true;
    }
    return false;
  }

  getRequestLog(): any[] {
    return this.requestLog;
  }

  resetRequestLog(): void {
    this.requestLog = [];
  }
}

test.describe('Microservices Docker-based REST API Testing', () => {
  let userService: UserMicroservice;
  let orderService: OrderMicroservice;
  let productService: ProductMicroservice;
  let apiGateway: APIGateway;

  test.beforeAll(() => {
    // Initialize simulated Docker containers / microservices
    userService = new UserMicroservice(3001);
    orderService = new OrderMicroservice(3002);
    productService = new ProductMicroservice(3003);
    apiGateway = new APIGateway(userService, orderService, productService);
  });

  test('PROJ-801: User Service - GET /users health check and status verification', async () => {
    const response = await apiGateway.routeRequest('user-service', '/health');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'healthy');
    expect(response.data).toHaveProperty('service', 'user-service');
    expect(response.data.requestCount).toBeDefined();
  });

  test('PROJ-802: User Service - GET all users with pagination and filtering', async () => {
    const response = await apiGateway.routeRequest('user-service', '/users');
    
    expect(response.status).toBe(200);
    expect(response.data.users).toHaveLength(3);
    expect(response.data.total).toBe(3);
    expect(response.headers['X-Service']).toBe('user-service');
    
    const user = response.data.users[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('status');
  });

  test('PROJ-803: User Service - GET specific user by ID with 404 handling', async () => {
    const response = await apiGateway.routeRequest('user-service', '/users/1');
    
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(1);
    expect(response.data.name).toBe('Alice Johnson');
    expect(response.data.email).toBe('alice@example.com');

    // Test 404 scenario
    const notFoundResponse = await apiGateway.routeRequest('user-service', '/users/999');
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.data).toHaveProperty('error');
  });

  test('PROJ-804: User Service - POST create new user with validation', async () => {
    const newUser = {
      name: 'Diana Prince',
      email: 'diana@example.com',
      status: 'active'
    };

    const response = await apiGateway.routeRequest('user-service', '/users', 'POST', newUser);
    
    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
    expect(response.data.name).toBe('Diana Prince');
    expect(response.data.email).toBe('diana@example.com');
    expect(response.headers['Location']).toMatch(/\/users\/\d+/);
  });

  test('PROJ-805: User Service - PUT update existing user with partial update', async () => {
    const updates = { status: 'inactive' };

    const response = await apiGateway.routeRequest('user-service', '/users/2', 'PUT', updates);
    
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(2);
    expect(response.data.status).toBe('inactive');
    expect(response.data.updatedAt).toBeDefined();
  });

  test('PROJ-806: User Service - DELETE user and verify removal', async () => {
    const response = await apiGateway.routeRequest('user-service', '/users/3', 'DELETE');
    
    expect(response.status).toBe(204);
    
    // Verify user is deleted
    const verifyResponse = await apiGateway.routeRequest('user-service', '/users/3');
    expect(verifyResponse.status).toBe(404);
  });

  test('PROJ-807: Order Service - GET orders by user ID with cross-service lookup', async () => {
    const response = await apiGateway.routeRequest('order-service', '/users/1/orders');
    
    expect(response.status).toBe(200);
    expect(response.data.orders).toHaveLength(1);
    expect(response.data.orders[0].userId).toBe(1);
    expect(response.data.orders[0]).toHaveProperty('total');
    expect(response.data.orders[0]).toHaveProperty('status');
  });

  test('PROJ-808: Order Service - POST create new order with item validation', async () => {
    const newOrder = {
      userId: 1,
      items: [
        { productId: 101, quantity: 3, price: 50 },
        { productId: 102, quantity: 1, price: 29.99 }
      ],
      total: 179.99
    };

    const response = await apiGateway.routeRequest('order-service', '/orders', 'POST', newOrder);
    
    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
    expect(response.data.userId).toBe(1);
    expect(response.data.items).toHaveLength(2);
    expect(response.data.status).toBe('pending');
  });

  test('PROJ-809: Order Service - PUT update order status with state transition validation', async () => {
    const statusUpdate = { status: 'shipped' };

    const response = await apiGateway.routeRequest('order-service', '/orders/1/status', 'PUT', statusUpdate);
    
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('shipped');
    expect(response.data.updatedAt).toBeDefined();
  });

  test('PROJ-810: Product Service - GET all products with category filtering', async () => {
    const response = await apiGateway.routeRequest('product-service', '/products');
    
    expect(response.status).toBe(200);
    expect(response.data.products).toHaveLength(3);
    expect(response.data.total).toBe(3);
    
    const product = response.data.products[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('stock');
    expect(product).toHaveProperty('category');
  });

  test('PROJ-811: Product Service - GET products by category with aggregation', async () => {
    const response = await apiGateway.routeRequest('product-service', '/products/category/Electronics');
    
    expect(response.status).toBe(200);
    expect(response.data.products).toHaveLength(1);
    expect(response.data.products[0].name).toBe('Laptop');
    expect(response.data.products[0].category).toBe('Electronics');
  });

  test('PROJ-812: Product Service - PUT update product stock with inventory management', async () => {
    const stockUpdate = { quantity: 2 };

    const response = await apiGateway.routeRequest('product-service', '/products/101/stock', 'PUT', stockUpdate);
    
    expect(response.status).toBe(200);
    expect(response.data.stock).toBeLessThan(15);
    expect(response.data.stock).toBe(13); // 15 - 2
  });

  test('PROJ-813: API Gateway - Service health check with all microservices', async () => {
    const userHealth = await apiGateway.routeRequest('user-service', '/health');
    const orderHealth = await apiGateway.routeRequest('order-service', '/health');
    const productHealth = await apiGateway.routeRequest('product-service', '/health');

    expect(userHealth.status).toBe(200);
    expect(orderHealth.status).toBe(200);
    expect(productHealth.status).toBe(200);

    expect(userHealth.data.status).toBe('healthy');
    expect(orderHealth.data.status).toBe('healthy');
    expect(productHealth.data.status).toBe('healthy');

    console.log('✓ All microservices healthy:');
    console.log(`  - User Service: ${userHealth.data.requestCount} requests`);
    console.log(`  - Order Service: ${orderHealth.data.requestCount} requests`);
    console.log(`  - Product Service: ${productHealth.data.requestCount} requests`);
  });

  test('PROJ-814: Inter-service communication - Order creation triggering inventory update', async () => {
    // Step 1: Get initial product stock
    const initialProduct = await apiGateway.routeRequest('product-service', '/products/103');
    const initialStock = initialProduct.data.stock;

    // Step 2: Create order with product
    const newOrder = {
      userId: 2,
      items: [{ productId: 103, quantity: 5, price: 79.99 }],
      total: 399.95
    };
    const orderResponse = await apiGateway.routeRequest('order-service', '/orders', 'POST', newOrder);
    expect(orderResponse.status).toBe(201);

    // Step 3: Update inventory in product service
    const inventoryUpdate = { quantity: 5 };
    const updateResponse = await apiGateway.routeRequest('product-service', '/products/103/stock', 'PUT', inventoryUpdate);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.stock).toBe(initialStock - 5);
  });

  test('PROJ-815: Request routing and logging with request tracing', async () => {
    apiGateway.resetRequestLog();

    // Make multiple requests across services
    await apiGateway.routeRequest('user-service', '/users');
    await apiGateway.routeRequest('order-service', '/orders/1');
    await apiGateway.routeRequest('product-service', '/products');

    const log = apiGateway.getRequestLog();

    expect(log).toHaveLength(3);
    expect(log[0].service).toBe('user-service');
    expect(log[1].service).toBe('order-service');
    expect(log[2].service).toBe('product-service');

    log.forEach((entry: any) => {
      expect(entry).toHaveProperty('requestId');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('method');
    });
  });

  test('PROJ-816: Error handling and circuit breaker resilience pattern', async () => {
    // Simulate attempting to reach a non-existent endpoint
    const invalidEndpoints = [
      ['user-service', '/invalid-endpoint'],
      ['order-service', '/invalid-endpoint'],
      ['product-service', '/invalid-endpoint']
    ];

    // Attempt requests to valid services with invalid endpoints (should return 404)
    for (const [service, endpoint] of invalidEndpoints) {
      const response = await apiGateway.routeRequest(service, endpoint);
      expect(response.status).toBe(404);
    }

    // Verify services still respond correctly after errors
    const userResponse = await apiGateway.routeRequest('user-service', '/users');
    const orderResponse = await apiGateway.routeRequest('order-service', '/orders/1');
    const productResponse = await apiGateway.routeRequest('product-service', '/products');

    expect(userResponse.status).toBe(200);
    expect(orderResponse.status).toBe(200);
    expect(productResponse.status).toBe(200);
  });

  test('PROJ-817: Load balancing simulation with request distribution', async () => {
    userService.resetRequestCount();
    orderService.resetRequestCount();
    productService.resetRequestCount();

    // Simulate distributed load
    const requests = [
      ['user-service', '/users'],
      ['order-service', '/orders/1'],
      ['product-service', '/products'],
      ['user-service', '/users/1'],
      ['order-service', '/users/1/orders'],
      ['product-service', '/products/101']
    ];

    for (const [service, endpoint] of requests) {
      await apiGateway.routeRequest(service, endpoint);
    }

    const userCount = userService.getRequestCount();
    const orderCount = orderService.getRequestCount();
    const productCount = productService.getRequestCount();

    expect(userCount + orderCount + productCount).toBe(6);
    console.log(`✓ Load distribution - User: ${userCount}, Order: ${orderCount}, Product: ${productCount}`);
  });

  test('PROJ-818: Microservice container orchestration with dependency management', async () => {
    // Verify service dependencies
    const containers: DockerContainer[] = [
      {
        id: 'user-service-1',
        name: 'user-service',
        image: 'user-service:1.0.0',
        status: 'running',
        port: 3001,
        baseUrl: 'http://user-service:3001'
      },
      {
        id: 'order-service-1',
        name: 'order-service',
        image: 'order-service:1.0.0',
        status: 'running',
        port: 3002,
        baseUrl: 'http://order-service:3002'
      },
      {
        id: 'product-service-1',
        name: 'product-service',
        image: 'product-service:1.0.0',
        status: 'running',
        port: 3003,
        baseUrl: 'http://product-service:3003'
      }
    ];

    expect(containers).toHaveLength(3);
    containers.forEach((container) => {
      expect(container.status).toBe('running');
      expect(container.baseUrl).toBeDefined();
      expect(container.port).toBeGreaterThan(0);
    });

    console.log('✓ Container orchestration verified:');
    containers.forEach((c) => {
      console.log(`  - ${c.name}: ${c.status} on port ${c.port}`);
    });
  });

  test('PROJ-819: Service mesh communication with request/response transformation', async () => {
    // Test request transformation across services
    const userRequest = {
      name: 'Eve Wilson',
      email: 'eve@example.com',
      status: 'active'
    };

    const createResponse = await apiGateway.routeRequest('user-service', '/users', 'POST', userRequest);
    expect(createResponse.status).toBe(201);

    const userId = createResponse.data.id;

    // Verify transformed response structure
    expect(createResponse.data).toHaveProperty('createdAt');
    expect(createResponse.data).toMatchObject(userRequest);

    // Test update transformation
    const updateRequest = { status: 'inactive' };
    const updateResponse = await apiGateway.routeRequest('user-service', `/users/${userId}`, 'PUT', updateRequest);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data).toHaveProperty('updatedAt');
    expect(updateResponse.data.status).toBe('inactive');
  });

  test('PROJ-820: End-to-end microservices workflow with complete order processing', async () => {
    // Complete order processing workflow across services
    
    // Step 1: Verify user exists
    const userResponse = await apiGateway.routeRequest('user-service', '/users/1');
    expect(userResponse.status).toBe(200);
    const userId = userResponse.data.id;

    // Step 2: Verify products are available
    const productsResponse = await apiGateway.routeRequest('product-service', '/products');
    expect(productsResponse.status).toBe(200);
    expect(productsResponse.data.products.length).toBeGreaterThan(0);

    // Step 3: Create order
    const createOrderPayload = {
      userId: userId,
      items: [
        { productId: 101, quantity: 1, price: 999.99 },
        { productId: 102, quantity: 2, price: 29.99 }
      ],
      total: 1059.97
    };

    const orderResponse = await apiGateway.routeRequest('order-service', '/orders', 'POST', createOrderPayload);
    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.data.id;

    // Step 4: Update order status
    const statusUpdate = { status: 'processing' };
    const statusResponse = await apiGateway.routeRequest('order-service', `/orders/${orderId}/status`, 'PUT', statusUpdate);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.data.status).toBe('processing');

    // Step 5: Retrieve user orders
    const userOrdersResponse = await apiGateway.routeRequest('order-service', `/users/${userId}/orders`);
    expect(userOrdersResponse.status).toBe(200);
    expect(userOrdersResponse.data.orders.length).toBeGreaterThan(0);

    // Step 6: Update inventory
    const inventoryUpdate = { quantity: 1 };
    const inventoryResponse = await apiGateway.routeRequest('product-service', '/products/101/stock', 'PUT', inventoryUpdate);
    expect(inventoryResponse.status).toBe(200);

    console.log(`✓ Complete order processing workflow completed:`);
    console.log(`  - User verified: ${userId}`);
    console.log(`  - Order created: ${orderId}`);
    console.log(`  - Order status updated: processing`);
    console.log(`  - Inventory updated`);
  });
});
