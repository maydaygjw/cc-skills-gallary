#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const os = require('os');

function findConfig() {
  const locations = [
    process.env.UDQ_CONFIG,
    path.join(process.cwd(), 'udq-config.yaml'),
    path.join(os.homedir(), '.udq-config.yaml'),
    path.join(__dirname, '..', 'udq-config.yaml')
  ].filter(Boolean);

  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  throw new Error('Config not found. Searched: ' + locations.join(', '));
}

function findPattern(patternName, config) {
  const patternsDir = config.options?.patterns_dir;
  const locations = [
    patternsDir && path.resolve(patternsDir),
    path.join(process.cwd(), 'udq-patterns'),
    path.join(os.homedir(), '.udq-patterns'),
    path.join(__dirname, '..', 'udq-patterns')
  ].filter(Boolean);

  for (const dir of locations) {
    const file = path.join(dir, `${patternName}.md`);
    if (fs.existsSync(file)) return file;
  }
  throw new Error(`Pattern "${patternName}" not found. Searched: ` + locations.join(', '));
}

async function main() {
  const [,, patternName, ...args] = process.argv;

  // Parse params
  const params = {};
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    params[key] = value;
  });

  // Load config
  const configPath = findConfig();
  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

  // Load pattern
  const patternPath = findPattern(patternName, config);
  const patternContent = fs.readFileSync(patternPath, 'utf8');

  // Extract SQL
  const sqlMatch = patternContent.match(/```sql\n([\s\S]+?)\n```/);
  if (!sqlMatch) throw new Error('No SQL found in pattern');

  let sql = sqlMatch[1];

  // Replace params
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'limit') {
      sql = sql.replace(new RegExp(`:${key}`, 'g'), value);
    } else {
      sql = sql.replace(new RegExp(`:${key}`, 'g'), mysql.escape(value));
    }
  });
  sql = sql.replace(/:date/g, 'NULL');
  if (!params.limit) sql = sql.replace(/:limit/g, '50');

  // Connect and query
  const conn = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  const [rows] = await conn.execute(sql);
  console.table(rows);
  await conn.end();
}

main().catch(console.error);
