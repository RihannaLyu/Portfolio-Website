/* ═══════════════════════════════════════════════════════════
   EXPERIENCE — the layer of motion + navigation over the room (script.js stays the room itself).
     1. ARRIVAL      the name writes on, the room's light warms up, the curtain lifts (once a visit)
     2. INDEX        a full-screen, numbered table of contents with live previews of each object
     3. OPENING      every page grows out of the object you clicked, and closes back into it
     4. DEPTH        on desktop the objects drift with the cursor, each at its own depth
     5. ENTRANCES    artworks + cards rise in, one after another, when a page opens
   Everything respects prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════ */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone   = () => matchMedia('(max-width: 768px)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  /* ── 0. PAGE LINKS: #about, #digital-art, … open that page straight away (shareable) ── */
  const LINKS = { 'about': 'nameplateItem', 'digital-art': 'windowItem', 'traditional-art': 'artItem', '3d-models': 'shelfItem',
                  'games': 'gametableItem', 'software': 'softwareItem', 'floral': 'flowersItem', 'notes': 'noteboardItem' };
  const linked = LINKS[location.hash.slice(1)] || (location.hash === '#index' ? 'indexBtn' : null);
  // a linked page has no object to grow out of, so it simply appears
  if (linked) {
    document.body.classList.add('is-deeplink');
    addEventListener('load', () => setTimeout(() => {
      const el = document.getElementById(linked); if (el) el.click();
      setTimeout(() => document.body.classList.remove('is-deeplink'), 1200);
    }, 150), { once: true });
  }

  /* ── 1. ARRIVAL ─────────────────────────────────────────── */
  const intro = $('#intro');
  if (intro) {
    if (store.get('introSeen') || reduced || linked) {
      intro.remove();
    } else {
      document.body.classList.add('is-arriving');
      requestAnimationFrame(() => intro.classList.add('is-playing'));
      const lift = () => {
        intro.classList.add('is-leaving');
        document.body.classList.remove('is-arriving');
        store.set('introSeen', '1');
        setTimeout(() => intro.remove(), 1100);
      };
      // at least long enough to read the name; never longer than the page needs to load
      const minTime = new Promise(r => setTimeout(r, 2100));
      const loaded  = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
      Promise.all([minTime, Promise.race([loaded, new Promise(r => setTimeout(r, 4500))])]).then(lift);
      intro.addEventListener('click', lift, { once: true });
    }
  }

  /* ── 3. OPENING: pages grow out of the object you clicked ──── */
  const PAGES = ['modelsPage', 'gamesPage', 'lightingPage', 'flowersPage', 'windowPage', 'notesPage', 'softwarePage', 'artPage']
    .map(id => document.getElementById(id)).filter(Boolean);
  function setOrigin(x, y) {
    PAGES.forEach(p => {
      const r = p.getBoundingClientRect();
      const k = r.width / (p.offsetWidth || r.width || 1);          // the desktop stage is scaled
      p.style.setProperty('--ox', ((x - r.left) / k) + 'px');
      p.style.setProperty('--oy', ((y - r.top) / k) + 'px');
    });
  }
  function originFrom(el) {
    const r = el && el.getBoundingClientRect();
    if (!r || !r.width) { setOrigin(innerWidth / 2, innerHeight / 2); return; }
    setOrigin(r.left + r.width / 2, r.top + r.height / 2);
  }
  // capture phase: the origin is set before script.js opens the page
  document.addEventListener('click', (e) => {
    const item = e.target.closest && e.target.closest('.wall > [id]');
    if (!item) return;
    // a real pointer click opens from the pointer; keyboard / Index clicks (no coordinates) from the object
    if (e.detail === 0 || (!e.clientX && !e.clientY)) originFrom(item);
    else setOrigin(e.clientX, e.clientY);
  }, true);

  /* page-open state: hides the Index button under any open page, and drives the entrances */
  const WATCH = PAGES.concat([$('#notebookWrap'), $('#gameLaunch'), $('#viewerOverlay'), $('#seriesOverlay'), $('#pieceViewer'), $('#lightbox')].filter(Boolean));
  const ENTER = '.digital-art-card, .floral-item, .software-card, .software-soon, .individual-art-card, .series-stack, .board-note, .note-composer, .notes-hint, .city-island, .mb-sheet';
  function syncOpen() {
    const anyOpen = WATCH.some(el => el.classList.contains('open')) || document.body.classList.contains('art-tabs-open');
    document.body.classList.toggle('page-open', anyOpen);
  }
  const mo = new MutationObserver(muts => {
    syncOpen();
    muts.forEach(m => {
      const el = m.target;
      if (!PAGES.includes(el) || !el.classList.contains('open') || el.dataset.entered === '1') return;
      // first open of a page: number its pieces so CSS can stagger them in
      el.dataset.entered = '1';
      $$(ENTER, el).forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14)));
    });
  });
  WATCH.forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['class'] }));
  new MutationObserver(syncOpen).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // notes on the board arrive later (fetched): number them as they land
  const board = $('#notesBoard');
  if (board) new MutationObserver(() => $$('.board-note', board).forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14))))
    .observe(board, { childList: true });

  /* ── 2. INDEX ───────────────────────────────────────────── */
  const btn = $('#indexBtn'), menu = $('#indexMenu'), closeBtn = $('#indexClose'), preview = $('#indexPreview');
  let lastFocus = null;
  function openIndex() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('open'));
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('index-open');
    setTimeout(() => $('.index-list button', menu).focus({ preventScroll: true }), 60);
  }
  function closeIndex(thenFocus = true) {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('index-open');
    setTimeout(() => { menu.hidden = true; }, reduced ? 0 : 650);
    if (thenFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }
  if (btn && menu) {
    btn.addEventListener('click', openIndex);
    closeBtn.addEventListener('click', () => closeIndex());
    document.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeIndex(); }
      if (e.key === 'Tab') {                                   // keep focus inside the dialog
        const f = $$('button, a', menu); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
    $$('.index-list button', menu).forEach(b => {
      b.style.setProperty('--thumb', `url("${b.dataset.preview}")`);   // the phone shows each object as a thumbnail
      const show = () => {
        if (!preview || preview.getAttribute('src') === b.dataset.preview) return;
        preview.classList.add('is-swapping');
        setTimeout(() => { preview.src = b.dataset.preview; preview.classList.remove('is-swapping'); }, reduced ? 0 : 160);
      };
      b.addEventListener('mouseenter', show);
      b.addEventListener('focus', show);
      b.addEventListener('click', () => {
        const id = (phone() && b.dataset.mobileTarget) || b.dataset.target;
        const target = document.getElementById(id);
        closeIndex(false);
        if (!target) return;
        if (phone()) target.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        setTimeout(() => { originFrom(target); target.click(); }, reduced ? 0 : (phone() ? 650 : 420));
      });
    });
  }

  /* ── 4. DEPTH: the room drifts with the cursor (desktop, fine pointers only) ── */
  const wall = $('#wall');
  if (wall && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      wall.style.setProperty('--mx', x.toFixed(4));
      wall.style.setProperty('--my', y.toFixed(4));
      raf = (Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('mousemove', (e) => {
      if (phone() || document.body.classList.contains('page-open')) return;
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }
})();
