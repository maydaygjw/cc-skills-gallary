/**
 * Database connection manager
 * Supports MySQL, PostgreSQL, and SQLite
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { getConfigPath, getCacheDir } = require('./path-resolver');

/**
 * Resolve cache directory from multiple locations
 */
function resolveCacheDir() {
  return getCacheDir();
}

const CONFIG_FILE = getConfigPath();
const CACHE_DIR = resolveCacheDir();

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.config = null;
    this.dbType = null;
  }

  /**
   * Load configuration from udq-config.yaml
   */
  loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error(
        `Configuration file not found: ${CONFIG_FILE}\n\n` +
        `Please create the configuration file:\n` +
        `\ndatabase:\n` +
        `  type: mysql\n` +
        `  host: localhost\n` +
        `  port: 3306\n` +
        `  user: your_username\n` +
        `  password: your_password\n` +
        `  database: your_db_name\n\n` +
        `options:\n` +
        `  readonly_mode: true\n`
      );
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    this.config = YAML.parse(content);
    this.dbType = this.config.database?.type?.toLowerCase();

    if (!this.dbType) {
      throw new Error('Database type not specified in configuration');
    }

    return this.config;
  }

  /**
   * Connect to database
   */
  async connect() {
    if (this.connection) return this.connection;

    if (!this.config) {
      this.loadConfig();
    }

    const db = this.config.database;

    switch (this.dbType) {
      case 'mysql':
        return this.connectMySQL(db);
      case 'postgresql':
      case 'postgres':
        return this.connectPostgreSQL(db);
      case 'sqlite':
        return this.connectSQLite(db);
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Connect to MySQL
   */
  async connectMySQL(config) {
    const mysql = require('mysql2/promise');

    try {
      this.connection = await mysql.createConnection({
        host: config.host || 'localhost',
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl || false,
        connectTimeout: 10000,
      });

      return this.connection;
    } catch (error) {
      throw new Error(`MySQL connection failed: ${error.message}`);
    }
  }

  /**
   * Connect to PostgreSQL
   */
  async connectPostgreSQL(config) {
    const { Client } = require('pg');

    try {
      const client = new Client({
        host: config.host || 'localhost',
        port: config.port || 5432,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl || false,
      });

      await client.connect();
      this.connection = client;
      return this.connection;
    } catch (error) {
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
  }

  /**
   * Connect to SQLite
   */
  connectSQLite(config) {
    const Database = require('better-sqlite3');

    try {
      const options = this.config.options?.readonly_mode ? { readonly: true } : {};
      this.connection = new Database(config.database, options);
      return this.connection;
    } catch (error) {
      throw new Error(`SQLite connection failed: ${error.message}`);
    }
  }

  /**
   * Execute SQL query
   */
  async query(sql, params = []) {
    if (!this.connection) {
      await this.connect();
    }

    // Check readonly mode
    if (this.config.options?.readonly_mode !== false) {
      const trimmed = sql.trim().toUpperCase();
      const allowedPrefixes = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'PRAGMA'];
      const isAllowed = allowedPrefixes.some(prefix => trimmed.startsWith(prefix));

      if (!isAllowed) {
        throw new Error(
          `Readonly mode is enabled. Only SELECT, SHOW, DESCRIBE, EXPLAIN queries are allowed.\n` +
          `To disable readonly mode, set options.readonly_mode: false in ${CONFIG_FILE}`
        );
      }
    }

    // Check table filter restrictions
    const restrictedTables = this.checkTableRestrictions(sql);
    if (restrictedTables.length > 0) {
      const filterConfig = this.getTableFilterConfig();
      const mode = filterConfig?.mode || 'whitelist';
      throw new Error(
        `Table access denied: "${restrictedTables.join(', ')}"\n\n` +
        `Table filter mode: ${mode}\n` +
        `Allowed tables: ${filterConfig?.listed_tables?.join(', ') || '(none specified)'}\n` +
        `Pattern rules: ${filterConfig?.patterns?.join(', ') || '(none specified)'}\n\n` +
        `To modify table restrictions, update options.table_filter in ${CONFIG_FILE}`
      );
    }

    // Apply max results limit
    const maxResults = this.config.options?.max_query_results || 1000;

    switch (this.dbType) {
      case 'mysql':
        return this.queryMySQL(sql, params, maxResults);
      case 'postgresql':
      case 'postgres':
        return this.queryPostgreSQL(sql, params, maxResults);
      case 'sqlite':
        return this.querySQLite(sql, params, maxResults);
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Execute MySQL query
   */
  async queryMySQL(sql, params, maxResults) {
    try {
      // Add LIMIT if not present for SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT') && !sql.match(/\bLIMIT\s+\d+/i)) {
        sql = `${sql} LIMIT ${maxResults}`;
      }

      const [rows] = await this.connection.execute(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Execute PostgreSQL query
   */
  async queryPostgreSQL(sql, params, maxResults) {
    try {
      // Add LIMIT if not present for SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT') && !sql.match(/\bLIMIT\s+\d+/i)) {
        sql = `${sql} LIMIT ${maxResults}`;
      }

      const result = await this.connection.query(sql, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Execute SQLite query
   */
  querySQLite(sql, params, maxResults) {
    try {
      // Add LIMIT if not present for SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT') && !sql.match(/\bLIMIT\s+\d+/i)) {
        sql = `${sql} LIMIT ${maxResults}`;
      }

      const stmt = this.connection.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (!this.connection) return;

    switch (this.dbType) {
      case 'mysql':
        await this.connection.end();
        break;
      case 'postgresql':
      case 'postgres':
        await this.connection.end();
        break;
      case 'sqlite':
        this.connection.close();
        break;
    }

    this.connection = null;
  }

  /**
   * Get database type
   */
  getType() {
    return this.dbType;
  }

  /**
   * Get database name
   */
  getDatabaseName() {
    return this.config?.database?.database;
  }

  /**
   * Check if a table is allowed based on table_filter configuration
   * @param {string} tableName - Name of the table to check
   * @returns {boolean} - true if allowed, false otherwise
   */
  isTableAllowed(tableName) {
    const tableFilter = this.config?.options?.table_filter;

    // No filter configured, allow all tables
    if (!tableFilter || !tableFilter.mode) {
      return true;
    }

    const mode = tableFilter.mode.toLowerCase();
    const listedTables = tableFilter.listed_tables || [];
    const patterns = tableFilter.patterns || [];

    // Check exact table name match
    const inList = listedTables.includes(tableName);

    // Check pattern matches
    const matchesPattern = patterns.some(pattern => {
      // Convert glob pattern to regex
      // * matches any characters
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
        .replace(/\*/g, '.*'); // Convert * to .*
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(tableName);
    });

    const isListed = inList || matchesPattern;

    if (mode === 'whitelist') {
      // Whitelist: only allow listed tables
      return isListed;
    } else if (mode === 'blacklist') {
      // Blacklist: allow all except listed tables
      return !isListed;
    }

    // Unknown mode, allow all
    return true;
  }

  /**
   * Get list of allowed tables (for schema discovery)
   * @returns {string[]|null} - Array of allowed table names, or null if all allowed
   */
  getAllowedTables() {
    const tableFilter = this.config?.options?.table_filter;

    if (!tableFilter || !tableFilter.mode) {
      return null; // All tables allowed
    }

    const mode = tableFilter.mode.toLowerCase();

    if (mode === 'whitelist') {
      // Return the explicit list for whitelist mode
      // Note: patterns are handled separately in matching
      return tableFilter.listed_tables || [];
    }

    return null; // Blacklist mode, need to check all tables individually
  }

  /**
   * Get table filter configuration for error messages
   * @returns {object|null} - Filter config or null
   */
  getTableFilterConfig() {
    return this.config?.options?.table_filter || null;
  }

  /**
   * Get comments configuration
   * @returns {object|null} - Comments config with tables and columns
   */
  getCommentsConfig() {
    return this.config?.options?.comments || null;
  }

  /**
   * Get configured comment for a table
   * @param {string} tableName - Table name
   * @returns {string|null} - Configured comment or null
   */
  getTableComment(tableName) {
    const comments = this.config?.options?.comments?.tables;
    return comments?.[tableName] || null;
  }

  /**
   * Get configured comment for a column
   * @param {string} tableName - Table name
   * @param {string} columnName - Column name
   * @returns {string|null} - Configured comment or null
   */
  getColumnComment(tableName, columnName) {
    const columns = this.config?.options?.comments?.columns;
    const key = `${tableName}.${columnName}`;
    return columns?.[key] || null;
  }

  /**
   * Execute a query bypassing table filter restrictions
   * Used for internal schema discovery queries
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Query results
   */
  async queryInternal(sql, params = []) {
    // Same as query() but without table filter checks
    if (!this.connection) {
      await this.connect();
    }

    // Apply max results limit
    const maxResults = this.config.options?.max_query_results || 1000;

    switch (this.dbType) {
      case 'mysql':
        return this.queryMySQL(sql, params, maxResults);
      case 'postgresql':
      case 'postgres':
        return this.queryPostgreSQL(sql, params, maxResults);
      case 'sqlite':
        return this.querySQLite(sql, params, maxResults);
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Extract table names from SQL and check if they are allowed
   * @param {string} sql - SQL query to check
   * @returns {string[]} - Array of restricted table names (empty if all allowed)
   */
  checkTableRestrictions(sql) {
    const tableFilter = this.config?.options?.table_filter;
    if (!tableFilter || !tableFilter.mode) {
      return []; // No restrictions
    }

    const tables = this.extractTableNamesFromSQL(sql);
    const restricted = tables.filter(table => !this.isTableAllowed(table));
    return restricted;
  }

  /**
   * Extract table names from SQL query
   * Handles: SELECT ... FROM table, JOIN table, UPDATE table, etc.
   * @param {string} sql - SQL query
   * @returns {string[]} - Array of table names
   */
  extractTableNamesFromSQL(sql) {
    const tables = new Set();
    const upperSQL = sql.toUpperCase();

    // Match FROM clause: FROM table_name or FROM `table_name` or FROM schema.table_name
    const fromRegex = /\bFROM\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/gi;
    let match;
    while ((match = fromRegex.exec(upperSQL)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    // Match JOIN clause: JOIN table_name or JOIN `table_name`
    const joinRegex = /\bJOIN\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/gi;
    while ((match = joinRegex.exec(upperSQL)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    // Match INTO clause: INSERT INTO table_name
    const intoRegex = /\bINTO\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/gi;
    while ((match = intoRegex.exec(upperSQL)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    // Match UPDATE clause: UPDATE table_name
    const updateRegex = /\bUPDATE\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/gi;
    while ((match = updateRegex.exec(upperSQL)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    // Match TABLE clause: TRUNCATE TABLE, etc.
    const tableRegex = /\bTABLE\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/gi;
    while ((match = tableRegex.exec(upperSQL)) !== null) {
      tables.add(match[1].toLowerCase());
    }

    return Array.from(tables);
  }
}

module.exports = { DatabaseManager, CONFIG_FILE, CACHE_DIR };
