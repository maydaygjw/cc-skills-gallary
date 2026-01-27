#!/usr/bin/env node

/**
 * Validate Mermaid Design Skill Structure
 * Checks if all required files and directories are present
 */

const fs = require('fs');
const path = require('path');

const skillDir = './mermaid-design';
const requiredFiles = [
  'SKILL.md',
  'scripts/',
  'references/',
  'assets/'
];

const requiredReferences = [
  'MERMAID_SYNTAX.md',
  'INDUSTRY_PATTERNS.md'
];

const requiredScripts = [
  'generate-diagram.js'
];

console.log('Validating Mermaid Design Skill structure...\n');

let isValid = true;

// Check root level files/directories
for (const file of requiredFiles) {
  const filePath = path.join(skillDir, file);
  const exists = fs.existsSync(filePath);
  const type = file.endsWith('/') ? 'directory' : 'file';

  console.log(`${exists ? '✓' : '✗'} ${type}: ${file}`);
  if (!exists) isValid = false;
}

// Check reference files
console.log('\nChecking reference files:');
const referencesDir = path.join(skillDir, 'references');
if (fs.existsSync(referencesDir)) {
  for (const refFile of requiredReferences) {
    const filePath = path.join(referencesDir, refFile);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✓' : '✗'} reference: ${refFile}`);
    if (!exists) isValid = false;
  }
} else {
  console.log('✗ references directory missing');
  isValid = false;
}

// Check script files
console.log('\nChecking script files:');
const scriptsDir = path.join(skillDir, 'scripts');
if (fs.existsSync(scriptsDir)) {
  for (const scriptFile of requiredScripts) {
    const filePath = path.join(scriptsDir, scriptFile);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✓' : '✗'} script: ${scriptFile}`);
    if (!exists) isValid = false;
  }
} else {
  console.log('✗ scripts directory missing');
  isValid = false;
}

// Validate SKILL.md has proper frontmatter
const skillMdPath = path.join(skillDir, 'SKILL.md');
if (fs.existsSync(skillMdPath)) {
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const hasFrontmatter = content.startsWith('---\n') && content.includes('\n---\n');
  const hasName = content.includes('name:') && content.includes('mermaid-design');
  const hasDescription = content.includes('description:');

  console.log(`\nChecking SKILL.md frontmatter:`);
  console.log(`${hasFrontmatter ? '✓' : '✗'} Has frontmatter`);
  console.log(`${hasName ? '✓' : '✗'} Has name field`);
  console.log(`${hasDescription ? '✓' : '✗'} Has description field`);

  if (!hasFrontmatter || !hasName || !hasDescription) isValid = false;
} else {
  console.log('\n✗ SKILL.md file missing');
  isValid = false;
}

console.log('\n' + '='.repeat(50));
if (isValid) {
  console.log('✓ Skill validation PASSED! The skill is properly structured.');
} else {
  console.log('✗ Skill validation FAILED! Please fix the issues above.');
  process.exit(1);
}