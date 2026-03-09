#!/usr/bin/env node
/**
 * Discover database schema and cache it
 * Usage: node discover-schema.js [--refresh]
 */

const { DatabaseManager } = require('../lib/db');
const { SchemaDiscovery } = require('../lib/schema');

async function main() {
  const forceRefresh = process.argv.includes('--refresh');

  const db = new DatabaseManager();

  try {
    await db.connect();
    console.log('Connected to database.\n');

    const discovery = new SchemaDiscovery(db);
    const schema = await discovery.getSchema(forceRefresh);

    console.log('\n=== Schema Summary ===');
    console.log(`Database: ${schema.database}`);
    console.log(`Type: ${schema.type}`);
    console.log(`Discovered at: ${schema.discovered_at}`);
    console.log(`\nTables: ${Object.keys(schema.tables).length}`);

    for (const [name, info] of Object.entries(schema.tables)) {
      console.log(`  - ${name}: ${info.columns.length} columns${info.comment ? ` (${info.comment})` : ''}`);
    }

    if (schema.relations.length > 0) {
      console.log(`\nRelations: ${schema.relations.length}`);
      for (const rel of schema.relations) {
        console.log(`  - ${rel.table_name}.${rel.column_name} → ${rel.ref_table}.${rel.ref_column}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
