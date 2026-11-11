import { mkdir, rm, stat, copyFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { uploadShortToYouTube } from './youtube-uploader.mjs';

import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let chromium;
let ffmpegStaticPath = null;
try {
  const reqLocal = createRequire(import.meta.url);
  ({ chromium } = reqLocal('patchright'));
  try {
    ffmpegStaticPath = reqLocal('ffmpeg-static');
  } catch {}
} catch {
  const reqGlobal = createRequire('C:\\Users\\Halilulloxon\\AppData\\Roaming\\npm\\node_modules\\mcp-video-studio\\package.json');
  ({ chromium } = reqGlobal('patchright'));
}

const LOCAL_FFMPEG = 'C:\\Users\\Halilulloxon\\AppData\\Roaming\\npm\\ffmpeg.exe';
const FFMPEG = existsSync(LOCAL_FFMPEG) ? LOCAL_FFMPEG : (ffmpegStaticPath || 'ffmpeg');
const PROJECT_DIR = __dirname;
const HISTORY_FILE = path.join(PROJECT_DIR, 'topics-history.json');
const OUTPUTS_DIR = path.join(PROJECT_DIR, 'daily-outputs');
const TOKEN_FILE = path.join(PROJECT_DIR, 'youtube-token.json');

const SATMASTER_PROMO = {
  domain: 'satmaster.halilulloxon.uz',
  url: 'https://satmaster.halilulloxon.uz',
  headline: '🚀 SAT MASTER — OʻZBEKISTONDAGI №1 DIGITAL SAT PLATFORMASI',
  features: [
    '🎯 Real Digital SAT Bluebook Adaptive Simulator',
    '🤖 24/7 Shaxsiy AI SAT Math Tutor (Qadamma-qadam yechim)',
    '📚 3,000+ SAT Math Testlar + Acing the New SAT bazasi',
    '📊 Desmos Graphing Calculator + Natijalar Tahlili'
  ]
};

const TOPIC_BANK = [
  {
    id: 'vieta-sum',
    isPromoSpecial: false,
    badge: '⚡ SAT MATH • 5-SONIYALIK USUL',
    hook: "Kvadrat tenglamani yechib o'tirmang!",
    prompt: 'Ildizlar yigʻindisini toping (Sum of solutions):',
    equation: '3x² − 18x + 7 = 0',
    pills: ['a = 3', 'b = −18', 'c = 7'],
    slowText: '❌ Oddiy usul (45s):   x = (−b ± √(b² − 4ac)) / 2a',
    formulaTitle: '✨ VIYET FORMULASI (ax² + bx + c = 0)',
    formulaBody: 'Sum of Solutions =  −b / a',
    stepTitle: 'QIYMATLARNI QOʻYAMIZ:  a = 3  va  b = −18',
    step1: 'Sum =  −(−18) / 3',
    step2: 'Sum =  −(−18) / 3  =  18 / 3',
    step3: 'Sum =  −(−18) / 3  =  18 / 3  =  6',
    options: [
      { label: 'A) −6', win: false },
      { label: 'B) 6', win: true },
      { label: 'C) 7/3', win: false },
      { label: 'D) 18', win: false }
    ],
    winnerText: '✅ TOʻGʻRI JAVOB: B (5 soniyada!)',
    cues: [
      { start: 0.0, end: 3.3, text: "SAT imtihonida buni ko'paytuvchiga ajratmang! 🛑" },
      { start: 3.3, end: 5.5, text: "Diskriminantga 45 soniya vaqt ketadi..." },
      { start: 5.5, end: 8.3, text: "Viyet qoidasi: Yig'indi = −b / a ⚡" },
      { start: 8.3, end: 11.5, text: "Bu yerda a = 3 va b = −18 ga teng!" },
      { start: 11.5, end: 14.2, text: "−(−18) ÷ 3 = +6 (5 soniyada!) 🎯" },
      { start: 14.2, end: 18.0, text: "Bepul Bluebook Simulator: satmaster.halilulloxon.uz 🚀" }
    ],
    voiceScript: "Stop factoring every quadratic on the S A T! Skip the slow quadratic formula and use Vietas shortcut: Sum equals negative b over a. Here a is 3 and b is negative 18. Negative negative 18 divided by 3 is positive 6! Practice on our free Bluebook simulator at satmaster dot halilulloxon dot uz!",
    shortTitle: "SAT Math 5-Soniyalik Usul! Kvadrat tenglama siri 🔥 #Shorts #SATMath #SATUzbekistan",
    longTitle: "SAT Math: Kvadrat Tenglama Ildizlari Yig'indisi (Viyet Teoremasi + SAT Master) | Digital SAT",
    ytDescription: "SAT Math imtihonida kvadrat tenglama ildizlari yig'indisini 5 soniyada topish usuli (-b/a)!\n\n🚀 Bizning rasmiy Digital SAT platformamiz — SAT MASTER:\n👉 https://satmaster.halilulloxon.uz\n\n✅ Real Digital SAT Bluebook Adaptive Simulator\n✅ 24/7 AI SAT Math Tutor\n✅ 3,000+ SAT Math savollar va Acing the New SAT kitoblari\n\n#satmath #sat #math #mathematics #DigitalSAT #SATUzbekistan #Shorts"
  },
  {
    id: 'vieta-product',
    isPromoSpecial: false,
    badge: '⚡ SAT MATH • KOʻPAYTMA SIRI',
    hook: "Ildizlar ko'paytmasi 3 soniyada!",
    prompt: 'What is the product of the solutions to:',
    equation: '2x² + 11x − 24 = 0',
    pills: ['a = 2', 'b = 11', 'c = −24'],
    slowText: '❌ Diskriminant bilan: 50 soniya vaqt yoʻqotish',
    formulaTitle: '✨ VIYET KOʻPAYTMA FORMULASI',
    formulaBody: 'Product of Solutions =  c / a',
    stepTitle: 'QIYMATLARNI QOʻYAMIZ:  c = −24  va  a = 2',
    step1: 'Product =  −24 / 2',
    step2: 'Product =  −24 ÷ 2',
    step3: 'Product =  −24 / 2  =  −12',
    options: [
      { label: 'A) −12', win: true },
      { label: 'B) 12', win: false },
      { label: 'C) −11/2', win: false },
      { label: 'D) −24', win: false }
    ],
    winnerText: '✅ TOʻGʻRI JAVOB: A (−12)',
    cues: [
      { start: 0.0, end: 3.3, text: "SAT Math: Ildizlar ko'paytmasini qanday topamiz? 🧠" },
      { start: 3.3, end: 5.5, text: "Tenglamani yechib o'tirmang!" },
      { start: 5.5, end: 8.3, text: "Formula: Ko'paytma = c / a ⚡" },
      { start: 8.3, end: 11.5, text: "c = −24 va a = 2 ni o'rniga qo'yamiz" },
      { start: 11.5, end: 14.2, text: "−24 ÷ 2 = −12. Javob A! 🎯" },
      { start: 14.2, end: 18.0, text: "3000+ SAT Testlar: satmaster.halilulloxon.uz 🚀" }
    ],
    voiceScript: "Need the product of solutions on the S A T? Dont solve the quadratic! The product of solutions is simply c over a. Here c is negative 24 and a is 2. Negative 24 divided by 2 equals negative 12! Try 3000 more practice questions on satmaster dot halilulloxon dot uz!",
    shortTitle: "SAT Math: Ildizlar ko'paytmasini 3 soniyada topish! 🎯 #Shorts #SATMath #SAT",
    longTitle: "Digital SAT Math: Ildizlar Ko'paytmasi (c/a Formulasi) + SAT Master Platformasi Sharhi",
    ytDescription: "Digital SAT Math imtihonida c/a formulasi orqali vaqt tejash siri.\n\n🚀 Bepul SAT tayyorgarlik platformamiz — SAT MASTER:\n👉 https://satmaster.halilulloxon.uz\n\n✅ Bluebook Exam Simulator\n✅ AI Tutor + Desmos Kalkulyator\n✅ 3,000+ SAT Math Practice Testlar\n\n#satmath #sat #math #mathematics #SATUzbekistan #Shorts"
  },
  {
    id: 'satmaster-spotlight',
    isPromoSpecial: true,
    badge: '🚀 SAT MASTER • RASMIY PLATFORMA',
    hook: 'SAT Math 800 Ball Siri!',
    prompt: 'Bepul Digital SAT Bluebook Simulator + AI Tutor:',
    equation: 'satmaster.halilulloxon.uz',
    pills: ['Bluebook Sim', 'AI Tutor 24/7', '3000+ Test'],
    slowText: '❌ Tarqoq PDF kitoblar va javobsiz testlardan charchadingizmi?',
    formulaTitle: '✨ SAT MASTER PLATFORMASI IMKONIYATLARI',
    formulaBody: 'Real Exam Simulator + Desmos + AI Tutor',
    stepTitle: '3 QADAMDA 750+ BALLGA CHIQING:',
    step1: '1) satmaster.halilulloxon.uz saytiga kiring',
    step2: '2) Bluebook Adaptive Mock Test topshiring',
    step3: '3) AI Tutor bilan har bir xatoni tahlil qiling!',
    options: [
      { label: 'A) 500 ball', win: false },
      { label: 'B) 600 ball', win: false },
      { label: 'C) 700 ball', win: false },
      { label: 'D) 800 BALL!', win: true }
    ],
    winnerText: '🔥 HOZIROQ KIRING: satmaster.halilulloxon.uz',
    cues: [
      { start: 0.0, end: 3.3, text: "SAT Math'dan 800 ball olishni xohlaysizmi? 🎯" },
      { start: 3.3, end: 5.5, text: "PDF kitoblardan qidirib vaqt yo'qotmang!" },
      { start: 5.5, end: 8.3, text: "satmaster.halilulloxon.uz — yagona platforma! 🚀" },
      { start: 8.3, end: 11.5, text: "Real Bluebook Simulator va 24/7 AI Tutor 🤖" },
      { start: 11.5, end: 14.2, text: "3,000+ mavzulashtirilgan testlar bazasi 📚" },
      { start: 14.2, end: 18.0, text: "Link kanal bio'sida: satmaster.halilulloxon.uz 🔥" }
    ],
    voiceScript: "Want to score 800 on Digital S A T Math? Stop wasting time with scattered P D Fs! Visit satmaster dot halilulloxon dot uz! Take full adaptive Bluebook mock exams, practice over 3000 questions, and get instant step by step help from our 24 7 A I Tutor. Link is in the channel bio!",
    shortTitle: "Digital SAT 800 Ball Siri! 🚀 Bepul Bluebook Simulator — satmaster.halilulloxon.uz #Shorts #SATMath",
    longTitle: "SAT Master (satmaster.halilulloxon.uz) — Bepul Digital SAT Bluebook Simulator va 24/7 AI Tutor!",
    ytDescription: "O'zbekistondagi eng mukammal Digital SAT platformasi — SAT MASTER bilan tanishing!\n\n🌐 Saytga kirish: https://satmaster.halilulloxon.uz\n\nPlatformada nimalar bor?\n1️⃣ Real Digital SAT Bluebook Adaptive Simulator (Module 1 & Module 2)\n2️⃣ 24/7 AI SAT Tutor — tushunmagan misollaringizni soniyalar ichida tushuntirib beradi\n3️⃣ 3,000+ Practice Questions va Topic Quizzes\n4️⃣ Progress Analytics va Top SAT kitoblar bazasi (Acing the New SAT, College Panda)\n\n#satmath #sat #math #DigitalSAT #SATMaster #SATUzbekistan #Shorts"
  },
  {
    id: 'system-elimination',
    isPromoSpecial: false,
    badge: '⚡ SAT MATH • TENGLAMALAR SISTEMASI',
    hook: "x va y ni alohida topmang!",
    prompt: 'If 4x + 3y = 19 and x + 2y = 11, what is 5x + 5y?',
    equation: '4x+3y=19  |  x+2y=11',
    pills: ['4x + x = 5x', '3y + 2y = 5y', '19 + 11 = 30'],
    slowText: '❌ Substitution usuli: x va y ni alohida topish (60s)',
    formulaTitle: '✨ SAT STACK & ADD USULI',
    formulaBody: 'Ikkala tenglamani qoʻshib yuboring!',
    stepTitle: 'QATORMA-QATOR QOʻSHAMIZ:',
    step1: '(4x + x) + (3y + 2y) = 19 + 11',
    step2: '5x + 5y = 30',
    step3: '5x + 5y = 30  (Tayyor!)',
    options: [
      { label: 'A) 8', win: false },
      { label: 'B) 15', win: false },
      { label: 'C) 30', win: true },
      { label: 'D) 6', win: false }
    ],
    winnerText: '✅ TOʻGʻRI JAVOB: C (30)',
    cues: [
      { start: 0.0, end: 3.3, text: "SAT Math'dagi eng mashhur tuzoq! 🔥" },
      { start: 3.3, end: 5.5, text: "x va y ni alohida topishga vaqt ketkazmang!" },
      { start: 5.5, end: 8.3, text: "Tenglamalarni shunchaki qo'shib yuboring ⚡" },
      { start: 8.3, end: 11.5, text: "4x + x = 5x,  3y + 2y = 5y" },
      { start: 11.5, end: 14.2, text: "19 + 11 = 30! Javob C! 🎯" },
      { start: 14.2, end: 18.0, text: "AI Tutor va Testlar: satmaster.halilulloxon.uz 🚀" }
    ],
    voiceScript: "Never solve for x and y separately when the S A T asks for 5 x plus 5 y! Just add the two equations together: 4 x plus x is 5 x, 3 y plus 2 y is 5 y, and 19 plus 11 is 30! Answer is C! Master every S A T trick on satmaster dot halilulloxon dot uz!",
    shortTitle: "SAT Math Tuzog'i: x va y ni topib o'tirmang! 🤯 #Shorts #SATMath #DigitalSAT",
    longTitle: "SAT Math Systems of Equations (Stack & Add Trick) + SAT Master Platformasida Mashq Qilish",
    ytDescription: "Tenglamalar sistemasini 5 soniyada yechish usuli!\n\n📚 Bepul SAT Math bazasi va Bluebook Simulator:\n👉 https://satmaster.halilulloxon.uz\n\n#satmath #sat #math #mathematics #SATUzbekistan #Shorts"
  },
  {
    id: 'desmos-intersection',
    isPromoSpecial: false,
    badge: '⚡ DESMOS HACK • DIGITAL SAT',
    hook: 'Desmos bilan 4 soniyada yeching!',
    prompt: 'How many solutions does the system have?',
    equation: 'y = x² − 4x + 5   |   y = 2x − 4',
    pills: ['1-qator: y=x²-4x+5', '2-qator: y=2x-4', 'Kesishish: (3, 2)'],
    slowText: '❌ Algebraik tenglashtirish va diskriminant (50s)',
    formulaTitle: '✨ DESMOS GRAPHING USULI',
    formulaBody: 'Ikkala funksiyani yozing → Nuqtani bosing!',
    stepTitle: 'DESMOS NATIJASI:',
    step1: 'x² − 6x + 9 = 0  →  (x − 3)² = 0',
    step2: 'Grafiklar faqat (3, 2) nuqtada urinadi',
    step3: 'Demak, yagona yechim: Exactly 1 solution!',
    options: [
      { label: 'A) Zero', win: false },
      { label: 'B) Exactly 1', win: true },
      { label: 'C) Exactly 2', win: false },
      { label: 'D) Infinitely many', win: false }
    ],
    winnerText: '✅ TOʻGʻRI JAVOB: B (Exactly 1)',
    cues: [
      { start: 0.0, end: 3.3, text: "Digital SAT'da Desmos eng katta qurolingiz! 📈" },
      { start: 3.3, end: 5.5, text: "Qo'lda tenglashtirib vaqt yo'qotmang!" },
      { start: 5.5, end: 8.3, text: "Ikkala tenglamani Desmos'ga kiriting ⚡" },
      { start: 8.3, end: 11.5, text: "Grafiklar faqat bitta (3, 2) nuqtada kesishadi" },
      { start: 11.5, end: 14.2, text: "Javob B: Exactly 1 solution! 🎯" },
      { start: 14.2, end: 18.0, text: "Desmos Simulator: satmaster.halilulloxon.uz 🚀" }
    ],
    voiceScript: "On the Digital S A T, Desmos is your superpower! Instead of solving this nonlinear system by hand, type both equations into Desmos. The parabola and line touch at a single point, 3 comma 2. So there is exactly 1 solution! Practice with our built in Desmos simulator at satmaster dot halilulloxon dot uz!",
    shortTitle: "Digital SAT Desmos Siri: Tenglamalar sistemasini 4 soniyada yechish! 📈 #Shorts #SATMath",
    longTitle: "Digital SAT Desmos Calculator Hacks: Nonlinear Systems + SAT Master Simulator",
    ytDescription: "Digital SAT Math imtihonida Desmos kalkulyatori yordamida chiziqli bo'lmagan sistemalarni 4 soniyada yechish!\n\n🚀 Ichki Desmos kalkulyatoriga ega Bluebook Simulator:\n👉 https://satmaster.halilulloxon.uz\n\n#satmath #sat #desmos #DigitalSAT #SATUzbekistan #Shorts"
  }
];

function drawVideoFrameInBrowser(payload) {
  const { t, duration, mode, topic, promo } = payload;
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

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

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#070B19');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#090D16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle math grid
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 2;
  const gridOffset = (t * 25) % 80;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = gridOffset; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 0, W, 10);
  const progGrad = ctx.createLinearGradient(0, 0, W, 0);
  progGrad.addColorStop(0, '#38BDF8');
  progGrad.addColorStop(0.5, '#818CF8');
  progGrad.addColorStop(1, '#34D399');
  ctx.fillStyle = progGrad;
  ctx.fillRect(0, 0, W * (t / duration), 10);

  if (mode === 'shorts') {
    // 9:16 VERTICAL SHORTS LAYOUT (1080x1920)
    const headerP = easeOutBack(t / 0.45);
    ctx.save();
    ctx.translate(W / 2, 95);
    ctx.scale(headerP, headerP);
    roundRect(ctx, -330, -34, 660, 68, 34);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38BDF8';
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topic.badge, 0, 0);
    ctx.restore();

    // Hook
    const titleP = easeOutCubic((t - 0.1) / 0.45);
    ctx.save();
    ctx.globalAlpha = titleP;
    ctx.translate(W / 2, 195 + (1 - titleP) * 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 54px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.hook, 0, 0);
    ctx.restore();

    // Problem card
    const cardP = easeOutBack((t - 0.25) / 0.5);
    ctx.save();
    ctx.translate(W / 2, 410);
    ctx.scale(cardP, cardP);
    roundRect(ctx, -460, -150, 920, 300, 32);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.prompt, 0, -82);

    ctx.font = '800 56px "Segoe UI", sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(topic.equation, 0, -6);

    for (let i = 0; i < 3; i++) {
      const ox = -290 + i * 290;
      roundRect(ctx, ox - 125, 42, 250, 58, 16);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 26px "Segoe UI", sans-serif';
      ctx.fillText(topic.pills[i] || '', ox, 78);
    }
    ctx.restore();

    // Slow method vs Shortcut
    if (t >= 3.0) {
      const s2P = easeOutCubic((t - 3.0) / 0.45);
      ctx.save();
      ctx.globalAlpha = s2P;
      ctx.translate(W / 2, 650);
      roundRect(ctx, -460, -52, 920, 104, 24);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#FCA5A5';
      ctx.font = '700 28px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topic.slowText, 0, 8);
      ctx.restore();
    }

    if (t >= 4.4) {
      const vP = easeOutBack((t - 4.4) / 0.5);
      ctx.save();
      ctx.translate(W / 2, 845);
      ctx.scale(vP, vP);
      roundRect(ctx, -460, -95, 920, 190, 28);
      ctx.fillStyle = 'rgba(14, 116, 144, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 30px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topic.formulaTitle, 0, -42);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px "Segoe UI", sans-serif';
      ctx.fillText(topic.formulaBody, 0, 32);
      ctx.restore();
    }

    if (t >= 8.0) {
      const stepP = easeOutBack((t - 8.0) / 0.5);
      ctx.save();
      ctx.translate(W / 2, 1095);
      ctx.scale(stepP, stepP);
      roundRect(ctx, -460, -100, 920, 200, 28);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#FDE68A';
      ctx.font = '800 28px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topic.stepTitle, 0, -50);
      ctx.font = '900 44px "Segoe UI", sans-serif';
      ctx.fillStyle = t < 10.2 ? '#FFFFFF' : t < 11.8 ? '#FBBF24' : '#34D399';
      const stepTxt = t < 10.2 ? topic.step1 : t < 11.8 ? topic.step2 : topic.step3;
      ctx.fillText(stepTxt, 0, 28);
      ctx.restore();
    }

    if (t >= 12.2) {
      const ansP = easeOutBack((t - 12.2) / 0.5);
      ctx.save();
      ctx.translate(W / 2, 1320);
      ctx.scale(ansP, ansP);
      for (let i = 0; i < 4; i++) {
        const ox = -345 + i * 230;
        const isWin = topic.options[i].win;
        ctx.save();
        ctx.translate(ox, 0);
        roundRect(ctx, -102, -48, 204, 96, 20);
        ctx.fillStyle = isWin ? '#059669' : 'rgba(30, 41, 59, 0.8)';
        ctx.fill();
        ctx.strokeStyle = isWin ? '#34D399' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = isWin ? 4 : 2;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 32px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(topic.options[i].label, 0, 0);
        ctx.restore();
      }
      ctx.fillStyle = '#34D399';
      ctx.font = '900 34px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topic.winnerText, 0, 88);
      ctx.restore();
    }

    // SAT MASTER PROMO BANNER (Always visible at bottom above captions, glowing after 13.5s)
    const promoPulse = t >= 13.5 ? 1 + Math.sin(t * 6) * 0.025 : 1;
    ctx.save();
    ctx.translate(W / 2, 1565);
    ctx.scale(promoPulse, promoPulse);
    roundRect(ctx, -460, -78, 920, 156, 28);
    const pGrad = ctx.createLinearGradient(-460, -78, 460, 78);
    pGrad.addColorStop(0, 'rgba(30, 58, 138, 0.92)');
    pGrad.addColorStop(1, 'rgba(88, 28, 135, 0.92)');
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = '900 27px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚀 BEPUL DIGITAL SAT SIMULATOR & AI TUTOR:', 0, -32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px "Segoe UI", sans-serif';
    ctx.fillText('🌐 satmaster.halilulloxon.uz', 0, 22);
    ctx.restore();

    // Captions bar
    const activeCue = topic.cues.find((c) => t >= c.start && t <= c.end);
    if (activeCue) {
      ctx.save();
      roundRect(ctx, 70, 1715, 940, 108, 26);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '800 34px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeCue.text, W / 2, 1769);
      ctx.restore();
    }
  } else {
    // 16:9 WIDESCREEN LONG-FORM LESSON + SAT MASTER SHOWCASE (1920x1080)
    // Left Column (x: 60..1180): Full Math Lesson
    // Right Column (x: 1220..1860): Dedicated SAT MASTER (satmaster.halilulloxon.uz) Ad & Feature Card
    ctx.save();
    roundRect(ctx, 60, 45, 540, 58, 29);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topic.badge, 330, 74);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(topic.hook, 60, 155);

    // Problem Box (Left)
    roundRect(ctx, 60, 195, 1100, 230, 28);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 28px "Segoe UI", sans-serif';
    ctx.fillText(topic.prompt, 100, 245);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '900 54px "Segoe UI", sans-serif';
    ctx.fillText(topic.equation, 100, 320);

    for (let i = 0; i < 3; i++) {
      const px = 100 + i * 330;
      roundRect(ctx, px, 350, 290, 52, 14);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topic.pills[i] || '', px + 145, 382);
    }

    // Formula & Step Box (Left)
    if (t >= 3.0) {
      roundRect(ctx, 60, 450, 1100, 175, 26);
      ctx.fillStyle = 'rgba(14, 116, 144, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(topic.formulaTitle, 100, 495);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 44px "Segoe UI", sans-serif';
      ctx.fillText(topic.formulaBody, 100, 565);
    }

    if (t >= 7.5) {
      roundRect(ctx, 60, 650, 1100, 210, 26);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#FDE68A';
      ctx.font = '800 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(topic.stepTitle, 100, 698);
      ctx.fillStyle = '#34D399';
      ctx.font = '900 42px "Segoe UI", sans-serif';
      const stepTxt = t < 10.5 ? topic.step1 : t < 12.2 ? topic.step2 : topic.step3;
      ctx.fillText(stepTxt, 100, 765);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 30px "Segoe UI", sans-serif';
      ctx.fillText(topic.winnerText, 100, 825);
    }

    // Right Column: Permanent SAT MASTER (satmaster.halilulloxon.uz) Showcase Card
    roundRect(ctx, 1210, 45, 650, 815, 34);
    const sideGrad = ctx.createLinearGradient(1210, 45, 1860, 860);
    sideGrad.addColorStop(0, 'rgba(30, 58, 138, 0.88)');
    sideGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
    sideGrad.addColorStop(1, 'rgba(88, 28, 135, 0.88)');
    ctx.fillStyle = sideGrad;
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚀 BIZNING LOYIHA • RASMIY PLATFORMA', 1535, 105);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px "Segoe UI", sans-serif';
    ctx.fillText('SAT MASTER', 1535, 170);

    roundRect(ctx, 1255, 200, 560, 74, 20);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.font = '900 34px "Segoe UI", sans-serif';
    ctx.fillText('satmaster.halilulloxon.uz', 1535, 246);

    ctx.textAlign = 'left';
    for (let i = 0; i < promo.features.length; i++) {
      const fy = 315 + i * 110;
      roundRect(ctx, 1255, fy, 560, 88, 18);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 23px "Segoe UI", sans-serif';
      ctx.fillText(promo.features[i], 1280, fy + 52);
    }

    roundRect(ctx, 1255, 760, 560, 72, 22);
    ctx.fillStyle = '#059669';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 27px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👉 Hoziroq bepul roʻyxatdan oʻting!', 1535, 804);

    // Bottom Subtitle Bar across 16:9 frame
    const activeCue = topic.cues.find((c) => t >= c.start && t <= c.end);
    if (activeCue) {
      roundRect(ctx, 60, 905, 1800, 110, 26);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '800 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeCue.text, W / 2, 960);
    }
    ctx.restore();
  }
}

async function generateVoiceover(wavPath, scriptText) {
  const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1
$synth.Volume = 100
$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}')
$synth.Speak('${scriptText.replace(/'/g, "''")}')
$synth.Dispose()
`;
  execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'inherit' });
}

async function renderVideo({ topic, mode, outMp4, fps = 15, durationSec = 18 }) {
  const width = mode === 'shorts' ? 1080 : 1920;
  const height = mode === 'shorts' ? 1920 : 1080;
  const totalFrames = fps * durationSec;
  const tempFramesDir = path.join(PROJECT_DIR, `frames_${mode}`);
  const tempAudioDir = path.join(PROJECT_DIR, 'audio');

  await rm(tempFramesDir, { recursive: true, force: true });
  await mkdir(tempFramesDir, { recursive: true });
  await mkdir(tempAudioDir, { recursive: true });

  const voiceWav = path.join(tempAudioDir, `voice_${topic.id}_${mode}.wav`);
  await generateVoiceover(voiceWav, topic.voiceScript);

  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1
  });

  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:#070913"><canvas id="stage" width="${width}" height="${height}"></canvas></body></html>`,
    { waitUntil: 'load' }
  );

  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    await page.evaluate(drawVideoFrameInBrowser, {
      t,
      duration: durationSec,
      mode,
      topic,
      promo: SATMASTER_PROMO
    });
    const frameFile = path.join(tempFramesDir, `frame_${String(f).padStart(5, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png' });
  }

  await browser.close();

  // Strictly throttled FFmpeg encode (-threads 2) per CPU Throttling Rule
  const ffmpegArgs = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(tempFramesDir, 'frame_%05d.png'),
    '-i', voiceWav,
    '-f', 'lavfi',
    '-i', `sine=frequency=220:duration=${durationSec}`,
    '-filter_complex',
    `[1:a]apad=whole_dur=${durationSec},volume=1.35[vo];[2:a]lowpass=f=320,volume=0.05,afade=t=in:st=0:d=1,afade=t=out:st=${durationSec - 1.5}:d=1.5[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    '-map', '0:v:0',
    '-map', '[aout]',
    '-t', String(durationSec),
    '-c:v', 'libx264',
    '-threads', '2',
    '-preset', 'fast',
    '-crf', '21',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    outMp4
  ];

  execFileSync(FFMPEG, ffmpegArgs, { stdio: 'inherit' });
  await rm(tempFramesDir, { recursive: true, force: true });
}

async function pickNextTopic() {
  let history = { usedIds: [], runs: [] };
  if (existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(await readFile(HISTORY_FILE, 'utf8'));
    } catch {}
  }
  let topic = TOPIC_BANK.find((t) => !history.usedIds.includes(t.id));
  if (!topic) {
    history.usedIds = [];
    topic = TOPIC_BANK[0];
  }
  history.usedIds.push(topic.id);
  history.runs.push({ id: topic.id, date: new Date().toISOString() });
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  return topic;
}

async function main() {
  await mkdir(OUTPUTS_DIR, { recursive: true });
  const topic = await pickNextTopic();
  const dateSlug = new Date().toISOString().slice(0, 10);

  const shortMp4 = path.join(OUTPUTS_DIR, `sat-math-shorts-${dateSlug}-${topic.id}.mp4`);
  const longMp4 = path.join(OUTPUTS_DIR, `sat-math-video-${dateSlug}-${topic.id}.mp4`);
  const metaJson = path.join(OUTPUTS_DIR, `sat-math-${dateSlug}-${topic.id}.json`);

  const shouldRender = process.argv.includes('--render');
  if (shouldRender) {
    console.log(`Rendering Daily YouTube Shorts (1080x1920) + SAT Master Promo for topic: ${topic.id}...`);
    await renderVideo({ topic, mode: 'shorts', outMp4: shortMp4 });
    console.log(`Rendering Daily YouTube Video (1920x1080) + SAT Master Showcase for topic: ${topic.id}...`);
    await renderVideo({ topic, mode: 'long', outMp4: longMp4 });
  }

  const metadata = {
    topicId: topic.id,
    isPromoSpecial: topic.isPromoSpecial,
    channel: 'https://www.youtube.com/@SATMATH-b5n',
    promotedProject: SATMASTER_PROMO,
    shorts: {
      title: topic.shortTitle,
      description: topic.ytDescription,
      videoPath: shortMp4,
      resolution: '1080x1920 (9:16)'
    },
    standardVideo: {
      title: topic.longTitle,
      description: topic.ytDescription,
      videoPath: longMp4,
      resolution: '1920x1080 (16:9)'
    },
    createdAt: new Date().toISOString()
  };

  await writeFile(metaJson, JSON.stringify(metadata, null, 2));
  await writeFile(path.join(PROJECT_DIR, 'current-topic.json'), JSON.stringify(topic, null, 2));

  console.log(`Selected daily topic: ${topic.id}`);
  console.log(`- Shorts Title:   ${topic.shortTitle}`);
  console.log(`- Video Title:    ${topic.longTitle}`);
  console.log(`- Promoted Site:  ${SATMASTER_PROMO.url}`);
  console.log(`- Metadata saved: ${metaJson}`);

  if (existsSync(TOKEN_FILE) && shouldRender) {
    console.log('Uploading both Daily Shorts and Daily Standard Video to YouTube (@SATMATH-b5n)...');
    await uploadShortToYouTube({
      videoPath: shortMp4,
      title: topic.shortTitle,
      description: topic.ytDescription
    });
    await uploadShortToYouTube({
      videoPath: longMp4,
      title: topic.longTitle,
      description: topic.ytDescription
    });
  } else {
    console.log('Ready! (Pass --render to render both MP4s, and add youtube-token.json for automatic YouTube upload).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
