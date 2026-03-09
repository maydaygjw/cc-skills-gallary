#!/usr/bin/env node
/**
 * List all patterns with their frontmatter (for LLM matching)
 * Usage: node list-patterns.js
 */

const fs = require('fs');
const path = require('path');
const { getPatternsDir } = require('../lib/path-resolver');

/**
 * Simple YAML frontmatter parser
 * Extracts: name, description, category, triggers, param_mapping, params
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const result = {
    name: '',
    description: '',
    category: '',
    triggers: [],
    param_mapping: {},
    params: {}
  };

  const yamlContent = match[1];

  // Extract simple key-value pairs
  // name: value
  // description: value
  // category: value
  const simplePairs = yamlContent.match(/^(\w+):\s*(.+)$/gm);
  if (simplePairs) {
    for (const pair of simplePairs) {
      const [key, ...valueParts] = pair.split(':');
      const value = valueParts.join(':').trim();

      if (key === 'name') result.name = value;
      else if (key === 'description') result.description = value;
      else if (key === 'category') result.category = value;
    }
  }

  // Extract triggers array: triggers: [a, b, c]
  const triggersMatch = yamlContent.match(/triggers:\s*\[([^\]]+)\]/);
  if (triggersMatch) {
    result.triggers = triggersMatch[1].split(',').map(t => t.trim());
  }

  // Extract param_mapping (simple key: { values: [...] } format)
  const paramMappingSection = yamlContent.match(/param_mapping:\s*([\s\S]*?)(?=^params:|^---)/m);
  if (paramMappingSection) {
    const pmContent = paramMappingSection[1];
    // Match each param: channel: { values: [...] }
    const paramMatches = pmContent.matchAll(/(\w+):\s*\{[^}]*values:\s*\[([^\]]+)\]/g);
    for (const match of paramMatches) {
      const paramName = match[1];
      const values = match[2].split(',').map(v => v.trim());
      result.param_mapping[paramName] = { values };
    }
  }

  // Extract params section
  const paramsSection = yamlContent.match(/params:\s*([\s\S]*?)(?=^---)/m);
  if (paramsSection) {
    const pContent = paramsSection[1];
    // Match param names at 2-space indent
    const paramMatches = pContent.match(/^  (\w+):/gm);
    if (paramMatches) {
      for (const match of paramMatches) {
        const paramName = match.trim().replace(':', '');
        // Find description for this param
        const descMatch = pContent.match(new RegExp(`${paramName}:[^a-z]*description:\\s*(.+)`));
        const defaultMatch = pContent.match(new RegExp(`${paramName}:[^a-z]*default:\\s*(.+)`));
        result.params[paramName] = {
          description: descMatch ? descMatch[1].trim() : '',
          default: defaultMatch ? defaultMatch[1].trim() : null
        };
      }
    }
  }

  return result;
}

function listPatterns() {
  const patternsDir = getPatternsDir();

  if (!fs.existsSync(patternsDir)) {
    console.log('No patterns directory found.');
    return;
  }

  const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No patterns found.');
    return;
  }

  console.log('# Available Patterns\n');
  console.log('| Pattern | Description | Category | Triggers | Params |');
  console.log('|---------|-------------|----------|----------|--------|');

  for (const file of files) {
    const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
    const fm = parseFrontmatter(content);

    if (!fm) continue;

    const params = Object.keys(fm.params).join(', ') || '-';
    const triggers = fm.triggers.slice(0, 3).join(', ') + (fm.triggers.length > 3 ? '...' : '');
    const row = `| ${fm.name || file.replace('.md', '')} | ${fm.description || '-'} | ${fm.category || '-'} | ${triggers} | ${params} |`;
    console.log(row);
  }

  console.log('\n--- Frontmatter Details ---\n');

  for (const file of files) {
    const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
    const fm = parseFrontmatter(content);

    if (!fm) continue;

    console.log(`## ${fm.name || file}`);
    console.log(`- File: ${file}`);
    console.log(`- Description: ${fm.description || '-'}`);
    console.log(`- Category: ${fm.category || '-'}`);

    if (fm.triggers && fm.triggers.length > 0) {
      console.log('- Triggers:');
      for (const t of fm.triggers) {
        console.log(`  - ${t}`);
      }
    }

    if (fm.param_mapping && Object.keys(fm.param_mapping).length > 0) {
      console.log('- Param Mapping:');
      for (const [param, config] of Object.entries(fm.param_mapping)) {
        if (config.values) {
          console.log(`  - ${param}: ${config.values.join(', ')}`);
        }
      }
    }

    if (fm.params && Object.keys(fm.params).length > 0) {
      console.log('- Params:');
      for (const [name, config] of Object.entries(fm.params)) {
        console.log(`  - ${name}: ${config.description || '-'} (default: ${config.default || 'none'})`);
      }
    }
    console.log();
  }
}

listPatterns();