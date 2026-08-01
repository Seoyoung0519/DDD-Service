/**
 * Android 빌드 시 JAVA_HOME이 JDK 7 등 구버전이면 Gradle HTTPS 다운로드가 실패합니다.
 * Windows Program Files\Java 아래 최신 JDK(17+)를 자동 선택합니다.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

function parseJdkMajor(name) {
  const modern = name.match(/^jdk-(\d+)/i);
  if (modern) return Number(modern[1]);
  const legacy = name.match(/^jdk1\.(\d+)/i);
  if (legacy) return Number(legacy[1]);
  return 0;
}

function javaHomeMajor(javaHome) {
  const base = path.basename(javaHome);
  const fromName = parseJdkMajor(base);
  if (fromName > 0) return fromName;

  const javaBin =
    process.platform === 'win32'
      ? path.join(javaHome, 'bin', 'java.exe')
      : path.join(javaHome, 'bin', 'java');
  if (!fs.existsSync(javaBin)) return 0;

  const r = spawnSync(javaBin, ['-version'], { encoding: 'utf8' });
  const out = `${r.stderr || ''}${r.stdout || ''}`;
  const m = out.match(/version "(\d+)(?:\.|")/);
  if (m) return Number(m[1]);
  const m2 = out.match(/version "1\.(\d+)/);
  return m2 ? Number(m2[1]) : 0;
}

function listWindowsJdks() {
  const roots = ['C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium'];
  const out = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root, { withFileTypes: true })) {
      if (d.isDirectory() && /^jdk/i.test(d.name)) {
        out.push(path.join(root, d.name));
      }
    }
  }
  return out;
}

function resolveJavaHome() {
  const candidates = [];

  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    candidates.push(process.env.JAVA_HOME);
  }

  if (process.platform === 'win32') {
    candidates.push(...listWindowsJdks());
  }

  const seen = new Set();
  const ranked = candidates
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .map((c) => ({ path: c, major: javaHomeMajor(c) }))
    .filter((c) => c.major >= 17 && c.major <= 21)
    .sort((a, b) => {
      const prefer = (major) => {
        if (major >= 17 && major <= 21) return 0;
        return major > 21 ? major - 21 + 10 : 100;
      };
      const diff = prefer(a.major) - prefer(b.major);
      return diff !== 0 ? diff : a.major - b.major;
    });

  return ranked[0]?.path ?? null;
}

function resolveJavaHomeOrExit() {
  const jdk = resolveJavaHome();
  if (jdk) return jdk;

  const fallback = listWindowsJdks()
    .map((c) => ({ path: c, major: javaHomeMajor(c) }))
    .filter((c) => c.major >= 17)
    .sort((a, b) => a.major - b.major)[0];

  return fallback?.path ?? null;
}

const jdkHome = resolveJavaHomeOrExit();
const env = { ...process.env };

if (jdkHome) {
  env.JAVA_HOME = jdkHome;
  console.log(`[run-android] JAVA_HOME=${jdkHome}`);
} else {
  console.error(
    '[run-android] JDK 17–21 not found. Install Temurin 17: winget install EclipseAdoptium.Temurin.17.JDK',
  );
  process.exit(1);
}

async function main() {
  const extraArgs = process.argv.slice(2);
  const hasPortFlag = extraArgs.some((a) => a === '--port' || a.startsWith('--port='));
  const hasNoBundler = extraArgs.includes('--no-bundler');

  // 8081에 Metro가 이미 떠 있으면 새 서버(8082) 대신 기존 Metro 재사용
  if (!hasPortFlag && !hasNoBundler && (await isPortInUse(8081))) {
    extraArgs.push('--no-bundler');
    console.log('[run-android] port 8081 in use — reusing existing Metro (--no-bundler)');
  }

  const args = ['expo', 'run:android', ...extraArgs];
  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    env,
  });

  process.exit(result.status ?? 1);
}

void main();
