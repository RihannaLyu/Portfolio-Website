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
  mvStop();                                   // phone viewer (see 3D MODELS — PHONE VIEWER)
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

document.querySelectorAll('.city-island').forEach((island) => {
  island.addEventListener('click', () => {
    const url = island.dataset.game;
    if (!url) return;
    gameLaunchFrame.src = url;              // load the game only when launched
    gameLaunch.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeGameLaunch() {
  gameLaunch.classList.remove('open');
  gameLaunchFrame.src = 'about:blank';      // unload the game / free memory
  document.body.style.overflow = '';
}

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
    viewerFrame.src = url;                    // PDF or embeddable page
    viewerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeViewer() {
  viewerOverlay.classList.remove('open');
  viewerFrame.src = 'about:blank';            // unload the PDF / page
  document.body.style.overflow = '';
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
   3D MODELS — TV CAROUSEL
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

const tvCarousel = document.getElementById('tvCarousel');
const tvTrack    = document.getElementById('tvTrack');
const tvArrowL   = document.getElementById('tvArrowLeft');
const tvArrowR   = document.getElementById('tvArrowRight');

let tvSlides  = [];
let tvActive  = 0;                                            // opens on the first video (Dragon Door)

function buildTVSlides() {
  if (!tvTrack) return;
  tvTrack.innerHTML = '';
  tvSlides = MODEL_VIDEOS.map((m, i) => {
    const stage = document.createElement('div');
    stage.className = 'tv-stage';
    
    stage.innerHTML = `
      <div class="tv-screen-container">
        <div class="tv-screen">
          <video class="tv-screen-media" 
                 poster="${MODELS_BASE}${m.poster}" 
                 src="${MODELS_BASE}${m.video}" 
                 playsinline 
                 preload="none">
          </video>
        </div>
        <img class="tv-frame" src="${MODELS_BASE}tv.PNG" alt="${m.title}" />
        <button class="tv-play-btn" aria-label="Play ${m.title}">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="47"></circle>
            <polygon points="41,31 41,69 72,50"></polygon>
          </svg>
        </button>
        <div class="tv-title-label">${m.title}</div>
      </div>
    `;

    const video   = stage.querySelector('video');
    const playBtn = stage.querySelector('.tv-play-btn');

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (i !== tvActive) { tvGoTo(i); return; }
      video.play();
    });
    video.addEventListener('play',  () => { stage.classList.add('is-playing'); video.controls = true; });
    video.addEventListener('ended', () => {
      stage.classList.remove('is-playing'); video.controls = false; video.currentTime = 0;
    });
    stage.addEventListener('click', () => { if (i !== tvActive) tvGoTo(i); });

    tvTrack.appendChild(stage);
    return { stage, video };
  });
  tvGoTo(tvActive, false);
}

function tvGoTo(i, animate = true) {
  i = Math.max(0, Math.min(MODEL_VIDEOS.length - 1, i));
  // pause the TV we're leaving
  if (tvSlides[tvActive]) {
    tvSlides[tvActive].video.pause();
    tvSlides[tvActive].stage.classList.remove('is-playing');
    tvSlides[tvActive].video.controls = false;
  }
  tvActive = i;

  if (!animate) tvTrack.style.transition = 'none';
  const slide  = tvSlides[i].stage;
  const offset = tvCarousel.offsetWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
  tvTrack.style.transform = 'translateX(' + offset + 'px)';
  if (!animate) { void tvTrack.offsetWidth; tvTrack.style.transition = ''; }

  tvSlides.forEach((s, idx) => s.stage.classList.toggle('is-active', idx === i));
  if (tvArrowL) tvArrowL.disabled = (i === 0);
  if (tvArrowR) tvArrowR.disabled = (i === MODEL_VIDEOS.length - 1);
}

if (tvArrowL) tvArrowL.addEventListener('click', () => tvGoTo(tvActive - 1));
if (tvArrowR) tvArrowR.addEventListener('click', () => tvGoTo(tvActive + 1));
window.addEventListener('resize', () => { if (tvSlides.length) tvGoTo(tvActive, false); });

// recentre after the page opens (layout is final once visible)
if (typeof shelfItem !== 'undefined' && shelfItem) {
  shelfItem.addEventListener('click', () => setTimeout(() => tvGoTo(tvActive, false), 60));
}
// pause everything when the page closes
if (typeof modelsClose !== 'undefined' && modelsClose) {
  modelsClose.addEventListener('click', () => {
    tvSlides.forEach(s => { s.video.pause(); s.stage.classList.remove('is-playing'); s.video.controls = false; });
  });
}

buildTVSlides();

/* ═══════════════════════════════════════════════════════════
   3D MODELS — PHONE VIEWER (768px and narrower; CSS hides the TVs)
   ═══════════════════════════════════════════════════════════ */
const mvViewer = document.getElementById('mvViewer');
const mvThumb  = document.getElementById('mvThumb');
const mvVideo  = document.getElementById('mvVideo');
const mvTitle  = document.getElementById('mvTitle');
const mvCount  = document.getElementById('mvCount');

let mvIndex = 0;
let mvBusy  = false;

function mvStop() {
  if (!mvVideo) return;
  mvVideo.pause();
  mvVideo.controls = false;
}

function mvShow(i) {
  const m = MODEL_VIDEOS[i];
  mvIndex = i;
  mvStop();
  // poster when there is one, otherwise the browser shows the first frame
  mvVideo.poster  = m.poster ? MODELS_BASE + m.poster : '';
  mvVideo.preload = m.poster ? 'none' : 'metadata';
  mvVideo.src     = MODELS_BASE + m.video + (m.poster ? '' : '#t=0.1');
  mvTitle.textContent = m.title;
  mvCount.textContent = (i + 1) + ' / ' + MODEL_VIDEOS.length;
  mvThumb.setAttribute('aria-label', 'Play ' + m.title);
}

// slide out (0.15s), swap, slide in from the other side (0.15s); loops at both ends
function mvStep(dir) {
  if (mvBusy) return;
  mvBusy = true;
  const n     = MODEL_VIDEOS.length;
  const out   = dir > 0 ? 'is-leaving-left'   : 'is-leaving-right';
  const enter = dir > 0 ? 'is-entering-right' : 'is-entering-left';
  mvViewer.classList.add('is-switching');
  mvThumb.classList.add(out);
  setTimeout(() => {
    mvShow((mvIndex + dir + n) % n);
    mvThumb.classList.remove(out);
    mvThumb.classList.add(enter);
    void mvThumb.offsetWidth;
    mvThumb.classList.remove(enter);
    mvViewer.classList.remove('is-switching');
    mvBusy = false;
  }, 150);
}

// fullscreen with the phone's own controls (iPhone only has webkitEnterFullscreen)
function mvPlay() {
  const v = mvVideo;
  v.controls = true;
  if (v.requestFullscreen) {
    v.requestFullscreen().catch(() => { if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
    v.play().catch(() => {});
  } else if (v.webkitEnterFullscreen) {
    v.play().catch(() => {});
    v.webkitEnterFullscreen();
  } else {
    v.play().catch(() => {});
  }
}

if (mvViewer) {
  document.getElementById('mvPrev').addEventListener('click', () => mvStep(-1));
  document.getElementById('mvNext').addEventListener('click', () => mvStep(1));

  // swipe left/right on the thumbnail; a plain tap plays
  let touchX = null, touchY = 0, swiped = false;
  mvThumb.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; swiped = false;
  }, { passive: true });
  mvThumb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;                            // swallow the click that may follow the swipe
      setTimeout(() => { swiped = false; }, 400);
      mvStep(dx < 0 ? 1 : -1);
    }
  });
  mvThumb.addEventListener('click', () => { if (swiped) { swiped = false; return; } mvPlay(); });
  mvThumb.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mvPlay(); }
  });

  // leaving fullscreen returns to the thumbnail, paused, on the same video
  const mvFsChange = () => {
    if ((document.fullscreenElement || document.webkitFullscreenElement) !== mvVideo) mvStop();
  };
  document.addEventListener('fullscreenchange', mvFsChange);
  document.addEventListener('webkitfullscreenchange', mvFsChange);
  mvVideo.addEventListener('webkitendfullscreen', mvStop);

  mvShow(0);
}
