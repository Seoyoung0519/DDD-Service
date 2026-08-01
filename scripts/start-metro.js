/**
 * Windows에서 Metro "Failed to start watch mode" 완화:
 * - CHOKIDAR_USEPOLLING: chokidar fallback watcher가 fs 이벤트 대신 폴링 사용
 * - CI=1: Metro가 watchman 사용을 줄이는 경로 활성화(Expo/Metro 버전에 따라)
 */
const { spawn } = require('child_process');

if (!process.env.CHOKIDAR_USEPOLLING) {
  process.env.CHOKIDAR_USEPOLLING = '1';
}
if (!process.env.WATCHMAN_DISABLE) {
  process.env.WATCHMAN_DISABLE = '1';
}

const passthrough = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', ...passthrough], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: require('path').join(__dirname, '..'),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
