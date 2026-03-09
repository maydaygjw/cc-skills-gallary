const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Resolve config file path with environment variable support
 * Priority:
 * 1. UDQ_CONFIG_PATH env var
 * 2. Project root udq-config.yaml
 * 3. Project root .config/udq-config.yaml
 * 4. User home ~/.config/udq/config.yaml
 * 5. Fallback: ./udq-config.yaml
 */
function getConfigPath() {
  if (process.env.UDQ_CONFIG_PATH) {
    return process.env.UDQ_CONFIG_PATH;
  }

  const locations = [
    path.join(process.cwd(), 'udq-config.yaml'),
    path.join(process.cwd(), '.config', 'udq-config.yaml'),
    path.join(os.homedir(), '.config', 'udq', 'config.yaml'),
    path.join(process.cwd(), 'udq-config.yaml'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }

  return locations[0];
}

/**
 * Resolve patterns directory
 * Priority:
 * 1. UDQ_PATTERNS_PATH env var
 * 2. Project root udq-patterns/
 * 3. Project root .config/udq/patterns/
 * 4. User home ~/.config/udq/patterns/
 * 5. Fallback: skill built-in udq-patterns/
 */
function getPatternsDir() {
  if (process.env.UDQ_PATTERNS_PATH) {
    return process.env.UDQ_PATTERNS_PATH;
  }

  const locations = [
    path.join(process.cwd(), 'udq-patterns'),
    path.join(process.cwd(), '.config', 'udq', 'patterns'),
    path.join(os.homedir(), '.config', 'udq', 'patterns'),
    path.join(__dirname, '..', 'udq-patterns'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc) && fs.statSync(loc).isDirectory()) {
      return loc;
    }
  }

  return locations[locations.length - 1];
}

/**
 * Resolve cache directory
 * Priority:
 * 1. UDQ_CACHE_PATH env var
 * 2. Project root .udq-cache/
 * 3. Project root .config/udq/cache/
 * 4. User home ~/.cache/udq/
 * 5. Fallback: ./.udq-cache/
 */
function getCacheDir() {
  if (process.env.UDQ_CACHE_PATH) {
    return process.env.UDQ_CACHE_PATH;
  }

  const locations = [
    path.join(process.cwd(), '.udq-cache'),
    path.join(process.cwd(), '.config', 'udq', 'cache'),
    path.join(os.homedir(), '.cache', 'udq'),
    path.join(process.cwd(), '.udq-cache'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc) && fs.statSync(loc).isDirectory()) {
      return loc;
    }
  }

  return locations[0];
}

module.exports = { getConfigPath, getPatternsDir, getCacheDir };
