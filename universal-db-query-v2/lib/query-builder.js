/**
 * Natural language to SQL query builder
 */

class QueryBuilder {
  constructor(schema, dbType) {
    this.schema = schema;
    this.dbType = dbType;
  }

  /**
   * Build SQL from natural language intent
   */
  build(intent, context = {}) {
    const { table, filters = [], timeRange, status, orderBy, limit } = context;

    if (!table) {
      throw new Error('Table name is required');
    }

    let sql = 'SELECT';
    const columns = context.columns || ['*'];
    sql += ` ${columns.join(', ')} FROM ${table}`;

    const whereConditions = [];

    // Add filters
    for (const filter of filters) {
      whereConditions.push(`${filter.column} ${filter.operator} ${filter.value}`);
    }

    // Add time range filter
    if (timeRange) {
      const timeCondition = this.buildTimeCondition(timeRange, table);
      if (timeCondition) {
        whereConditions.push(timeCondition);
      }
    }

    // Add status filter
    if (status) {
      const statusCondition = this.buildStatusCondition(status, table);
      if (statusCondition) {
        whereConditions.push(statusCondition);
      }
    }

    // Add WHERE clause
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (orderBy) {
      sql += ` ORDER BY ${orderBy.column} ${orderBy.direction || 'DESC'}`;
    } else if (this.hasTimeColumn(table)) {
      const timeCol = this.getTimeColumn(table);
      sql += ` ORDER BY ${timeCol} DESC`;
    }

    // Add LIMIT
    const maxLimit = limit || 100;
    sql += ` LIMIT ${maxLimit}`;

    return sql;
  }

  /**
   * Build time condition SQL
   */
  buildTimeCondition(timeRange, table) {
    const timeCol = this.getTimeColumn(table);
    if (!timeCol) return null;

    const dateFunc = this.getDateFunction();

    switch (timeRange.type) {
      case 'today':
        return `${dateFunc.date}(${timeCol}) = ${dateFunc.current_date}`;
      case 'yesterday':
        return `${dateFunc.date}(${timeCol}) = ${dateFunc.date}(${dateFunc.subdate}(${dateFunc.current_date}, 1))`;
      case 'this_week':
        return this.getWeekCondition(timeCol);
      case 'this_month':
        return `${dateFunc.month}(${timeCol}) = ${dateFunc.month}(${dateFunc.current_date})`;
      case 'date':
        return `${dateFunc.date}(${timeCol}) = '${timeRange.value}'`;
      default:
        return null;
    }
  }

  /**
   * Build status condition SQL
   */
  buildStatusCondition(status, table) {
    const statusCol = this.getStatusColumn(table);
    if (!statusCol) return null;

    const tableEnums = this.schema.enums?.[table];
    const columnEnums = tableEnums?.[statusCol];

    if (columnEnums) {
      // Find matching enum value
      for (const [value, label] of Object.entries(columnEnums)) {
        if (label.includes(status) || status.includes(label)) {
          return `${statusCol} = ${value}`;
        }
      }
    }

    return null;
  }

  /**
   * Get database-specific date functions
   */
  getDateFunction() {
    switch (this.dbType) {
      case 'mysql':
        return {
          date: 'DATE',
          current_date: 'CURDATE()',
          subdate: 'DATE_SUB',
          month: 'MONTH',
        };
      case 'postgresql':
      case 'postgres':
        return {
          date: 'DATE',
          current_date: 'CURRENT_DATE',
          subdate: 'DATE_SUB',
          month: 'EXTRACT(MONTH FROM',
        };
      case 'sqlite':
        return {
          date: 'date',
          current_date: "date('now')",
          subdate: 'date',
          month: "strftime('%m'",
        };
      default:
        return {
          date: 'DATE',
          current_date: 'CURRENT_DATE',
          subdate: 'DATE_SUB',
          month: 'MONTH',
        };
    }
  }

  /**
   * Get week condition based on database type
   */
  getWeekCondition(timeCol) {
    switch (this.dbType) {
      case 'mysql':
        return `YEARWEEK(${timeCol}) = YEARWEEK(NOW())`;
      case 'postgresql':
      case 'postgres':
        return `EXTRACT(WEEK FROM ${timeCol}) = EXTRACT(WEEK FROM CURRENT_DATE)`;
      case 'sqlite':
        return `strftime('%Y-W%W', ${timeCol}) = strftime('%Y-W%W', 'now')`;
      default:
        return `YEARWEEK(${timeCol}) = YEARWEEK(NOW())`;
    }
  }

  /**
   * Find time column in table
   */
  getTimeColumn(table) {
    const tableInfo = this.schema.tables?.[table];
    if (!tableInfo) return null;

    const timePatterns = [
      'created_at', 'create_time', 'create_at',
      'updated_at', 'update_time', 'update_at',
      'deleted_at', 'delete_time', 'delete_at',
    ];

    for (const column of tableInfo.columns) {
      if (timePatterns.includes(column.name.toLowerCase())) {
        return column.name;
      }
    }

    // Find any datetime/timestamp column
    for (const column of tableInfo.columns) {
      const type = column.type.toLowerCase();
      if (type.includes('datetime') || type.includes('timestamp')) {
        return column.name;
      }
    }

    return null;
  }

  /**
   * Check if table has time column
   */
  hasTimeColumn(table) {
    return this.getTimeColumn(table) !== null;
  }

  /**
   * Find status column in table
   */
  getStatusColumn(table) {
    const tableInfo = this.schema.tables?.[table];
    if (!tableInfo) return null;

    const statusPatterns = ['status', 'state', 'type'];

    for (const column of tableInfo.columns) {
      const name = column.name.toLowerCase();
      if (statusPatterns.some(p => name.includes(p))) {
        return column.name;
      }
    }

    return null;
  }

  /**
   * Generate count query
   */
  buildCount(table, conditions = []) {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return sql;
  }

  /**
   * Format results as markdown table
   */
  formatResults(rows, maxRows = 20) {
    if (!rows || rows.length === 0) {
      return 'No results found.';
    }

    const keys = Object.keys(rows[0]);
    const displayRows = rows.slice(0, maxRows);
    const remaining = rows.length - maxRows;

    // Build header
    let md = '| ' + keys.join(' | ') + ' |\n';
    md += '| ' + keys.map(() => '---').join(' | ') + ' |\n';

    // Build rows
    for (const row of displayRows) {
      md += '| ' + keys.map(k => String(row[k] ?? '')).join(' | ') + ' |\n';
    }

    if (remaining > 0) {
      md += `\n*... and ${remaining} more rows*`;
    }

    return md;
  }
}

module.exports = { QueryBuilder };
