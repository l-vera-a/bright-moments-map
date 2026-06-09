'use strict';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const MOMENTS = [
  {
    id: 1, number: 'I', title: 'Момент свободы',
    text: [
      'Пусть в твоей жизни всегда будет место для дороги, которую ты выбираешь сама.',
      'Не потому что «так надо». Не потому что «так правильно».',
      'А потому что внутри тихо сказало: «мне туда».'
    ]
  },
  {
    id: 2, number: 'II', title: 'Момент лёгкости',
    text: [
      'Пусть сложное иногда оказывается проще, чем казалось.',
      'Пусть нужные двери открываются без драматического скрипа.',
      'И пусть будет больше дней, после которых хочется сказать: «А вот это было хорошо».'
    ]
  },
  {
    id: 3, number: 'III', title: 'Момент красоты',
    text: [
      'Пусть вокруг будет больше красивого: в местах, людях, словах, случайных утрах, отражениях в окнах и планах, которые вдруг начинают сбываться.'
    ]
  },
  {
    id: 4, number: 'IV', title: 'Момент силы',
    text: [
      'Пусть твоя сила будет не только про «выдержать».',
      'Пусть она будет ещё и про выбирать, останавливаться, уходить от лишнего и беречь себя без чувства вины.'
    ]
  },
  {
    id: 5, number: 'V', title: 'Момент тепла',
    text: [
      'Пусть рядом будут люди, с которыми можно не играть роль, не объяснять очевидное и не держать лицо, когда хочется просто быть живой.'
    ]
  },
  {
    id: 6, number: 'VI', title: 'Момент «я смогла»',
    text: [
      'Пусть впереди будет много тихих побед. Не обязательно громких. Не обязательно для всех.',
      'Просто таких, после которых внутри становится спокойнее и увереннее.'
    ]
  },
  {
    id: 7, number: 'VII', title: 'Момент нового маршрута',
    text: [
      'Пусть каждый новый поворот ведёт не к хаосу, а к себе.',
      'К новым желаниям. К новым местам.',
      'К новым причинам улыбаться без повода.'
    ]
  },
  {
    id: 8, number: 'VIII', title: 'Момент, который останется',
    text: [
      'Пусть в жизни будет больше мгновений, которые не нужно записывать, чтобы помнить.',
      'Они просто остаются — запахом, светом, фразой, человеком, дорогой.'
    ]
  }
];

// ─── GEMINI CONSTELLATION ────────────────────────────────────────────────────
// 8 stars mapped to Gemini: 2 heads, 2 upper, 2 mid, 2 feet
// Offsets from screen center in "units" (scaled at runtime)

const GEMINI_OFFSETS = [
  [-1.0, -1.5],  // 0  Pollux  (left head)
  [+1.0, -1.5],  // 1  Castor  (right head)
  [-1.2, -0.62], // 2  left upper body
  [+1.2, -0.62], // 3  right upper body
  [-1.38, +0.28],// 4  left mid
  [+1.38, +0.28],// 5  right mid
  [-1.5,  +1.18],// 6  left foot
  [+1.5,  +1.18],// 7  right foot
];

// Which indices connect with lines
const GEMINI_LINES = [
  [0, 2], [2, 4], [4, 6],   // left twin body
  [1, 3], [3, 5], [5, 7],   // right twin body
  [2, 3], [4, 5],            // crossbars
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const HALF     = 16;   // half of star div (32px hitbox)
const PAD      = 72;   // minimum distance from edges for star movement
const BG_COUNT = 260;  // background canvas stars
const MAX_Z    = 1400; // depth of star field

// ─── STATE ────────────────────────────────────────────────────────────────────

let gameState = 'intro'; // 'intro' | 'playing' | 'paused' | 'assembling' | 'done'
let wishIndex = 0;
let activationTimer = null;
let rafId = null;

// ─── CANVAS BACKGROUND ────────────────────────────────────────────────────────

let canvas, ctx;
const bgStars = [];

function initCanvas() {
  canvas = document.getElementById('starfield');
  ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Solid fill on resize so there's no white flash
    ctx.fillStyle = '#07080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // 3D stars: x/y are world-space offsets from centre, z is depth
  for (let i = 0; i < BG_COUNT; i++) {
    bgStars.push({
      x:   (Math.random() - 0.5) * MAX_Z * 2.6,
      y:   (Math.random() - 0.5) * MAX_Z * 2.6,
      z:   Math.random() * MAX_Z,
      spd: 1.4 + Math.random() * 5.2,   // close stars faster, far stars slower
      bri: 0.5 + Math.random() * 0.5,   // brightness variation
    });
  }
}

// ─── GAME STARS ───────────────────────────────────────────────────────────────

const gameStars = [];

function initGameStars() {
  const layer = document.getElementById('game-layer');
  const w = window.innerWidth, h = window.innerHeight;

  MOMENTS.forEach((m, idx) => {
    const el = document.createElement('div');
    el.className = 'game-star';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Звезда ' + (idx + 1));
    layer.appendChild(el);

    // Spread initial positions so they don't cluster
    const angle   = (idx / MOMENTS.length) * Math.PI * 2 + Math.random() * 0.8;
    const radius  = (Math.min(w, h) * 0.25) + Math.random() * (Math.min(w, h) * 0.2);
    const cx = w / 2, cy = h / 2;
    const x = Math.max(PAD, Math.min(w - PAD, cx + Math.cos(angle) * radius));
    const y = Math.max(PAD, Math.min(h - PAD, cy + Math.sin(angle) * radius));

    const speed = 0.28 + Math.random() * 0.38;
    const dir   = Math.random() * Math.PI * 2;

    const star = {
      id: m.id, el,
      x, y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      collected: false,
      active:    false,
      assembling: false,
      geminiX: 0,
      geminiY: 0,
    };
    gameStars.push(star);
    setStarPos(star);

    el.addEventListener('click',   () => onStarClick(star));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') onStarClick(star); });
  });
}

function setStarPos(star) {
  star.el.style.transform = `translate(${star.x - HALF}px, ${star.y - HALF}px)`;
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────

function loop() {
  const w  = canvas.width,  h  = canvas.height;
  const cx = w / 2,         cy = h / 2;
  // Focal length controls the field of view (larger = tighter tunnel)
  const fl = Math.min(w, h) * 0.44;

  const moving = gameState === 'playing' || gameState === 'paused';

  // ── Fade instead of clear ─────────────────────────────────────────────────
  // Each frame we paint a semi-transparent dark rect over the previous frame.
  // This creates natural trailing streaks: fast/close stars leave longer trails.
  ctx.fillStyle = 'rgba(7, 8, 15, 0.16)';
  ctx.fillRect(0, 0, w, h);

  // Subtle nebula — drawn at low opacity each frame, reaches a steady state
  const ng = ctx.createRadialGradient(cx * 1.15, cy * 0.68, 0, cx * 1.15, cy * 0.68, w * 0.52);
  ng.addColorStop(0, 'rgba(42, 12, 75, 0.055)');
  ng.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ng;
  ctx.fillRect(0, 0, w, h);

  // ── 3D perspective star field ─────────────────────────────────────────────
  bgStars.forEach(star => {
    if (moving) {
      star.z -= star.spd;
      if (star.z < 1) {
        // Star passed the camera — respawn at the back, random world-space angle
        star.z = MAX_Z;
        star.x = (Math.random() - 0.5) * MAX_Z * 2.6;
        star.y = (Math.random() - 0.5) * MAX_Z * 2.6;
      }
    }

    // Project 3D → 2D screen: stars at centre-screen when far, spread toward edges when close
    const sx = (star.x / star.z) * fl + cx;
    const sy = (star.y / star.z) * fl + cy;
    if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) return;

    // Size and brightness grow quadratically as star approaches (z → 0)
    const t  = 1 - star.z / MAX_Z;            // 0 = far, 1 = very near
    const r  = Math.max(0.3, t * t * 3.8);
    const op = Math.min(1, t * 2.4) * star.bri;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${op.toFixed(2)})`;
    ctx.fill();
  });

  // ── Move game stars ───────────────────────────────────────────────────────
  if (moving) {
    gameStars.forEach(star => {
      if (star.assembling) return;
      star.x += star.vx;
      star.y += star.vy;
      if (star.x < PAD || star.x > w - PAD) { star.vx *= -1; star.x = Math.max(PAD, Math.min(w - PAD, star.x)); }
      if (star.y < PAD || star.y > h - PAD) { star.vy *= -1; star.y = Math.max(PAD, Math.min(h - PAD, star.y)); }
      setStarPos(star);
    });
  }

  rafId = requestAnimationFrame(loop);
}

// ─── ACTIVATION CYCLE ────────────────────────────────────────────────────────

function activateNextStar() {
  if (gameState !== 'playing') return;

  const available = gameStars.filter(s => !s.collected);
  if (available.length === 0) { onAllCollected(); return; }

  // Pick one that is not currently active (shouldn't be any, but guard)
  const star = available[Math.floor(Math.random() * available.length)];
  star.active = true;
  star.el.classList.add('active');

  activationTimer = setTimeout(() => {
    if (star.active && !star.collected) {
      star.active = false;
      star.el.classList.remove('active');
    }
    // Gap before next activation
    const gap = 1000 + Math.random() * 1000;
    setTimeout(activateNextStar, gap);
  }, 3500 + Math.random() * 1800);
}

function onStarClick(star) {
  if (gameState !== 'playing') return;
  if (!star.active) return;

  clearTimeout(activationTimer);
  activationTimer = null;

  // Collect this star
  star.active    = false;
  star.collected = true;
  star.el.classList.remove('active');
  star.el.classList.add('collected');

  updateCounter();

  // Show the next wish in sequence (wishes not tied to specific star)
  showCard(MOMENTS[wishIndex]);
  wishIndex++;
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

function showCard(moment) {
  gameState = 'paused';
  document.getElementById('card-number').textContent = `Момент ${moment.number}`;
  document.getElementById('card-title').textContent  = moment.title;
  document.getElementById('card-text').innerHTML     = moment.text.map(p => `<p>${p}</p>`).join('');
  document.getElementById('card-overlay').classList.add('active');
}

function closeCard() {
  if (!document.getElementById('card-overlay').classList.contains('active')) return;
  document.getElementById('card-overlay').classList.remove('active');
  if (gameState !== 'paused') return;

  const remaining = gameStars.filter(s => !s.collected).length;
  if (remaining === 0) {
    onAllCollected();
  } else {
    gameState = 'playing';
    const gap = 900 + Math.random() * 600;
    setTimeout(activateNextStar, gap);
  }
}

// ─── COUNTER ──────────────────────────────────────────────────────────────────

function updateCounter() {
  const n = gameStars.filter(s => s.collected).length;
  document.getElementById('counter-n').textContent = n;
}

// ─── COLLECT ALL → ASSEMBLE GEMINI ───────────────────────────────────────────

function onAllCollected() {
  gameState = 'assembling';
  setTimeout(assembleGemini, 700);
}

function assembleGemini() {
  const cx   = window.innerWidth  / 2;
  const cy   = window.innerHeight / 2;
  const unit = Math.min(window.innerWidth, window.innerHeight) * 0.13;

  gameStars.forEach((star, i) => {
    const [ox, oy] = GEMINI_OFFSETS[i];
    star.geminiX = cx + ox * unit;
    star.geminiY = cy + oy * unit;
    star.assembling = true;

    star.el.classList.remove('collected');

    // Staggered CSS transition to target position
    star.el.style.transition      = `transform 1.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.06}s`;
    star.el.style.transform       = `translate(${star.geminiX - HALF}px, ${star.geminiY - HALF}px)`;
  });

  // After stars settle, draw lines, then add gem-star class for glow + twinkle
  setTimeout(() => {
    gameStars.forEach((star, i) => {
      star.el.style.transition = '';
      star.el.classList.add('gem-star');
      // Desync twinkle per star
      const dur   = (2.4 + i * 0.35 + (i % 3) * 0.4).toFixed(1);
      const delay = (i * 0.28).toFixed(1);
      star.el.style.setProperty('--twinkle-dur',   dur + 's');
      star.el.style.setProperty('--twinkle-delay', delay + 's');
    });
    drawConstellationLines();
  }, 1600);

  setTimeout(showFinalModal, 3600);
}

function drawConstellationLines() {
  const NS  = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('constellation-svg');
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

  GEMINI_LINES.forEach(([a, b], i) => {
    const sa = gameStars[a], sb = gameStars[b];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', sa.geminiX); line.setAttribute('y1', sa.geminiY);
    line.setAttribute('x2', sb.geminiX); line.setAttribute('y2', sb.geminiY);
    line.setAttribute('class', 'const-line');
    line.style.animationDelay = `${i * 0.2}s`;
    svg.appendChild(line);
  });
}

// ─── FINAL MODAL ──────────────────────────────────────────────────────────────

function showFinalModal() {
  gameState = 'done';
  document.getElementById('final-overlay').classList.add('active');
}

function closeFinalModal() {
  document.getElementById('final-overlay').classList.remove('active');
  setTimeout(() => location.reload(), 600);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initGameStars();

  // Start the render loop immediately (stars visible behind intro)
  loop();

  // Hide game layer until game starts
  document.getElementById('game-layer').style.opacity = '0';
  document.getElementById('game-layer').style.transition = 'opacity 1s ease';

  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('game-layer').style.opacity = '1';
    document.getElementById('counter').classList.add('visible');
    gameState = 'playing';
    setTimeout(activateNextStar, 1600);
  });

  // Card close
  document.getElementById('card-backdrop').addEventListener('click', closeCard);
  document.getElementById('card-close-btn').addEventListener('click', closeCard);

  // Final modal close (backdrop click or button)
  document.getElementById('final-backdrop').addEventListener('click', closeFinalModal);
  document.getElementById('final-close-btn').addEventListener('click', closeFinalModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCard(); closeFinalModal(); }
  });
});
