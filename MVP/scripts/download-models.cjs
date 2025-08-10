/* eslint-disable */
const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_BASE = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

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
  for (const f of FILES) {
    const url = `${MODEL_BASE}/${f}`;
    const dest = path.join(outDir, f);
    if (fs.existsSync(dest)) {
      console.log('exists', f);
      continue;
    }
    console.log('downloading', f);
    await download(url, dest);
  }
  console.log('Models ready in public/models');
})();




