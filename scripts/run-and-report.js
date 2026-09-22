/**
 * Runs cucumber-js, then ALWAYS generates the Allure report (even when tests fail),
 * optionally opens it, and exits with cucumber's exit code so CI still fails correctly.
 *
 *   node scripts/run-and-report.js [--open] [cucumber-js args...]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const open = args.includes('--open');
const cucumberArgs = args.filter((a) => a !== '--open');
const run = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true }).status ?? 1;

fs.rmSync('allure-results', { recursive: true, force: true });
const testExit = run('npx', ['cucumber-js', ...cucumberArgs]);

const genExit = run('npx', ['allure', 'generate', 'allure-results', '--clean', '-o', 'allure-report']);
if (genExit !== 0) console.warn('\nAllure report could not be generated (is Java installed?). Cucumber HTML report: reports/cucumber-report.html');
else if (open) run('npx', ['allure', 'open', 'allure-report']);

process.exit(testExit);
