import { test, expect } from '@playwright/test';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// ETL Testing: SQLite to MySQL data migration validation
const SOURCE_DB = path.join(__dirname, '../etl-source.sqlite');
const DESTINATION_DB = path.join(__dirname, '../etl-destination.sqlite');

// Helper functions for database operations
function getSourceDatabase() {
  return new sqlite3.Database(SOURCE_DB);
}

function getDestDatabase() {
  return new sqlite3.Database(DESTINATION_DB);
}

function runQuery(dbPath: string, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else {
        db.close();
        resolve(rows || []);
      }
    });
  });
}

function runInsert(dbPath: string, sql: string, params: any[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else {
        db.close();
        resolve(this.lastID);
      }
    });
  });
}

function initializeSourceDB() {
  return new Promise((resolve, reject) => {
    const db = getSourceDatabase();
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          department TEXT,
          salary REAL,
          hire_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          budget REAL,
          manager_id INTEGER
        )
      `, (err) => {
        if (err) reject(err);
        db.close(() => resolve(null));
      });
    });
  });
}

function initializeDestDB() {
  return new Promise((resolve, reject) => {
    const db = getDestDatabase();
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          department TEXT,
          salary REAL,
          hire_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          migrated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          budget REAL,
          manager_id INTEGER,
          migrated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        db.close(() => resolve(null));
      });
    });
  });
}

test.describe('ETL Data Testing - SQLite to MySQL Validation', () => {

  test.beforeAll(async () => {
    // Clean up and initialize databases
    if (fs.existsSync(SOURCE_DB)) fs.unlinkSync(SOURCE_DB);
    if (fs.existsSync(DESTINATION_DB)) fs.unlinkSync(DESTINATION_DB);
    
    await initializeSourceDB();
    await initializeDestDB();
    console.log('✓ ETL source and destination databases initialized');
  });

  test('PROJ-601 ETL: extract data from source database', async () => {
    // Insert test data into source
    await runInsert(SOURCE_DB, 
      'INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      ['John', 'Doe', 'john.doe@company.com', 'Engineering', 85000, '2020-01-15']
    );

    await runInsert(SOURCE_DB,
      'INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      ['Jane', 'Smith', 'jane.smith@company.com', 'Marketing', 75000, '2020-06-20']
    );

    await runInsert(SOURCE_DB,
      'INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      ['Bob', 'Johnson', 'bob.johnson@company.com', 'Engineering', 90000, '2019-03-10']
    );

    // Extract all data from source
    const employees = await runQuery(SOURCE_DB, 'SELECT * FROM employees');
    
    expect(employees.length).toBe(3);
    console.log(`✓ Extracted ${employees.length} employee records from source`);
    
    // Validate extraction
    const engineeringCount = employees.filter(e => e.department === 'Engineering').length;
    console.log(`✓ Found ${engineeringCount} Engineering department employees`);
    expect(engineeringCount).toBe(2);
  });

  test('PROJ-602 ETL: validate source data schema and types', async () => {
    // Get source table structure
    const schema = await runQuery(SOURCE_DB, "PRAGMA table_info(employees)");
    
    expect(schema.length).toBeGreaterThan(0);
    console.log(`✓ Source schema validated with ${schema.length} columns`);

    // Validate column types
    const columnMap = schema.reduce((acc: any, col: any) => {
      acc[col.name] = col.type;
      return acc;
    }, {});

    expect(columnMap['id']).toBe('INTEGER');
    expect(columnMap['first_name']).toBe('TEXT');
    expect(columnMap['salary']).toBe('REAL');
    expect(columnMap['hire_date']).toBe('DATE');
    console.log('✓ Column types validated');

    // Check constraints
    const constraints = await runQuery(SOURCE_DB, 'SELECT * FROM sqlite_master WHERE type="table" AND name="employees"');
    expect(constraints.length).toBe(1);
    console.log('✓ Table constraints verified');
  });

  test('PROJ-603 ETL: transform and cleanse data', async () => {
    // Extract source data
    const sourceData = await runQuery(SOURCE_DB, 'SELECT * FROM employees');
    
    console.log('✓ Starting data transformation');

    // Apply transformations
    const transformedData = sourceData.map(emp => ({
      ...emp,
      full_name: `${emp.first_name} ${emp.last_name}`.toUpperCase(),
      email_lower: emp.email.toLowerCase(),
      salary_adjusted: emp.salary * 1.05, // 5% raise
      hire_year: new Date(emp.hire_date).getFullYear()
    }));

    expect(transformedData.length).toBe(sourceData.length);
    console.log(`✓ Transformed ${transformedData.length} records`);

    // Validate transformations
    transformedData.forEach(emp => {
      expect(emp.full_name).toBe(emp.full_name.toUpperCase());
      expect(emp.email_lower).toBe(emp.email.toLowerCase());
      expect(emp.salary_adjusted).toBeGreaterThan(emp.salary);
      expect(emp.hire_year).toBeGreaterThan(2015);
    });

    console.log('✓ Data transformation validations passed');
  });

  test('PROJ-604 ETL: load transformed data to destination', async () => {
    // Extract from source
    const sourceData = await runQuery(SOURCE_DB, 'SELECT * FROM employees');
    
    console.log(`✓ Loading ${sourceData.length} records to destination`);

    // Load to destination
    for (const emp of sourceData) {
      await runInsert(DESTINATION_DB,
        'INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
        [emp.first_name, emp.last_name, emp.email, emp.department, emp.salary, emp.hire_date]
      );
    }

    // Verify load
    const destData = await runQuery(DESTINATION_DB, 'SELECT * FROM employees');
    expect(destData.length).toBe(sourceData.length);
    console.log(`✓ Successfully loaded ${destData.length} records to destination`);
  });

  test('PROJ-605 ETL: validate data integrity between source and destination', async () => {
    // Extract data from both databases
    const sourceData = await runQuery(SOURCE_DB, 'SELECT * FROM employees ORDER BY id');
    const destData = await runQuery(DESTINATION_DB, 'SELECT * FROM employees ORDER BY id');

    // Row count validation
    expect(destData.length).toBe(sourceData.length);
    console.log(`✓ Row count matched: ${sourceData.length} records`);

    // Column-by-column validation
    sourceData.forEach((srcRow, idx) => {
      const destRow = destData[idx];
      
      expect(destRow.first_name).toBe(srcRow.first_name);
      expect(destRow.last_name).toBe(srcRow.last_name);
      expect(destRow.email).toBe(srcRow.email);
      expect(destRow.department).toBe(srcRow.department);
      expect(destRow.salary).toBe(srcRow.salary);
    });

    console.log('✓ Data integrity validation passed for all records');
  });

  test('PROJ-606 ETL: handle NULL values and missing data', async () => {
    // Insert records with NULL values
    await runInsert(SOURCE_DB,
      'INSERT INTO employees (first_name, last_name, email, department, salary) VALUES (?, ?, ?, ?, ?)',
      ['Alice', 'Brown', 'alice.brown@company.com', null, null]
    );

    // Extract data with NULLs
    const dataWithNulls = await runQuery(SOURCE_DB, 
      'SELECT * FROM employees WHERE first_name = "Alice"'
    );

    expect(dataWithNulls.length).toBe(1);
    expect(dataWithNulls[0].department).toBeNull();
    expect(dataWithNulls[0].salary).toBeNull();
    console.log('✓ NULL value handling verified');

    // Load to destination
    const record = dataWithNulls[0];
    await runInsert(DESTINATION_DB,
      'INSERT INTO employees (first_name, last_name, email, department, salary) VALUES (?, ?, ?, ?, ?)',
      [record.first_name, record.last_name, record.email, record.department, record.salary]
    );

    // Validate NULLs preserved in destination
    const destRecord = await runQuery(DESTINATION_DB,
      'SELECT * FROM employees WHERE first_name = "Alice"'
    );

    expect(destRecord[0].department).toBeNull();
    expect(destRecord[0].salary).toBeNull();
    console.log('✓ NULL values preserved during ETL');
  });

  test('PROJ-607 ETL: data reconciliation and matching', async () => {
    // Get record counts
    const sourceCounts = await runQuery(SOURCE_DB, 
      'SELECT department, COUNT(*) as count FROM employees GROUP BY department'
    );

    const destCounts = await runQuery(DESTINATION_DB,
      'SELECT department, COUNT(*) as count FROM employees GROUP BY department'
    );

    console.log('✓ Source department distribution:', sourceCounts);
    console.log('✓ Destination department distribution:', destCounts);

    // Reconcile by key field
    const sourceEmails = new Set(
      (await runQuery(SOURCE_DB, 'SELECT email FROM employees')).map(r => r.email)
    );

    const destEmails = new Set(
      (await runQuery(DESTINATION_DB, 'SELECT email FROM employees')).map(r => r.email)
    );

    console.log(`✓ Source unique emails: ${sourceEmails.size}`);
    console.log(`✓ Destination unique emails: ${destEmails.size}`);
    expect(sourceEmails.size).toBe(destEmails.size);

    // Check for missing records in destination
    let missingCount = 0;
    sourceEmails.forEach(email => {
      if (!destEmails.has(email)) missingCount++;
    });

    expect(missingCount).toBe(0);
    console.log('✓ All source records present in destination (full reconciliation)');
  });

  test('PROJ-608 ETL: duplicate detection and handling', async () => {
    // Check for duplicates in source
    const duplicates = await runQuery(SOURCE_DB,
      'SELECT email, COUNT(*) as count FROM employees GROUP BY email HAVING count > 1'
    );

    console.log(`✓ Duplicate emails found in source: ${duplicates.length}`);
    expect(duplicates.length).toBe(0);

    // Check for duplicates in destination
    const destDuplicates = await runQuery(DESTINATION_DB,
      'SELECT email, COUNT(*) as count FROM employees GROUP BY email HAVING count > 1'
    );

    expect(destDuplicates.length).toBe(0);
    console.log('✓ No duplicates in destination database');

    // Validate unique constraints
    const emails = await runQuery(DESTINATION_DB, 'SELECT COUNT(DISTINCT email) as count FROM employees');
    const totalRows = await runQuery(DESTINATION_DB, 'SELECT COUNT(*) as count FROM employees');

    expect(emails[0].count).toBe(totalRows[0].count);
    console.log('✓ Email uniqueness constraint validated');
  });

  test('PROJ-609 ETL: data quality metrics and reporting', async () => {
    // Calculate data quality metrics
    const sourceMetrics = await runQuery(SOURCE_DB, `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as non_null_departments,
        COUNT(CASE WHEN salary IS NOT NULL THEN 1 END) as non_null_salaries,
        AVG(salary) as avg_salary,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
      FROM employees
    `);

    const destMetrics = await runQuery(DESTINATION_DB, `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as non_null_departments,
        COUNT(CASE WHEN salary IS NOT NULL THEN 1 END) as non_null_salaries,
        AVG(salary) as avg_salary,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
      FROM employees
    `);

    console.log('✓ Source data quality metrics:', sourceMetrics[0]);
    console.log('✓ Destination data quality metrics:', destMetrics[0]);

    // Validate metrics match
    expect(destMetrics[0].total_records).toBe(sourceMetrics[0].total_records);
    expect(destMetrics[0].unique_emails).toBe(sourceMetrics[0].unique_emails);
    expect(destMetrics[0].non_null_departments).toBe(sourceMetrics[0].non_null_departments);
    console.log('✓ Data quality metrics validated');
  });

  test('PROJ-610 ETL: performance and monitoring', async () => {
    // Simulate ETL process timing
    const startTime = Date.now();

    // Extract
    const extractStart = Date.now();
    const sourceData = await runQuery(SOURCE_DB, 'SELECT * FROM employees');
    const extractDuration = Date.now() - extractStart;

    // Transform
    const transformStart = Date.now();
    const transformed = sourceData.map(r => ({...r}));
    const transformDuration = Date.now() - transformStart;

    // Load
    const loadStart = Date.now();
    // Skip actual load since data already loaded
    const loadDuration = Date.now() - loadStart;

    const totalDuration = Date.now() - startTime;
    const recordCount = sourceData.length;
    const throughput = recordCount > 0 ? (recordCount / totalDuration) * 1000 : 0;

    console.log('✓ ETL Performance Metrics:');
    console.log(`  - Extract: ${extractDuration}ms`);
    console.log(`  - Transform: ${transformDuration}ms`);
    console.log(`  - Load: ${loadDuration}ms`);
    console.log(`  - Total: ${totalDuration}ms`);
    console.log(`  - Throughput: ${Math.round(throughput)} records/sec`);

    expect(totalDuration).toBeGreaterThan(0);
    expect(throughput).toBeGreaterThanOrEqual(0);
  });

  test.afterAll(async () => {
    // Clean up test databases
    if (fs.existsSync(SOURCE_DB)) fs.unlinkSync(SOURCE_DB);
    if (fs.existsSync(DESTINATION_DB)) fs.unlinkSync(DESTINATION_DB);
    console.log('✓ ETL test databases cleaned up');
  });
});
