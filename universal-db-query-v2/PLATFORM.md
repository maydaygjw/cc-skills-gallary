# Platform-Independent Setup

Universal DB Query V2 is now platform-agnostic and can be deployed to any environment (Claude Code, OpenClaw, standalone, etc.).

## Configuration Paths

All paths support environment variables for maximum flexibility:

### Config File (`udq-config.yaml`)

Priority order:
1. `UDQ_CONFIG_PATH` environment variable
2. `./udq-config.yaml` (project root)
3. `./.config/udq-config.yaml` (project root)
4. `~/.config/udq/config.yaml` (user home)

### Patterns Directory (`udq-patterns/`)

Priority order:
1. `UDQ_PATTERNS_PATH` environment variable
2. `./udq-patterns/` (project root)
3. `./.config/udq/patterns/` (project root)
4. `~/.config/udq/patterns/` (user home)
5. Skill built-in `udq-patterns/` (fallback)

### Cache Directory (`.udq-cache/`)

Priority order:
1. `UDQ_CACHE_PATH` environment variable
2. `./.udq-cache/` (project root)
3. `./.config/udq/cache/` (project root)
4. `~/.cache/udq/` (user home)

## Environment Variables

```bash
# Optional: Override default paths
export UDQ_CONFIG_PATH=/path/to/your/config.yaml
export UDQ_PATTERNS_PATH=/path/to/your/patterns
export UDQ_CACHE_PATH=/path/to/your/cache
```

## Deployment Examples

### Claude Code
```bash
# Config in project root
cp udq-config.yaml /path/to/project/udq-config.yaml
```

### OpenClaw
```bash
# Use environment variables
export UDQ_CONFIG_PATH=/etc/openclaw/udq-config.yaml
export UDQ_PATTERNS_PATH=/etc/openclaw/patterns
export UDQ_CACHE_PATH=/var/cache/udq
```

### Standalone
```bash
# Config in current directory
node scripts/query.js "SELECT * FROM users"
```

## Migration from Claude Code

If you have existing `.claude/` paths, they will continue to work but are deprecated. To migrate:

```bash
# Move config
mv .claude/udq-config.yaml ./udq-config.yaml

# Move patterns
mv .claude/udq-patterns ./udq-patterns

# Move cache
mv .claude/.udq-cache ./.udq-cache
```
