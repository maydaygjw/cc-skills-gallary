#!/usr/bin/env node
/**
 * List all tables in the database
 * Usage: node list-tables.js
 */

const { DatabaseManager } = require('../lib/db');
const { SchemaDiscovery } = require('../lib/schema');

async function main() {
  const db = new DatabaseManager();

  try {
    await db.connect();
    const discovery = new SchemaDiscovery(db);
    const schema = await discovery.getSchema();

    console.log('Tables:\n');

    const tables = Object.entries(schema.tables);
    if (tables.length === 0) {
      console.log('No tables found.');
      return;
    }

    for (let i = 0; i < tables.length; i++) {
      const [name, info] = tables[i];
      console.log(`${i + 1}. ${name}`);
      if (info.comment) {
        console.log(`   ${info.comment}`);
      }
      console.log(`   ${info.columns.length} columns`);
      console.log();
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
