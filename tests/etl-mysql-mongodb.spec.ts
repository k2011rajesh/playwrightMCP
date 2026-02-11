import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Mock MongoDB collection class
class MockMongoDBCollection {
  private documents: any[] = [];
  private indexedFields: Set<string> = new Set();

  insertOne(doc: any): { insertedId: string } {
    const insertedId = Date.now().toString() + Math.random().toString();
    this.documents.push({ _id: insertedId, ...doc });
    return { insertedId };
  }

  insertMany(docs: any[]): { insertedIds: string[] } {
    const insertedIds = docs.map(doc => {
      const id = Date.now().toString() + Math.random().toString();
      this.documents.push({ _id: id, ...doc });
      return id;
    });
    return { insertedIds };
  }

  find(filter: any = {}): any[] {
    return this.documents.filter(doc => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });
  }

  findOne(filter: any): any {
    return this.documents.find(doc => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });
  }

  countDocuments(): number {
    return this.documents.length;
  }

  deleteMany(): { deletedCount: number } {
    const count = this.documents.length;
    this.documents = [];
    return { deletedCount: count };
  }

  createIndex(spec: any): void {
    const key = Object.keys(spec)[0];
    this.indexedFields.add(key);
  }

  getIndexes(): string[] {
    return Array.from(this.indexedFields);
  }

  aggregate(pipeline: any[]): any[] {
    let data = [...this.documents];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        data = data.filter(doc => {
          for (const [key, value] of Object.entries(stage.$match)) {
            if (doc[key] !== value) return false;
          }
          return true;
        });
      } else if (stage.$group) {
        const grouped: any = {};
        for (const doc of data) {
          const keyValue = doc[stage.$group._id.substring(1)] || 'null';
          if (!grouped[keyValue]) grouped[keyValue] = [];
          grouped[keyValue].push(doc);
        }
        data = Object.entries(grouped).map(([key, docs]: any) => ({
          _id: key,
          count: docs.length,
          avg: docs.reduce((sum: number, d: any) => sum + (d.salary || 0), 0) / docs.length
        }));
      }
    }
    
    return data;
  }
}

// Mock MongoDB database class
class MockMongoDB {
  private collections: Map<string, MockMongoDBCollection> = new Map();

  collection(name: string): MockMongoDBCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockMongoDBCollection());
    }
    return this.collections.get(name)!;
  }

  listCollections(): string[] {
    return Array.from(this.collections.keys());
  }
}

test.describe('ETL MySQL to MongoDB Migration', () => {
  let sourceDb: Database.Database;
  let targetDb: MockMongoDB;

  test.beforeAll(() => {
    // Initialize source MySQL (simulated with SQLite)
    const dbPath = path.join(process.cwd(), 'test-mysql-mongodb.db');
    sourceDb = new Database(dbPath);
    sourceDb.exec('PRAGMA journal_mode = WAL;');

    // Drop and recreate tables
    sourceDb.exec('DROP TABLE IF EXISTS orders');
    sourceDb.exec('DROP TABLE IF EXISTS customers');
    
    sourceDb.exec(`
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        city TEXT,
        country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sourceDb.exec(`
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
      )
    `);

    // Insert test data
    sourceDb.prepare(`
      INSERT INTO customers (first_name, last_name, email, city, country)
      VALUES (?, ?, ?, ?, ?)
    `).run('John', 'Doe', 'john@example.com', 'New York', 'USA');

    sourceDb.prepare(`
      INSERT INTO customers (first_name, last_name, email, city, country)
      VALUES (?, ?, ?, ?, ?)
    `).run('Jane', 'Smith', 'jane@example.com', 'London', 'UK');

    sourceDb.prepare(`
      INSERT INTO customers (first_name, last_name, email, city, country)
      VALUES (?, ?, ?, ?, ?)
    `).run('Bob', 'Johnson', 'bob@example.com', 'Sydney', 'Australia');

    // Insert orders
    sourceDb.prepare(`
      INSERT INTO orders (customer_id, total_amount, status)
      VALUES (?, ?, ?)
    `).run(1, 150.50, 'completed');

    sourceDb.prepare(`
      INSERT INTO orders (customer_id, total_amount, status)
      VALUES (?, ?, ?)
    `).run(1, 200.00, 'completed');

    sourceDb.prepare(`
      INSERT INTO orders (customer_id, total_amount, status)
      VALUES (?, ?, ?)
    `).run(2, 75.25, 'pending');

    sourceDb.prepare(`
      INSERT INTO orders (customer_id, total_amount, status)
      VALUES (?, ?, ?)
    `).run(3, 320.99, 'shipped');

    // Initialize target MongoDB (mocked)
    targetDb = new MockMongoDB();
  });

  test.afterAll(() => {
    sourceDb.close();
    const dbPath = path.join(process.cwd(), 'test-mysql-mongodb.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  test('PROJ-701: Extract customer data from MySQL source', async () => {
    const stmt = sourceDb.prepare('SELECT * FROM customers ORDER BY customer_id');
    const customers = stmt.all();

    expect(customers).toHaveLength(3);
    expect(customers[0]).toMatchObject({
      customer_id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      city: 'New York'
    });
    expect(customers[2]).toMatchObject({
      first_name: 'Bob',
      email: 'bob@example.com'
    });
  });

  test('PROJ-702: Validate MySQL relational schema structure', async () => {
    const tableInfo = sourceDb.pragma('table_info(customers)');
    
    expect(tableInfo).toHaveLength(7); // customer_id, first_name, last_name, email, city, country, created_at
    expect(tableInfo[1].name).toBe('first_name');
    expect(tableInfo[3].name).toBe('email');
    
    const orderInfo = sourceDb.pragma('table_info(orders)');
    expect(orderInfo).toHaveLength(5); // order_id, customer_id, order_date, total_amount, status
    expect(orderInfo.some((col: any) => col.name === 'customer_id')).toBe(true);
  });

  test('PROJ-703: Transform relational to document structure (denormalization)', async () => {
    const stmt = sourceDb.prepare(`
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.city,
        c.country,
        COUNT(o.order_id) as order_count,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id
    `);
    
    const transformedData = stmt.all().map((row: any) => ({
      customerId: row.customer_id,
      fullName: `${row.first_name} ${row.last_name}`,
      email: row.email,
      location: {
        city: row.city,
        country: row.country
      },
      orderSummary: {
        count: row.order_count || 0,
        totalSpent: row.total_spent || 0
      }
    }));

    expect(transformedData).toHaveLength(3);
    expect(transformedData[0]).toMatchObject({
      customerId: 1,
      fullName: 'John Doe',
      location: { city: 'New York', country: 'USA' },
      orderSummary: { count: 2, totalSpent: 350.5 }
    });
    expect(transformedData[1]).toMatchObject({
      customerId: 2,
      orderSummary: { count: 1, totalSpent: 75.25 }
    });
  });

  test('PROJ-704: Load transformed data into MongoDB target', async () => {
    const stmt = sourceDb.prepare(`
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.city,
        c.country
      FROM customers c
      ORDER BY c.customer_id
    `);
    
    const customers = stmt.all();
    const mongoCollection = targetDb.collection('customers');

    const loadedIds = [];
    for (const cust of customers) {
      const result = mongoCollection.insertOne({
        email: cust.email,
        firstName: cust.first_name,
        lastName: cust.last_name,
        location: {
          city: cust.city,
          country: cust.country
        },
        source: 'mysql_migration'
      });
      loadedIds.push(result.insertedId);
    }

    expect(loadedIds).toHaveLength(3);
    const count = mongoCollection.countDocuments();
    expect(count).toBe(3);
  });

  test('PROJ-705: Validate data integrity between MySQL and MongoDB', async () => {
    const mysqlStmt = sourceDb.prepare('SELECT email, first_name, last_name FROM customers ORDER BY email');
    const mysqlData = mysqlStmt.all();

    const mongoCollection = targetDb.collection('customers');
    const mongoData = mongoCollection.find().sort((a: any, b: any) => a.email.localeCompare(b.email));

    expect(mongoData).toHaveLength(mysqlData.length);

    mysqlData.forEach((mysqlRow: any, idx: number) => {
      expect(mongoData[idx].email).toBe(mysqlRow.email);
      expect(mongoData[idx].firstName).toBe(mysqlRow.first_name);
      expect(mongoData[idx].lastName).toBe(mysqlRow.last_name);
    });
  });

  test('PROJ-706: Handle NULL values during MySQL to MongoDB migration', async () => {
    // Insert customer with NULL city
    sourceDb.prepare(`
      INSERT INTO customers (first_name, last_name, email, city, country)
      VALUES (?, ?, ?, ?, ?)
    `).run('Alice', 'Brown', 'alice@example.com', null, 'Canada');

    const stmt = sourceDb.prepare('SELECT * FROM customers WHERE email = ?');
    const customer = stmt.get('alice@example.com');

    expect(customer.city).toBeNull();

    const mongoCollection = targetDb.collection('customers');
    mongoCollection.insertOne({
      email: customer.email,
      firstName: customer.first_name,
      city: customer.city, // Preserve NULL as null in MongoDB
      country: customer.country
    });

    const mongoDoc = mongoCollection.findOne({ email: 'alice@example.com' });
    expect(mongoDoc.city).toBeNull();
  });

  test('PROJ-707: Reconcile denormalized order data in MongoDB', async () => {
    const mongoCollection = targetDb.collection('orders');
    
    // Load orders with customer denormalization
    const orderStmt = sourceDb.prepare(`
      SELECT o.order_id, o.customer_id, c.email, c.first_name, o.total_amount, o.status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_id
    `);
    
    const orders = orderStmt.all();
    
    mongoCollection.insertMany(orders.map((order: any) => ({
      orderId: order.order_id,
      customerEmail: order.email,
      customerName: order.first_name,
      amount: order.total_amount,
      status: order.status
    })));

    const allOrders = mongoCollection.find();
    expect(allOrders).toHaveLength(4);
    
    const johnOrders = mongoCollection.find({ customerEmail: 'john@example.com' });
    expect(johnOrders).toHaveLength(2);
    expect(johnOrders[0]).toMatchObject({
      customerName: 'John',
      status: 'completed'
    });
  });

  test('PROJ-708: Detect duplicate email constraints during migration', async () => {
    const mongoCollection = targetDb.collection('customers');
    mongoCollection.createIndex({ email: 1 });

    const stmt = sourceDb.prepare('SELECT email FROM customers');
    const emails = stmt.all().map((row: any) => row.email);
    const uniqueEmails = new Set(emails);

    expect(uniqueEmails.size).toBe(emails.length);
    expect(emails.filter((email: string) => emails.indexOf(email) !== emails.lastIndexOf(email))).toHaveLength(0);
  });

  test('PROJ-709: Calculate ETL quality metrics for MySQL to MongoDB migration', async () => {
    const mongoCustomers = targetDb.collection('customers');
    const mongoBefore = mongoCustomers.countDocuments();

    const mysqlStmt = sourceDb.prepare('SELECT COUNT(*) as count FROM customers');
    const mysqlCount = (mysqlStmt.get() as any).count;

    const dataCompleteness = (mongoBefore / mysqlCount) * 100;
    expect(dataCompleteness).toBe(100);

    const mongoOrders = targetDb.collection('orders');
    const mongoOrderCount = mongoOrders.countDocuments();

    const mysqlOrderStmt = sourceDb.prepare('SELECT COUNT(*) as count FROM orders');
    const mysqlOrderCount = (mysqlOrderStmt.get() as any).count;

    expect(mongoOrderCount).toBe(mysqlOrderCount);

    // Calculate migration coverage
    const totalRecords = mongoBefore + mongoOrderCount;
    const migrationCoverage = {
      customersLoaded: mongoBefore,
      ordersLoaded: mongoOrderCount,
      totalRecords: totalRecords,
      coveragePercent: (totalRecords / (mysqlCount + mysqlOrderCount)) * 100
    };

    expect(migrationCoverage.coveragePercent).toBe(100);
  });

  test('PROJ-710: Measure ETL throughput for MySQL to MongoDB migration', async () => {
    const mongoCollection = targetDb.collection('test_perf');

    // Simulate bulk load performance test
    const startTime = Date.now();
    const recordCount = 1000;

    const testDocs = Array.from({ length: recordCount }, (_, i) => ({
      id: i,
      name: `customer_${i}`,
      email: `customer${i}@example.com`,
      value: Math.random() * 1000,
      timestamp: new Date()
    }));

    mongoCollection.insertMany(testDocs);
    
    const endTime = Date.now();
    const elapsedMs = endTime - startTime;
    const throughput = (recordCount / elapsedMs) * 1000; // records per second

    expect(mongoCollection.countDocuments()).toBe(recordCount);
    expect(throughput).toBeGreaterThan(100); // At least 100 records/sec
  });

  test('PROJ-711: Validate schema mapping transformation rules', async () => {
    // Verify transformation rules applied correctly
    const mysqlCustomer = sourceDb.prepare('SELECT * FROM customers WHERE email = ?').get('john@example.com');
    
    const mongoCollection = targetDb.collection('customers');
    const mongoCustomer = mongoCollection.findOne({ email: 'john@example.com' });

    // Verify field mapping
    expect(mongoCustomer).toBeDefined();
    expect(mongoCustomer!.firstName).toBe(mysqlCustomer.first_name);
    expect(mongoCustomer!.lastName).toBe(mysqlCustomer.last_name);
    
    // Verify nested structure creation
    if (mysqlCustomer.city) {
      expect(mongoCustomer!.location).toEqual({
        city: mysqlCustomer.city,
        country: mysqlCustomer.country
      });
    }
  });

  test('PROJ-712: End-to-end MySQL to MongoDB ETL validation', async () => {
    // Comprehensive ETL validation
    const mysqlCustomerCount = (sourceDb.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;
    const mysqlOrderCount = (sourceDb.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;

    const mongoCustomerCollection = targetDb.collection('customers');
    const mongoOrderCollection = targetDb.collection('orders');

    const mongoCustomerCount = mongoCustomerCollection.countDocuments();
    const mongoOrderCount = mongoOrderCollection.countDocuments();

    // Verify counts match
    expect(mongoCustomerCount).toBe(mysqlCustomerCount);
    expect(mongoOrderCount).toBe(mysqlOrderCount);

    // Verify data samples are consistent
    const mysqlSample = sourceDb.prepare('SELECT * FROM customers LIMIT 1').get();
    const mongoSample = mongoCustomerCollection.find().slice(0, 1)[0];

    expect(mongoSample.email).toBe(mysqlSample.email);
    
    // Verify transformation applied
    expect(mongoSample.firstName).toBeDefined();
    expect(mongoSample.lastName).toBeDefined();

    console.log(`✓ MySQL: ${mysqlCustomerCount} customers, ${mysqlOrderCount} orders`);
    console.log(`✓ MongoDB: ${mongoCustomerCount} customers, ${mongoOrderCount} orders`);
    console.log(`✓ ETL migration validation passed`);
  });
});
