#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ANSI_REGEX = /\[[0-9;]*m/g;
const OPENCODE_HEADER_REGEX = /^\s*>\s*build\s*·\s*/;

function showHelp() {
  console.log(`
Usage: node ai-commit.js <task-id> <commit-message> [options]

  Only processes STAGED files. Run 'git add' first to select what to commit.

Arguments:
  task-id        Task/bug ID (e.g., PROJ-123)
  commit-message Commit message describing the change

Options:
  --dry-run      Show what would be done without making changes
  --skip-ai      Skip opencode AI processing, just commit
  --help         Show this help message

Examples:
  git add src/auth.js
  node ai-commit.js PROJ-123 "fix login bug"

  git add -A
  node ai-commit.js JIRA-456 "add user profile page" --dry-run
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { dryRun: false, skipAi: false };
  const positional = [];

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--skip-ai') options.skipAi = true;
    else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    console.error('Error: Missing required arguments: task-id and commit-message');
    showHelp();
    process.exit(1);
  }

  return {
    taskId: positional[0],
    commitMessage: positional[1],
    ...options
  };
}

function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts });
}

function isBinaryFile(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    for (let i = 0; i < Math.min(buf.length, 8000); i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function getStagedFiles() {
  const staged = exec('git diff --cached --name-only').trim();
  if (!staged) {
    return [];
  }
  return staged.split('\n').filter(f => f);
}

function stripOpencodeOutput(raw) {
  const lines = raw.split('\n');
  let outputStarted = false;
  const result = [];

  for (const line of lines) {
    const clean = line.replace(ANSI_REGEX, '');
    if (!outputStarted) {
      // Skip empty lines and opencode headers
      if (clean.trim() === '') continue;
      if (OPENCODE_HEADER_REGEX.test(clean)) continue;
      if (clean.startsWith('>')) continue;
      outputStarted = true;
    }
    result.push(line);
  }

  return result.join('\n');
}

function runOpencode(filePath) {
  const prompt = 'Output the following code/content EXACTLY as-is. Do not add markdown formatting, explanations, or any modifications. Just output the raw content:';

  return new Promise((resolve, reject) => {
    const child = spawn('opencode', ['run', prompt], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`opencode run exited with code ${code}: ${stderr}`));
        return;
      }
      resolve(stripOpencodeOutput(stdout));
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run opencode: ${err.message}`));
    });

    // Pipe file content to stdin
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(child.stdin);
    fileStream.on('error', (err) => {
      child.stdin.end();
      reject(new Error(`Failed to read file: ${err.message}`));
    });
  });
}

async function processFiles(files, options) {
  const processed = [];
  const skipped = [];

  for (const file of files) {
    // Skip deleted files
    if (!fs.existsSync(file)) {
      skipped.push({ file, reason: 'deleted' });
      continue;
    }

    // In skip-ai mode, commit all files as-is (except deleted)
    if (options.skipAi) {
      console.log(`[SKIP-AI] Will commit as-is: ${file}`);
      processed.push(file);
      continue;
    }

    // Skip binary files (only when doing AI processing)
    if (isBinaryFile(file)) {
      skipped.push({ file, reason: 'binary' });
      continue;
    }

    // Skip very large files (>500KB)
    const stats = fs.statSync(file);
    if (stats.size > 500 * 1024) {
      skipped.push({ file, reason: 'too large (>500KB)' });
      continue;
    }

    if (options.dryRun) {
      console.log(`[DRY-RUN] Would process: ${file}`);
      processed.push(file);
      continue;
    }

    try {
      const originalContent = fs.readFileSync(file, 'utf8');
      const aiOutput = await runOpencode(file);

      // Only write if output is non-empty
      if (!aiOutput.trim()) {
        console.log(`⚠️  Empty AI output for: ${file}, keeping original`);
        processed.push(file);
        continue;
      }

      fs.writeFileSync(file, aiOutput);
      console.log(`✓ Processed: ${file}`);
      processed.push(file);
    } catch (err) {
      console.error(`✗ Failed to process ${file}: ${err.message}`);
      skipped.push({ file, reason: `error: ${err.message}` });
    }
  }

  return { processed, skipped };
}

async function main() {
  const options = parseArgs();

  // Verify git repository
  try {
    exec('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    console.error('Error: Not a git repository');
    process.exit(1);
  }

  // Verify opencode is available
  try {
    exec('which opencode', { stdio: 'ignore' });
  } catch {
    console.error('Error: opencode CLI not found. Please install it first.');
    process.exit(1);
  }

  // Get staged files only
  const files = getStagedFiles();

  if (files.length === 0) {
    console.error('Error: No staged changes to commit.');
    console.error('');
    console.error('Please stage the files you want to commit first:');
    console.error('  git add <file1> <file2> ...');
    console.error('');
    console.error('Or stage all changes:');
    console.error('  git add -A');
    console.error('');
    console.error('Then run this command again.');
    process.exit(1);
  }

  console.log(`\n📋 Task ID: ${options.taskId}`);
  console.log(`💬 Commit message: ${options.commitMessage}`);
  console.log(`📁 Staged files to process (${files.length} total):`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log();

  // Process files through opencode AI
  const { processed, skipped } = await processFiles(files, options);

  if (skipped.length > 0) {
    console.log(`\n⚠️  Skipped ${skipped.length} file(s):`);
    skipped.forEach(s => console.log(`   - ${s.file} (${s.reason})`));
  }

  if (processed.length === 0) {
    console.error('\nError: No files were processed successfully');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log(`\n[DRY-RUN] Would commit with message: [${options.taskId}] ${options.commitMessage}`);
    return;
  }

  // Re-stage all changes (AI output may have modified files)
  console.log('\nRe-staging changes...');
  exec('git add -A');

  // Commit
  const finalMessage = `[${options.taskId}] ${options.commitMessage}`;
  console.log(`\n📝 Committing: ${finalMessage}`);

  try {
    exec(`git commit -m "${finalMessage}"`);
    console.log(`\n✅ Successfully committed!`);
    console.log(`   Message: ${finalMessage}`);
    console.log(`   Files: ${processed.length}`);
  } catch (err) {
    console.error(`\n✗ Commit failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
