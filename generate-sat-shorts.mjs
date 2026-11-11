import { mkdir, rm, stat, copyFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('C:\\Users\\Halilulloxon\\AppData\\Roaming\\npm\\node_modules\\mcp-video-studio\\package.json');
const { chromium } = require('patchright');

const FFMPEG = 'C:\\Users\\Halilulloxon\\AppData\\Roaming\\npm\\ffmpeg.exe';
const PROJECT_DIR = 'C:\\Users\\Halilulloxon\\.gemini\\antigravity\\scratch\\sat-math-shorts';
const FRAMES_DIR = path.join(PROJECT_DIR, 'frames');
const AUDIO_DIR = path.join(PROJECT_DIR, 'audio');
const OUTPUT_MP4 = path.join(PROJECT_DIR, 'sat-math-youtube-shorts.mp4');
const CONV_ARTIFACT_DIR = 'C:\\Users\\Halilulloxon\\.gemini\\antigravity\\brain\\64895711-717e-451c-80f5-e1ac4ce2ea57';
const CURRENT_BRAIN_DIR = 'C:\\Users\\Halilulloxon\\.gemini\\antigravity\\brain\\5e3180ae-9fc6-4d1c-8991-f974537d7576';
const ARTIFACT_MP4 = path.join(CONV_ARTIFACT_DIR, 'sat-math-youtube-shorts.mp4');
const PREVIEW_PNG = path.join(CONV_ARTIFACT_DIR, 'sat-math-preview.png');

const FPS = 30;
const DURATION_SEC = 18;
const TOTAL_FRAMES = FPS * DURATION_SEC;

function drawFrameInBrowser(t) {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;
  const topic = window.__CURRENT_TOPIC__ || {};

  function clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
  }
  function easeOutCubic(x) {
    x = clamp(x);
    return 1 - Math.pow(1 - x, 3);
  }
  function easeOutBack(x) {
    x = clamp(x);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // 1. Deep animated dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#070B19');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#090D16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle animated glowing orbs
  ctx.save();
  const orb1Y = 380 + Math.sin(t * 1.5) * 40;
  const rad1 = ctx.createRadialGradient(220, orb1Y, 20, 220, orb1Y, 420);
  rad1.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  rad1.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, W, H);

  const orb2Y = 1380 + Math.cos(t * 1.2) * 50;
  const rad2 = ctx.createRadialGradient(860, orb2Y, 20, 860, orb2Y, 460);
  rad2.addColorStop(0, 'rgba(168, 85, 247, 0.20)');
  rad2.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = rad2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Subtle math grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 2;
  const gridOffset = (t * 25) % 90;
  for (let x = 0; x < W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = gridOffset; y < H; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Top progress bar (YouTube Shorts style)
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 0, W, 14);
  const progGrad = ctx.createLinearGradient(0, 0, W, 0);
  progGrad.addColorStop(0, '#38BDF8');
  progGrad.addColorStop(0.5, '#818CF8');
  progGrad.addColorStop(1, '#34D399');
  ctx.fillStyle = progGrad;
  ctx.fillRect(0, 0, W * (t / 18.0), 14);

  // Header Pill Badge
  const headerP = easeOutBack(t / 0.5);
  ctx.save();
  ctx.translate(W / 2, 115);
  ctx.scale(headerP, headerP);
  roundRect(ctx, -310, -36, 620, 72, 36);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#38BDF8';
  ctx.stroke();
  ctx.fillStyle = '#38BDF8';
  ctx.font = '800 28px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(topic.badge || '⚡ SAT MATH • 5-SECOND HACK', 0, 0);
  ctx.restore();

  // Main Hook Title
  const titleP = easeOutCubic((t - 0.15) / 0.5);
  ctx.save();
  ctx.globalAlpha = titleP;
  ctx.translate(W / 2, 235 + (1 - titleP) * 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 62px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(topic.hook || "DON'T Factor This!", 0, 0);
  ctx.restore();

  // Problem Card (Always visible after 0.3s)
  const cardP = easeOutBack((t - 0.3) / 0.6);
  ctx.save();
  ctx.translate(W / 2, 470);
  ctx.scale(cardP, cardP);
  roundRect(ctx, -460, -165, 920, 330, 36);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 32px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(topic.prompt || 'What is the sum of the solutions to:', 0, -90);

  ctx.font = '800 68px "Segoe UI", sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(topic.equation || '3x² − 18x + 7 = 0', 0, -5);

  if (t >= 8.0) {
    ctx.save();
    ctx.globalAlpha = clamp((t - 8.0) / 0.3);
    const pills = topic.pills || ['a = 3', 'b = −18', 'c = 7'];
    roundRect(ctx, -330, 45, 200, 62, 18);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 34px "Segoe UI", sans-serif';
    ctx.fillText(pills[0] || '', -230, 86);

    roundRect(ctx, -90, 45, 240, 62, 18);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.font = '800 34px "Segoe UI", sans-serif';
    ctx.fillText(pills[1] || '', 30, 86);

    roundRect(ctx, 185, 45, 175, 62, 18);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 32px "Segoe UI", sans-serif';
    ctx.fillText(pills[2] || '', 272, 86);
    ctx.restore();
  } else {
    const rawOpts = (topic.options && topic.options.length) ? topic.options.map(o => o.label) : ['A) −6', 'B) 6', 'C) 7/3', 'D) 18'];
    for (let i = 0; i < 4; i++) {
      const ox = -330 + i * 220;
      roundRect(ctx, ox - 92, 50, 184, 68, 18);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 34px "Segoe UI", sans-serif';
      ctx.fillText(rawOpts[i] || '', ox, 94);
    }
  }
  ctx.restore();

  // SECTION 2 (t = 3.2s to 8.0s): Slow Method vs Vieta's Formula
  if (t >= 3.2) {
    const s2P = easeOutCubic((t - 3.2) / 0.5);
    ctx.save();
    ctx.globalAlpha = s2P;
    ctx.translate(W / 2, 745 + (1 - s2P) * 30);

    roundRect(ctx, -460, -65, 920, 130, 26);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FCA5A5';
    ctx.font = '700 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(topic.slowText || '❌ Oddiy usul (45s):   x = (−b ± √(b² − 4ac)) / 2a', -420, 10);

    const strikeP = clamp((t - 3.6) / 0.4);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(-60 + 460 * strikeP, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Vieta's Formula Card (t >= 4.5s)
  if (t >= 4.5) {
    const vP = easeOutBack((t - 4.5) / 0.55);
    ctx.save();
    ctx.translate(W / 2, 965);
    ctx.scale(vP, vP);

    roundRect(ctx, -460, -110, 920, 220, 32);
    const vGrad = ctx.createLinearGradient(-460, -110, 460, 110);
    vGrad.addColorStop(0, 'rgba(14, 116, 144, 0.35)');
    vGrad.addColorStop(1, 'rgba(30, 58, 138, 0.45)');
    ctx.fillStyle = vGrad;
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '800 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.formulaTitle || "✨ VIYET FORMULASI (ax² + bx + c = 0)", 0, -52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 60px "Segoe UI", sans-serif';
    ctx.fillText(topic.formulaBody || 'Sum of Solutions =  −b / a', 0, 35);
    ctx.restore();
  }

  // SECTION 3 (t >= 8.5s): Step-by-Step Plug In Calculation
  if (t >= 8.5) {
    const stepP = easeOutBack((t - 8.5) / 0.55);
    ctx.save();
    ctx.translate(W / 2, 1255);
    ctx.scale(stepP, stepP);

    roundRect(ctx, -460, -120, 920, 240, 32);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = '800 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.stepTitle || 'QIYMATLARNI QOʻYAMIZ:', 0, -64);

    ctx.font = '900 56px "Segoe UI", sans-serif';
    if (t < 10.5) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(topic.step1 || 'Sum =  −(−18) / 3', 0, 30);
    } else if (t < 12.0) {
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(topic.step2 || topic.step1 || '', 0, 30);
    } else {
      ctx.fillStyle = '#34D399';
      ctx.fillText(topic.step3 || topic.step2 || '', 0, 30);
    }
    ctx.restore();
  }

  // SECTION 4 (t >= 13.0s): Final Answer Choices + Green Winner Highlight
  if (t >= 13.0) {
    const ansP = easeOutBack((t - 13.0) / 0.55);
    ctx.save();
    ctx.translate(W / 2, 1525);
    ctx.scale(ansP, ansP);

    const opts = topic.options || [
      { label: 'A) −6', win: false },
      { label: 'B) 6', win: true },
      { label: 'C) 7/3', win: false },
      { label: 'D) 18', win: false }
    ];

    for (let i = 0; i < 4; i++) {
      const ox = -345 + i * 230;
      const isWin = opts[i] ? opts[i].win : false;
      const pulse = isWin ? 1 + Math.sin((t - 13.0) * 8) * 0.04 : 1;

      ctx.save();
      ctx.translate(ox, 0);
      ctx.scale(pulse, pulse);
      roundRect(ctx, -102, -58, 204, 116, 24);
      if (isWin) {
        ctx.fillStyle = '#059669';
        ctx.fill();
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = isWin ? '#FFFFFF' : '#94A3B8';
      ctx.font = (isWin ? '900 42px ' : '700 36px ') + '"Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts[i] ? opts[i].label : '', 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = '#34D399';
    ctx.font = '900 38px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.winnerText || '✅ TOʻGʻRI JAVOB: B (5 soniyada!)', 0, 108);
    ctx.restore();
  }

  // Dynamic Subtitles Bar at the bottom (y = 1765)
  const cues = topic.cues || [
    { start: 0.0, end: 3.3, text: "Stop factoring every quadratic on the SAT! 🛑" },
    { start: 3.3, end: 5.5, text: "Skip the slow quadratic formula..." },
    { start: 5.5, end: 8.3, text: "Use Vieta's Shortcut: Sum = −b / a ⚡" },
    { start: 8.3, end: 11.5, text: "Here a = 3 and b = −18. Plug them in!" },
    { start: 11.5, end: 14.2, text: "−(−18) ÷ 3 = +6 in 5 seconds! 🎯" },
    { start: 14.2, end: 18.0, text: "Answer is B! Follow for 800 SAT Math 🚀" }
  ];
  const activeCue = cues.find((c) => t >= c.start && t <= c.end);
  if (activeCue) {
    ctx.save();
    roundRect(ctx, 70, 1715, 940, 110, 28);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '800 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeCue.text, W / 2, 1770);
    ctx.restore();
  }
}

async function generateVoiceover(wavPath, topic) {
  console.log('Generating TTS voiceover via Windows SpeechSynthesizer...');
  const voiceText = (topic && topic.voiceScript)
    ? topic.voiceScript
    : 'Stop factoring every quadratic on the S A T! Skip the slow quadratic formula, and use Vietas shortcut: the sum of solutions is negative b over a. Here, a is 3, and b is negative 18. Negative negative 18 divided by 3 equals positive 6! The answer is B. Follow for an 800 S A T Math score!';

  const escapedText = voiceText.replace(/'/g, "''");
  const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 100
$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}')
$synth.Speak(@'
${escapedText}
'@)
$synth.Dispose()
`;
  execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'inherit' });
}

async function cleanDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
  const entries = await readdir(dirPath).catch(() => []);
  for (const entry of entries) {
    try {
      await rm(path.join(dirPath, entry), { force: true });
    } catch {}
  }
}

async function main() {
  await cleanDir(FRAMES_DIR);
  await mkdir(FRAMES_DIR, { recursive: true });
  await mkdir(AUDIO_DIR, { recursive: true });

  let topic = null;
  const currentTopicJson = path.join(PROJECT_DIR, 'current-topic.json');
  if (existsSync(currentTopicJson)) {
    try {
      topic = JSON.parse(await readFile(currentTopicJson, 'utf8'));
      console.log(`Loaded active daily topic: [${topic.id}] ${topic.badge}`);
    } catch (e) {
      console.warn('Failed reading current-topic.json, using fallback');
    }
  }

  const voiceWav = path.join(AUDIO_DIR, 'voiceover.wav');
  await generateVoiceover(voiceWav, topic);

  console.log('Launching headless browser to render 540 frames (1080x1920 @ 30fps)...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });

  await page.setContent('<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:#070913"><canvas id="stage" width="1080" height="1920"></canvas></body></html>', { waitUntil: 'load' });
  if (topic) {
    await page.evaluate((top) => { window.__CURRENT_TOPIC__ = top; }, topic);
  }

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const t = f / FPS;
    await page.evaluate(drawFrameInBrowser, t);
    const frameFile = path.join(FRAMES_DIR, `frame_${String(f).padStart(5, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png' });
    if (f === 435) {
      try {
        await mkdir(CONV_ARTIFACT_DIR, { recursive: true });
        await copyFile(frameFile, PREVIEW_PNG);
        await mkdir(CURRENT_BRAIN_DIR, { recursive: true });
        await copyFile(frameFile, path.join(CURRENT_BRAIN_DIR, 'sat-math-preview.png'));
      } catch {}
    }
    if (f % 90 === 0 || f === TOTAL_FRAMES - 1) {
      console.log(`Rendered frame ${f + 1}/${TOTAL_FRAMES} (${t.toFixed(1)}s)`);
    }
  }

  await browser.close();

  console.log('Encoding final MP4 with voiceover + ambient synth background via FFmpeg (-threads 2)...');
  const ffmpegArgs = [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(FRAMES_DIR, 'frame_%05d.png'),
    '-i', voiceWav,
    '-f', 'lavfi',
    '-i', `sine=frequency=220:duration=${DURATION_SEC}`,
    '-filter_complex',
    `[1:a]apad=whole_dur=${DURATION_SEC},volume=1.35[vo];[2:a]lowpass=f=320,volume=0.06,afade=t=in:st=0:d=1,afade=t=out:st=16.5:d=1.5[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    '-map', '0:v:0',
    '-map', '[aout]',
    '-t', String(DURATION_SEC),
    '-c:v', 'libx264',
    '-threads', '2',
    '-preset', 'fast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    OUTPUT_MP4
  ];

  execFileSync(FFMPEG, ffmpegArgs, { stdio: 'inherit' });

  try {
    await mkdir(CONV_ARTIFACT_DIR, { recursive: true });
    await copyFile(OUTPUT_MP4, ARTIFACT_MP4);
    await mkdir(CURRENT_BRAIN_DIR, { recursive: true });
    await copyFile(OUTPUT_MP4, path.join(CURRENT_BRAIN_DIR, 'sat-math-youtube-shorts.mp4'));
  } catch {}

  const OUTPUTS_DIR = path.join(PROJECT_DIR, 'daily-outputs');
  const dateSlug = new Date().toISOString().slice(0, 10);
  if (topic && topic.id) {
    const dailyMp4 = path.join(OUTPUTS_DIR, `sat-math-${dateSlug}-${topic.id}.mp4`);
    await copyFile(OUTPUT_MP4, dailyMp4);
    console.log(`Copied to daily outputs: ${dailyMp4}`);
  }

  await cleanDir(FRAMES_DIR);

  const info = await stat(OUTPUT_MP4);
  console.log(`SUCCESS! Video created: ${OUTPUT_MP4} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
