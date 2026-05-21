# AI Commit - Usage Reference

## Installation

Place the `ai-commit` skill directory in your project or Claude skills directory.

## Prerequisites

```bash
# Verify git is installed
git --version

# Verify opencode is installed
which opencode

# Verify Node.js is installed
node --version
```

## Basic Workflow

### 1. Make Your Changes

Edit files as normal in your project.

### 2. Stage the Files You Want to Commit

```bash
git add src/auth.js src/login.css
```

Only staged files will be processed. Unstaged changes are ignored.

### 3. Run AI Commit

```bash
node ai-commit/scripts/ai-commit.js TASK-123 "your commit message"
```

The script will:
- Verify you have staged changes
- Run each staged file through opencode LLM
- Commit with `[TASK-123] your commit message`

### 3. Verify the Commit

```bash
git log -1 --format=full
```

## Dry Run Mode

Preview what the script would do without making changes:

```bash
node ai-commit/scripts/ai-commit.js TASK-123 "fix bug" --dry-run
```

Output example:
```
📋 Task ID: TASK-123
💬 Commit message: fix bug
📁 Files to process (unstaged, 3 total):
   - src/auth.js
   - src/login.css
   - README.md

[DRY-RUN] Would process: src/auth.js
[DRY-RUN] Would process: src/login.css
[DRY-RUN] Would process: README.md

[DRY-RUN] Would commit with message: [TASK-123] fix bug
```

## Skip AI Mode

If you just want the commit message format without AI processing:

```bash
node ai-commit/scripts/ai-commit.js TASK-123 "update docs" --skip-ai
```

## Handling Edge Cases

### No Changes

If there are no staged or unstaged changes:

```
Error: No changes to commit
```

### Not a Git Repository

```
Error: Not a git repository
```

### Binary Files

Binary files are automatically skipped and committed as-is:

```
✓ Processed: src/app.js
⚠️  Skipped 1 file(s):
   - assets/logo.png (binary)
```

### Large Files

Files larger than 500KB are skipped to avoid token limits:

```
⚠️  Skipped 1 file(s):
   - data/large-dataset.json (too large (>500KB))
```

## Commit Message Conventions

The script formats commits as:

```
[TASK-ID] Description of change
```

Examples:
```
[JIRA-123] fix user authentication timeout
[PROJ-456] add dark mode toggle
[BUG-789] resolve memory leak in parser
```

## Integration with Claude Code

When using Claude Code, simply ask:

```
/commit my changes with task ID PROJ-123 and message "fix login bug"
```

Or use the skill directly:

```
Use ai-commit to commit these changes as TASK-456 "update API endpoints"
```
