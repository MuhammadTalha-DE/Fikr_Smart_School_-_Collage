const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon',
};

async function fetchImageBuffer(source) {
  if (!source || typeof source !== 'string') return null;
  if (source.startsWith('data:')) {
    const base64 = source.match(/^data:[^;,]+;base64,(.+)$/s)?.[1];
    return base64 ? Buffer.from(base64, 'base64') : null;
  }

  if (/^https?:\/\//i.test(source)) {
    try {
      const response = await fetch(source);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  const normalized = decodeURIComponent(source.split(/[?#]/, 1)[0]).replace(/\\/g, '/');
  const uploadMarker = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
  if (!uploadMarker) return null;
  const relativePath = uploadMarker[1];
  const roots = [
    path.resolve(__dirname, '../uploads'),
    path.resolve(__dirname, '../../uploads'),
  ];

  for (const root of roots) {
    const candidate = path.resolve(root, relativePath);
    if (!candidate.startsWith(`${root}${path.sep}`)) continue;
    try {
      return await fs.promises.readFile(candidate);
    } catch {
      // Try the second configured uploads directory.
    }
  }
  return null;
}

function getImageMimeType(source) {
  if (typeof source === 'string' && source.startsWith('data:')) {
    return source.slice(5).split(/[;,]/, 1)[0] || 'image/png';
  }
  return mimeTypes[path.extname(String(source || '')).toLowerCase()] || 'image/png';
}

module.exports = { fetchImageBuffer, getImageMimeType };
