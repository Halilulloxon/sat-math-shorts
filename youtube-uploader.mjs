/**
 * YouTube Data API v3 Resumable Video Uploader for @SATMATH-b5n
 *
 * Setup once:
 * 1. Save your Google Cloud OAuth 2.0 Desktop client credentials to:
 *    C:\Users\Halilulloxon\.gemini\antigravity\scratch\sat-math-shorts\client_secret.json
 * 2. Run `node youtube-uploader.mjs --auth` once to authorize your YouTube channel
 *    and save `youtube-token.json`.
 * 3. Every daily run at 09:00 AM (Asia/Tashkent) automatically refreshes the access token
 *    and uploads the generated Shorts MP4 to https://www.youtube.com/@SATMATH-b5n.
 */

import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_SECRET_PATH = path.join(PROJECT_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(PROJECT_DIR, 'youtube-token.json');

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
  console.log(`SUCCESS! Uploaded YouTube Short: https://youtube.com/shorts/${result.id}`);
  return { uploaded: true, videoId: result.id, url: `https://youtube.com/shorts/${result.id}` };
}

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('YouTube Data API v3 Uploader ready.');
  console.log(`Credentials path: ${CLIENT_SECRET_PATH}`);
  console.log(`Token path:       ${TOKEN_PATH}`);

  if (existsSync(TOKEN_PATH)) {
    console.log('[YouTube Uploader] Found youtube-token.json! Preparing upload...');
    const outputsDir = path.join(PROJECT_DIR, 'daily-outputs');
    let targetMeta = null;
    if (existsSync(outputsDir)) {
      const files = (await readdir(outputsDir)).filter(f => f.endsWith('.json'));
      files.sort().reverse();
      if (files.length > 0) {
        targetMeta = JSON.parse(await readFile(path.join(outputsDir, files[0]), 'utf8'));
      }
    }
    if (!targetMeta && existsSync(path.join(PROJECT_DIR, 'current-topic.json'))) {
      const topic = JSON.parse(await readFile(path.join(PROJECT_DIR, 'current-topic.json'), 'utf8'));
      targetMeta = {
        title: topic.ytTitle,
        description: topic.ytDescription,
        videoPath: path.join(PROJECT_DIR, 'sat-math-youtube-shorts.mp4')
      };
    }
    if (targetMeta && existsSync(targetMeta.videoPath)) {
      console.log(`Uploading ${targetMeta.videoPath} to https://www.youtube.com/@SATMATH-b5n...`);
      const uploadRes = await uploadShortToYouTube({
        videoPath: targetMeta.videoPath,
        title: targetMeta.title,
        description: targetMeta.description
      });
      console.log('Upload result:', uploadRes);
    } else {
      console.log('No rendered video file found for upload.');
    }
  } else {
    console.log('[YouTube Uploader] youtube-token.json is not present.');
    console.log('[YouTube Uploader] Upload skipped. Ready to upload to https://www.youtube.com/@SATMATH-b5n once authorized.');
  }
}
