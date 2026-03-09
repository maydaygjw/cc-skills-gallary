/**
 * Schema discovery module
 * Discovers database schema, tables, columns, and relationships
 */

const fs = require('fs');
const path = require('path');
const { CACHE_DIR } = require('./db');

const CACHE_FILE = path.join(CACHE_DIR, 'schema.json');

class SchemaDiscovery {
  constructor(dbManager) {
    this.db = dbManager;
  }

  /**
   * Discover full database schema
   */
  async discover() {
    const dbType = this.db.getType();
    const databaseName = this.db.getDatabaseName();

    console.log(`Discovering schema for ${dbType} database: ${databaseName}...`);

    const tables = await this.discoverTables();
    const relations = await this.discoverRelations();
    const enums = await this.discoverEnums(tables);

    const schema = {
      database: databaseName,
      type: dbType,
      discovered_at: new Date().toISOString(),
      tables,
      relations,
      enums,
    };

    // Save cache
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(schema, null, 2));
    console.log(`Schema cached to ${CACHE_FILE}`);

    return schema;
  }

  /**
   * Discover all tables
   */
  async discoverTables() {
    const dbType = this.db.getType();
    let sql;

    switch (dbType) {
      case 'mysql':
        sql = `
          SELECT
            TABLE_NAME as name,
            TABLE_COMMENT as comment
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME
        `;
        break;

      case 'postgresql':
      case 'postgres':
        sql = `
          SELECT
            t.table_name as name,
            pg_catalog.obj_description(pgc.oid, 'pg_class') as comment
          FROM information_schema.tables t
          JOIN pg_catalog.pg_class pgc ON pgc.relname = t.table_name
          WHERE t.table_schema = 'public'
          ORDER BY t.table_name
        `;
        break;

      case 'sqlite':
        sql = `
          SELECT
            name,
            '' as comment
          FROM sqlite_master
          WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `;
        break;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    // Use queryInternal for schema discovery to bypass table filter
    // (we need to query system tables to discover user tables)
    // Note: SQLite doesn't use parameters in the query, while MySQL/PostgreSQL do
    const params = (dbType === 'sqlite') ? [] : [this.db.getDatabaseName()];
    const rows = await this.db.queryInternal(sql, params);
    const tables = {};

    for (const row of rows) {
      const tableName = row.name || row.TABLE_NAME;

      // Check if table is allowed by filter
      if (!this.db.isTableAllowed(tableName)) {
        console.log(`  Skipping filtered table: ${tableName}`);
        continue;
      }

      // Get database comment and config comment, prefer config if available
      const dbComment = row.comment || row.TABLE_COMMENT || '';
      const configComment = this.db.getTableComment(tableName);
      const finalComment = configComment || dbComment;

      tables[tableName] = {
        comment: finalComment,
        columns: await this.discoverColumns(tableName),
      };
    }

    return tables;
  }

  /**
   * Discover columns for a table
   */
  async discoverColumns(tableName) {
    const dbType = this.db.getType();
    let sql;
    let params = [];

    switch (dbType) {
      case 'mysql':
        sql = `
          SELECT
            COLUMN_NAME as name,
            DATA_TYPE as type,
            COLUMN_COMMENT as comment,
            IS_NULLABLE as nullable,
            COLUMN_DEFAULT as default_value,
            ORDINAL_POSITION as position
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `;
        params = [this.db.getDatabaseName(), tableName];
        break;

      case 'postgresql':
      case 'postgres':
        sql = `
          SELECT
            c.column_name as name,
            c.data_type as type,
            pg_catalog.col_description(pgc.oid, a.attnum) as comment,
            c.is_nullable as nullable,
            c.column_default as default_value,
            c.ordinal_position as position
          FROM information_schema.columns c
          JOIN pg_catalog.pg_class pgc ON pgc.relname = c.table_name
          JOIN pg_catalog.pg_attribute a ON a.attrelid = pgc.oid AND a.attname = c.column_name
          WHERE c.table_schema = 'public' AND c.table_name = $1
          ORDER BY c.ordinal_position
        `;
        params = [tableName];
        break;

      case 'sqlite':
        sql = `PRAGMA table_info('${tableName}')`;
        break;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    const rows = await this.db.queryInternal(sql, params);

    return rows.map(row => {
      const columnName = row.name || row.COLUMN_NAME || row.name;
      const dbComment = row.comment || row.COLUMN_COMMENT || '';
      const configComment = this.db.getColumnComment(tableName, columnName);

      return {
        name: columnName,
        type: row.type || row.DATA_TYPE || row.type,
        comment: configComment || dbComment,
        nullable: row.nullable || row.IS_NULLABLE || row.notnull === 0,
        default: row.default_value || row.COLUMN_DEFAULT || row.dflt_value,
        position: row.position || row.ORDINAL_POSITION || row.cid,
        pk: row.pk === 1 || false,
      };
    });
  }

  /**
   * Discover foreign key relationships
   */
  async discoverRelations() {
    const dbType = this.db.getType();
    let sql;

    switch (dbType) {
      case 'mysql':
        sql = `
          SELECT
            TABLE_NAME as table_name,
            COLUMN_NAME as column_name,
            REFERENCED_TABLE_NAME as ref_table,
            REFERENCED_COLUMN_NAME as ref_column
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        `;
        break;

      case 'postgresql':
      case 'postgres':
        sql = `
          SELECT
            tc.table_name,
            kcu.column_name as column_name,
            ccu.table_name AS ref_table,
            ccu.column_name AS ref_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
        `;
        break;

      case 'sqlite':
        // SQLite requires per-table PRAGMA
        return await this.discoverSQLiteRelations();

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    // Use queryInternal for system table queries
    const params = (dbType === 'sqlite') ? [] : [this.db.getDatabaseName()];
    const rows = await this.db.queryInternal(sql, params);
    return rows;
  }

  /**
   * Discover SQLite foreign keys (per-table)
   */
  async discoverSQLiteRelations() {
    // Use queryInternal for system table query
    const tablesResult = await this.db.queryInternal(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
    );

    const relations = [];
    for (const table of tablesResult) {
      const tableName = table.name;

      // Skip filtered tables
      if (!this.db.isTableAllowed(tableName)) {
        continue;
      }

      const fkRows = await this.db.queryInternal(`PRAGMA foreign_key_list('${tableName}')`);

      for (const fk of fkRows) {
        relations.push({
          table_name: tableName,
          column_name: fk.from,
          ref_table: fk.table,
          ref_column: fk.to,
        });
      }
    }

    return relations;
  }

  /**
   * Discover enum values from column comments
   */
  async discoverEnums(tables) {
    const enums = {};

    for (const [tableName, tableInfo] of Object.entries(tables)) {
      enums[tableName] = {};

      for (const column of tableInfo.columns) {
        const comment = column.comment || '';
        const enumValues = this.parseEnumFromComment(comment);

        if (enumValues) {
          enums[tableName][column.name] = enumValues;
        }
      }
    }

    return enums;
  }

  /**
   * Parse enum values from comment string
   * Supports formats like:
   * - "1:待付款 2:已付款"
   * - "1.待付款 2.已付款"
   * - "是否xx(1是2否)"
   */
  parseEnumFromComment(comment) {
    if (!comment) return null;

    const patterns = [
      // 1:值1 2:值2 或 1.值1 2.值2 或 1-值1 2-值2
      /(\d+)[:\.\-]([^\s:]+)/g,
      // 是否xx(1是2否)
      /(\d+)([是\u5426\u5426 yes no])/gi,
    ];

    const result = {};
    let hasMatch = false;

    // Try first pattern
    let match;
    const pattern1 = /(\d+)[:\.\-]([^\s:]+)/g;
    while ((match = pattern1.exec(comment)) !== null) {
      result[match[1]] = match[2].trim();
      hasMatch = true;
    }

    if (hasMatch) return result;

    // Try boolean pattern
    if (comment.includes('是否') || comment.includes('yes') || comment.includes('no')) {
      const boolPattern = /(\d+)[^\d]*(是|yes|否|no)/gi;
      while ((match = boolPattern.exec(comment)) !== null) {
        result[match[1]] = match[2];
        hasMatch = true;
      }
    }

    return hasMatch ? result : null;
  }

  /**
   * Load schema from cache
   */
  loadCache() {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Get schema (from cache or discover)
   */
  async getSchema(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.loadCache();
      if (cached) {
        // Check TTL
        const config = this.db.config;
        const ttlHours = config.options?.cache_ttl_hours ?? 24;

        if (ttlHours === 0) {
          return cached; // Never expire
        }

        const discoveredAt = new Date(cached.discovered_at);
        const now = new Date();
        const hoursSinceDiscovery = (now - discoveredAt) / (1000 * 60 * 60);

        if (hoursSinceDiscovery < ttlHours) {
          console.log('Using cached schema (use --refresh to force update)');
          return cached;
        }
      }
    }

    return await this.discover();
  }

  /**
   * Get all tables
   */
  async getTables() {
    const schema = await this.getSchema();
    return Object.keys(schema.tables);
  }

  /**
   * Get table info
   */
  async getTableInfo(tableName) {
    const schema = await this.getSchema();
    return schema.tables[tableName];
  }
}

module.exports = { SchemaDiscovery, CACHE_FILE };
