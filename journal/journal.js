/* ==========================================================================
   JOURNAL SCRIPT - CHRONICLES SPREAD
   Multi-spread notebook: pages fill up and auto-overflow to new spreads.
   Navigate between spreads with footer prev/next and dot indicators.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const leftTA     = document.getElementById('scrapbook-textarea');
    const rightTA    = document.getElementById('scrapbook-textarea-right');
    const wordCount  = document.getElementById('word-count');
    const autoSave   = document.getElementById('autosave-status');
    const prevBtn    = document.getElementById('prev-page-btn');
    const nextBtn    = document.getElementById('next-page-btn');
    const dotsEl     = document.getElementById('page-nav-dots');
    const labelEl    = document.getElementById('page-nav-label');

    if (!leftTA || !rightTA) return;

    // ── State ──────────────────────────────────────────────────────────────
    let spreads    = JSON.parse(localStorage.getItem('scriptorium_spreads')) || [{ left: '', right: '' }];
    let currentIdx = parseInt(localStorage.getItem('scriptorium_spread_idx') || '0');
    if (currentIdx >= spreads.length) currentIdx = spreads.length - 1;

    // ── Init ───────────────────────────────────────────────────────────────
    renderSpread();

    // ── Render current spread into the DOM ──────────────────────────────────
    function renderSpread(focusTarget) {
        const s = spreads[currentIdx];
        leftTA.value  = s.left  || '';
        rightTA.value = s.right || '';
        updateNav();
        updateWordCount();
        if (focusTarget === 'right') {
            rightTA.focus();
            rightTA.setSelectionRange(rightTA.value.length, rightTA.value.length);
        } else {
            leftTA.focus();
            leftTA.setSelectionRange(leftTA.value.length, leftTA.value.length);
        }
    }

    // ── Navigation UI ──────────────────────────────────────────────────────
    function updateNav() {
        if (prevBtn)  prevBtn.disabled = currentIdx === 0;
        if (nextBtn) {
            const onLast = currentIdx === spreads.length - 1;
            nextBtn.textContent = onLast ? 'New Page →' : 'Next →';
            nextBtn.disabled    = false;
        }
        if (labelEl) labelEl.textContent = `Spread ${currentIdx + 1} of ${spreads.length}`;
        if (dotsEl)  renderDots();
    }

    function renderDots() {
        dotsEl.innerHTML = spreads.map((_, i) =>
            `<span class="page-nav-dot ${i === currentIdx ? 'active' : ''}" data-idx="${i}" title="Spread ${i + 1}"></span>`
        ).join('');
        dotsEl.querySelectorAll('.page-nav-dot').forEach(dot => {
            dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx)));
        });
    }

    // ── Navigate to a specific spread ──────────────────────────────────────
    function goTo(idx, focusTarget) {
        const dir = idx >= currentIdx ? 'forward' : 'backward';
        animatePageTurn(dir, () => {
            flushCurrent();
            persist();
            currentIdx = idx;
            localStorage.setItem('scriptorium_spread_idx', currentIdx);
            renderSpread(focusTarget);
        });
    }

    // ── 3D page fold animation ──────────────────────────────────────────────
    function animatePageTurn(direction, callback) {
        const DURATION = 650;
        const spread = document.getElementById('spread-chronicles');
        if (!spread) { callback(); return; }

        // Build flap (the folding page face)
        const flap  = document.createElement('div');
        flap.className = `page-fold-flap fold-${direction}`;

        const front = document.createElement('div');
        front.className = 'page-fold-face-front';

        const back  = document.createElement('div');
        back.className = 'page-fold-face-back';

        flap.appendChild(front);
        flap.appendChild(back);

        // Crease: shadow near fold axis simulating paper bend
        const crease = document.createElement('div');
        crease.className = `page-fold-crease fold-${direction}`;
        flap.appendChild(crease);

        // Highlight: light catching the paper edge as it lifts
        const highlight = document.createElement('div');
        highlight.className = `page-fold-highlight fold-${direction}`;
        flap.appendChild(highlight);

        // Build shadow
        const shadow = document.createElement('div');
        shadow.className = `page-fold-shadow fold-${direction}`;

        // Swap cover: hides the non-folding page's instant content change
        const swapCover = document.createElement('div');
        swapCover.className = `page-swap-cover fold-${direction}`;

        spread.style.position = 'relative';
        spread.appendChild(swapCover);
        spread.appendChild(shadow);
        spread.appendChild(flap);

        // Trigger animation on next paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flap.classList.add('go');
                shadow.classList.add('go');
                swapCover.classList.add('go');
            });
        });

        // Swap content at the exact midpoint (page is edge-on = invisible)
        setTimeout(callback, DURATION * 0.5);

        // Cleanup after animation completes
        setTimeout(() => {
            flap.remove();
            shadow.remove();
            swapCover.remove();
        }, DURATION + 80);
    }

    // ── Write current textarea values back into the state array ────────────
    function flushCurrent() {
        spreads[currentIdx] = { left: leftTA.value, right: rightTA.value };
    }

    // ── Persistence ────────────────────────────────────────────────────────
    let saveTimer;
    function persist() {
        flushCurrent();
        clearTimeout(saveTimer);
        flash('Ink drying...');
        saveTimer = setTimeout(() => {
            localStorage.setItem('scriptorium_spreads',    JSON.stringify(spreads));
            localStorage.setItem('scriptorium_spread_idx', currentIdx);
            flash('Draft saved ✓');
        }, 1200);
    }

    function flash(msg) {
        if (!autoSave) return;
        autoSave.textContent = msg;
        autoSave.classList.add('visible');
        setTimeout(() => autoSave.classList.remove('visible'), 2200);
    }

    // ── Word count (all spreads combined) ──────────────────────────────────
    function updateWordCount() {
        if (!wordCount) return;
        flushCurrent();
        const allText = spreads.map(s => (s.left || '') + ' ' + (s.right || '')).join(' ');
        const words   = allText.trim().split(/\s+/).filter(Boolean).length;
        wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }

    // ── Overflow: push excess from left → right page ────────────────────────
    function handleLeftOverflow() {
        if (leftTA.scrollHeight <= leftTA.clientHeight) return;

        const full = leftTA.value;

        // Binary-search for last character that fits
        let lo = 0, hi = full.length;
        while (lo < hi) {
            const mid = Math.floor((lo + hi + 1) / 2);
            leftTA.value = full.slice(0, mid);
            if (leftTA.scrollHeight <= leftTA.clientHeight) lo = mid;
            else hi = mid - 1;
        }

        // Snap back to word/line boundary
        let cut = lo;
        while (cut > 0 && full[cut] !== ' ' && full[cut] !== '\n') cut--;
        if (cut === 0) cut = lo;

        const leftContent  = full.slice(0, cut);
        const overflowText = full.slice(cut).replace(/^[ \n]/, '');

        leftTA.value  = leftContent;
        rightTA.value = overflowText + (rightTA.value ? '\n' + rightTA.value : '');

        rightTA.focus();
        rightTA.setSelectionRange(overflowText.length, overflowText.length);
    }

    // ── Overflow: push excess from right page → new spread ─────────────────
    function handleRightOverflow() {
        if (rightTA.scrollHeight <= rightTA.clientHeight) return;

        const full = rightTA.value;

        // Binary-search
        let lo = 0, hi = full.length;
        while (lo < hi) {
            const mid = Math.floor((lo + hi + 1) / 2);
            rightTA.value = full.slice(0, mid);
            if (rightTA.scrollHeight <= rightTA.clientHeight) lo = mid;
            else hi = mid - 1;
        }

        let cut = lo;
        while (cut > 0 && full[cut] !== ' ' && full[cut] !== '\n') cut--;
        if (cut === 0) cut = lo;

        const rightContent = full.slice(0, cut);
        const overflowText = full.slice(cut).replace(/^[ \n]/, '');

        rightTA.value = rightContent;
        flushCurrent();

        // Create new spread (or go to existing next spread)
        if (currentIdx === spreads.length - 1) {
            spreads.push({ left: overflowText, right: '' });
        } else {
            // Prepend overflow to start of next spread's left page
            spreads[currentIdx + 1].left = overflowText +
                (spreads[currentIdx + 1].left ? '\n' + spreads[currentIdx + 1].left : '');
        }

        persist();
        goTo(currentIdx + 1, 'left');
    }

    // ── Navigation button handlers ─────────────────────────────────────────
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIdx > 0) goTo(currentIdx - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIdx < spreads.length - 1) {
                goTo(currentIdx + 1);
            } else {
                // Manually add a blank new spread
                flushCurrent();
                spreads.push({ left: '', right: '' });
                persist();
                goTo(spreads.length - 1, 'left');
            }
        });
    }

    // ── Keyboard: backspace at start of right → return to left ─────────────
    rightTA.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && rightTA.selectionStart === 0 && rightTA.selectionEnd === 0) {
            e.preventDefault();
            leftTA.focus();
            leftTA.setSelectionRange(leftTA.value.length, leftTA.value.length);
        }
    });

    // ── Keyboard: backspace at start of left on non-first spread → prev ────
    leftTA.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && leftTA.selectionStart === 0 && leftTA.selectionEnd === 0 && currentIdx > 0) {
            e.preventDefault();
            goTo(currentIdx - 1, 'right');
        }
    });

    // ── Input events ────────────────────────────────────────────────────────
    leftTA.addEventListener('input', () => {
        handleLeftOverflow();
        updateWordCount();
        persist();
    });

    rightTA.addEventListener('input', () => {
        handleRightOverflow();
        updateWordCount();
        persist();
    });
});
