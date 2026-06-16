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

document.addEventListener('mousemove', (e) => {
  moveEyeball(eyeLeft,  SOCKET.left,  e.clientX, e.clientY);
  moveEyeball(eyeRight, SOCKET.right, e.clientX, e.clientY);
});

function moveEyeball(eyeEl, socket, mouseX, mouseY) {
  if (!eyeEl || !frame) return;
  const rect    = frame.getBoundingClientRect();
  const socketX = rect.left + socket.x * rect.width;
  const socketY = rect.top  + socket.y * rect.height;
  const angle   = Math.atan2(mouseY - socketY, mouseX - socketX);
  const rawDist = Math.hypot(mouseX - socketX, mouseY - socketY);
  const dist    = MAX_SHIFT * Math.min(1, rawDist / 300);
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
let lightsOn = true;
const switchImg    = document.getElementById('switchImg');
const darkOverlay  = document.getElementById('darkOverlay');
const portraitItem = document.getElementById('portraitItem');
const switchItem   = document.getElementById('switchItem');

switchItem.addEventListener('click', toggleLight);

function toggleLight() {
  lightsOn = !lightsOn;
  if (lightsOn) {
    switchImg.src = 'images/light-on.PNG';
    document.body.classList.remove('lights-off');
    darkOverlay.classList.remove('on');
    portraitItem.classList.remove('lights-off');
  } else {
    switchImg.src = 'images/light-off.PNG';
    document.body.classList.add('lights-off');
    darkOverlay.classList.add('on');
    portraitItem.classList.add('lights-off');
  }
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
}

// ── GAMES PAGE ────────────────────────────────────────────
const gametableItem = document.getElementById('gametableItem');
const gamesPage     = document.getElementById('gamesPage');
const gamesClose    = document.getElementById('gamesClose');

gametableItem.addEventListener('click', openGames);
gamesClose.addEventListener('click', closeGames);

function openGames() {
  gamesPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGames() {
  gamesPage.classList.remove('open');
  document.body.style.overflow = '';
}

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

artItem.addEventListener('click', openArt);
artClose.addEventListener('click', closeArt);

function openArt() {
  artPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeArt() {
  closePieceViewer();
  closeSeriesOverlay();
  artPage.classList.remove('open');
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

// ── LIGHTING PAGE ─────────────────────────────────────────
const lightingItem  = document.getElementById('lightingItem');
const lightingPage  = document.getElementById('lightingPage');
const lightingClose = document.getElementById('lightingClose');
const lightingImg   = document.getElementById('lightingImg');
const lightBurst    = document.getElementById('lightBurst');

lightingItem.addEventListener('mouseenter', () => {
  lightingImg.src = 'images/lighting-color.png';
  lightBurst.classList.add('active');
});
lightingItem.addEventListener('mouseleave', () => {
  lightingImg.src = 'images/lighting.png';
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
}

function closeWindow() {
  windowPage.classList.remove('open');
  document.body.style.overflow = '';
}

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


/* ═══════════════════════════════════════════════════════════
   3D MODELS — TV CAROUSEL
   ═══════════════════════════════════════════════════════════ */
const MODELS_BASE = 'images/3Dmodels/';
const MODEL_VIDEOS = [
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
let tvActive  = Math.floor((MODEL_VIDEOS.length - 1) / 2);   // centre item

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
                 preload="auto">
          </video>
        </div>
        <img class="tv-frame" src="${MODELS_BASE}tv.png" alt="${m.title}" />
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
