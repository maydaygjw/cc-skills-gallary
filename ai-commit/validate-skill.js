#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const skillDir = __dirname;
let hasErrors = false;

function check(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    hasErrors = true;
    return false;
  }
  console.log(`✓ ${message}`);
  return true;
}

function checkFileExists(filePath, description) {
  return check(fs.existsSync(path.join(skillDir, filePath)), `${description}: ${filePath}`);
}

function checkDirExists(dirPath, description) {
  const fullPath = path.join(skillDir, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  return check(exists, `${description}: ${dirPath}/`);
}

console.log('Validating ai-commit skill structure...\n');

// Check SKILL.md
checkFileExists('SKILL.md', 'Skill definition file');

if (fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
  const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');

  // Check frontmatter
  check(skillMd.startsWith('---'), 'SKILL.md has YAML frontmatter');
  check(/name:\s*ai-commit/.test(skillMd), 'SKILL.md frontmatter has name field');
  check(/description:/.test(skillMd), 'SKILL.md frontmatter has description field');

  // Check required sections
  check(/## Usage/.test(skillMd), 'SKILL.md has Usage section');
  check(/## Workflow/.test(skillMd), 'SKILL.md has Workflow section');
}

// Check scripts directory
checkDirExists('scripts', 'Scripts directory');

if (fs.existsSync(path.join(skillDir, 'scripts'))) {
  checkFileExists('scripts/ai-commit.js', 'Main commit script');

  if (fs.existsSync(path.join(skillDir, 'scripts/ai-commit.js'))) {
    const script = fs.readFileSync(path.join(skillDir, 'scripts/ai-commit.js'), 'utf8');
    check(script.includes('opencode'), 'Script references opencode');
    check(script.includes('git commit'), 'Script runs git commit');
    check(script.includes('taskId'), 'Script handles task ID');
  }
}

// Check references directory
checkDirExists('references', 'References directory');
checkFileExists('references/usage.md', 'Usage reference');

console.log();

if (hasErrors) {
  console.error('Validation failed with errors.');
  process.exit(1);
} else {
  console.log('✅ All validations passed!');
}
