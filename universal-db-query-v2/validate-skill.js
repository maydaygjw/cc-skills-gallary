#!/usr/bin/env node
/**
 * Skill structure validation
 * Validates that the skill follows the standard structure
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'SKILL.md',
  'README.md',
  'package.json',
];

const REQUIRED_DIRS = [
  'scripts',
  'templates',
  'lib',
];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

function validateSkill() {
  let errors = [];
  let warnings = [];

  console.log('Validating Universal DB Query Skill V2...\n');

  // Check required files
  for (const file of REQUIRED_FILES) {
    if (checkFile(file)) {
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file} - MISSING`);
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check required directories
  for (const dir of REQUIRED_DIRS) {
    if (checkFile(dir) && fs.statSync(path.join(__dirname, dir)).isDirectory()) {
      console.log(`✓ ${dir}/`);
    } else {
      console.log(`✗ ${dir}/ - MISSING`);
      errors.push(`Missing required directory: ${dir}/`);
    }
  }

  // Validate SKILL.md frontmatter
  const skillPath = path.join(__dirname, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');

    // Check for frontmatter
    if (content.startsWith('---')) {
      const endIdx = content.indexOf('---', 3);
      if (endIdx !== -1) {
        const frontmatter = content.substring(3, endIdx).trim();
        if (frontmatter.includes('name:') && frontmatter.includes('description:')) {
          console.log('✓ SKILL.md has valid frontmatter');
        } else {
          console.log('⚠ SKILL.md frontmatter missing name or description');
          warnings.push('SKILL.md frontmatter should include name and description');
        }
      }
    } else {
      console.log('⚠ SKILL.md missing frontmatter');
      warnings.push('SKILL.md should have YAML frontmatter (---)');
    }
  }

  // Check scripts
  const scriptsDir = path.join(__dirname, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    console.log(`✓ Found ${scripts.length} scripts: ${scripts.join(', ')}`);
  }

  // Check lib
  const libDir = path.join(__dirname, 'lib');
  if (fs.existsSync(libDir)) {
    const libs = fs.readdirSync(libDir).filter(f => f.endsWith('.js'));
    console.log(`✓ Found ${libs.length} lib modules: ${libs.join(', ')}`);
  }

  // Check templates
  const templatesDir = path.join(__dirname, 'templates');
  if (fs.existsSync(templatesDir)) {
    const hasConfig = fs.existsSync(path.join(templatesDir, 'config.yaml'));
    if (hasConfig) {
      console.log('✓ templates/config.yaml exists');

      // Validate config.yaml has table_filter documentation
      const configContent = fs.readFileSync(path.join(templatesDir, 'config.yaml'), 'utf8');
      if (configContent.includes('table_filter')) {
        console.log('✓ templates/config.yaml includes table_filter configuration');
      } else {
        console.log('⚠ templates/config.yaml missing table_filter documentation');
        warnings.push('templates/config.yaml should document table_filter feature');
      }

      // Validate config.yaml has comments configuration
      if (configContent.includes('comments:')) {
        console.log('✓ templates/config.yaml includes comments configuration');
      } else {
        console.log('⚠ templates/config.yaml missing comments documentation');
        warnings.push('templates/config.yaml should document comments feature');
      }
    } else {
      console.log('⚠ templates/config.yaml missing');
      warnings.push('templates/config.yaml should exist');
    }
  }

  // Check package.json
  const pkgPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.dependencies) {
      const deps = Object.keys(pkg.dependencies);
      const requiredDeps = ['mysql2', 'pg', 'better-sqlite3', 'yaml'];
      const missingDeps = requiredDeps.filter(d => !deps.includes(d));
      if (missingDeps.length === 0) {
        console.log('✓ All required dependencies present');
      } else {
        console.log(`⚠ Missing dependencies: ${missingDeps.join(', ')}`);
        warnings.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✓ Validation passed!');
    return 0;
  }

  if (errors.length > 0) {
    console.log(`\n✗ ${errors.length} error(s):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  return errors.length > 0 ? 1 : 0;
}

process.exit(validateSkill());
