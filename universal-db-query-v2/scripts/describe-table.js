#!/usr/bin/env node
/**
 * Describe table structure
 * Usage: node describe-table.js <table_name>
 */

const { DatabaseManager } = require('../lib/db');
const { SchemaDiscovery } = require('../lib/schema');

async function main() {
  const tableName = process.argv[2];

  if (!tableName) {
    console.log('Usage: node describe-table.js <table_name>');
    process.exit(1);
  }

  const db = new DatabaseManager();

  try {
    await db.connect();
    const discovery = new SchemaDiscovery(db);
    const schema = await discovery.getSchema();

    const tableInfo = schema.tables[tableName];

    if (!tableInfo) {
      console.error(`Table '${tableName}' not found.`);
      console.log('\nAvailable tables:');
      Object.keys(schema.tables).forEach(t => console.log(`  - ${t}`));
      process.exit(1);
    }

    console.log(`\nTable: ${tableName}`);
    if (tableInfo.comment) {
      console.log(`Comment: ${tableInfo.comment}`);
    }
    console.log(`Columns: ${tableInfo.columns.length}\n`);

    console.log('| Column | Type | Nullable | Default | Comment |');
    console.log('|--------|------|----------|---------|---------|');

    for (const col of tableInfo.columns) {
      const comment = col.comment || '';
      const enums = schema.enums?.[tableName]?.[col.name];
      const enumStr = enums ? ` [${Object.entries(enums).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';

      console.log(
        `| ${col.name} | ${col.type} | ${col.nullable ? 'YES' : 'NO'} | ${col.default || '-'} | ${comment}${enumStr} |`
      );
    }

    // Show relations
    const relations = schema.relations.filter(r => r.table_name === tableName);
    if (relations.length > 0) {
      console.log('\nForeign Keys:');
      for (const rel of relations) {
        console.log(`  - ${rel.column_name} → ${rel.ref_table}.${rel.ref_column}`);
      }
    }

    console.log();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
