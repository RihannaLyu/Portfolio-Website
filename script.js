const SERIES = {
  weightless: { label: "Weightless Series", folder: "images", files: ["above.jpg","gemini.jpg", "below.jpg", "self-portrait.jpg", "flooded.jpg", "anchor.jpg", "submerged.jpg"] },
  faceless:   { label: "Faceless Series",  folder: "images/Faceless", files: ["flowerface1.jpg", "flowerface2.jpg", "clockface1.jpg", "clockface2.jpg", "fishtankface1.jpg", "fishtankface2.jpg", "smileyface1.jpg", "smileyface2.png", "diverface1.jpg", "diverface2.jpg"] },
  chinese_traditional: {
    label: "Chinese Traditional",
    folder: "images/Chinesetraditional",
    files: [
      "zhuazi.jpg",
      "meihua.jpg",
      "godless.jpg",
      "still-life-1.jpg",
      "still-life-2.jpg",
      "still-life-3.jpg",
      "still-life-4.jpg",
      "still-life-5.jpg",
      "still-life-6.jpg",
      "still-life-7.jpg",
      "still-life-8.jpg",
      "still-life-9.jpg"
    ]
  }
};


// 16 Drawings with Boundaries-2 moved later in the order sequence
const INDIVIDUAL_WORKS = [
  { title: "My Precious", file: "myprecious.jpg" },
  { title: "Still Life David", file: "stilllifedavid.jpg" },
  { title: "Escape", file: "escape.jpg" },
  { title: "Cycle", file: "cycle.jpg" },
  
  { title: "Reflect", file: "reflect.jpg" },
  { title: "Boundaries-2", file: "boundaries-2.jpg" },
  { title: "Hedgehog", file: "hedgehog.jpg" },
  { title: "Envy", file: "envy.jpg" },
  { title: "Shadow", file: "shadow.jpg" },
  { title: "Boundaries-1", file: "boundaries-1.jpg" }, // Moved later in order
  { title: "Fearless", file: "fearless.jpg" },
  { title: "Birthday", file: "birthday.jpg" },
  { title: "Diana", file: "diana.jpg" },
  { title: "Cocoon", file: "cocoon.jpg" },
  { title: "Boy Who Dont Want Haircut", file: "boywhodontwanthaircut.jpg" },
  { title: "3 min Figures", file: "3minfigures.jpg" },
  { title: "Thief", file: "thief.jpg" }
];

const MAX_SHIFT = 5;
const eyeLeft     = document.getElementById('eyeLeft');
const eyeRight    = document.getElementById('eyeRight');
const avatarBlink = document.getElementById('avatarBlink');
const frame       = document.querySelector('.frame-inner');

const SOCKET = {
  left:  { x: 0.22, y: 0.43 },
  right: { x: 0.44, y: 0.42 },
};

let lastTouch = 0;

document.addEventListener('mousemove', (e) => {
  if (Date.now() - lastTouch < 800) return;   // ignore the fake mouse event phones send after a tap
  moveEyeball(eyeLeft,  SOCKET.left,  e.clientX, e.clientY);
  moveEyeball(eyeRight, SOCKET.right, e.clientX, e.clientY);
});

// On phones there's no cursor — the eyes look toward wherever you touch.
// The glance is scaled down with the portrait so the eyes stay in their sockets.
function lookAtTouch(e) {
  const t = e.touches[0];
  if (!t || !frame) return;
  lastTouch = Date.now();
  const shift = MAX_SHIFT * frame.getBoundingClientRect().width / 600;
  moveEyeball(eyeLeft,  SOCKET.left,  t.clientX, t.clientY, shift);
  moveEyeball(eyeRight, SOCKET.right, t.clientX, t.clientY, shift);
}
document.addEventListener('touchstart', lookAtTouch, { passive: true });
document.addEventListener('touchmove',  lookAtTouch, { passive: true });

function moveEyeball(eyeEl, socket, mouseX, mouseY, maxShift = MAX_SHIFT) {
  if (!eyeEl || !frame) return;
  const rect    = frame.getBoundingClientRect();
  const socketX = rect.left + socket.x * rect.width;
  const socketY = rect.top  + socket.y * rect.height;
  const angle   = Math.atan2(mouseY - socketY, mouseX - socketX);
  const rawDist = Math.hypot(mouseX - socketX, mouseY - socketY);
  const dist    = maxShift * Math.min(1, rawDist / 300);
  const moveX   = Math.cos(angle) * dist;
  const moveY   = Math.sin(angle) * dist * 0.4;
  eyeEl.style.transform = `translate(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px)`;
}

// ── BLINKING ──────────────────────────────────────────────
const HOLD_MS = 120;
const OPEN_MS = 160;

function blink() {
  if (!avatarBlink) return;
  avatarBlink.style.transition = 'none';
  avatarBlink.style.opacity    = '1';
  if (eyeLeft)  { eyeLeft.style.transition  = 'none'; eyeLeft.style.opacity  = '0'; }
  if (eyeRight) { eyeRight.style.transition = 'none'; eyeRight.style.opacity = '0'; }
  setTimeout(() => {
    if (eyeLeft)  eyeLeft.style.opacity  = '1';
    if (eyeRight) eyeRight.style.opacity = '1';
    avatarBlink.style.transition = `opacity ${OPEN_MS}ms ease-out`;
    avatarBlink.style.opacity    = '0';
    setTimeout(() => {
      avatarBlink.style.transition = 'none';
      if (Math.random() < 0.3) {
        setTimeout(blink, 150 + Math.random() * 80);
      } else {
        scheduleNextBlink();
      }
    }, OPEN_MS);
  }, HOLD_MS);
}

function scheduleNextBlink() {
  const next = 2000 + Math.random() * 5000;
  setTimeout(blink, next);
}

window.addEventListener('load', () => {
  setTimeout(scheduleNextBlink, 2000);
});

// Build the Traditional Art grid as soon as the DOM is ready — don't wait for
// every image on the page to finish downloading (that 'load' wait was the ~1 min delay).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderIndividualWorks);
} else {
  renderIndividualWorks();
}

// ── LIGHT SWITCH ──────────────────────────────────────────
// Dark mode = body.lights-off (all the night lighting is in ROOM LIGHTING in style.css).
// The visitor's choice is remembered; the inline script at the top of <body> applies it
// before the first paint, so a returning visitor never sees the wrong mode flash.
const LIGHTS_KEY = 'lightsOff';
const HINT_KEY   = 'switchHintSeen';
const switchImg  = document.getElementById('switchImg');
const switchItem = document.getElementById('switchItem');
const switchTip  = document.getElementById('switchTip');
let lightsOn = !document.body.classList.contains('lights-off');
let switchTimer = null;

function storeGet(key)        { try { return localStorage.getItem(key); } catch (e) { return null; } }
function storeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

function showSwitchState() {
  switchImg.src = lightsOn ? 'images/light-on.PNG' : 'images/light-off.PNG';
  switchItem.setAttribute('aria-pressed', String(!lightsOn));
  switchTip.textContent = lightsOn ? 'Turn off the lights' : 'Turn on the lights';
}
showSwitchState();
// the saved mode went in without transitions; let them run from the next change on
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('lights-init')));

// first visit on a touch screen: "Tap the switch" until the first tap
if (storeGet(HINT_KEY) !== '1') document.body.classList.add('show-switch-hint');

switchItem.addEventListener('click', toggleLight);   // a <button>: Enter / Space work too

function toggleLight() {
  lightsOn = !lightsOn;
  storeSet(LIGHTS_KEY, lightsOn ? '0' : '1');
  document.body.classList.remove('show-switch-hint');
  storeSet(HINT_KEY, '1');
  playSwitchClick();

  // mode + flicker start straight away; the classes are cleared once it has settled
  const body = document.body;
  body.classList.remove('lights-flicker-on', 'lights-flicker-off');
  void body.offsetWidth;                                   // restart the flicker on quick double toggles
  body.classList.toggle('lights-off', !lightsOn);
  body.classList.add('lights-switching', lightsOn ? 'lights-flicker-on' : 'lights-flicker-off');
  if (!lightsOn) {                                         // drop the coloured hover look (it can stick on phones)
    document.getElementById('lightingImg').src = 'images/lighting.PNG';
    document.getElementById('lightBurst').classList.remove('active');
  }
  clearTimeout(switchTimer);
  switchTimer = setTimeout(() => body.classList.remove('lights-switching', 'lights-flicker-on', 'lights-flicker-off'), 900);

  // the toggle tips over; the up/down image swaps half-way through
  switchImg.classList.remove('is-flipping');
  void switchImg.offsetWidth;
  switchImg.classList.add('is-flipping');
  setTimeout(showSwitchState, 130);
}
switchImg.addEventListener('animationend', () => switchImg.classList.remove('is-flipping'));

// A soft "click", made on the fly (no sound file). It only ever plays in response to a
// tap or key press; if the browser still won't allow audio it just stays silent.
let switchAudio = null;
function playSwitchClick() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    switchAudio = switchAudio || new AC();
    if (switchAudio.state === 'suspended') switchAudio.resume();
    const rate = switchAudio.sampleRate;
    const len  = Math.floor(rate * 0.03);
    const buf  = switchAudio.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src  = switchAudio.createBufferSource();
    const tone = switchAudio.createBiquadFilter();
    const vol  = switchAudio.createGain();
    src.buffer = buf;
    tone.type = 'bandpass'; tone.frequency.value = 2200; tone.Q.value = 1.2;
    vol.gain.value = 0.25;
    src.connect(tone).connect(vol).connect(switchAudio.destination);
    src.start();
  } catch (e) {}
}

// ── ABOUT NOTEBOOK ────────────────────────────────────────
const notebookBackdrop = document.getElementById('notebookBackdrop');
const notebookWrap     = document.getElementById('notebookWrap');
const nameplateItem    = document.getElementById('nameplateItem');

nameplateItem.addEventListener('click', openAbout);

function openAbout() {
  notebookBackdrop.classList.add('open');
  notebookWrap.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAbout() {
  notebookBackdrop.classList.remove('open');
  notebookWrap.classList.remove('open');
  document.body.style.overflow = '';
}

// ── 3D MODELS PAGE ───────────────────────────────────────
const shelfItem   = document.getElementById('shelfItem');
const modelsPage  = document.getElementById('modelsPage');
const modelsClose = document.getElementById('modelsClose');

shelfItem.addEventListener('click', openModels);
modelsClose.addEventListener('click', closeModels);

function openModels() {
  modelsPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModels() {
  modelsPage.classList.remove('open');
  document.body.style.overflow = '';
  if (typeof tvClose === 'function') tvClose();   // stop any playing build (see 3D MODELS — TV PILE)
}

// ── GAMES PAGE ────────────────────────────────────────────
const gametableItem = document.getElementById('gametableItem');
const gamesPage     = document.getElementById('gamesPage');
const gamesClose    = document.getElementById('gamesClose');

gametableItem.addEventListener('click', openGames);
gamesClose.addEventListener('click', closeGames);

function openGames() {
  showGamesTab('builds');
  gamesPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGames() {
  gamesPage.classList.remove('open');
  document.body.style.overflow = '';
}

// ── GAMES TABS (phones only) ──────────────────────────────
// On the phone the Games page shows one category at a time: the tab bar switches the page's
// data-tab, and CSS shows that category's islands. Desktop hides the bar and shows both.
const gamesTabBtns    = [...document.querySelectorAll('.games-tab')];
const GAMES_TAB_ORDER = ['builds', 'videos'];

function showGamesTab(name) {
  gamesPage.dataset.tab = name;
  gamesTabBtns.forEach(btn => {
    const on = btn.dataset.tab === name;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on);
    btn.tabIndex = on ? 0 : -1;
  });
}

gamesTabBtns.forEach(btn => btn.addEventListener('click', () => showGamesTab(btn.dataset.tab)));

// arrow keys move between the two tabs
document.getElementById('gamesTabs').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const next = e.key === 'ArrowRight' ? 'videos' : 'builds';
  showGamesTab(next);
  gamesTabBtns.find(b => b.dataset.tab === next).focus();
});

// swipe left → Video Games, swipe right → Interactive Builds
let gamesSwipeX = null, gamesSwipeY = 0;
gamesPage.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) { gamesSwipeX = null; return; }
  gamesSwipeX = e.touches[0].clientX;
  gamesSwipeY = e.touches[0].clientY;
}, { passive: true });
gamesPage.addEventListener('touchend', (e) => {
  if (gamesSwipeX === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - gamesSwipeX, dy = t.clientY - gamesSwipeY;
  gamesSwipeX = null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  const i = GAMES_TAB_ORDER.indexOf(gamesPage.dataset.tab) + (dx < 0 ? 1 : -1);
  if (i >= 0 && i < GAMES_TAB_ORDER.length) showGamesTab(GAMES_TAB_ORDER[i]);
});

// ── GAME ISLANDS (Ren'Py + Unity web builds) ──────────────
// Each .city-island carries its own data-game="..." path to a web build's index.html.
//   • Hosted inside this site:  'images/gamedesign/<game>/index.html'
//   • Or a full itch.io / other URL.
const gameLaunch      = document.getElementById('gameLaunch');
const gameLaunchFrame = document.getElementById('gameLaunchFrame');
const gameLaunchClose = document.getElementById('gameLaunchClose');

// On phones the launcher lives directly in <body>: held sideways, a phone is wider than 768px
// and gets the scaled-down desktop room, which would shrink the game with it. Moved once at
// load (moving an iframe later reloads the game), so rotating mid-game keeps playing.
const isPhone = matchMedia('(max-width: 768px), (max-height: 500px)').matches ||
                (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 500);
if (isPhone) document.body.appendChild(gameLaunch);

// Phones held upright: the "turn sideways" prompt plays its turn once, then the game itself is
// shown turned 90° and full screen (CSS: .hint-dismissed), so turning the phone makes it right
// way up even when the screen can't rotate (rotation lock, in-app browsers like WeChat).
// If the screen does rotate, the sideways-phone CSS takes over and shows it normally.
const ROTATE_HINT_MS = 2000;               // ◄ how long the prompt stays before the game appears
let rotateHintTimer = null;

document.querySelectorAll('.city-island').forEach((island) => {
  island.addEventListener('click', () => {
    const url = island.dataset.game;
    if (!url) return;
    gameLaunchFrame.src = url;              // load the game only when launched
    gameLaunch.classList.add('open');
    document.body.style.overflow = 'hidden';
    clearTimeout(rotateHintTimer);
    rotateHintTimer = setTimeout(dismissRotateHint, ROTATE_HINT_MS);
  });
});

function dismissRotateHint() {
  clearTimeout(rotateHintTimer);
  gameLaunch.classList.add('hint-dismissed');
}

function closeGameLaunch() {
  clearTimeout(rotateHintTimer);
  gameLaunch.classList.remove('open');
  gameLaunch.classList.remove('hint-dismissed');   // the rotate prompt shows again next launch
  gameLaunchFrame.src = 'about:blank';      // unload the game / free memory
  document.body.style.overflow = '';
}

// tapping the prompt (or "Got it") skips straight to the game
document.getElementById('rotateHint').addEventListener('click', dismissRotateHint);

if (gameLaunchClose) gameLaunchClose.addEventListener('click', closeGameLaunch);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gameLaunch.classList.contains('open')) closeGameLaunch();
});

// ── INTERACTIVE BUILD ISLANDS (PDF viewers) ───────────────
// Each .city-island carries data-view="..." (a PDF path). The viewer opens it
// full-screen; the "Open in new tab" button pops the PDF into its own tab.
const viewerOverlay = document.getElementById('viewerOverlay');
const viewerFrame   = document.getElementById('viewerFrame');
const viewerClose   = document.getElementById('viewerClose');
const viewerNewtab  = document.getElementById('viewerNewtab');

document.querySelectorAll('.city-island[data-view]').forEach((island) => {
  island.addEventListener('click', () => {
    const url = island.dataset.view;
    if (!url) return;
    viewerNewtab.href = url;                  // lets the "Open in new tab" button pop out the PDF
    const pages = phoneArt.matches && /\.pdf($|[?#])/i.test(url);
    viewerOverlay.classList.toggle('is-pages', pages);
    if (pages) showPdfPages(url);             // phones: pages drawn to the screen width
    else viewerFrame.src = url;               // PDF or embeddable page
    viewerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeViewer() {
  viewerOverlay.classList.remove('open');
  viewerFrame.src = 'about:blank';            // unload the PDF / page
  clearPdfPages();
  document.body.style.overflow = '';
}

// ── PHONE PDF PAGES ───────────────────────────────────────
// Phone browsers show a PDF in an iframe as one huge, unscrollable first page. On the phone
// the viewer instead draws every page with PDF.js (loaded only the first time a PDF opens),
// fitted to the screen width, in a list that scrolls. Pages render as they come into view.
const viewerPages = document.getElementById('viewerPages');
const PDFJS_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfjsReady = null;
let pdfJob = 0, pdfDoc = null, pdfObserver = null;

function loadPdfJs() {
  if (!pdfjsReady) {
    pdfjsReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS_URL + 'pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => { pdfjsReady = null; reject(new Error('PDF.js failed to load')); };
      document.head.appendChild(s);
    });
  }
  return pdfjsReady;
}

function pdfStatus(html) {
  viewerPages.innerHTML = `<p class="viewer-status">${html}</p>`;
}

async function showPdfPages(url) {
  const job = ++pdfJob;
  viewerPages.scrollTop = 0;
  pdfStatus('Loading…');
  try {
    const pdfjsLib = await loadPdfJs();
    const doc = await pdfjsLib.getDocument(url).promise;
    if (job !== pdfJob) { doc.destroy(); return; }   // closed or switched while loading
    pdfDoc = doc;

    // one placeholder per page, shaped like page 1, so the list has its full length right away
    const first = (await doc.getPage(1)).getViewport({ scale: 1 });
    viewerPages.innerHTML = '';
    pdfObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        pdfObserver.unobserve(entry.target);
        renderPdfPage(doc, +entry.target.dataset.page, entry.target, job);
      });
    }, { root: viewerPages, rootMargin: '600px 0px' });

    for (let n = 1; n <= doc.numPages; n++) {
      const holder = document.createElement('div');
      holder.className = 'viewer-page';
      holder.dataset.page = n;
      holder.style.aspectRatio = `${first.width} / ${first.height}`;
      viewerPages.appendChild(holder);
      pdfObserver.observe(holder);
    }
  } catch (err) {
    if (job !== pdfJob) return;
    pdfStatus(`Couldn't show this PDF here. <a href="${url}" target="_blank" rel="noopener">Open it instead &#8599;</a>`);
  }
}

async function renderPdfPage(doc, n, holder, job) {
  try {
    const page = await doc.getPage(n);
    if (job !== pdfJob) return;
    const base  = page.getViewport({ scale: 1 });
    holder.style.aspectRatio = `${base.width} / ${base.height}`;
    // extra pixels so a pinch-zoom stays sharp, capped to keep memory sane on long decks
    const sharp = Math.min((window.devicePixelRatio || 1) * 1.5, 3);
    const vp    = page.getViewport({ scale: (holder.clientWidth / base.width) * sharp });
    const canvas = document.createElement('canvas');
    canvas.width  = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    if (job !== pdfJob) return;
    holder.appendChild(canvas);
  } catch (err) { /* leave the blank placeholder */ }
}

function clearPdfPages() {
  pdfJob++;
  if (pdfObserver) { pdfObserver.disconnect(); pdfObserver = null; }
  if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }
  viewerPages.innerHTML = '';
}

if (viewerClose) viewerClose.addEventListener('click', closeViewer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && viewerOverlay.classList.contains('open')) closeViewer();
});

// ── ART PAGE ──────────────────────────────────────────────
const artItem  = document.getElementById('artItem');
const artPage  = document.getElementById('artPage');
const artClose = document.getElementById('artClose');
const seriesOverlay = document.getElementById('seriesOverlay');
const seriesFan     = document.getElementById('seriesFan');
const individualGrid = document.getElementById('individualGrid');

// phones open the merged Art page (see ART TABS below); desktop keeps the Traditional Art page
artItem.addEventListener('click', () => phoneArt.matches ? openArtTabs('digital') : openArt());
artClose.addEventListener('click', closeArt);

function openArt() {
  artPage.classList.add('open');
  document.body.style.overflow = 'hidden';
  layoutPhoneGalleries();
}

function closeArt() {
  closePieceViewer();
  closeSeriesOverlay();
  artPage.classList.remove('open');
  document.body.classList.remove('art-tabs-open');
  document.body.style.overflow = '';
}

function openSeriesOverlay() {
  if (!artPage.classList.contains('open')) return;
  seriesOverlay.classList.add('open');
}

function closeSeriesOverlay() {
  seriesOverlay.classList.remove('open');
}

// ── RENDER INDIVIDUAL PIECES GRID (2 ACROSS) ──────────────
function renderIndividualWorks() {
  if (!individualGrid) return;
  individualGrid.innerHTML = '';

  INDIVIDUAL_WORKS.forEach(work => {
    const card = document.createElement('div');
    card.className = 'individual-art-card';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'individual-img-container';

    const img = document.createElement('img');
    img.src = `images/Artindividuals/${work.file}`;
    img.alt = work.title;

    const label = document.createElement('div');
    label.className = 'individual-card-label';
    label.textContent = work.title;

    imgContainer.appendChild(img);
    card.appendChild(imgContainer);
    card.appendChild(label);

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openPieceViewer(img.src, work.title);
    });

    individualGrid.appendChild(card);
  });
}

// ── DYNAMIC SERIES STACK RENDERER ─────────────────────────
document.querySelectorAll('.series-stack').forEach(stack => {
  stack.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const seriesKey = stack.getAttribute('data-series');
    const seriesData = SERIES[seriesKey];
    if (!seriesData || !seriesFan) return;

    seriesFan.innerHTML = '';

    seriesData.files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'fan-card';

      const img = document.createElement('img');
      img.src = `${seriesData.folder}/${file}`;
      img.alt = file;

      let rawName = file.split('.')[0];
      let titleText = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      const label = document.createElement('div');
      label.className = 'fan-card-label';
      label.textContent = titleText;

      card.appendChild(img);
      card.appendChild(label);

      card.addEventListener('click', (evt) => {
        evt.stopPropagation();
        openPieceViewer(img.src, titleText);
      });

      seriesFan.appendChild(card);
    });

    openSeriesOverlay();
  });
});

seriesOverlay.addEventListener('click', (e) => {
  if (e.target === seriesOverlay) {
    closeSeriesOverlay();
  }
});

// close button is only visible on mobile (see MOBILE in style.css)
const seriesClose = document.getElementById('seriesClose');
if (seriesClose) seriesClose.addEventListener('click', closeSeriesOverlay);

// ── PIECE VIEWER & PRECISION DETAILED MAGNIFIER ───────────
const pieceViewer      = document.getElementById('pieceViewer');
const pieceViewerImg   = document.getElementById('pieceViewerImg');
const pieceViewerTitle = document.getElementById('pieceViewerTitle');
const pieceViewerMag   = document.getElementById('pieceViewerMag');

pieceViewer.addEventListener('click', (e) => {
  if (e.target === pieceViewerImg || e.target === pieceViewerMag) return;
  closePieceViewer();
});

function openPieceViewer(src, title) {
  pieceViewerImg.src = src;
  pieceViewerTitle.textContent = title;
  
  pieceViewerMag.style.backgroundImage = `url('${src}')`;
  pieceViewerMag.style.visibility = 'hidden';
  pieceViewerMag.style.opacity = '0';
  
  pieceViewer.classList.add('open');
}

function closePieceViewer() {
  pieceViewer.classList.remove('open');
  pieceViewerMag.style.visibility = 'hidden';
  pieceViewerMag.style.opacity = '0';
}

pieceViewerImg.addEventListener('mousemove', (e) => {
  const rect = pieceViewerImg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    pieceViewerMag.style.visibility = 'hidden';
    pieceViewerMag.style.opacity = '0';
    return;
  }

  pieceViewerMag.style.visibility = 'visible';
  pieceViewerMag.style.opacity = '1';
  
  pieceViewerMag.style.left = (x - 130) + 'px';
  pieceViewerMag.style.top  = (y - 130) + 'px';
  
  const bgX = (x / rect.width) * 100;
  const bgY = (y / rect.height) * 100;

  pieceViewerMag.style.backgroundPosition = `${bgX}% ${bgY}%`;
  pieceViewerMag.style.backgroundSize = `${rect.width * 3}px ${rect.height * 3}px`;
});

pieceViewerImg.addEventListener('mouseleave', () => {
  pieceViewerMag.style.visibility = 'hidden';
  pieceViewerMag.style.opacity = '0';
});

// ── TOUCH MAGNIFIER (phones) ──────────────────────────────
// Press and drag on the piece: the loupe floats above your fingertip so the
// finger never hides what's being magnified. Lifting the finger hides it.
const TOUCH_ZOOM = 2.5;
const TOUCH_LIFT = 90;   // px the loupe sits above the fingertip

function showTouchMag(e) {
  const t = e.touches[0];
  if (!t) return;
  e.preventDefault();                       // hold the page still while magnifying
  const rect = pieceViewerImg.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width,  t.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, t.clientY - rect.top));
  const r = pieceViewerMag.offsetWidth / 2;

  pieceViewerMag.style.visibility = 'visible';
  pieceViewerMag.style.opacity = '1';
  pieceViewerMag.style.left = (x - r) + 'px';
  pieceViewerMag.style.top  = (y - r - TOUCH_LIFT) + 'px';
  pieceViewerMag.style.backgroundPosition = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
  pieceViewerMag.style.backgroundSize = `${rect.width * TOUCH_ZOOM}px ${rect.height * TOUCH_ZOOM}px`;
}

function hideTouchMag(e) {
  if (e.cancelable) e.preventDefault();     // stops the fake mouse events that would re-show the desktop loupe
  pieceViewerMag.style.visibility = 'hidden';
  pieceViewerMag.style.opacity = '0';
}

pieceViewerImg.addEventListener('touchstart',  showTouchMag, { passive: false });
pieceViewerImg.addEventListener('touchmove',   showTouchMag, { passive: false });
pieceViewerImg.addEventListener('touchend',    hideTouchMag);
pieceViewerImg.addEventListener('touchcancel', hideTouchMag);

// ── LIGHTING PAGE ─────────────────────────────────────────
const lightingItem  = document.getElementById('lightingItem');
const lightingPage  = document.getElementById('lightingPage');
const lightingClose = document.getElementById('lightingClose');
const lightingImg   = document.getElementById('lightingImg');
const lightBurst    = document.getElementById('lightBurst');

// Lighting Design is a wall placeholder for now (not enough to show yet). Flip to true to reopen it.
const LIGHTING_PAGE_READY = false;
if (LIGHTING_PAGE_READY) {
  lightingItem.addEventListener('mouseenter', () => {
    if (document.body.classList.contains('lights-off')) return;   // at night the track keeps its one warm white
    lightingImg.src = 'images/lighting-color.PNG';
    lightBurst.classList.add('active');
  });
  lightingItem.addEventListener('mouseleave', () => {
    lightingImg.src = 'images/lighting.PNG';
    lightBurst.classList.remove('active');
  });

  lightingItem.addEventListener('click', openLighting);
}
lightingClose.addEventListener('click', closeLighting);

function openLighting() {
  lightingPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLighting() {
  lightingPage.classList.remove('open');
  document.body.style.overflow = '';
  // stop the stage video when leaving the page
  const v = lightingPage.querySelector('.stage-video');
  if (v) { v.pause(); lightingPage.querySelector('.lighting-stage').classList.remove('is-playing'); v.controls = false; }
}

// ── LIGHTING STAGE VIDEO (play button like the 3D TVs) ────
const lightingStage = document.querySelector('.lighting-stage');
if (lightingStage) {
  const stageVideo = lightingStage.querySelector('.stage-video');
  const stagePlay  = lightingStage.querySelector('.stage-play-btn');
  if (stageVideo && stagePlay) {
    stagePlay.addEventListener('click', () => { stageVideo.play(); });
    stageVideo.addEventListener('play',  () => { lightingStage.classList.add('is-playing'); stageVideo.controls = true; });
    stageVideo.addEventListener('pause', () => { lightingStage.classList.remove('is-playing'); });
    stageVideo.addEventListener('ended', () => {
      lightingStage.classList.remove('is-playing');
      stageVideo.controls = false;
      stageVideo.currentTime = 0;
    });
  }
}

// ── FLOWFLOWERS PAGE ──────────────────────────────────────────
const flowersItem  = document.getElementById('flowersItem');
const flowersPage  = document.getElementById('flowersPage');
const flowersClose = document.getElementById('flowersClose');

flowersItem.addEventListener('click', openFlowers);
flowersClose.addEventListener('click', closeFlowers);

function openFlowers() {
  flowersPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFlowers() {
  flowersPage.classList.remove('open');
  document.body.style.overflow = '';
}

// ── NOTEBOARD ─────────────────────────────────────────────
// A public board of sticky notes, plus "you are visitor No. …". Notes and the visitor count
// live in a free Supabase project (see supabase-setup.sql). Paste its Project URL and
// publishable (anon) key below. Until then the board runs in preview mode: notes are kept only
// in this browser, and the visitor number shows 1,000.
const NOTES_API = {
  url: 'https://xyiqbxbzmnqtakqoghol.supabase.co',          // Supabase project "portfolio-noteboard"
  key: 'sb_publishable_-6j04kbZJwPTnUvi7Ej5GQ_sm189yXS',   // publishable key: safe to be public
};
const VISITOR_START = 1000;                 // the first visitor is No. 1,000
const NOTE_MAX      = 280;
const notesOnline   = Boolean(NOTES_API.url && NOTES_API.key);

const noteboardItem = document.getElementById('noteboardItem');
const notesPage     = document.getElementById('notesPage');
const notesClose    = document.getElementById('notesClose');
const notesVisitor  = document.getElementById('notesVisitor');
const notesBoard    = document.getElementById('notesBoard');
const noteForm      = document.getElementById('noteForm');
const notePaper     = document.getElementById('notePaper');
const noteText      = document.getElementById('noteText');
const noteName      = document.getElementById('noteName');
const noteEmail     = document.getElementById('noteEmail');
const noteCount     = document.getElementById('noteCount');
const notePinBtn    = document.getElementById('notePinBtn');
const noteStatus    = document.getElementById('noteStatus');
const noteColorBtns = [...document.querySelectorAll('.note-color')];
let noteColor = 'yellow';

function safeGet(k)    { try { return localStorage.getItem(k); } catch (e) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

function sbFetch(path, options = {}) {
  const headers = { apikey: NOTES_API.key, 'Content-Type': 'application/json', ...options.headers };
  // legacy anon keys are JWTs and also go in Authorization; new publishable keys don't
  if (NOTES_API.key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + NOTES_API.key;
  return fetch(NOTES_API.url.replace(/\/$/, '') + '/rest/v1/' + path, { ...options, headers })
    .then(res => { if (!res.ok) throw new Error('Supabase ' + res.status); return res; });
}

// ── visitor number: each browser counts once (its id is kept in localStorage) ──
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n.toLocaleString('en-US') + (s[(v - 20) % 10] || s[v] || s[0]);
}
function showVisitorNumber(n) {
  notesVisitor.innerHTML = `visitor no. <strong>${n.toLocaleString('en-US')}</strong> ✿`;
}
function visitorId() {
  let id = safeGet('visitorId');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
           const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
         });
    safeSet('visitorId', id);
  }
  return id;
}
function registerVisit() {
  const cached = Number(safeGet('visitorNumber'));
  if (cached) showVisitorNumber(cached);
  if (!notesOnline) { if (!cached) showVisitorNumber(VISITOR_START); return; }
  sbFetch('rpc/register_visit', { method: 'POST', body: JSON.stringify({ vid: visitorId() }) })
    .then(res => res.json())
    .then(position => {
      const n = VISITOR_START - 1 + Number(position);
      safeSet('visitorNumber', n);
      showVisitorNumber(n);
    })
    .catch(() => { if (!cached) notesVisitor.textContent = 'hi, visitor!'; });
}
registerVisit();                              // counted on arrival, not only when the board opens

// ── the board ──
function noteTilt(id) {                        // a steady little tilt per note
  const h = String(id).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return ((Math.abs(h) % 9) - 4) * 0.8 + 'deg';
}
function renderNote(note, isNew) {
  const el = document.createElement('article');
  el.className = 'board-note' + (isNew ? ' is-new' : '');
  el.dataset.color = ['yellow', 'pink', 'mint', 'blue', 'peach'].includes(note.color) ? note.color : 'yellow';
  el.style.setProperty('--tilt', noteTilt(note.id));
  const text = document.createElement('p');
  text.className = 'board-note-text';
  text.textContent = note.body;                // textContent: visitors' words are never run as HTML
  const by = document.createElement('p');
  by.className = 'board-note-by';
  const date = new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  by.textContent = '— ' + (note.name ? note.name + ', ' : '') + date;
  el.append(text, by);
  return el;
}
function showNotes(notes) {
  notesBoard.innerHTML = '';
  if (!notes.length) {
    notesBoard.innerHTML = '<p class="notes-empty">no notes yet. be the first! ♡</p>';
    return;
  }
  notes.forEach(n => notesBoard.appendChild(renderNote(n)));
}
function demoNotes() {
  try { return JSON.parse(safeGet('demoNotes') || '[]'); } catch (e) { return []; }
}
function loadNotes() {
  if (!notesOnline) { showNotes(demoNotes()); return; }
  notesBoard.innerHTML = '<p class="notes-empty">loading…</p>';
  sbFetch('notes?select=id,created_at,body,name,color&order=created_at.desc&limit=200')
    .then(res => res.json())
    .then(showNotes)
    .catch(() => { notesBoard.innerHTML = '<p class="notes-empty">the board is napping. try again soon!</p>'; });
}

// ── writing a note ──
function setNoteColor(color) {
  noteColor = color;
  notePaper.dataset.color = color;
  noteColorBtns.forEach(b => {
    const on = b.dataset.color === color;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', on);
  });
}
noteColorBtns.forEach(b => b.addEventListener('click', () => setNoteColor(b.dataset.color)));
noteText.addEventListener('input', () => { noteCount.textContent = noteText.value.length + ' / ' + NOTE_MAX; });

noteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const body = noteText.value.trim();
  if (!body) { noteStatus.textContent = 'write something first!'; noteText.focus(); return; }
  const note = {
    body: body.slice(0, NOTE_MAX),
    name: noteName.value.trim().slice(0, 40) || null,
    color: noteColor,
  };
  const email = noteEmail.value.trim().slice(0, 120);
  notePinBtn.disabled = true;
  noteStatus.textContent = 'pinning…';

  const done = () => {
    const shown = { ...note, id: 'new-' + Date.now(), created_at: new Date().toISOString() };
    notesBoard.querySelector('.notes-empty')?.remove();
    notesBoard.prepend(renderNote(shown, true));
    noteForm.reset();
    setNoteColor(noteColor);
    noteCount.textContent = '0 / ' + NOTE_MAX;
    noteStatus.textContent = email ? 'pinned! I\'ll write back ♡' : 'pinned! thank you ♡';
    setTimeout(() => { notePinBtn.disabled = false; }, 8000);   // a short pause between notes
  };

  if (!notesOnline) {                          // preview mode: this browser only
    const all = demoNotes();
    all.unshift({ ...note, id: 'demo-' + Date.now(), created_at: new Date().toISOString() });
    safeSet('demoNotes', JSON.stringify(all.slice(0, 50)));
    done();
    return;
  }
  // the email goes in its own column, which visitors can write but never read back
  sbFetch('notes', { method: 'POST', headers: { Prefer: 'return=minimal' },
                     body: JSON.stringify({ ...note, email: email || null }) })
    .then(done)
    .catch(() => {
      notePinBtn.disabled = false;
      noteStatus.textContent = 'oops, that didn\'t pin. try again?';
    });
});

// ── open / close ──
function openNotes() {
  notesPage.classList.add('open');
  notesPage.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  noteStatus.textContent = '';
  loadNotes();
}
function closeNotes() {
  notesPage.classList.remove('open');
  document.body.style.overflow = '';
}
noteboardItem.addEventListener('click', openNotes);
noteboardItem.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNotes(); }
});
notesClose.addEventListener('click', closeNotes);

// ── SOFTWARE PAGE (opened from the computer cart) ────────
const softwareItem  = document.getElementById('softwareItem');
const softwarePage  = document.getElementById('softwarePage');
const softwareClose = document.getElementById('softwareClose');

function openSoftware() {
  softwarePage.classList.add('open');
  softwarePage.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function closeSoftware() {
  if (typeof osClose === 'function') osClose(false);
  softwarePage.classList.remove('open');
  document.body.style.overflow = '';
}
softwareItem.addEventListener('click', openSoftware);
softwareItem.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSoftware(); }
});
softwareClose.addEventListener('click', closeSoftware);

/* the desktop inside Software & Apps: icons + dock open each app's window; the menu-bar clock ticks */
const osDesk  = document.getElementById('osDesk');
const osClock = document.getElementById('osClock');
let osOpenWin = null, osLastIcon = null;

function osOpen(app, fromEl) {
  const win = osDesk.querySelector(`.app-window[data-app="${app}"]`);
  if (!win) return;
  if (osOpenWin && osOpenWin !== win) osClose(false);
  osLastIcon = fromEl || null;
  // the window grows out of the icon that opened it
  if (fromEl) {
    const d = osDesk.getBoundingClientRect(), r = fromEl.getBoundingClientRect(), k = d.width / (osDesk.offsetWidth || d.width);
    win.style.setProperty('--fx', ((r.left + r.width / 2 - d.left) / k) + 'px');
    win.style.setProperty('--fy', ((r.top + r.height / 2 - d.top) / k) + 'px');
  }
  win.hidden = false;
  requestAnimationFrame(() => win.classList.add('is-open'));
  osOpenWin = win;
  softwarePage.classList.add('has-window');
  document.querySelectorAll(`[data-app]`).forEach(b => b.classList.toggle('is-running', b.dataset.app === app && !b.classList.contains('app-window')));
  setTimeout(() => { const o = win.querySelector('.app-open'); if (o) o.focus({ preventScroll: true }); }, 120);
}
function osClose(refocus = true) {
  if (!osOpenWin) return false;
  const win = osOpenWin; osOpenWin = null;
  win.classList.remove('is-open');
  softwarePage.classList.remove('has-window');
  document.querySelectorAll('.is-running').forEach(b => b.classList.remove('is-running'));
  setTimeout(() => { if (!win.classList.contains('is-open')) win.hidden = true; }, 320);
  if (refocus && osLastIcon) osLastIcon.focus({ preventScroll: true });
  return true;
}
if (osDesk) {
  document.querySelectorAll('#os button[data-app]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); osOpen(b.dataset.app, b); }));
  osDesk.querySelectorAll('.app-dot-close').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); osClose(); }));
  osDesk.addEventListener('click', (e) => { if (osOpenWin && !e.target.closest('.app-window')) osClose(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && osOpenWin) { e.stopImmediatePropagation(); osClose(); }
  }, true);
  softwareClose.addEventListener('click', () => osClose(false));
  const tick = () => { osClock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  tick(); setInterval(tick, 20000);
}

// ── WINDOW PAGE ───────────────────────────────────────────
const windowItem  = document.getElementById('windowItem');
const windowPage  = document.getElementById('windowPage');
const windowClose = document.getElementById('windowClose');

windowItem.addEventListener('click', openWindow);
windowClose.addEventListener('click', closeWindow);

function openWindow() {
  windowPage.classList.add('open');
  document.body.style.overflow = 'hidden';
  layoutPhoneGalleries();
}

function closeWindow() {
  windowPage.classList.remove('open');
  document.body.classList.remove('art-tabs-open');
  document.body.style.overflow = '';
}

// ── ART TABS (phones, 768px and narrower) ─────────────────
// The window (Digital Art) isn't hung on the phone wall, so the easel opens one "Art" page:
// a fixed tab bar over the Digital Art and Traditional Art pages, which cross-fade when a
// tab is tapped or the content is swiped sideways. Desktop never uses any of this.
const phoneArt     = window.matchMedia('(max-width: 768px)');
const artTabs      = document.getElementById('artTabs');
const artTabsClose = document.getElementById('artTabsClose');
const artTabBtns   = [...artTabs.querySelectorAll('.art-tab')];
const ART_TAB_ORDER = ['digital', 'traditional'];

function showArtTab(name) {
  artTabBtns.forEach(btn => {
    const on = btn.dataset.tab === name;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on);
    btn.tabIndex = on ? 0 : -1;
  });
  windowPage.classList.toggle('open', name === 'digital');
  artPage.classList.toggle('open', name === 'traditional');
  layoutPhoneGalleries();
}

function currentArtTab() {
  return artPage.classList.contains('open') ? 'traditional' : 'digital';
}

function openArtTabs(name) {
  windowPage.scrollTop = 0;
  artPage.scrollTop = 0;
  document.body.classList.add('art-tabs-open');
  document.body.style.overflow = 'hidden';
  showArtTab(name);
}

function closeArtTabs() {
  closeArt();
  closeWindow();
}

artTabsClose.addEventListener('click', closeArtTabs);
artTabBtns.forEach(btn => btn.addEventListener('click', () => showArtTab(btn.dataset.tab)));

// arrow keys move between the two tabs
artTabs.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const next = e.key === 'ArrowRight' ? 'traditional' : 'digital';
  showArtTab(next);
  artTabBtns.find(b => b.dataset.tab === next).focus();
});

// swipe left → Traditional Art, swipe right → Digital Art
let swipeX = null, swipeY = 0;
[windowPage, artPage].forEach(page => {
  page.addEventListener('touchstart', (e) => {
    if (!document.body.classList.contains('art-tabs-open') || e.touches.length !== 1) { swipeX = null; return; }
    swipeX = e.touches[0].clientX;
    swipeY = e.touches[0].clientY;
  }, { passive: true });
  page.addEventListener('touchend', (e) => {
    if (swipeX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeX, dy = t.clientY - swipeY;
    swipeX = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = ART_TAB_ORDER.indexOf(currentArtTab()) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < ART_TAB_ORDER.length) showArtTab(ART_TAB_ORDER[i]);
  });
});

// rotating / resizing past 768px closes the phone-only Art page
phoneArt.addEventListener('change', () => {
  if (!phoneArt.matches && document.body.classList.contains('art-tabs-open')) closeArtTabs();
});

// ── LIGHTBOX ─────────────────────────────────────────────
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDesc  = document.getElementById('lightboxDesc');

function openLightbox(src, title, desc) {
  lightboxImg.src           = src;
  lightboxTitle.textContent = title;
  lightboxDesc.textContent  = desc || '';
  lightbox.classList.add('open');
}

function closeLightbox() {
  lightbox.classList.remove('open');
}

// ── ESCAPE KEY ────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (pieceViewer.classList.contains('open')) { closePieceViewer(); return; }
    if (seriesOverlay.classList.contains('open')) { closeSeriesOverlay(); return; }
    closeArt();
    closeAbout();
    closeModels();
    closeGames();
    closeLighting();
    closeFlowers();
    closeNotes();
    closeSoftware();
    closeWindow();
    closeLightbox();
  }
});

// ── DIGITAL ART INTERACTIVITY ─────────────────────────────
document.querySelectorAll('.digital-art-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    const img = card.querySelector('img');
    const title = card.querySelector('.digital-card-title').textContent;
    openPieceViewer(img.src, title);
  });
});

// ── PHONE GALLERY WRAP ────────────────────────────────────
// On phones (≤768px) Traditional Art and Digital Art are each one 2-column grid (see
// style.css): the series / illustrations block sits in the left half, the pieces run one
// per row beside it, then two per row once it ends. CSS can't know how many rows the left
// block covers, so measure it and set --wrap-rows; .wrap-fill then stretches the block to
// the bottom of those rows so nothing is left empty under it.
const phoneGallery = window.matchMedia('(max-width: 768px)');
const GALLERY_WRAPS = [
  { left: document.querySelector('.art-left'),           pieces: '.art-right .digital-section-subtitle, .individual-art-card' },
  { left: document.querySelector('.digital-column-left'), pieces: '.digital-column-right .digital-section-subtitle, .digital-column-right .digital-art-card' }
];

function layoutPhoneGalleries() {
  GALLERY_WRAPS.forEach(({ left, pieces }) => {
    if (!left) return;
    left.classList.remove('wrap-fill');
    if (!phoneGallery.matches) { left.style.removeProperty('--wrap-rows'); return; }
    const items = [...left.parentElement.querySelectorAll(pieces)];
    if (!items.length) return;
    // 1) left block beside every piece: each piece gets its own row, so its bottom is where that row ends
    left.style.setProperty('--wrap-rows', items.length);
    const leftBottom = left.getBoundingClientRect().bottom - 1;
    // 2) it spans rows until a piece reaches its bottom; the pieces after that go two per row
    let rows = items.findIndex(el => el.getBoundingClientRect().bottom >= leftBottom) + 1;
    if (rows === 0) rows = items.length;
    left.style.setProperty('--wrap-rows', rows);
    left.classList.add('wrap-fill');
  });
}

let galleryFrame = 0;
function queuePhoneGalleries() {
  cancelAnimationFrame(galleryFrame);
  galleryFrame = requestAnimationFrame(layoutPhoneGalleries);
}
window.addEventListener('resize', queuePhoneGalleries);
phoneGallery.addEventListener('change', queuePhoneGalleries);
GALLERY_WRAPS.forEach(({ left }) => left && left.querySelectorAll('img').forEach(img => img.addEventListener('load', queuePhoneGalleries)));
if (document.fonts) document.fonts.ready.then(queuePhoneGalleries);


/* ═══════════════════════════════════════════════════════════
   3D MODELS — TV PILE
   ═══════════════════════════════════════════════════════════ */
const MODELS_BASE = 'images/3Dmodels/';
const MODEL_VIDEOS = [
  {
    title: "Dragon Door",
    video: "dragondoor.mp4",
    poster: "thumbnaildragon.jpg"
  },
  {
    title: "Kung Fu Master",
    video: "kungfumaster.mp4",
    poster: "kungfumaster.jpg"
  },
  {
    title: "Master Bedroom Design",
    video: "masterbedroom.mp4",
    poster: "masterbedroom.jpg"
  },
  {
    title: "Endless City",
    video: "endlesscity.mp4",
    poster: "endlesscity.jpg"
  }
];

/* THE TV PILE: four little sets, all on one screen. Choosing one brings it forward (big, centred,
   the others dimmed behind) and plays it with its controls; "All channels", Esc or a click on
   the backdrop puts it back. One design for desktop and phone. */
const tvWall       = document.getElementById('tvWall');
const tvFocus      = document.getElementById('tvFocus');
const tvFocusVideo = document.getElementById('tvFocusVideo');
const tvFocusTitle = document.getElementById('tvFocusTitle');
const tvFocusNo    = document.getElementById('tvFocusNo');
const tvFocusBack  = document.getElementById('tvFocusBack');
let tvLastSet = null;

function buildTVWall() {
  if (!tvWall) return;
  tvWall.innerHTML = '';
  MODEL_VIDEOS.forEach((m, i) => {
    const set = document.createElement('button');
    set.type = 'button';
    set.className = 'tv-set';
    set.style.setProperty('--n', i);
    set.setAttribute('aria-label', 'Play ' + m.title);
    set.innerHTML = `
      <span class="tv-antenna" aria-hidden="true"><i></i><i></i></span>
      <span class="tv-body">
        <span class="tv-glass"><img class="tv-poster" src="${MODELS_BASE}${m.poster}" alt="" loading="lazy" /></span>
        <img class="tv-frame" src="${MODELS_BASE}tv.PNG" alt="" />
        <span class="tv-channel" aria-hidden="true">CH ${String(i + 1).padStart(2, '0')}</span>
        <span class="tv-play" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><polygon points="42,32 42,68 70,50"/></svg></span>
      </span>
      <span class="tv-name">${m.title}</span>`;
    set.addEventListener('click', () => tvOpen(i, set));
    tvWall.appendChild(set);
  });
}

function tvOpen(i, fromSet) {
  const m = MODEL_VIDEOS[i];
  tvLastSet = fromSet || null;
  tvFocusTitle.textContent = m.title;
  tvFocusNo.textContent = 'CH ' + String(i + 1).padStart(2, '0');
  tvFocusVideo.poster = MODELS_BASE + m.poster;
  tvFocusVideo.src = MODELS_BASE + m.video;
  tvFocus.setAttribute('aria-hidden', 'false');
  modelsPage.classList.add('is-watching');
  tvFocusVideo.play().catch(() => {});                       // the click is the user's gesture
  setTimeout(() => tvFocusBack.focus({ preventScroll: true }), 80);
}

function tvClose() {
  if (!modelsPage.classList.contains('is-watching')) return false;
  tvFocusVideo.pause();
  modelsPage.classList.remove('is-watching');
  tvFocus.setAttribute('aria-hidden', 'true');
  if (tvLastSet) tvLastSet.focus({ preventScroll: true });
  setTimeout(() => { if (!modelsPage.classList.contains('is-watching')) tvFocusVideo.removeAttribute('src'); }, 450);
  return true;
}

if (tvFocus) {
  tvFocusBack.addEventListener('click', tvClose);
  tvFocus.addEventListener('click', (e) => { if (e.target === tvFocus) tvClose(); });
  // Esc steps back to all channels first (before the page-wide Esc closes the page)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modelsPage.classList.contains('is-watching')) { e.stopImmediatePropagation(); tvClose(); }
  }, true);
}
buildTVWall();
