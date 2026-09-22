/**
 * Runs the suite on each desktop browser one after another (Chromium, Firefox, WebKit),
 * keeping a separate report folder per browser as cross-browser evidence.
 *   npm run test:cross-browser [-- extra cucumber-js args]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');

const browsers = (process.env.BROWSERS || 'chromium,firefox,webkit').split(',');
const extra = process.argv.slice(2);
const summary = [];

for (const browser of browsers) {
  console.log(`\n========== ${browser.toUpperCase()} ==========\n`);
  fs.rmSync('reports', { recursive: true, force: true });
  const status = spawnSync('npx', ['cucumber-js', ...extra], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER: browser },
  }).status;
  if (fs.existsSync('reports')) {
    fs.rmSync(`reports-${browser}`, { recursive: true, force: true });
    fs.renameSync('reports', `reports-${browser}`);
  }
  summary.push({ browser, result: status === 0 ? 'PASSED' : 'FAILED', report: `reports-${browser}/cucumber-report.html` });
}

console.table(summary);
process.exit(summary.every((s) => s.result === 'PASSED') ? 0 : 1);
