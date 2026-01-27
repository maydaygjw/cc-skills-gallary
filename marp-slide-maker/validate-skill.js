#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validate Marp Slide Maker Skill Structure
 * Checks that all required files and directories exist
 */

function validateSkill(skillPath = './marp-slide-maker') {
  console.log('Validating Marp Slide Maker skill...\n');

  const errors = [];
  const warnings = [];

  // Check if skill directory exists
  if (!fs.existsSync(skillPath)) {
    errors.push(`Skill directory does not exist: ${skillPath}`);
    return { valid: false, errors, warnings };
  }

  // Define expected files and directories
  const expectedFiles = [
    'SKILL.md',
    'references/MARP_SYNTAX.md',
    'scripts/generate-slide.js'
  ];

  // Check each expected file
  for (const file of expectedFiles) {
    const fullPath = path.join(skillPath, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing required file: ${file}`);
    } else {
      console.log(`✓ Found: ${file}`);
    }
  }

  // Check if references directory exists
  const refsDir = path.join(skillPath, 'references');
  if (!fs.existsSync(refsDir)) {
    warnings.push('references directory not found - consider adding for documentation');
  } else {
    console.log('✓ Found: references/');
  }

  // Check if scripts directory exists
  const scriptsDir = path.join(skillPath, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    warnings.push('scripts directory not found - consider adding for utility scripts');
  } else {
    console.log('✓ Found: scripts/');
  }

  // Check SKILL.md content for essential sections
  const skillDocPath = path.join(skillPath, 'SKILL.md');
  if (fs.existsSync(skillDocPath)) {
    const content = fs.readFileSync(skillDocPath, 'utf8');

    const requiredSections = [
      { name: 'Purpose', pattern: /## Purpose/i },
      { name: 'When to Use', pattern: /## When to Use/i },
      { name: 'Features', pattern: /## Features/i },
      { name: 'Usage', pattern: /## Usage/i }
    ];

    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        warnings.push(`SKILL.md is missing section: ${section.name}`);
      }
    }
  }

  // Check if there's a package.json for dependencies
  const packageJsonPath = path.join(skillPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    warnings.push('No package.json found - consider adding for dependency management');
  } else {
    console.log('✓ Found: package.json');
  }

  const isValid = errors.length === 0;

  console.log('\n' + (isValid ? '✅ Skill validation passed!' : '❌ Skill validation failed!'));

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return {
    valid: isValid,
    errors,
    warnings,
    message: isValid ? 'Skill structure is valid' : 'Skill structure has issues'
  };
}

// Run validation if called directly
if (require.main === module) {
  // When run from the marp-slide-maker directory itself, skill path is '.'
  const currentDir = __dirname;
  const skillPath = process.argv[2] || '.';
  const result = validateSkill(skillPath);

  if (!result.valid) {
    process.exit(1);  // Exit with error code if validation fails
  }
}

module.exports = { validateSkill };