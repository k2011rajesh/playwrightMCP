import { test, expect } from '@playwright/test';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Initialize SQLite database for testing
const DB_PATH = path.join(__dirname, '../test-db.sqlite');

function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) reject(err);
        db.close(() => resolve(null));
      });
    });
  });
}

function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else {
        db.close();
        resolve(rows || []);
      }
    });
  });
}

function runInsert(sql: string, params: any[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else {
        db.close();
        resolve(this.lastID);
      }
    });
  });
}

test.describe('SQLite Database Testing with Playwright', () => {

  test.beforeAll(async () => {
    // Setup database
    await initializeDatabase();
    console.log('✓ Database initialized');
  });

  test('PROJ-401 SQLite: create record and verify persistence', async () => {
    // Insert a user record
    const userId = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['John Doe', 'john@example.com']
    );
    
    expect(userId).toBeGreaterThan(0);
    console.log(`✓ User created with ID: ${userId}`);

    // Query to verify persistence
    const users = await runQuery(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    expect(users.length).toBe(1);
    expect(users[0].name).toBe('John Doe');
    expect(users[0].email).toBe('john@example.com');
    console.log('✓ Record verified in database');
  });

  test('PROJ-402 SQLite: read and query data from database', async () => {
    // Insert multiple users
    const user1Id = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Alice Smith', 'alice@example.com']
    );
    
    const user2Id = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Bob Johnson', 'bob@example.com']
    );

    // Query all users
    const allUsers = await runQuery('SELECT * FROM users WHERE id IN (?, ?)', [user1Id, user2Id]);
    
    expect(allUsers.length).toBe(2);
    console.log(`✓ Retrieved ${allUsers.length} users from database`);

    // Query specific user by email
    const specificUser = await runQuery(
      'SELECT * FROM users WHERE email = ?',
      ['alice@example.com']
    );
    
    expect(specificUser.length).toBe(1);
    expect(specificUser[0].name).toBe('Alice Smith');
    console.log('✓ Query by email filter successful');
  });

  test('PROJ-403 SQLite: update record and verify changes', async () => {
    // Create initial record
    const userId = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Charlie Brown', 'charlie@example.com']
    );

    // Verify initial data
    let user = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    expect(user[0].name).toBe('Charlie Brown');
    console.log('✓ Initial record created');

    // Update the record
    await new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE users SET name = ? WHERE id = ?',
        ['Charles Brown', userId],
        (err) => {
          if (err) reject(err);
          db.close();
          resolve(null);
        }
      );
    });

    // Verify update
    user = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    expect(user[0].name).toBe('Charles Brown');
    console.log('✓ Record updated and verified');
  });

  test('PROJ-404 SQLite: delete record and verify removal', async () => {
    // Create a record to delete
    const userId = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['David Wilson', 'david@example.com']
    );

    // Verify it exists
    let user = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    expect(user.length).toBe(1);
    console.log('✓ Record created for deletion test');

    // Delete the record
    await new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) reject(err);
        db.close();
        resolve(null);
      });
    });

    // Verify deletion
    user = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    expect(user.length).toBe(0);
    console.log('✓ Record deleted and verified');
  });

  test('PROJ-405 SQLite: foreign key relationships and data integrity', async () => {
    // Create user
    const userId = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Emma Davis', 'emma@example.com']
    );

    // Create multiple tasks for the user
    const task1Id = await runInsert(
      'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'Complete Project', 'Finish the Playwright suite', 'pending']
    );

    const task2Id = await runInsert(
      'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'Write Tests', 'Add more test cases', 'in_progress']
    );

    // Query tasks by user
    const userTasks = await runQuery(
      'SELECT * FROM tasks WHERE user_id = ?',
      [userId]
    );

    expect(userTasks.length).toBe(2);
    expect(userTasks[0].title).toBe('Complete Project');
    expect(userTasks[1].title).toBe('Write Tests');
    console.log(`✓ Foreign key relationship verified: ${userTasks.length} tasks for user ${userId}`);

    // Count tasks by status
    const pendingTasks = await runQuery(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?',
      [userId, 'pending']
    );
    
    expect(pendingTasks[0].count).toBe(1);
    console.log('✓ Task filtering by status working correctly');
  });

  test('PROJ-406 SQLite: aggregation and data analysis queries', async () => {
    // Create multiple users
    const userId1 = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Frank Miller', 'frank@example.com']
    );

    const userId2 = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Grace Lee', 'grace@example.com']
    );

    // Add tasks to both users
    await runInsert(
      'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, ?)',
      [userId1, 'Task 1', 'completed']
    );
    await runInsert(
      'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, ?)',
      [userId1, 'Task 2', 'completed']
    );
    await runInsert(
      'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, ?)',
      [userId2, 'Task 3', 'pending']
    );

    // Count total tasks
    const totalTasks = await runQuery(
      'SELECT COUNT(*) as count FROM tasks'
    );
    expect(totalTasks[0].count).toBeGreaterThanOrEqual(3);
    console.log(`✓ Total tasks in database: ${totalTasks[0].count}`);

    // Get user with most tasks
    const userTaskCounts = await runQuery(`
      SELECT u.id, u.name, COUNT(t.id) as task_count 
      FROM users u 
      LEFT JOIN tasks t ON u.id = t.user_id 
      WHERE u.id IN (?, ?)
      GROUP BY u.id
      ORDER BY task_count DESC
    `, [userId1, userId2]);

    expect(userTaskCounts.length).toBeGreaterThan(0);
    console.log('✓ Aggregation query successful:', userTaskCounts);

    // Get task distribution by status
    const statusDistribution = await runQuery(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);

    expect(statusDistribution.length).toBeGreaterThan(0);
    console.log('✓ Task status distribution:', statusDistribution);
  });

  test('PROJ-407 SQLite: transaction and data consistency', async () => {
    // Test transaction rollback scenario
    const initialUser = await runInsert(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['Henry White', 'henry@example.com']
    );

    // Verify initial state
    let users = await runQuery('SELECT COUNT(*) as count FROM users WHERE id = ?', [initialUser]);
    expect(users[0].count).toBe(1);
    console.log('✓ Initial state verified');

    // Simulate transaction - update and verify
    await new Promise((resolve) => {
      const db = getDatabase();
      db.run('BEGIN TRANSACTION');
      db.run(
        'UPDATE users SET name = ? WHERE id = ?',
        ['Henry Updated', initialUser],
        () => {
          db.run('COMMIT', () => {
            db.close();
            resolve(null);
          });
        }
      );
    });

    // Verify transaction committed
    const updated = await runQuery('SELECT name FROM users WHERE id = ?', [initialUser]);
    expect(updated[0].name).toBe('Henry Updated');
    console.log('✓ Transaction committed successfully');
  });

  test.afterAll(async () => {
    // Clean up database file
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log('✓ Test database cleaned up');
    }
  });
});
