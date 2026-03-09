# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Claude Code Skills Gallery** - a collection of reusable skills that extend Claude's capabilities. Each skill is a self-contained module with documentation, scripts, and reference materials.

## Repository Structure

```
├── marp-slide-maker/          # Create Marp presentation slides from Markdown
├── mermaid-design/            # Generate Mermaid diagrams for documentation
├── universal-db-query/        # Database query skill with MCP (DBHub)
├── universal-db-query-v2/     # Database query skill - Standalone (no MCP)
└── .claude/                   # Claude Code configuration
    ├── settings.local.json
    └── skills/                # Installed skills (auto-generated)
```

## Skill Architecture

Each skill follows a standardized structure:

```
skill-name/
├── SKILL.md                    # Main skill definition (required)
│   ├── Frontmatter: name, description
│   └── Usage instructions, examples
├── scripts/                    # Executable scripts (required)
│   └── *.js                    # Node.js utilities
├── references/                 # Documentation references (required)
│   └── *.md                    # Syntax guides, patterns
├── assets/                     # Static assets (optional)
├── templates/                  # Template files (optional)
├── examples/                   # Usage examples (optional)
├── validate-skill.js           # Structure validation
└── package.json                # Node.js metadata (optional)
```

## Available Skills

### marp-slide-maker

Creates professional presentation slides using Marp (Markdown Presentation Ecosystem).

**Key Scripts:**
- `node scripts/generate-slide.js <template> [options] <output>` - Generate slides
- `node validate-skill.js` - Validate skill structure
- `npm run validate` - NPM wrapper for validation

**Templates:** `basic`, `technical`, `presentation`, `workshop`

**Example:**
```bash
node marp-slide-maker/scripts/generate-slide.js technical --title "Tech Talk" output.md
```

**Exporting:** Requires Marp CLI (`npm install -g @marp-team/marp-cli`)

### mermaid-design

Generates Mermaid diagrams for system architecture, workflows, and technical documentation.

**Key Scripts:**
- `node scripts/generate-diagram.js` - Interactive diagram generator
- `node validate-skill.js` - Validate skill structure

**Diagram Categories:**
- `architecture`: Layered, microservices, event-driven
- `flowchart`: Process flows, decision trees
- `sequence`: API interactions, use cases
- `entity`: Database schemas, domain models

### universal-db-query

Intelligent database query skill with automatic metadata discovery (requires DBHub MCP).

**Key Files:**
- `SKILL.md` - Skill implementation guide
- `templates/db-config.yaml` - Configuration template
- `templates/db-patterns/*.sql` - Query templates
- `examples/fanhuolun.md` - Usage examples

**Configuration:** Requires `.claude/db-config.yaml` in target project:
```yaml
database:
  mcp_server: DBHub
  schema: your_database
```

### universal-db-query-v2

Standalone database query skill - direct connection without MCP server. Supports MySQL, PostgreSQL, SQLite.

**Key Scripts:**
- `node scripts/query.js "<sql>"` - Execute SQL queries
- `node scripts/discover-schema.js [--refresh]` - Discover and cache schema
- `node scripts/list-tables.js` - List all tables
- `node scripts/describe-table.js <table>` - Show table structure
- `node scripts/run-pattern.js <pattern>` - Run SQL patterns
- `npm install` - Install dependencies (mysql2, pg, better-sqlite3)

**Configuration:** Requires `./udq-config.yaml` in target project:
```yaml
database:
  type: mysql|postgresql|sqlite
  host: localhost
  port: 3306
  user: username
  password: password
  database: db_name

options:
  readonly_mode: true
  cache_enabled: true
```

## Skill Development

### Creating a New Skill

1. Create directory: `mkdir new-skill/`
2. Create `SKILL.md` with frontmatter:
   ```yaml
   ---
   name: skill-name
   description: What this skill does
   ---
   ```
3. Create `scripts/` directory with utilities
4. Create `references/` directory with documentation
5. Add `validate-skill.js` for structure validation
6. Test with `node validate-skill.js`

### Skill Validation

Each skill should have a `validate-skill.js` that checks:
- `SKILL.md` exists with proper frontmatter (name, description)
- `scripts/` directory exists
- `references/` directory exists
- Required files are present

Run validation:
```bash
node <skill-name>/validate-skill.js
```

### Skill Frontmatter Format

```yaml
---
name: skill-name
description: Clear description of what the skill does
---
```

## Common Operations

### Validate All Skills
```bash
node marp-slide-maker/validate-skill.js
node mermaid-design/validate-skill.js
node universal-db-query-v2/validate-skill.js
```

### Universal DB Query V2 (Standalone)
```bash
# Setup
cd universal-db-query-v2 && npm install

# Configure
cp templates/config.yaml ./udq-config.yaml  # Edit with your DB settings

# Usage
node scripts/discover-schema.js              # Cache schema
node scripts/list-tables.js                  # List tables
node scripts/describe-table.js orders        # Describe table
node scripts/query.js "SELECT * FROM orders LIMIT 10"
node scripts/run-pattern.js daily-report     # Run pattern
```

### Generate Marp Slides
```bash
node marp-slide-maker/scripts/generate-slide.js <template> output.md
node marp-slide-maker/scripts/generate-slide.js --list-templates
node marp-slide-maker/scripts/generate-slide.js --help
```

### Generate Mermaid Diagrams
```bash
node mermaid-design/scripts/generate-diagram.js
# Follow interactive prompts
```

## Dependencies

- **Node.js**: Required for skill scripts
- **Marp CLI**: Optional, for exporting slides to PDF/PPTX
  ```bash
  npm install -g @marp-team/marp-cli
  ```

## Claude Code Configuration

Settings in `.claude/settings.local.json`:
- Permissions for Bash commands (node, npm, marp)
- WebFetch permissions for documentation
- WebSearch enabled

## Skill Design Principles

1. **Self-contained**: Each skill includes all necessary documentation
2. **Templated**: Use templates for consistent output generation
3. **Validated**: Include validation scripts for structure checking
4. **Documented**: Include reference materials for users
5. **Executable**: Provide scripts that can be run standalone

## Notes

- Skills are consumed by Claude Code through the `SKILL.md` files
- The `.claude/skills/` directory is auto-generated; do not manually edit
- When modifying skills, always run validation to ensure structure is correct
- Universal-db-query is a design specification; implementation is in the SKILL.md
