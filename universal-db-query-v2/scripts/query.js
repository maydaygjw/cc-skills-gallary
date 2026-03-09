#!/usr/bin/env node
/**
 * Execute SQL query
 * Usage: node query.js "SELECT * FROM orders LIMIT 10"
 */

const { DatabaseManager } = require('../lib/db');
const { SchemaDiscovery } = require('../lib/schema');
const { QueryBuilder } = require('../lib/query-builder');

async function main() {
  const sql = process.argv[2];

  if (!sql) {
    console.log('Usage: node query.js "SELECT * FROM orders LIMIT 10"');
    process.exit(1);
  }

  const db = new DatabaseManager();

  try {
    await db.connect();
    console.log('Connected to database.\n');

    const rows = await db.query(sql);

    // Load schema for formatting
    const discovery = new SchemaDiscovery(db);
    const schema = await discovery.getSchema();
    const builder = new QueryBuilder(schema, db.getType());

    console.log('Results:');
    console.log(builder.formatResults(rows));
    console.log(`\nTotal rows: ${rows.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
