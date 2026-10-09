#!/usr/bin/env node
// PostToolUse hook: after Claude edits a TypeScript file under src/ or test/,
// run `npm run typecheck` and feed any errors back to Claude (exit code 2).
const { spawnSync } = require('node:child_process');

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    filePath = JSON.parse(input).tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }
  if (!/[\\/](src|test)[\\/].*\.ts$/.test(filePath)) {
    process.exit(0);
  }
  const result = spawnSync('npm', ['run', 'typecheck', '--silent'], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(`typecheck failed after editing ${filePath}:\n${result.stdout}${result.stderr}`);
    process.exit(2);
  }
});
