#!/usr/bin/env node
/**
 * Builds the library, packs it into a fixed-name tarball, and npm-installs it here.
 * npm (not pnpm) on purpose: this app lives outside the pnpm workspace so the
 * install exercises the published artifact — `files`, `exports`, styles.css — the
 * same way a real consumer's `npm install @kiranharidas/chat-kit` would.
 */
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exampleDir = dirname(fileURLToPath(import.meta.url));
const libDir = resolve(exampleDir, '../../packages/chat-kit');
const tarball = join(exampleDir, 'chat-kit-local.tgz');

const major = Number(process.versions.node.split('.')[0]);
if (major < 22) {
  console.error(
    `Node ${process.versions.node} is too old for this repo's toolchain (need >= 22, repo pins 26).\n` +
      'Run: export PATH="$HOME/.nvm/versions/node/v26.0.0/bin:$PATH"',
  );
  process.exit(1);
}

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

run('pnpm build', libDir);
run(`pnpm pack --out ${JSON.stringify(tarball)}`, libDir);

// The tarball keeps the same name/version across re-packs, so drop any previous
// install and lockfile — otherwise npm may reuse a stale integrity/cache entry.
rmSync(join(exampleDir, 'node_modules', '@kiranharidas', 'chat-kit'), {
  recursive: true,
  force: true,
});
rmSync(join(exampleDir, 'package-lock.json'), { force: true });
run('npm install --no-audit --no-fund', exampleDir);

console.log('\n✔ Installed @kiranharidas/chat-kit from local tarball.');
console.log('  Next: cd examples/local-consumer && npm run dev');
