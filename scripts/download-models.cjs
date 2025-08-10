/* eslint-disable */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Fallback local mirror is removed due to 404s; models will be streamed from CDN at runtime.
const MODEL_BASE = null;
const FILES = [];

const outDir = path.join(process.cwd(), 'public', 'models');
fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed ${url} -> ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

(async () => {
  console.log('CDN model loading enabled; no downloads required.');
})();


