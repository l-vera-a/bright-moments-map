'use strict';

// ─── DATA ───────────────────────────────────────────────────────────────────

const MOMENTS = [
  {
    id: 1,
    title: 'Момент свободы',
    number: 'I',
    text: [
      'Пусть в твоей жизни всегда будет место для дороги, которую ты выбираешь сама.',
      'Не потому что «так надо». Не потому что «так правильно».',
      'А потому что внутри тихо сказало: «мне туда».'
    ]
  },
  {
    id: 2,
    title: 'Момент лёгкости',
    number: 'II',
    text: [
      'Пусть сложное иногда оказывается проще, чем казалось.',
      'Пусть нужные двери открываются без драматического скрипа.',
      'И пусть будет больше дней, после которых хочется сказать: «А вот это было хорошо».'
    ]
  },
  {
    id: 3,
    title: 'Момент красоты',
    number: 'III',
    text: [
      'Пусть вокруг будет больше красивого: в местах, людях, словах, случайных утрах, отражениях в окнах и планах, которые вдруг начинают сбываться.'
    ]
  },
  {
    id: 4,
    title: 'Момент силы',
    number: 'IV',
    text: [
      'Пусть твоя сила будет не только про «выдержать».',
      'Пусть она будет ещё и про выбирать, останавливаться, уходить от лишнего и беречь себя без чувства вины.'
    ]
  },
  {
    id: 5,
    title: 'Момент тепла',
    number: 'V',
    text: [
      'Пусть рядом будут люди, с которыми можно не играть роль, не объяснять очевидное и не держать лицо, когда хочется просто быть живой.'
    ]
  },
  {
    id: 6,
    title: 'Момент «я смогла»',
    number: 'VI',
    text: [
      'Пусть впереди будет много тихих побед. Не обязательно громких. Не обязательно для всех.',
      'Просто таких, после которых внутри становится спокойнее и увереннее.'
    ]
  },
  {
    id: 7,
    title: 'Момент нового маршрута',
    number: 'VII',
    text: [
      'Пусть каждый новый поворот ведёт не к хаосу, а к себе.',
      'К новым желаниям. К новым местам.',
      'К новым причинам улыбаться без повода.'
    ]
  },
  {
    id: 8,
    title: 'Момент, который останется',
    number: 'VIII',
    text: [
      'Пусть в жизни будет больше мгновений, которые не нужно записывать, чтобы помнить.',
      'Они просто остаются — запахом, светом, фразой, человеком, дорогой.'
    ]
  }
];

const FINAL_MOMENT = {
  title: 'Юля',
  number: '✦',
  text: [
    'Самая важная точка на этой карте — не место, не дата и не событие.',
    'Это ты.',
    'Потому что именно ты превращаешь дорогу в путь, случайности — в историю, а обычные дни — в то, что потом называется жизнью.'
  ]
};

// ─── STATE ───────────────────────────────────────────────────────────────────

const openedPoints = new Set(JSON.parse(localStorage.getItem('bm_opened') || '[]'));
let userMoments = JSON.parse(localStorage.getItem('bm_user_moments') || '[]');
let finalUnlocked = openedPoints.size >= 8;

// ─── SVG POINT COORDINATES ───────────────────────────────────────────────────
// Map is 800×700 viewBox

const POINT_COORDS = [
  { id: 1, cx: 110, cy: 580 },
  { id: 2, cx: 190, cy: 480 },
  { id: 3, cx: 160, cy: 380 },
  { id: 4, cx: 260, cy: 300 },
  { id: 5, cx: 370, cy: 240 },
  { id: 6, cx: 490, cy: 210 },
  { id: 7, cx: 590, cy: 160 },
  { id: 8, cx: 680, cy: 110 }
];

const FINAL_COORDS = { cx: 720, cy: 70 };

// SVG route path through all points + final
const ROUTE_DARK_D = `M 80,640 C 95,610 100,595 110,580`;
const ROUTE_LIGHT_D = `M 110,580 C 140,545 170,510 190,480
  C 210,450 175,410 160,380
  C 145,350 210,325 260,300
  C 310,275 340,258 370,240
  C 400,222 445,215 490,210
  C 535,205 560,182 590,160
  C 620,138 650,124 680,110
  C 695,102 708,87 720,70`;

// ─── BUILD SVG ───────────────────────────────────────────────────────────────

function buildSVG() {
  const svg = document.getElementById('route-svg');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';

  // Gradient defs
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <linearGradient id="bgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3a2e26" stop-opacity="0.06"/>
      <stop offset="60%" stop-color="#e8ddd0" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#d4ae72" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowStrong" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Background fill
  const bgRect = document.createElementNS(NS, 'rect');
  bgRect.setAttribute('width', '800');
  bgRect.setAttribute('height', '700');
  bgRect.setAttribute('fill', 'url(#bgGrad)');
  svg.appendChild(bgRect);

  // Subtle grid lines (map texture)
  const gridG = document.createElementNS(NS, 'g');
  gridG.setAttribute('class', 'map-grid');
  gridG.setAttribute('opacity', '0.12');
  for (let i = 0; i < 10; i++) {
    const h = document.createElementNS(NS, 'line');
    h.setAttribute('x1', '0'); h.setAttribute('y1', String(70 * i));
    h.setAttribute('x2', '800'); h.setAttribute('y2', String(70 * i));
    h.setAttribute('stroke', '#9e8d7a'); h.setAttribute('stroke-width', '0.5');
    gridG.appendChild(h);
    const v = document.createElementNS(NS, 'line');
    v.setAttribute('x1', String(80 * i)); v.setAttribute('y1', '0');
    v.setAttribute('x2', String(80 * i)); v.setAttribute('y2', '700');
    v.setAttribute('stroke', '#9e8d7a'); v.setAttribute('stroke-width', '0.5');
    gridG.appendChild(v);
  }
  svg.appendChild(gridG);

  // Zone labels
  const labelDark = document.createElementNS(NS, 'text');
  labelDark.setAttribute('x', '30'); labelDark.setAttribute('y', '630');
  labelDark.setAttribute('class', 'zone-label');
  labelDark.textContent = 'Тёмный участок';
  svg.appendChild(labelDark);

  const labelLight = document.createElementNS(NS, 'text');
  labelLight.setAttribute('x', '600'); labelLight.setAttribute('y', '48');
  labelLight.setAttribute('class', 'zone-label');
  labelLight.textContent = 'Светлый участок';
  svg.appendChild(labelLight);

  // Route - dark segment
  const routeDark = document.createElementNS(NS, 'path');
  routeDark.setAttribute('d', ROUTE_DARK_D);
  routeDark.setAttribute('class', 'route-dark');
  svg.appendChild(routeDark);

  // Route - light segment
  const routeLight = document.createElementNS(NS, 'path');
  routeLight.setAttribute('id', 'route-light');
  routeLight.setAttribute('d', ROUTE_LIGHT_D);
  routeLight.setAttribute('class', 'route-light');
  svg.appendChild(routeLight);

  // Regular points
  POINT_COORDS.forEach((pt) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `map-point${openedPoints.has(pt.id) ? ' opened' : ''}`);
    g.setAttribute('data-id', String(pt.id));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', MOMENTS[pt.id - 1].title);

    const outer = document.createElementNS(NS, 'circle');
    outer.setAttribute('cx', String(pt.cx)); outer.setAttribute('cy', String(pt.cy));
    outer.setAttribute('r', '12'); outer.setAttribute('class', 'point-outer');

    const inner = document.createElementNS(NS, 'circle');
    inner.setAttribute('cx', String(pt.cx)); inner.setAttribute('cy', String(pt.cy));
    inner.setAttribute('r', '5'); inner.setAttribute('class', 'point-inner');

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', String(pt.cx));
    label.setAttribute('y', String(pt.cy + 22));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'point-label');
    label.textContent = MOMENTS[pt.id - 1].number;

    g.appendChild(outer);
    g.appendChild(inner);
    g.appendChild(label);
    svg.appendChild(g);

    g.addEventListener('click', () => openCard(pt.id));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openCard(pt.id); });
  });

  // Final point
  const fg = document.createElementNS(NS, 'g');
  fg.setAttribute('id', 'final-point');
  fg.setAttribute('class', `final-point${finalUnlocked ? ' visible' : ''}`);
  fg.setAttribute('tabindex', finalUnlocked ? '0' : '-1');
  fg.setAttribute('role', 'button');
  fg.setAttribute('aria-label', 'Юля — финальная точка');

  const fo = document.createElementNS(NS, 'circle');
  fo.setAttribute('cx', String(FINAL_COORDS.cx)); fo.setAttribute('cy', String(FINAL_COORDS.cy));
  fo.setAttribute('r', '16'); fo.setAttribute('class', 'final-point-outer');

  const fi = document.createElementNS(NS, 'circle');
  fi.setAttribute('cx', String(FINAL_COORDS.cx)); fi.setAttribute('cy', String(FINAL_COORDS.cy));
  fi.setAttribute('r', '6'); fi.setAttribute('class', 'final-point-inner');
  fi.setAttribute('filter', 'url(#glowStrong)');

  const fl = document.createElementNS(NS, 'text');
  fl.setAttribute('x', String(FINAL_COORDS.cx));
  fl.setAttribute('y', String(FINAL_COORDS.cy + 26));
  fl.setAttribute('text-anchor', 'middle');
  fl.setAttribute('class', 'final-point-label');
  fl.textContent = 'Юля';

  fg.appendChild(fo); fg.appendChild(fi); fg.appendChild(fl);
  svg.appendChild(fg);

  fg.addEventListener('click', () => { if (finalUnlocked) openFinalCard(); });
  fg.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && finalUnlocked) openFinalCard();
  });

  // Restore user moments
  userMoments.forEach((m) => addUserPointToSVG(m.text, m.cx, m.cy));

  updateStatus();
}

// ─── CARD LOGIC ──────────────────────────────────────────────────────────────

function openCard(id) {
  const moment = MOMENTS[id - 1];
  const overlay = document.getElementById('card-overlay');
  const title = document.getElementById('card-title');
  const number = document.getElementById('card-number');
  const text = document.getElementById('card-text');

  number.textContent = `Момент ${moment.number}`;
  title.textContent = moment.title;
  text.innerHTML = moment.text.map(p => `<p>${p}</p>`).join('');

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Mark as opened
  if (!openedPoints.has(id)) {
    openedPoints.add(id);
    saveOpened();
    markPointOpened(id);
    checkAllOpened();
  }
}

function closeCard() {
  const overlay = document.getElementById('card-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function openFinalCard() {
  document.getElementById('final-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFinalModal() {
  document.getElementById('final-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function markPointOpened(id) {
  const g = document.querySelector(`.map-point[data-id="${id}"]`);
  if (g) g.classList.add('opened');
}

function checkAllOpened() {
  updateStatus();
  if (openedPoints.size >= 8 && !finalUnlocked) {
    finalUnlocked = true;
    setTimeout(() => {
      const fp = document.getElementById('final-point');
      if (fp) {
        fp.classList.add('visible');
        fp.setAttribute('tabindex', '0');
      }
      const routeLight = document.getElementById('route-light');
      if (routeLight) routeLight.classList.add('all-opened');
      const btn = document.getElementById('open-final-btn');
      if (btn) btn.classList.add('visible');
    }, 600);
  }
}

function updateStatus() {
  const el = document.getElementById('map-status');
  if (!el) return;
  const count = openedPoints.size;
  if (count === 0) {
    el.textContent = 'Нажимайте на точки, чтобы открыть яркие моменты';
    el.classList.remove('glowing');
  } else if (count < 8) {
    el.textContent = `Карта наполняется светом… (${count} из 8)`;
    el.classList.remove('glowing');
  } else {
    el.textContent = 'Маршрут стал светлее.';
    el.classList.add('glowing');
  }
}

function saveOpened() {
  localStorage.setItem('bm_opened', JSON.stringify([...openedPoints]));
}

// ─── ADD MOMENT ──────────────────────────────────────────────────────────────

function addUserMoment() {
  const input = document.getElementById('moment-input');
  const feedback = document.getElementById('add-moment-feedback');
  const text = input.value.trim();
  if (!text) return;

  // Random position on the lighter part of the map
  const cx = 300 + Math.random() * 380;
  const cy = 80 + Math.random() * 340;
  const truncated = text.length > 30 ? text.slice(0, 30) + '…' : text;

  const momentData = { text: truncated, cx: Math.round(cx), cy: Math.round(cy) };
  userMoments.push(momentData);
  localStorage.setItem('bm_user_moments', JSON.stringify(userMoments));

  addUserPointToSVG(truncated, momentData.cx, momentData.cy);

  input.value = '';
  feedback.textContent = 'Момент добавлен на карту ✦';
  feedback.classList.add('visible');
  setTimeout(() => feedback.classList.remove('visible'), 3000);

  // Scroll to map
  document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
}

function addUserPointToSVG(text, cx, cy) {
  const svg = document.getElementById('route-svg');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';

  const g = document.createElementNS(NS, 'g');

  const outer = document.createElementNS(NS, 'circle');
  outer.setAttribute('cx', String(cx)); outer.setAttribute('cy', String(cy));
  outer.setAttribute('r', '9'); outer.setAttribute('class', 'user-point-outer');

  const inner = document.createElementNS(NS, 'circle');
  inner.setAttribute('cx', String(cx)); inner.setAttribute('cy', String(cy));
  inner.setAttribute('r', '3'); inner.setAttribute('class', 'user-point-inner');

  const label = document.createElementNS(NS, 'text');
  label.setAttribute('x', String(cx));
  label.setAttribute('y', String(cy + 17));
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('class', 'user-point-label');
  label.textContent = text.length > 20 ? text.slice(0, 20) + '…' : text;

  g.appendChild(outer); g.appendChild(inner); g.appendChild(label);
  svg.appendChild(g);
}

// ─── SCROLL ANIMATION ────────────────────────────────────────────────────────

function initScrollObserver() {
  const els = document.querySelectorAll('.observe-fade');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach((el) => observer.observe(el));
}

// ─── HERO LINES SVG ──────────────────────────────────────────────────────────

function buildHeroLines() {
  const svg = document.getElementById('hero-lines-svg');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const paths = [
    'M -50,400 Q 200,200 500,350 T 1050,300',
    'M -50,500 Q 300,300 600,450 T 1050,400',
    'M 100,600 Q 400,350 750,500 T 1100,450',
    'M 0,200 Q 350,100 650,250 T 1100,200',
  ];
  paths.forEach((d, i) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#b8975a');
    path.setAttribute('stroke-width', '0.8');
    path.setAttribute('opacity', String(0.15 + i * 0.05));
    svg.appendChild(path);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildHeroLines();
  buildSVG();
  initScrollObserver();

  // On load, restore open state
  if (finalUnlocked) {
    setTimeout(() => {
      const routeLight = document.getElementById('route-light');
      if (routeLight) routeLight.classList.add('all-opened');
      const btn = document.getElementById('open-final-btn');
      if (btn) btn.classList.add('visible');
    }, 300);
  }

  // Card close
  document.getElementById('card-backdrop').addEventListener('click', closeCard);
  document.getElementById('card-close-btn').addEventListener('click', closeCard);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCard();
      closeFinalModal();
    }
  });

  // Final modal close
  document.getElementById('final-backdrop').addEventListener('click', closeFinalModal);
  document.getElementById('final-close-btn').addEventListener('click', closeFinalModal);

  // Open final button
  document.getElementById('open-final-btn-action').addEventListener('click', openFinalCard);

  // Scroll to map
  document.getElementById('open-map-btn').addEventListener('click', () => {
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Add moment
  document.getElementById('add-moment-btn').addEventListener('click', addUserMoment);
  document.getElementById('moment-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addUserMoment();
    }
  });
});
