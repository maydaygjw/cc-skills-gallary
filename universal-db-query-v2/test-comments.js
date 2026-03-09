#!/usr/bin/env node
/**
 * Comments Override Feature Test
 * Demonstrates the comments override functionality
 */

const fs = require('fs');
const path = require('path');

const TEST_DB = './test-comments.db';
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

  // Create tables WITHOUT any comments (SQLite doesn't support column comments)
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      order_no TEXT,
      amount REAL,
      state INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO users VALUES
      (1, 'Alice', 'alice@example.com', 1, datetime('now')),
      (2, 'Bob', 'bob@example.com', 2, datetime('now'));

    INSERT INTO orders VALUES
      (1, 1, 'ORD001', 100.00, 1, datetime('now')),
      (2, 2, 'ORD002', 200.00, 2, datetime('now'));
  `);

  db.close();
  console.log('✓ Test database created (no comments in database)');
}

function createConfigWithComments() {
  const config = {
    database: {
      type: 'sqlite',
      database: TEST_DB
    },
    options: {
      cache_enabled: true,
      readonly_mode: true,
      max_query_results: 100,
      comments: {
        tables: {
          users: '用户表 - 存储注册用户基本信息',
          orders: '订单表 - 存储用户订单数据'
        },
        columns: {
          'users.id': '用户唯一标识ID',
          'users.name': '用户昵称',
          'users.email': '用户邮箱地址',
          'users.status': '用户状态：1正常 2禁用 3删除',
          'users.created_at': '注册时间',
          'orders.id': '订单ID',
          'orders.user_id': '关联用户ID',
          'orders.order_no': '订单编号',
          'orders.amount': '订单总金额（元）',
          'orders.state': '订单状态：1待付款 2已付款 3已发货 4已完成 5已取消',
          'orders.created_at': '下单时间'
        }
      }
    }
  };

  fs.writeFileSync(CONFIG_FILE, require('yaml').stringify(config));
}

function createConfigWithoutComments() {
  const config = {
    database: {
      type: 'sqlite',
      database: TEST_DB
    },
    options: {
      cache_enabled: true,
      readonly_mode: true,
      max_query_results: 100
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

async function testWithConfigComments() {
  console.log('\n=== Test 1: With Config Comments ===');
  console.log('Config: comments.tables and comments.columns defined');

  createConfigWithComments();

  // Clear require cache
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const { SchemaDiscovery } = require('./lib/schema');

  const dbManager = new DatabaseManager();
  await dbManager.connect();
  const schemaDiscovery = new SchemaDiscovery(dbManager);

  // Test 1.1: Schema discovery should include config comments
  console.log('\n1.1 Testing schema discovery with config comments...');
  const schema = await schemaDiscovery.discover(true);

  console.log('\n   Tables discovered:');
  for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
    console.log(`   - ${tableName}: ${tableInfo.comment || '(no comment)'}`);
  }

  // Test 1.2: Verify table comments
  console.log('\n1.2 Verifying table comments...');
  const usersTable = schema.tables.users;
  const ordersTable = schema.tables.orders;

  const usersCommentOK = usersTable.comment === '用户表 - 存储注册用户基本信息';
  const ordersCommentOK = ordersTable.comment === '订单表 - 存储用户订单数据';

  console.log(`   users table comment: ${usersTable.comment}`);
  console.log(`   ✓ Table comment from config: ${usersCommentOK ? 'PASS' : 'FAIL'}`);
  console.log(`   orders table comment: ${ordersTable.comment}`);
  console.log(`   ✓ Table comment from config: ${ordersCommentOK ? 'PASS' : 'FAIL'}`);

  // Test 1.3: Verify column comments
  console.log('\n1.3 Verifying column comments...');

  const usersIdCol = usersTable.columns.find(c => c.name === 'id');
  const usersStatusCol = usersTable.columns.find(c => c.name === 'status');
  const ordersStateCol = ordersTable.columns.find(c => c.name === 'state');

  console.log(`   users.id comment: ${usersIdCol?.comment}`);
  console.log(`   ✓ Column comment from config: ${usersIdCol?.comment === '用户唯一标识ID' ? 'PASS' : 'FAIL'}`);

  console.log(`   users.status comment: ${usersStatusCol?.comment}`);
  console.log(`   ✓ Column comment with enum: ${usersStatusCol?.comment?.includes('1正常') ? 'PASS' : 'FAIL'}`);

  console.log(`   orders.state comment: ${ordersStateCol?.comment}`);
  console.log(`   ✓ Column comment with enum: ${ordersStateCol?.comment?.includes('1待付款') ? 'PASS' : 'FAIL'}`);

  await dbManager.close();
}

async function testWithoutConfigComments() {
  console.log('\n=== Test 2: Without Config Comments ===');
  console.log('Config: no comments defined');

  createConfigWithoutComments();

  // Clear require cache
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const { SchemaDiscovery } = require('./lib/schema');

  const dbManager = new DatabaseManager();
  await dbManager.connect();
  const schemaDiscovery = new SchemaDiscovery(dbManager);

  // Test 2.1: Schema discovery without config comments
  console.log('\n2.1 Testing schema discovery without config comments...');
  const schema = await schemaDiscovery.discover(true);

  console.log('\n   Tables discovered:');
  for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
    console.log(`   - ${tableName}: ${tableInfo.comment || '(no comment - as expected)'}`);
  }

  // Test 2.2: Verify no comments
  console.log('\n2.2 Verifying no comments (expected)...');
  const usersTable = schema.tables.users;
  const usersIdCol = usersTable.columns.find(c => c.name === 'id');

  console.log(`   users table comment: "${usersTable.comment}"`);
  console.log(`   ✓ Empty comment as expected: ${usersTable.comment === '' ? 'PASS' : 'FAIL'}`);

  console.log(`   users.id comment: "${usersIdCol?.comment}"`);
  console.log(`   ✓ Empty comment as expected: ${usersIdCol?.comment === '' ? 'PASS' : 'FAIL'}`);

  await dbManager.close();
}

async function testCommentOverride() {
  console.log('\n=== Test 3: Comment Override Priority ===');
  console.log('Testing: Config comment should override database comment');

  // Create a config with comments (simulating override)
  const config = {
    database: {
      type: 'sqlite',
      database: TEST_DB
    },
    options: {
      cache_enabled: true,
      readonly_mode: true,
      max_query_results: 100,
      comments: {
        tables: {
          users: '【配置覆盖】用户表 - 这是从配置读取的注释'
        }
      }
    }
  };

  fs.writeFileSync(CONFIG_FILE, require('yaml').stringify(config));

  // Clear require cache
  delete require.cache[require.resolve('./lib/db')];
  delete require.cache[require.resolve('./lib/schema')];

  const { DatabaseManager } = require('./lib/db');
  const { SchemaDiscovery } = require('./lib/schema');

  const dbManager = new DatabaseManager();
  await dbManager.connect();
  const schemaDiscovery = new SchemaDiscovery(dbManager);

  console.log('\n3.1 Testing comment override...');
  const schema = await schemaDiscovery.discover(true);

  const usersTable = schema.tables.users;
  console.log(`   users table comment: ${usersTable.comment}`);
  console.log(`   ✓ Config overrides DB: ${usersTable.comment?.includes('【配置覆盖】') ? 'PASS' : 'FAIL'}`);

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
  console.log('║     Universal DB Query V2 - Comments Override Test         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    backupOriginalConfig();
    await setupTestDatabase();
    await testWithConfigComments();
    await testWithoutConfigComments();
    await testCommentOverride();

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
