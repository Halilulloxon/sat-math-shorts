/**
 * Instagram Automated Reels Uploader + 1-Click Login & GitHub Secrets Sync for @sat_math_sat
 *
 * Supports two modes automatically:
 * 1) Official Instagram Graph API (`ig_user_id` + `access_token` via Meta Resumable Reels Upload)
 * 2) Browser Session / Cookie Automation (`patchright` headless browser + saved `instagram-session.json` cookies)
 *
 * Commands:
 * - `node instagram-uploader.mjs --auth`          : Opens browser window to log into @sat_math_sat, saves session & syncs to GitHub Secrets
 * - `node instagram-uploader.mjs --upload-sample` : Uploads sample `sat-math-youtube-shorts.mp4` as a Reel to @sat_math_sat
 */

import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));
const IG_SESSION_PATH = path.join(PROJECT_DIR, 'instagram-session.json');
const IG_GRAPH_TOKEN_PATH = path.join(PROJECT_DIR, 'instagram-token.json');
const GITHUB_REPO = 'Halilulloxon/sat-math-shorts';
const IG_USERNAME = 'sat_math_sat';
const IG_EMAIL = 'halilullohayotullo0608@gmail.com';

let chromium;
try {
  const reqLocal = createRequire(import.meta.url);
  ({ chromium } = reqLocal('patchright'));
} catch {
  const reqGlobal = createRequire('C:\\Users\\Halilulloxon\\AppData\\Roaming\\npm\\node_modules\\mcp-video-studio\\package.json');
  ({ chromium } = reqGlobal('patchright'));
}

export async function syncInstagramSecretsToGitHub() {
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
      console.log('⚠️ GitHub token topilmadi, faqat lokal saqlandi.');
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

    const secretsToPush = {};
    if (existsSync(IG_SESSION_PATH)) {
      secretsToPush.INSTAGRAM_SESSION = await readFile(IG_SESSION_PATH, 'utf8');
    }
    if (existsSync(IG_GRAPH_TOKEN_PATH)) {
      secretsToPush.INSTAGRAM_TOKEN = await readFile(IG_GRAPH_TOKEN_PATH, 'utf8');
    }

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

/**
 * Interactive 1-Click Browser Login for @sat_math_sat
 * Opens a real Edge/Chrome window so the user can log into Instagram once,
 * captures the authenticated session (`sessionid` cookie & localStorage),
 * saves `instagram-session.json`, and encrypts it into GitHub Actions Secrets!
 */
export async function runInteractiveInstagramAuth() {
  console.log('\n================================================================');
  console.log(`📸 Instagram (@${IG_USERNAME} / ${IG_EMAIL}) ulash oynasi ochilmoqda...`);
  console.log('Iltimos, ochilgan brauzer oynasida Instagram akkauntingizga kiring.');
  console.log('Tizimga kirganingizdan soʻng avtomatik saqlanadi va GitHub Cloud 24/7 ga ulanadi!');
  console.log('================================================================\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: false, channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ headless: false });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 840 },
  });
  const page = await context.newPage();

  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });

  // Pre-fill username/email if login input appears
  try {
    const userInp = page.locator('input[name="username"], input[name="email"]').first();
    await userInp.waitFor({ state: 'visible', timeout: 8000 });
    await userInp.fill(IG_USERNAME);
  } catch {}

  console.log('⏳ Instagram akkauntga kirishingiz kutilmoqda (maksimum 5 daqiqa)...');

  const deadline = Date.now() + 5 * 60 * 1000;
  let authenticated = false;

  while (Date.now() < deadline) {
    const cookies = await context.cookies('https://www.instagram.com');
    const sessionCookie = cookies.find((c) => c.name === 'sessionid' && c.value && c.value.length > 5);
    if (sessionCookie) {
      authenticated = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!authenticated) {
    await browser.close();
    throw new Error('❌ Instagram login muddati tugadi (sessionid topilmadi). Qayta urinib koʻring.');
  }

  // Wait briefly for full session stabilization
  await page.waitForTimeout(3000);
  const storageState = await context.storageState();
  storageState.meta = {
    username: IG_USERNAME,
    email: IG_EMAIL,
    savedAt: new Date().toISOString(),
  };

  await writeFile(IG_SESSION_PATH, JSON.stringify(storageState, null, 2));
  await browser.close();

  console.log(`✅ Instagram sessiyasi saqlandi: ${IG_SESSION_PATH}`);
  await syncInstagramSecretsToGitHub();
  console.log(`🎉 @${IG_USERNAME} muvaffaqiyatli ulandi va GitHub Cloud 24/7 ga bogʻlandi!`);
}

/**
 * Mode 1: Official Meta Instagram Graph API Resumable Reels Upload
 * Used automatically if `instagram-token.json` exists with `{ igUserId, accessToken }`.
 */
async function uploadViaGraphApi({ videoPath, caption }) {
  const tokenData = JSON.parse(await readFile(IG_GRAPH_TOKEN_PATH, 'utf8'));
  const { igUserId, accessToken } = tokenData;
  if (!igUserId || !accessToken) {
    return null;
  }

  console.log(`[Instagram Graph API] Uploading Reel to @${IG_USERNAME} (${igUserId})...`);
  const fileInfo = await stat(videoPath);
  const videoBytes = await readFile(videoPath);

  // Step 1: Initialize Resumable Upload Container
  const initRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_type: 'REELS',
      upload_type: 'resumable',
      caption,
      share_to_feed: true,
    }),
  });

  if (!initRes.ok) {
    throw new Error(`IG Graph API container init failed: ${await initRes.text()}`);
  }
  const { id: containerId, uri: uploadUri } = await initRes.json();

  // Step 2: Upload Binary MP4 to rupload.facebook.com
  const upRes = await fetch(uploadUri, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${accessToken}`,
      offset: '0',
      file_size: String(fileInfo.size),
      'Content-Type': 'application/octet-stream',
    },
    body: videoBytes,
  });

  if (!upRes.ok) {
    throw new Error(`IG Graph API binary upload failed: ${await upRes.text()}`);
  }

  // Step 3: Poll until status_code === FINISHED
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
    );
    const statusJson = await statusRes.json();
    if (statusJson.status_code === 'FINISHED') break;
    if (statusJson.status_code === 'ERROR') {
      throw new Error(`IG Graph API media processing error: ${JSON.stringify(statusJson)}`);
    }
  }

  // Step 4: Publish Container
  const pubRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ creation_id: containerId }),
  });

  if (!pubRes.ok) {
    throw new Error(`IG Graph API publish failed: ${await pubRes.text()}`);
  }
  const pubData = await pubRes.json();
  console.log(`✅ SUCCESS! Published Instagram Reel via Graph API (ID: ${pubData.id}) to @${IG_USERNAME}`);
  return { uploaded: true, mode: 'graph_api', mediaId: pubData.id, account: `@${IG_USERNAME}` };
}

/**
 * Mode 2: Browser Session Upload via Patchright (`instagram-session.json`)
 * Automates Instagram Web's "Create -> New Post / Reel" modal cleanly in headless mode.
 */
async function uploadViaBrowserSession({ videoPath, caption }) {
  console.log(`[Instagram Uploader] Uploading Reel to @${IG_USERNAME} via authenticated session...`);
  const storageState = JSON.parse(await readFile(IG_SESSION_PATH, 'utf8'));

  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  try {
    const context = await browser.newContext({
      storageState,
      viewport: { width: 1280, height: 900 },
      locale: 'en-US',
    });
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    // Dismiss optional "Turn on Notifications" or "Save Login Info" dialogs
    for (const btnLabel of ['Not Now', 'Not now', 'Cancel', 'OK']) {
      try {
        const btn = page.getByRole('button', { name: btnLabel, exact: true }).first();
        if (await btn.isVisible({ timeout: 1500 })) {
          await btn.click();
          await page.waitForTimeout(800);
        }
      } catch {}
    }

    // Check if logged in
    if (page.url().includes('/accounts/login')) {
      throw new Error(`Instagram session expired for @${IG_USERNAME}. Run: node instagram-uploader.mjs --auth`);
    }

    // Click "New post" / "Create" icon in left sidebar
    const createLink = page.locator('a:has(svg[aria-label="New post"]), a:has(svg[aria-label="Create"]), svg[aria-label="New post"], svg[aria-label="Create"]').first();
    await createLink.waitFor({ state: 'visible', timeout: 15000 });
    await createLink.click();
    await page.waitForTimeout(1500);

    // Professional account submenu: "Post" | "Live video" | "Ad" -> click "Post"
    const postSubItem = page.locator('a[role="link"]:has(span:text-is("Post")), span:text-is("Post")').first();
    if (await postSubItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await postSubItem.click();
      await page.waitForTimeout(2500);
    }

    // Set MP4 file on `<input type="file">` inside the Create modal
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 15000 });
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(4500);

    // Dismiss "Video posts are now shared as reels" popup if shown
    try {
      const okReelBtn = page.locator('[role="dialog"] button:has-text("OK"), [role="dialog"] div[role="button"]:has-text("OK")').first();
      if (await okReelBtn.isVisible({ timeout: 3000 })) {
        await okReelBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Click "Next" (Crop step -> Trim/Cover step)
    const nextBtn1 = page.locator('[role="dialog"] div[role="button"]:text-is("Next"), [role="dialog"] button:text-is("Next")').first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 15000 });
    await nextBtn1.click();
    await page.waitForTimeout(2500);

    // Click "Next" (Trim/Cover step -> Caption & Share step)
    const nextBtn2 = page.locator('[role="dialog"] div[role="button"]:text-is("Next"), [role="dialog"] button:text-is("Next")').first();
    await nextBtn2.waitFor({ state: 'visible', timeout: 15000 });
    await nextBtn2.click();
    await page.waitForTimeout(2500);

    // Fill caption in contenteditable div
    try {
      const captionBox = page.locator('[role="dialog"] div[aria-label="Write a caption..."], [role="dialog"] div[role="textbox"]').first();
      if (await captionBox.isVisible({ timeout: 5000 })) {
        await captionBox.click();
        await page.keyboard.type(caption);
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.warn('Caption fill warning:', e.message);
    }

    // Click exact "Share" button inside dialog (avoids "Share to Threads")
    const shareBtn = page.locator('[role="dialog"] div[role="button"]:text-is("Share"), [role="dialog"] button:text-is("Share")').first();
    await shareBtn.waitFor({ state: 'visible', timeout: 15000 });
    await shareBtn.click();

    console.log('⏳ Waiting for Instagram Reel upload & processing to finish...');
    // Wait until "Your reel has been shared." or "Shared reel" appears
    const sharedConfirmation = page.locator(
      'text=/Your reel has been shared|Shared reel|Post shared|Reel shared/i'
    ).first();
    await sharedConfirmation.waitFor({ state: 'visible', timeout: 120000 });

    // Save refreshed cookies back to `instagram-session.json`
    const updatedState = await context.storageState();
    updatedState.meta = {
      username: IG_USERNAME,
      email: IG_EMAIL,
      savedAt: new Date().toISOString(),
    };
    await writeFile(IG_SESSION_PATH, JSON.stringify(updatedState, null, 2));

    console.log(`✅ SUCCESS! Uploaded Instagram Reel to https://www.instagram.com/${IG_USERNAME}/`);
    return {
      uploaded: true,
      mode: 'browser_session',
      account: `@${IG_USERNAME}`,
      url: `https://www.instagram.com/${IG_USERNAME}/`,
    };
  } finally {
    await browser.close();
  }
}

export async function uploadReelToInstagram({ videoPath, caption }) {
  try {
    if (existsSync(IG_GRAPH_TOKEN_PATH)) {
      const graphRes = await uploadViaGraphApi({ videoPath, caption });
      if (graphRes) return graphRes;
    }
    if (existsSync(IG_SESSION_PATH)) {
      return await uploadViaBrowserSession({ videoPath, caption });
    }
    console.log(
      `[Instagram Uploader] Skipping live Instagram upload for @${IG_USERNAME}: run "node instagram-uploader.mjs --auth" once to connect.`
    );
    return { uploaded: false, reason: 'missing_instagram_session' };
  } catch (err) {
    console.error(`[Instagram Uploader] Error uploading to @${IG_USERNAME}:`, err.message);
    return { uploaded: false, reason: err.message };
  }
}

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  if (process.argv.includes('--auth')) {
    runInteractiveInstagramAuth().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else if (process.argv.includes('--upload-sample')) {
    uploadReelToInstagram({
      videoPath: path.join(PROJECT_DIR, 'sat-math-youtube-shorts.mp4'),
      caption:
        "SAT Math 5-Soniyalik Usul! Kvadrat tenglama ildizlari yigʻindisini (-b/a) orqali 5 soniyada toping! 🔥\n\n🚀 Bizning rasmiy Digital SAT platformamiz — SAT MASTER:\n👉 satmaster.halilulloxon.uz (Link bio'da!)\n\n✅ Real Digital SAT Bluebook Adaptive Simulator\n✅ 24/7 AI SAT Math Tutor\n✅ 3,000+ SAT Math savollar\n\n#satmath #sat #math #mathematics #DigitalSAT #SATUzbekistan #reels #sat_math_sat",
    }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log(`Instagram Reels Uploader ready for @${IG_USERNAME} (${IG_EMAIL}).`);
    console.log(`Session path:     ${IG_SESSION_PATH}`);
    console.log(`Graph Token path: ${IG_GRAPH_TOKEN_PATH}`);
    console.log(`Run "node instagram-uploader.mjs --auth" to log in and sync with GitHub Cloud 24/7.`);
  }
}
