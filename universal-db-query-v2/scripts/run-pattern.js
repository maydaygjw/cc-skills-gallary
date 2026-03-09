#!/usr/bin/env node
/**
 * Run a query pattern from udq-patterns directory
 * Usage: node run-pattern.js <pattern_name> [param=value ...]
 */

const fs = require('fs');
const path = require('path');
const { getPatternsDir } = require('../lib/path-resolver');
const { DatabaseManager } = require('../lib/db');
const { QueryBuilder } = require('../lib/query-builder');

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let indentLevel = 0;

  for (const line of lines) {
    // Top-level key
    const topMatch = line.match(/^(\w+):\s*(.*)$/);
    if (topMatch && !line.startsWith(' ')) {
      currentKey = topMatch[1];
      const value = topMatch[2].trim();
      if (value === '') {
        frontmatter[currentKey] = {};
      } else {
        frontmatter[currentKey] = value;
      }
      continue;
    }

    // Nested params (2 spaces indent)
    if (currentKey === 'params' && line.startsWith('  ') && !line.startsWith('    ')) {
      const paramMatch = line.match(/^  (\w+):$/);
      if (paramMatch) {
        frontmatter.params[paramMatch[1]] = {};
        continue;
      }
    }

    // Param properties (4 spaces indent)
    if (currentKey === 'params' && line.startsWith('    ')) {
      const propMatch = line.match(/^    (\w+):\s*(.*)$/);
      if (propMatch) {
        // Find which param this belongs to
        const paramKeys = Object.keys(frontmatter.params);
        const lastParam = paramKeys[paramKeys.length - 1];
        if (lastParam) {
          frontmatter.params[lastParam][propMatch[1]] = propMatch[2].trim();
        }
      }
    }
  }

  return frontmatter;
}

/**
 * Extract SQL from markdown code block
 */
function extractSQL(content) {
  const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
  return sqlMatch ? sqlMatch[1].trim() : '';
}

/**
 * Parse markdown pattern file
 */
function parseMarkdownPattern(content) {
  const frontmatter = parseFrontmatter(content);
  const sql = extractSQL(content);

  if (!frontmatter) return null;

  // Convert params format to match old format
  const params = {};
  if (frontmatter.params) {
    for (const [name, config] of Object.entries(frontmatter.params)) {
      params[name] = {
        description: config.description || '',
        default: config.default || null,
      };
    }
  }

  return {
    name: frontmatter.name || '',
    description: frontmatter.description || '',
    category: frontmatter.category || '',
    params,
    sql,
  };
}

/**
 * Parse SQL pattern file (legacy format, for backward compatibility)
 */
function parseSQLPattern(content) {
  const lines = content.split('\n');
  const metadata = {
    name: '',
    description: '',
    params: {},
    sql: '',
  };

  let inParams = false;
  let sqlStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('-- @name:')) {
      metadata.name = line.replace('-- @name:', '').trim();
    } else if (line.startsWith('-- @description:')) {
      metadata.description = line.replace('-- @description:', '').trim();
    } else if (line.startsWith('-- @params:')) {
      inParams = true;
    } else if (inParams && line.startsWith('--')) {
      const paramLine = line.replace('--', '').trim();
      const match = paramLine.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, name, desc] = match;
        // Extract default value from parentheses
        const defaultMatch = desc.match(/\(([^)]+)\)$/);
        metadata.params[name] = {
          description: defaultMatch ? desc.replace(defaultMatch[0], '').trim() : desc,
          default: defaultMatch ? defaultMatch[1] : null,
        };
      }
    } else if (!line.startsWith('--') && line.length > 0) {
      sqlStart = i;
      break;
    } else if (line === '' && inParams) {
      inParams = false;
    }
  }

  metadata.sql = lines.slice(sqlStart).join('\n').trim();
  return metadata;
}

/**
 * Find pattern file by name (exact match)
 */
function findPattern(name) {
  const patternsDir = getPatternsDir();

  if (!fs.existsSync(patternsDir)) {
    return null;
  }

  // Try markdown files first, then SQL files for backward compatibility
  const files = fs.readdirSync(patternsDir).filter(f =>
    f.endsWith('.md') || f.endsWith('.sql')
  );

  for (const file of files) {
    const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
    const pattern = file.endsWith('.md')
      ? parseMarkdownPattern(content)
      : parseSQLPattern(content);

    if (!pattern) continue;

    const fileBase = file.toLowerCase().replace(/\.(md|sql)$/, '');
    if (pattern.name.toLowerCase().includes(name.toLowerCase()) ||
        fileBase === name.toLowerCase()) {
      return pattern;
    }
  }

  return null;
}

// 渠道关键词映射
const CHANNEL_KEYWORDS = {
  '氧气学长': 'yqxz',
  'yqxz': 'yqxz',
  '城院呀': 'cyy',
  'cyy': 'cyy',
  'xls': 'xls',
  '小鹿': 'xls',
};

// 时间关键词映射
const TIME_KEYWORDS = {
  '今天': 'CURDATE()',
  '昨天': 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
  '前天': 'DATE_SUB(CURDATE(), INTERVAL 2 DAY)',
  '本周': "DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)",
  '上周': "DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)",
  '本月': "DATE_FORMAT(CURDATE(), '%Y-%m-01')",
  '上月': "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')",
};

/**
 * 从自然语言中提取参数
 */
function extractParams(query) {
  const params = {};
  const lowerQuery = query.toLowerCase();

  // 提取渠道
  for (const [keyword, value] of Object.entries(CHANNEL_KEYWORDS)) {
    if (query.includes(keyword)) {
      params.channel = value;
      break;
    }
  }

  // 提取时间
  for (const [keyword, value] of Object.entries(TIME_KEYWORDS)) {
    if (query.includes(keyword)) {
      params.date = value;
      break;
    }
  }

  // 提取数量限制（前N、topN、排行前N）
  const limitMatch = query.match(/前(\d+)|top(\d+)|排行第?(\d+)|第(\d+)/i);
  if (limitMatch) {
    params.limit = limitMatch[1] || limitMatch[2] || limitMatch[3] || limitMatch[4];
  }

  return params;
}

/**
 * 智能匹配 pattern（支持自然语言查询）
 * @param {string} query - 用户查询（可以是 pattern 名称或自然语言）
 * @returns {{pattern: object, params: object}} 匹配到的 pattern 和提取的参数
 */
function smartMatch(query) {
  const patternsDir = getPatternsDir();

  if (!fs.existsSync(patternsDir)) {
    return null;
  }

  const files = fs.readdirSync(patternsDir).filter(f =>
    f.endsWith('.md') || f.endsWith('.sql')
  );

  // 先尝试精确匹配 pattern 名称
  const exactMatch = findPattern(query);
  if (exactMatch) {
    return { pattern: exactMatch, params: {} };
  }

  // 提取查询中的参数
  const extractedParams = extractParams(query);

  // 计算每个 pattern 的匹配分数
  let bestMatch = null;
  let bestScore = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
    const pattern = file.endsWith('.md')
      ? parseMarkdownPattern(content)
      : parseSQLPattern(content);

    if (!pattern) continue;

    // 计算匹配分数
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const patternName = pattern.name.toLowerCase();
    const patternDesc = pattern.description.toLowerCase();

    // 名称包含查询词 +3 分
    if (patternName.includes(lowerQuery) || lowerQuery.includes(patternName)) {
      score += 3;
    }

    // 描述包含查询关键 +2 分
    // 店铺单量相关
    if ((lowerQuery.includes('店铺') || lowerQuery.includes('销量') || lowerQuery.includes('单量') || lowerQuery.includes('订单')) &&
        (patternDesc.includes('店铺') || patternDesc.includes('单量') || patternDesc.includes('订单'))) {
      score += 2;
    }

    // 渠道匹配 +2 分
    if (extractedParams.channel) {
      const channelKeywords = Object.keys(CHANNEL_KEYWORDS).filter(k => k !== 'yqxz' && k !== 'cyy' && k !== 'xls');
      for (const kw of channelKeywords) {
        if (query.includes(kw) && pattern.params.channel) {
          score += 2;
          break;
        }
      }
    }

    // 时间匹配 +1 分
    if (extractedParams.date && pattern.params.date) {
      score += 1;
    }

    // 数量匹配 +1 分
    if (extractedParams.limit && pattern.params.limit) {
      score += 1;
    }

    // pattern 参数数量越少越匹配（简单优先）
    if (Object.keys(pattern.params).length <= 3) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  // 只返回分数 > 0 的匹配
  if (bestScore > 0 && bestMatch) {
    return { pattern: bestMatch, params: extractedParams };
  }

  return null;
}

/**
 * List all available patterns
 */
function listPatterns() {
  const patternsDir = getPatternsDir();

  if (!fs.existsSync(patternsDir)) {
    return [];
  }

  const files = fs.readdirSync(patternsDir).filter(f =>
    f.endsWith('.md') || f.endsWith('.sql')
  );

  return files.map(file => {
    const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
    return file.endsWith('.md')
      ? parseMarkdownPattern(content)
      : parseSQLPattern(content);
  }).filter(p => p !== null);
}

async function main() {
  const input = process.argv[2];

  if (!input || input === '--list') {
    console.log('Available patterns:\n');
    const patterns = listPatterns();

    if (patterns.length === 0) {
      console.log('No patterns found in:', getPatternsDir());
      console.log('\nCreate Markdown files in this directory with the following format:\n');
      console.log('---');
      console.log('name: Pattern Name');
      console.log('description: Description');
      console.log('category: Category Name');
      console.log('params:');
      console.log('  param1:');
      console.log('    type: string');
      console.log('    description: Parameter description');
      console.log('    default: default_value');
      console.log('---');
      console.log('');
      console.log('## SQL');
      console.log('');
      console.log('```sql');
      console.log('SELECT * FROM table WHERE field = :param1;');
      console.log('```');
    } else {
      // Group by category
      const byCategory = {};
      patterns.forEach(p => {
        const cat = p.category || '未分类';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
      });

      for (const [category, catPatterns] of Object.entries(byCategory)) {
        console.log(`\n【${category}】`);
        catPatterns.forEach(p => {
          console.log(`  • ${p.name}`);
          console.log(`    ${p.description}`);
        });
      }
      console.log();
    }
    return;
  }

  // Parse explicit parameters from command line (key=value format)
  const explicitParams = {};
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const match = arg.match(/^(\w+)=(.+)$/);
    if (match) {
      explicitParams[match[1]] = match[2];
    }
  }

  const db = new DatabaseManager();

  try {
    // 尝试智能匹配（支持自然语言查询）
    const matchResult = smartMatch(input);

    if (!matchResult) {
      console.error(`Pattern not found for: '${input}'`);
      console.log('\nUse --list to see available patterns.');
      process.exit(1);
    }

    const { pattern: pattern, params: extractedParams } = matchResult;

    // 合并参数：命令行参数 > 自动提取的参数 > 默认值
    const params = { ...extractedParams, ...explicitParams };

    console.log(`\nPattern: ${pattern.name}`);
    console.log(`Description: ${pattern.description}`);
    console.log(`(Matched from: "${input}")`);

    if (Object.keys(pattern.params).length > 0) {
      console.log('\nParameters:');
      for (const [name, info] of Object.entries(pattern.params)) {
        const value = params[name] || info.default || '(not set)';
        console.log(`  ${name}: ${info.description} = ${value}`);
      }
    }

    console.log('\nSQL:');
    console.log(pattern.sql);

    // Replace parameters
    let sql = pattern.sql;
    for (const [name, value] of Object.entries(params)) {
      // Quote string values, keep numbers and SQL functions unquoted
      let replacement;
      if (['CURDATE()', 'NOW()', 'CURRENT_DATE', 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)', 'NULL'].includes(value)) {
        replacement = value;
      } else if (/^\d+$/.test(value)) {
        replacement = value;
      } else {
        replacement = `'${value}'`;
      }
      sql = sql.replace(new RegExp(`:${name}\\b`, 'g'), replacement);
    }

    // Replace remaining parameters with defaults or NULL
    for (const [name, info] of Object.entries(pattern.params)) {
      if (!params[name]) {
        if (info.default && info.default !== 'NULL') {
          let defaultValue = info.default;
          // Handle SQL functions and expressions (contain parentheses)
          if (['CURDATE()', 'NOW()', 'CURRENT_DATE', 'NULL'].includes(defaultValue) ||
              defaultValue.includes('(')) {
            // Keep as is, will be executed by DB
          } else if (!defaultValue.match(/^\d+$/)) {
            defaultValue = `'${defaultValue}'`;
          }
          sql = sql.replace(new RegExp(`COALESCE\\(:${name}\\s*,\\s*[^)]+\\)`, 'g'), defaultValue);
          sql = sql.replace(new RegExp(`:${name}\\b`, 'g'), defaultValue);
        } else {
          sql = sql.replace(new RegExp(`:${name}\\b`, 'g'), 'NULL');
        }
      }
    }

    console.log('\n--- Executing ---\n');

    await db.connect();
    const rows = await db.query(sql);

    const { QueryBuilder } = require('../lib/query-builder');
    const { SchemaDiscovery } = require('../lib/schema');
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
