/**
 * YouTube Data API v3 Resumable Video Uploader + 1-Click OAuth & GitHub Secrets Sync for @SATMATH-b5n
 *
 * Commands:
 * - `node youtube-uploader.mjs --auth` : Opens browser login to generate `youtube-token.json` and syncs to GitHub Actions Secrets
 * - `node youtube-uploader.mjs`        : Checks status or uploads video
 */

import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_SECRET_PATH = path.join(PROJECT_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(PROJECT_DIR, 'youtube-token.json');
const REDIRECT_URI = 'http://localhost:8989/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const GITHUB_REPO = 'Halilulloxon/sat-math-shorts';

async function syncSecretsToGitHub() {
  try {
    const sodiumMod = await import('libsodium-wrappers');
    const sodium = sodiumMod.default || sodiumMod;
    await sodium.ready;

    const credOut = spawnSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
    }).stdout;
    const tokenLine = (credOut || '').split('\n').find((l) => l.startsWith('password='));
    if (!tokenLine) {
      console.log('⚠️ GitHub token topilmadi, lokal saqlandi.');
      return;
    }
    const ghToken = tokenLine.slice(9).trim();
    const headers = {
      Authorization: `Bearer ${ghToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'sat-math-shorts',
      'Content-Type': 'application/json',
    };

    const pkRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/public-key`, { headers });
    if (!pkRes.ok) {
      throw new Error(`Public key olishda xato: ${await pkRes.text()}`);
    }
    const { key_id, key } = await pkRes.json();
    const binKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);

    const secretsToPush = {
      YOUTUBE_CLIENT_SECRET: await readFile(CLIENT_SECRET_PATH, 'utf8'),
      YOUTUBE_TOKEN: await readFile(TOKEN_PATH, 'utf8'),
    };

    for (const [secretName, secretValue] of Object.entries(secretsToPush)) {
      const binSec = sodium.from_string(secretValue);
      const encBytes = sodium.crypto_box_seal(binSec, binKey);
      const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

      const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/${secretName}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ encrypted_value, key_id }),
      });
      if (!putRes.ok) {
        throw new Error(`Secret ${secretName} saqlashda xato: ${await putRes.text()}`);
      }
      console.log(`✅ GitHub Secret yuklandi: ${secretName}`);
    }
  } catch (err) {
    console.error('GitHub Secret sync warning:', err.message);
  }
}

export async function runInteractiveOAuth() {
  if (!existsSync(CLIENT_SECRET_PATH)) {
    console.error(`❌ client_secret.json topilmadi: ${CLIENT_SECRET_PATH}`);
    process.exit(1);
  }
  const secretRaw = JSON.parse(await readFile(CLIENT_SECRET_PATH, 'utf8'));
  const client = secretRaw.installed || secretRaw.web;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', client.client_id);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('\n========================================================');
  console.log('🌐 Brauzerda YouTube (@SATMATH-b5n) ruxsat oynasi ochilmoqda...');
  console.log('Agar avtomatik ochilmasa, ushbu havolani bosing:\n');
  console.log(authUrl.toString());
  console.log('========================================================\n');

  try {
    execFileSync('cmd.exe', ['/c', 'start', '', authUrl.toString()], { stdio: 'ignore' });
  } catch {}

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, REDIRECT_URI);
      if (reqUrl.pathname === '/oauth2callback') {
        const authCode = reqUrl.searchParams.get('code');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2 style="font-family:sans-serif;color:#10b981;">✅ YouTube (@SATMATH-b5n) muvaffaqiyatli ulandi va GitHub Cloud 24/7 ga bogʻlandi! Bu oynani yopishingiz mumkin.</h2>');
        server.close();
        if (authCode) resolve(authCode);
        else reject(new Error('OAuth code qaytmadi'));
      }
    });
    server.listen(8989);
  });

  const params = new URLSearchParams({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token olishda xatolik: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  tokenData.expiry_date = Date.now() + (tokenData.expires_in || 3600) * 1000;
  await writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  console.log(`✅ youtube-token.json saqlandi: ${TOKEN_PATH}`);

  await syncSecretsToGitHub();
  return tokenData;
}

async function getAccessToken() {
  if (!existsSync(CLIENT_SECRET_PATH) || !existsSync(TOKEN_PATH)) {
    return null;
  }
  const secretRaw = JSON.parse(await readFile(CLIENT_SECRET_PATH, 'utf8'));
  const client = secretRaw.installed || secretRaw.web;
  const token = JSON.parse(await readFile(TOKEN_PATH, 'utf8'));

  if (token.expiry_date && Date.now() < token.expiry_date - 60000) {
    return token.access_token;
  }

  const params = new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh YouTube OAuth token: ${await res.text()}`);
  }
  const refreshed = await res.json();
  const updated = {
    ...token,
    access_token: refreshed.access_token,
    expiry_date: Date.now() + (refreshed.expires_in || 3600) * 1000,
  };
  await writeFile(TOKEN_PATH, JSON.stringify(updated, null, 2));
  return updated.access_token;
}

export async function uploadShortToYouTube({ videoPath, title, description, privacyStatus = 'public' }) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('[YouTube Uploader] Skipping live API upload: client_secret.json or youtube-token.json not configured yet.');
    return { uploaded: false, reason: 'missing_oauth_credentials' };
  }

  const fileInfo = await stat(videoPath);
  const videoBytes = await readFile(videoPath);

  const metadata = {
    snippet: {
      title,
      description,
      tags: ['satmath', 'sat', 'math', 'mathematics', 'DigitalSAT', 'SATUzbekistan', 'Shorts'],
      categoryId: '27', // Education
      defaultLanguage: 'uz',
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(fileInfo.size),
      'X-Upload-Content-Type': 'video/mp4',
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) {
    throw new Error(`YouTube upload init failed: ${await initRes.text()}`);
  }

  const uploadUrl = initRes.headers.get('location');
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(fileInfo.size),
      'Content-Type': 'video/mp4',
    },
    body: videoBytes,
  });

  if (!uploadRes.ok) {
    throw new Error(`YouTube video byte upload failed: ${await uploadRes.text()}`);
  }

  const result = await uploadRes.json();
  console.log(`SUCCESS! Uploaded YouTube video: https://youtu.be/${result.id}`);
  return { uploaded: true, videoId: result.id, url: `https://youtu.be/${result.id}` };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  if (process.argv.includes('--auth')) {
    runInteractiveOAuth().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log('YouTube Data API v3 Uploader ready.');
    console.log(`Credentials path: ${CLIENT_SECRET_PATH}`);
    console.log(`Token path:       ${TOKEN_PATH}`);
  }
}
