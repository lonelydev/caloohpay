#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('Usage: node scripts/make-executable.js <file> [file ...]');
  process.exit(1);
}

const mode = 0o755;

targets.forEach((target) => {
  const resolved = path.resolve(__dirname, '..', target);

  try {
    fs.chmodSync(resolved, mode);
    const relativePath = path.relative(process.cwd(), resolved) || resolved;
    console.log(`Set executable permissions on ${relativePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: cannot find ${target}, skipping chmod.`);
      return;
    }

    throw error;
  }
});
