#!/usr/bin/env node
/**
 * Table Filter Feature Test
 * Demonstrates the table filtering functionality
 */

const fs = require('fs');
const path = require('path');

const TEST_DB = './test-filter.db';
const CONFIG_BACKUP = './udq-config.yaml.backup';
const CONFIG_FILE = './udq-config.yaml';

async function setupTestDatabase() {
  console.log('Setting up test database...');

  // Remove existing test db
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }

  const Database = require('better-sqlite3');
  const db = new Database(TEST_DB);

  // Create various tables
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL);
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
    CREATE TABLE admin_logs (id INTEGER PRIMARY KEY, action TEXT, created_at DATETIME);
    CREATE TABLE password_hashes (id INTEGER PRIMARY KEY, hash TEXT);
    CREATE TABLE report_daily (id INTEGER PRIMARY KEY, date TEXT, total REAL);
    CREATE TABLE report_monthly (id INTEGER PRIMARY KEY, month TEXT, total REAL);
    CREATE TABLE temp_data (id INTEGER PRIMARY KEY, data TEXT);

    INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
    INSERT INTO orders VALUES (1, 1, 100.00), (2, 2, 200.00);
    INSERT INTO products VALUES (1, 'Product A', 50.00), (2, 'Product B', 75.00);
    INSERT INTO admin_logs VALUES (1, 'LOGIN', datetime('now'));
    INSERT INTO password_hashes VALUES (1, 'secret_hash_123');
    INSERT INTO report_daily VALUES (1, '2024-01-01', 1000.00);
    INSERT INTO report_monthly VALUES (1, '2024-01', 30000.00);
    INSERT INTO temp_data VALUES (1, 'temporary');
  `);

  db.close();
  console.log('✓ Test database created with 8 tables');
}

function createConfig(tableFilter) {
  const config = {
    database: {
      type: 'sqlite',
      database: TEST_DB
    },
    options: {
      cache_enabled: true,
      readonly_mode: true,
      max_query_results: 100,
      table_filter: tableFilter
    }
  };

  fs.writeFileSync(CONFIG_FILE, require('yaml').stringify(config));
}

function backupOriginalConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.renameSync(CONFIG_FILE, CONFIG_BACKUP);
    console.log('✓ Original config backed up');
  }
}

function restoreOriginalConfig() {
  if (fs.existsSync(CONFIG_BACKUP)) {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    fs.renameSync(CONFIG_BACKUP, CONFIG_FILE);
    console.log('✓ Original config restored');
  }
}

async function testWhitelistMode() {
  console.log('\n=== Test 1: Whitelist Mode ===');
  console.log('Config: mode=whitelist, tables=[users,orders], patterns=[report_*]');

  createConfig({
    mode: 'whitelist',
    listed_tables: ['users', 'orders'],
    patterns: ['report_*']
  });

  // Clear require cache to reload modules with new config
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const { SchemaDiscovery } = require('./lib/schema');

  const dbManager = new DatabaseManager();

  // Test 1.1: Schema discovery should only include allowed tables
  console.log('\n1.1 Testing schema discovery (whitelist)...');
  const schemaDiscovery = new SchemaDiscovery(dbManager);
  await dbManager.connect();
  const schema = await schemaDiscovery.discover(true);
  const tableNames = Object.keys(schema.tables).sort();
  console.log('   Discovered tables:', tableNames.join(', '));

  const expected = ['orders', 'report_daily', 'report_monthly', 'users'];
  const match = JSON.stringify(tableNames) === JSON.stringify(expected);
  console.log('   Expected:', expected.join(', '));
  console.log('   ✓ Schema filter working:', match ? 'PASS' : 'FAIL');

  // Test 1.2: Allowed queries should work
  console.log('\n1.2 Testing allowed queries...');
  for (const table of ['users', 'orders', 'report_daily']) {
    try {
      const result = await dbManager.query(`SELECT * FROM ${table}`);
      console.log(`   ✓ SELECT FROM ${table}: allowed (${result.length} rows)`);
    } catch (e) {
      console.log(`   ✗ SELECT FROM ${table}: FAILED - ${e.message.split('\n')[0]}`);
    }
  }

  // Test 1.3: Blocked queries should fail
  console.log('\n1.3 Testing blocked queries...');
  for (const table of ['admin_logs', 'password_hashes', 'temp_data']) {
    try {
      await dbManager.query(`SELECT * FROM ${table}`);
      console.log(`   ✗ SELECT FROM ${table}: SHOULD HAVE BEEN BLOCKED!`);
    } catch (e) {
      console.log(`   ✓ SELECT FROM ${table}: correctly blocked`);
    }
  }

  // Test 1.4: JOIN with blocked table should fail
  console.log('\n1.4 Testing JOIN with blocked table...');
  try {
    await dbManager.query('SELECT * FROM users JOIN temp_data ON users.id = temp_data.id');
    console.log('   ✗ JOIN with temp_data: SHOULD HAVE BEEN BLOCKED!');
  } catch (e) {
    console.log('   ✓ JOIN with temp_data: correctly blocked');
  }

  await dbManager.close();
}

async function testBlacklistMode() {
  console.log('\n=== Test 2: Blacklist Mode ===');
  console.log('Config: mode=blacklist, tables=[admin_logs,password_hashes,temp_data]');

  createConfig({
    mode: 'blacklist',
    listed_tables: ['admin_logs', 'password_hashes', 'temp_data']
  });

  // Clear require cache
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const dbManager = new DatabaseManager();
  await dbManager.connect();

  // Test 2.1: Allowed queries (not in blacklist)
  console.log('\n2.1 Testing allowed queries (not in blacklist)...');
  for (const table of ['users', 'orders', 'products', 'report_daily']) {
    try {
      const result = await dbManager.query(`SELECT * FROM ${table}`);
      console.log(`   ✓ SELECT FROM ${table}: allowed (${result.length} rows)`);
    } catch (e) {
      console.log(`   ✗ SELECT FROM ${table}: FAILED - ${e.message.split('\n')[0]}`);
    }
  }

  // Test 2.2: Blocked queries (in blacklist)
  console.log('\n2.2 Testing blocked queries (in blacklist)...');
  for (const table of ['admin_logs', 'password_hashes', 'temp_data']) {
    try {
      await dbManager.query(`SELECT * FROM ${table}`);
      console.log(`   ✗ SELECT FROM ${table}: SHOULD HAVE BEEN BLOCKED!`);
    } catch (e) {
      console.log(`   ✓ SELECT FROM ${table}: correctly blocked`);
    }
  }

  await dbManager.close();
}

async function testNoFilter() {
  console.log('\n=== Test 3: No Filter (All Tables Allowed) ===');
  console.log('Config: no table_filter defined');

  createConfig(null);

  // Clear require cache
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const { SchemaDiscovery } = require('./lib/schema');

  const dbManager = new DatabaseManager();
  await dbManager.connect();
  const schemaDiscovery = new SchemaDiscovery(dbManager);

  // Test 3.1: All tables should be discovered
  console.log('\n3.1 Testing schema discovery (no filter)...');
  const schema = await schemaDiscovery.discover(true);
  const tableNames = Object.keys(schema.tables);
  console.log('   Discovered tables:', tableNames.length, 'tables');
  console.log('   ✓ All tables discovered:', tableNames.length === 8 ? 'PASS' : 'FAIL');

  // Test 3.2: All queries should work
  console.log('\n3.2 Testing queries on all tables...');
  const allTables = ['users', 'orders', 'products', 'admin_logs', 'password_hashes', 'report_daily', 'report_monthly', 'temp_data'];
  let allPassed = true;

  for (const table of allTables) {
    try {
      const result = await dbManager.query(`SELECT * FROM ${table}`);
      console.log(`   ✓ SELECT FROM ${table}: allowed (${result.length} rows)`);
    } catch (e) {
      console.log(`   ✗ SELECT FROM ${table}: FAILED`);
      allPassed = false;
    }
  }
  console.log('   ✓ All queries allowed:', allPassed ? 'PASS' : 'FAIL');

  await dbManager.close();
}

async function cleanup() {
  console.log('\n=== Cleanup ===');

  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
    console.log('✓ Test database removed');
  }
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    console.log('✓ Test config removed');
  }
  if (fs.existsSync('./.udq-cache')) {
    fs.rmSync('./.udq-cache', { recursive: true });
    console.log('✓ Cache directory removed');
  }

  restoreOriginalConfig();
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Universal DB Query V2 - Table Filter Test              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    backupOriginalConfig();
    await setupTestDatabase();
    await testWhitelistMode();
    await testBlacklistMode();
    await testNoFilter();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     ✓ All tests completed!                                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await cleanup();
  }
}

main();
