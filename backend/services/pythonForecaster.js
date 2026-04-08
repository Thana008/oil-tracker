const path = require('path');
const { spawn } = require('child_process');

const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const SCRIPT_PATH = path.join(__dirname, '../python/predict_price.py');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = {};

function runPython(payload) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `python exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout || '{}'));
      } catch (e) {
        reject(new Error(`invalid python json: ${e.message}`));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

async function predictPriceWithPython(history, fuelType, horizonDays = 7) {
  const key = `${fuelType}:${horizonDays}`;
  const now = Date.now();
  const cached = cache[key];
  if (cached && now < cached.expiresAt) return cached.value;

  const sliced = Array.isArray(history) ? history.slice(-180) : [];
  const result = await runPython({ history: sliced, fuelType, horizonDays });
  cache[key] = { value: result, expiresAt: now + CACHE_TTL_MS };
  return result;
}

module.exports = { predictPriceWithPython };

