/* ==========================================================================
   JOURNAL SCRIPT - CHRONICLES SPREAD
   Multi-spread notebook: pages fill up and auto-overflow to new spreads.
   Navigate between spreads with footer prev/next and dot indicators.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const leftTA = document.getElementById('scrapbook-textarea');
    const rightTA = document.getElementById('scrapbook-textarea-right');
    const wordCount = document.getElementById('word-count');
    const autoSave = document.getElementById('autosave-status');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const tearBtn = document.getElementById('tear-page-btn');
    const dropdownTrigger = document.getElementById('spread-dropdown-trigger');
    const dropdownMenu = document.getElementById('nested-spread-menu');
    const fontSelect = document.getElementById('font-select');

    if (!leftTA || !rightTA) return;

    // Toggle custom nested spread dropdown menu
    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('open');
        });

        dropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ── State ──────────────────────────────────────────────────────────────
    let spreads = [{ left: '', right: '' }];
    let currentIdx = 0;

    // ── Font initialization ────────────────────────────────────────────────
    function applyFont(fontName) {
        if (fontName === 'Default Serif') {
            leftTA.style.fontFamily = `'EB Garamond', serif`;
            rightTA.style.fontFamily = `'EB Garamond', serif`;
        } else if (fontName === 'Default Sans') {
            leftTA.style.fontFamily = `system-ui, -apple-system, sans-serif`;
            rightTA.style.fontFamily = `system-ui, -apple-system, sans-serif`;
        } else {
            leftTA.style.fontFamily = `"${fontName}", cursive, sans-serif`;
            rightTA.style.fontFamily = `"${fontName}", cursive, sans-serif`;
        }
    }

    const savedFont = localStorage.getItem('scriptorium_journal_font') || 'Default Serif';
    if (fontSelect) fontSelect.value = savedFont;
    applyFont(savedFont);

    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            const font = e.target.value;
            applyFont(font);
            localStorage.setItem('scriptorium_journal_font', font);
        });
    }

    // ── Font Size adjustment ────────────────────────────────────────────────
    const fsDecBtn = document.getElementById('fs-dec');
    const fsIncBtn = document.getElementById('fs-inc');

    let currentFS = parseFloat(localStorage.getItem('scriptorium_journal_font_size') || '1.1');

    function applyFontSize(sizeRem) {
        const lineHeightPx = Math.round(sizeRem * 27.27);
        document.documentElement.style.setProperty('--journal-font-size', `${sizeRem}rem`);
        document.documentElement.style.setProperty('--journal-line-height', `${lineHeightPx}px`);

        if (fsDecBtn) fsDecBtn.disabled = sizeRem <= 0.8;
        if (fsIncBtn) fsIncBtn.disabled = sizeRem >= 1.8;
    }

    applyFontSize(currentFS);

    if (fsDecBtn) {
        fsDecBtn.addEventListener('click', () => {
            if (currentFS > 0.8) {
                currentFS = Math.round((currentFS - 0.1) * 10) / 10;
                applyFontSize(currentFS);
                localStorage.setItem('scriptorium_journal_font_size', currentFS);
            }
        });
    }

    if (fsIncBtn) {
        fsIncBtn.addEventListener('click', () => {
            if (currentFS < 1.8) {
                currentFS = Math.round((currentFS + 0.1) * 10) / 10;
                applyFontSize(currentFS);
                localStorage.setItem('scriptorium_journal_font_size', currentFS);
            }
        });
    }

    // ── Theme/Casing Style Selection ──
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        const savedLayout = localStorage.getItem('scriptorium_layout') || 'folio';
        themeSelect.value = savedLayout;

        themeSelect.addEventListener('change', (e) => {
            const layout = e.target.value;
            const body = document.body;
            body.className = body.className.replace(/layout-[\w-]+/, `layout-${layout}`);
            if (!body.className.includes('layout-')) {
                body.classList.add(`layout-${layout}`);
            }
            localStorage.setItem('scriptorium_layout', layout);
        });
    }

    // ── Toggle Page Lines ──
    const toggleLinesBtn = document.getElementById('toggle-lines-btn');
    if (toggleLinesBtn) {
        const linesHidden = localStorage.getItem('scriptorium_hide_lines') === 'true';
        if (linesHidden) {
            document.body.classList.add('hide-page-lines');
            toggleLinesBtn.classList.add('active');
        }

        toggleLinesBtn.addEventListener('click', () => {
            const isHidden = document.body.classList.toggle('hide-page-lines');
            localStorage.setItem('scriptorium_hide_lines', isHidden);
            toggleLinesBtn.classList.toggle('active', isHidden);
        });
    }

    // ── Ambient Soundscape Selection ──
    const soundSelect = document.getElementById('sound-select');
    if (soundSelect) {
        soundSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            if (typeof window.stopAllSounds === 'function') {
                window.stopAllSounds();
            }
            if (type !== 'none' && typeof window.startSound === 'function') {
                window.startSound(type);
            }
        });
    }

    // ── Unique Spread ID Naming Engine ──────────────────────────────────────
    function generateSpreadId() {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date();
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const prefix = `${day}_${month}_${year}`; // e.g. 30_May_2026

        // Find the maximum counter for today's prefix in the current spreads array
        let maxCounter = 0;
        spreads.forEach(s => {
            if (s.id && s.id.startsWith(prefix + '-')) {
                const parts = s.id.split('-');
                const counter = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(counter) && counter > maxCounter) {
                    maxCounter = counter;
                }
            }
        });

        return `${prefix}-${maxCounter + 1}`;
    }

    // ── Markdown Conversion Helpers ─────────────────────────────────────────
    function htmlToMarkdown(html) {
        if (!html) return '';
        let md = html;
        md = md.replace(/\r/g, '');

        // Safely parse image tags and preserve custom widths/styles as HTML img tags,
        // while converting default 25% (or un-styled) images to classic markdown syntax.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = md;
        const imgs = tempDiv.querySelectorAll('img');
        imgs.forEach(img => {
            const width = img.getAttribute('width') || img.style.width;
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            if (!width || width === '25%' || width === '25') {
                img.outerHTML = `![${alt}](${src})`;
            } else {
                img.outerHTML = `<img src="${src}" alt="${alt}" width="${width}">`;
            }
        });
        md = tempDiv.innerHTML;

        // Replace bold tags
        md = md.replace(/<(b|strong)>(.*?)<\/\1>/gi, '**$2**');
        // Replace italic tags
        md = md.replace(/<(i|em)>(.*?)<\/\1>/gi, '*$2*');
        // Replace strikethrough tags
        md = md.replace(/<(s|strike)>(.*?)<\/\1>/gi, '~~$2~~');
        // Convert block elements divs/paragraphs to newlines
        md = md.replace(/<div>(.*?)<\/div>/gi, '\n$1');
        md = md.replace(/<p>(.*?)<\/p>/gi, '\n$1');
        // Replace single <br> with newline
        md = md.replace(/<br\s*\/?>/gi, '\n');
        // Decode HTML entities
        const temp = document.createElement('textarea');
        temp.innerHTML = md;
        return temp.value.trim();
    }

    function markdownToHtml(md) {
        if (!md) return '';
        let html = md;
        // Escape HTML characters
        html = html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Restore underlines
        html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>');

        // Restore HTML img tags (e.g. resized ones)
        html = html.replace(/&lt;img\s+(.*?)&gt;/gi, '<img $1>');

        // Image parser (default to 25% width)
        html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" width="25%">');

        // Bold parser
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic parser
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Strikethrough parser
        html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

        // Parse newlines
        const lines = html.split('\n');
        return lines.map((line, idx) => {
            if (idx === 0) return line || '<br>';
            return `<div>${line || '<br>'}</div>`;
        }).join('');
    }

    function loadLocalJournal() {
        fetch('/api/journal')
            .then(res => res.json())
            .then(data => {
                if (data.spreads && data.spreads.length > 0) {
                    spreads = data.spreads.map(spread => ({
                        id: spread.id || generateSpreadId(),
                        left: markdownToHtml(spread.left),
                        right: markdownToHtml(spread.right)
                    }));
                } else {
                    const local = localStorage.getItem('scriptorium_spreads');
                    if (local) {
                        spreads = JSON.parse(local);
                    } else {
                        spreads = [{ id: generateSpreadId(), left: '', right: '' }];
                    }
                }

                // Ensure every single loaded spread is assigned an ID
                spreads.forEach(s => {
                    if (!s.id) s.id = generateSpreadId();
                });

                const savedIdx = parseInt(localStorage.getItem('scriptorium_spread_idx') || '0');
                currentIdx = savedIdx < spreads.length ? savedIdx : spreads.length - 1;
                renderSpread();
                updateWordCount();
            })
            .catch(err => {
                console.error("Local server api unavailable, using localStorage fallback:", err);
                const local = localStorage.getItem('scriptorium_spreads');
                if (local) {
                    spreads = JSON.parse(local);
                } else {
                    spreads = [{ id: generateSpreadId(), left: '', right: '' }];
                }

                // Ensure every single loaded spread is assigned an ID
                spreads.forEach(s => {
                    if (!s.id) s.id = generateSpreadId();
                });

                const savedIdx = parseInt(localStorage.getItem('scriptorium_spread_idx') || '0');
                currentIdx = savedIdx < spreads.length ? savedIdx : spreads.length - 1;
                renderSpread();
                updateWordCount();
            });
    }

    // ── Init ───────────────────────────────────────────────────────────────
    loadLocalJournal();

    // ── Helper: Set Caret to End of Contenteditable ────────────────────────
    function setCaretToEnd(el) {
        el.focus();
        if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // ── Update Page Header Dates dynamically based on file names ───────────
    function updateHeaderDates() {
        const currentSpread = spreads[currentIdx];
        if (!currentSpread) return;
        if (!currentSpread.id) {
            currentSpread.id = generateSpreadId();
        }

        // Parse e.g. "30_May_2026-1"
        const match = currentSpread.id.match(/^(\d+)_([a-zA-Z]+)_(\d+)-(\d+)$/);
        if (match) {
            const day = match[1];
            const month = match[2];
            const year = match[3];

            // Update Left Page Date Badge
            const leftDayEl = document.getElementById('left-day-num');
            const leftMonthEl = document.getElementById('left-month-name');
            const leftYearEl = document.getElementById('left-year-num');

            if (leftDayEl) leftDayEl.textContent = day;
            if (leftMonthEl) leftMonthEl.textContent = month;
            if (leftYearEl) leftYearEl.textContent = year;

            // Update Right Page Date Badge
            const rightDayEl = document.getElementById('right-day-num');
            const rightMonthEl = document.getElementById('right-month-name');
            const rightYearEl = document.getElementById('right-year-num');

            if (rightDayEl) rightDayEl.textContent = day;
            if (rightMonthEl) rightMonthEl.textContent = month;
            if (rightYearEl) rightYearEl.textContent = year;
        }
    }

    // ── Render current spread into the DOM ──────────────────────────────────
    function renderSpread(focusTarget) {
        const s = spreads[currentIdx];
        leftTA.innerHTML = s.left || '';
        rightTA.innerHTML = s.right || '';
        updateHeaderDates();
        updateNav();
        updateWordCount();
        if (focusTarget === 'right') {
            setCaretToEnd(rightTA);
        } else {
            setCaretToEnd(leftTA);
        }
    }

    // ── Update Dropdown Trigger Label ──────────────────────────────────────
    function updateDropdownTriggerLabel() {
        if (!dropdownTrigger) return;
        const currentSpread = spreads[currentIdx];
        if (currentSpread && currentSpread.id) {
            const match = currentSpread.id.match(/^(\d+)_([a-zA-Z]+)_(\d+)-(\d+)$/);
            if (match) {
                const day = match[1];
                const month = match[2];
                const counter = match[4];
                dropdownTrigger.innerHTML = `${day} ${month} (Sp. ${counter}) ▾`;
                return;
            }
        }
        dropdownTrigger.innerHTML = `Spread ${currentIdx + 1} ▾`;
    }

    // ── Group and Render Nested Spread Menu (Accordion-style Tree) ─────────
    function renderNestedSpreadMenu() {
        if (!dropdownMenu) return;
        dropdownMenu.innerHTML = '';

        // Group spreads by Year -> Month -> Day
        const tree = {};

        spreads.forEach((spread, index) => {
            if (!spread.id) return;
            const match = spread.id.match(/^(\d+)_([a-zA-Z]+)_(\d+)-(\d+)$/);
            let day = "Unknown";
            let month = "Unknown";
            let year = "Unknown";
            let counter = (index + 1).toString();

            if (match) {
                day = match[1];
                month = match[2];
                year = match[3];
                counter = match[4];
            }

            if (!tree[year]) tree[year] = {};
            if (!tree[year][month]) tree[year][month] = {};
            if (!tree[year][month][day]) tree[year][month][day] = [];

            tree[year][month][day].push({
                index,
                counter,
                label: `${day} ${month} (Spread ${counter})`
            });
        });

        // Loop over the grouped tree and build the DOM
        for (const year in tree) {
            const yearItem = document.createElement('div');
            yearItem.className = 'menu-year-item';

            const yearHeader = document.createElement('div');
            yearHeader.className = 'menu-year-header';
            yearHeader.innerHTML = `<span>${year}</span> <span class="arrow">▾</span>`;
            yearItem.appendChild(yearHeader);

            const monthsList = document.createElement('div');
            monthsList.className = 'menu-months-list expanded'; // default expanded
            yearItem.appendChild(monthsList);

            yearHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                monthsList.classList.toggle('expanded');
                yearHeader.querySelector('.arrow').textContent = monthsList.classList.contains('expanded') ? '▾' : '▸';
            });

            for (const month in tree[year]) {
                const monthItem = document.createElement('div');
                monthItem.className = 'menu-month-item';

                const monthHeader = document.createElement('div');
                monthHeader.className = 'menu-month-header';
                monthHeader.innerHTML = `<span>${month}</span> <span class="arrow">▾</span>`;
                monthItem.appendChild(monthHeader);

                const spreadsList = document.createElement('div');
                spreadsList.className = 'menu-spreads-list expanded'; // default expanded
                monthItem.appendChild(spreadsList);

                monthHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    spreadsList.classList.toggle('expanded');
                    monthHeader.querySelector('.arrow').textContent = spreadsList.classList.contains('expanded') ? '▾' : '▸';
                });

                for (const day in tree[year][month]) {
                    tree[year][month][day].forEach(sp => {
                        const option = document.createElement('div');
                        option.className = `menu-spread-option ${sp.index === currentIdx ? 'active' : ''}`;
                        option.textContent = `${day} ${month} (Spread ${sp.counter})`;
                        option.addEventListener('click', (e) => {
                            e.stopPropagation();
                            goTo(sp.index);
                            dropdownMenu.classList.remove('open');
                        });
                        spreadsList.appendChild(option);
                    });
                }

                monthsList.appendChild(monthItem);
            }

            dropdownMenu.appendChild(yearItem);
        }
    }

    // ── Navigation UI ──────────────────────────────────────────────────────
    function updateNav() {
        if (prevBtn) prevBtn.disabled = currentIdx === 0;
        if (nextBtn) {
            const onLast = currentIdx === spreads.length - 1;
            nextBtn.textContent = onLast ? 'New Page →' : 'Next →';
            nextBtn.disabled = false;
        }
        updateDropdownTriggerLabel();
        renderNestedSpreadMenu();
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
        const flap = document.createElement('div');
        flap.className = `page-fold-flap fold-${direction}`;

        const front = document.createElement('div');
        front.className = 'page-fold-face-front';

        const back = document.createElement('div');
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

    // ── Write current values back into the state array ────────────────────
    function flushCurrent() {
        const currentSpread = spreads[currentIdx];
        const id = currentSpread ? currentSpread.id : null;
        spreads[currentIdx] = {
            id: id || generateSpreadId(),
            left: leftTA.innerHTML,
            right: rightTA.innerHTML
        };
    }

    // ── Persistence ────────────────────────────────────────────────────────
    let saveTimer;
    function persist() {
        flushCurrent();
        clearTimeout(saveTimer);
        flash('Ink drying...');
        saveTimer = setTimeout(() => {
            localStorage.setItem('scriptorium_spreads', JSON.stringify(spreads));
            localStorage.setItem('scriptorium_spread_idx', currentIdx);

            const s = spreads[currentIdx];
            if (!s.id) s.id = generateSpreadId();

            // Save ONLY this specific page spread to the local filesystem
            fetch('/api/journal/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: s.id,
                    left: htmlToMarkdown(s.left),
                    right: htmlToMarkdown(s.right)
                })
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        flash('Saved to entries/ ✓');
                    } else {
                        flash('Draft saved ✓');
                    }
                })
                .catch(err => {
                    console.error("Local fileserver unreachable, quick-saved locally:", err);
                    flash('Draft saved ✓');
                });
        }, 1200);
    }

    function flash(msg) {
        if (!autoSave) return;
        autoSave.textContent = msg;
        autoSave.classList.add('visible');
        setTimeout(() => autoSave.classList.remove('visible'), 2200);
    }

    // ── Word count (all spreads combined, ignoring HTML tags) ──────────────
    function updateWordCount() {
        if (!wordCount) return;
        flushCurrent();
        const temp = document.createElement('div');
        const allText = spreads.map(s => {
            temp.innerHTML = (s.left || '') + ' ' + (s.right || '');
            return temp.textContent || temp.innerText || '';
        }).join(' ');
        const words = allText.trim().split(/\s+/).filter(Boolean).length;
        wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }

    // ── Helper: Check if selection is at the start of a contenteditable ─────
    function isSelectionAtStart(el) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return false;
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        return preCaretRange.toString().trim().length === 0;
    }

    // ── Input & Autosave Events ─────────────────────────────────────────────
    leftTA.addEventListener('input', () => {
        updateWordCount();
        persist();
    });

    rightTA.addEventListener('input', () => {
        updateWordCount();
        persist();
    });

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
                flushCurrent();
                const newId = generateSpreadId();
                spreads.push({ id: newId, left: '', right: '' });
                persist();
                goTo(spreads.length - 1, 'left');
            }
        });
    }

    if (tearBtn) {
        tearBtn.addEventListener('click', () => {
            if (!confirm("Are you sure you want to tear out this spread? This will permanently delete these page files from disk.")) return;

            const tornSpread = spreads[currentIdx];

            // Remove the current spread from the array
            spreads.splice(currentIdx, 1);

            // If we have no spreads left, create an empty one
            if (spreads.length === 0) {
                spreads = [{ id: generateSpreadId(), left: '', right: '' }];
            }

            // Adjust currentIdx
            if (currentIdx >= spreads.length) {
                currentIdx = spreads.length - 1;
            }

            // Immediately load the new spread into the DOM before persisting
            // This ensures flushCurrent() registers the correct adjacent content
            const s = spreads[currentIdx];
            leftTA.innerHTML = s.left || '';
            rightTA.innerHTML = s.right || '';

            // Update localStorage
            localStorage.setItem('scriptorium_spreads', JSON.stringify(spreads));
            localStorage.setItem('scriptorium_spread_idx', currentIdx);

            // Call single file delete on server
            if (tornSpread && tornSpread.id) {
                fetch('/api/journal/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: tornSpread.id })
                }).catch(err => console.error("Failed to delete local spread file:", err));
            }

            // Re-render navigation UI
            updateNav();
            updateWordCount();

            flash('Page torn out ✂');
        });
    }

    // ── Keyboard: backspace at start of right → return to left ─────────────
    rightTA.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && isSelectionAtStart(rightTA)) {
            if (localStorage.getItem('scriptorium_backspace_nav_enabled') === 'false') return;
            e.preventDefault();
            setCaretToEnd(leftTA);
        }
    });

    // ── Keyboard: backspace at start of left on non-first spread → prev ────
    leftTA.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && isSelectionAtStart(leftTA) && currentIdx > 0) {
            if (localStorage.getItem('scriptorium_backspace_nav_enabled') === 'false') return;
            e.preventDefault();
            goTo(currentIdx - 1, 'right');
        }
    });

    // ── Text Formatting Toolbar ─────────────────────────────────────────────
    function activeTA() {
        return document._lastFocusedTA || leftTA;
    }

    [leftTA, rightTA].forEach(ta => {
        ta.addEventListener('focus', () => { document._lastFocusedTA = ta; });
    });

    document.querySelectorAll('.fmt-btn').forEach(btn => {
        btn.addEventListener('mousedown', e => {
            e.preventDefault(); // Prevent text formatting buttons from stealing focus
        });
        btn.addEventListener('click', () => {
            const cmd = btn.dataset.cmd;
            if (!cmd) return;

            const ta = activeTA();
            ta.focus();

            if (cmd === 'removeFormat') {
                document.execCommand('removeFormat', false, null);
            } else {
                document.execCommand(cmd, false, null);
            }

            persist();
            updateActiveStates();
        });
    });

    function updateActiveStates() {
        document.getElementById('fmt-bold')?.classList.toggle('active', document.queryCommandState('bold'));
        document.getElementById('fmt-italic')?.classList.toggle('active', document.queryCommandState('italic'));
        document.getElementById('fmt-underline')?.classList.toggle('active', document.queryCommandState('underline'));
        document.getElementById('fmt-strike')?.classList.toggle('active', document.queryCommandState('strikeThrough'));
    }

    [leftTA, rightTA].forEach(ta => {
        ta.addEventListener('mouseup', updateActiveStates);
        ta.addEventListener('keyup', updateActiveStates);
        ta.addEventListener('click', updateActiveStates);
    });

    // ── Image Upload & Resizing Dropdown Handling ───────────────────────────
    const imgBtn = document.getElementById('fmt-image');
    const fileInput = document.getElementById('image-upload-input');

    function toggleImageDropdown(show) {
        let dropdown = document.getElementById('image-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'image-dropdown';
            dropdown.className = 'image-dropdown';
            document.body.appendChild(dropdown);
        }

        const shouldOpen = (show !== undefined) ? show : !dropdown.classList.contains('open');

        if (!shouldOpen) {
            dropdown.classList.remove('open');
            return;
        }

        // Re-generate inner HTML to reflect current selection state
        const selectedImg = document.querySelector('.selected-img');
        const hasSelected = !!selectedImg;
        const currentWidth = hasSelected ? (selectedImg.getAttribute('width') || selectedImg.style.width || '100%') : '';

        dropdown.innerHTML = `
            <div class="fmt-dropdown-item" id="img-opt-upload">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; opacity: 0.8;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span>Upload Image...</span>
            </div>
            <div class="fmt-dropdown-divider"></div>
            <div class="fmt-dropdown-header">Resize Selected Image</div>
            <div class="fmt-dropdown-item ${!hasSelected ? 'disabled' : ''} ${currentWidth === '25%' ? 'active' : ''}" data-width="25%">
                <span>25% Width (Default)</span>
            </div>
            <div class="fmt-dropdown-item ${!hasSelected ? 'disabled' : ''} ${currentWidth === '50%' ? 'active' : ''}" data-width="50%">
                <span>50% Width</span>
            </div>
            <div class="fmt-dropdown-item ${!hasSelected ? 'disabled' : ''} ${currentWidth === '75%' ? 'active' : ''}" data-width="75%">
                <span>75% Width</span>
            </div>
            <div class="fmt-dropdown-item ${!hasSelected ? 'disabled' : ''} ${currentWidth === '100%' ? 'active' : ''}" data-width="100%">
                <span>100% Width</span>
            </div>
            <div class="fmt-dropdown-divider"></div>
            <div class="fmt-dropdown-item btn-delete ${!hasSelected ? 'disabled' : ''}" id="img-opt-delete">
                <span>✕ Delete Image</span>
            </div>
        `;

        dropdown.classList.add('open');

        // Position the dropdown relative to `#fmt-image` button (above it)
        const imgBtnEl = document.getElementById('fmt-image');
        if (imgBtnEl) {
            const btnRect = imgBtnEl.getBoundingClientRect();
            const dropdownHeight = dropdown.getBoundingClientRect().height;
            const dropdownTop = btnRect.top + window.scrollY - dropdownHeight - 4;
            const dropdownLeft = btnRect.left + window.scrollX - 10;
            dropdown.style.top = `${dropdownTop}px`;
            dropdown.style.left = `${dropdownLeft}px`;
        }

        // Add event listeners inside the dropdown
        dropdown.querySelector('#img-opt-upload').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.remove('open');
            if (fileInput) fileInput.click();
        });

        dropdown.querySelectorAll('[data-width]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!hasSelected) return;

                const newWidth = item.dataset.width;
                selectedImg.setAttribute('width', newWidth);
                selectedImg.style.width = newWidth;
                
                persist();
                updateWordCount();
                
                // Refresh active status
                toggleImageDropdown(true);
            });
        });

        dropdown.querySelector('#img-opt-delete').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hasSelected) return;

            selectedImg.remove();
            removeSelectedImageState();
            dropdown.classList.remove('open');

            persist();
            updateWordCount();
        });
    }

    function selectImage(img) {
        removeSelectedImageState();
        img.classList.add('selected-img');
        toggleImageDropdown(true);
    }

    function removeSelectedImageState() {
        document.querySelectorAll('#scrapbook-textarea img, #scrapbook-textarea-right img').forEach(img => {
            img.classList.remove('selected-img');
        });
        const dropdown = document.getElementById('image-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    }

    // Global listener for clicking on images or dismissing the dropdown
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && (e.target.closest('#scrapbook-textarea') || e.target.closest('#scrapbook-textarea-right'))) {
            e.stopPropagation();
            selectImage(e.target);
        } else if (!e.target.closest('#image-dropdown') && !e.target.closest('#fmt-image')) {
            removeSelectedImageState();
        }
    });

    if (imgBtn) {
        imgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleImageDropdown();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;

            // Reset input so user can upload the same file again
            fileInput.value = '';

            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            // Show status
            flash('Uploading image...');

            reader.onload = () => {
                const base64Data = reader.result;

                fetch('/api/kb/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        data: base64Data
                    })
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.url) {
                        flash('Image inserted ✓');

                        // Insert at cursor selection if focused, otherwise append
                        const selection = window.getSelection();
                        let inserted = false;

                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const editorLeft = document.getElementById('scrapbook-textarea');
                            const editorRight = document.getElementById('scrapbook-textarea-right');

                            if (editorLeft.contains(range.commonAncestorContainer) || editorRight.contains(range.commonAncestorContainer)) {
                                range.deleteContents();
                                const img = document.createElement('img');
                                img.src = res.url;
                                img.alt = file.name;
                                img.setAttribute('width', '25%');
                                img.style.width = '25%';
                                range.insertNode(img);

                                // Move cursor right after the image
                                range.setStartAfter(img);
                                range.setEndAfter(img);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                inserted = true;
                            }
                        }

                        if (!inserted) {
                            // Fallback to active TA
                            const ta = activeTA();
                            const img = document.createElement('img');
                            img.src = res.url;
                            img.alt = file.name;
                            img.setAttribute('width', '25%');
                            img.style.width = '25%';
                            ta.appendChild(img);
                        }

                        // Save new state
                        persist();
                        updateWordCount();
                    } else {
                        flash('Upload failed ✕');
                    }
                })
                .catch(err => {
                    console.error("Image upload failed:", err);
                    flash('Upload failed ✕');
                });
            };
        });
    }

    // ── Paste Event Interception to prevent base64 contamination ──
    function uploadPastedImage(file, ta) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        flash('Uploading pasted image...');

        reader.onload = () => {
            const base64Data = reader.result;

            fetch('/api/kb/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: file.name || 'pasted_image.png',
                    data: base64Data
                })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success && res.url) {
                    flash('Image pasted & saved ✓');

                    // Create image element
                    const img = document.createElement('img');
                    img.src = res.url;
                    img.alt = file.name || 'pasted_image.png';
                    img.setAttribute('width', '25%');
                    img.style.width = '25%';

                    // Insert at current cursor selection inside the active textarea
                    const selection = window.getSelection();
                    let inserted = false;

                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        if (ta.contains(range.commonAncestorContainer)) {
                            range.deleteContents();
                            range.insertNode(img);

                            // Move cursor after the image
                            range.setStartAfter(img);
                            range.setEndAfter(img);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            inserted = true;
                        }
                    }

                    if (!inserted) {
                        ta.appendChild(img);
                    }

                    persist();
                    updateWordCount();
                } else {
                    flash('Upload failed ✕');
                }
            })
            .catch(err => {
                console.error("Pasted image upload failed:", err);
                flash('Upload failed ✕');
            });
        };
    }

    function setupPasteHandling(ta) {
        ta.addEventListener('paste', (e) => {
            // Check for pasted files
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            let hasImage = false;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    hasImage = true;
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) {
                        uploadPastedImage(file, ta);
                    }
                    break;
                }
            }

            if (hasImage) return;

            // Also check for pasted HTML containing base64 images
            const pastedHtml = e.clipboardData.getData('text/html');
            if (pastedHtml && (pastedHtml.includes('src="data:image/') || pastedHtml.includes("src='data:image/"))) {
                e.preventDefault();
                const parser = new DOMParser();
                const doc = parser.parseFromString(pastedHtml, 'text/html');
                const imgs = doc.querySelectorAll('img');
                
                const uploadPromises = [];
                imgs.forEach(img => {
                    const src = img.getAttribute('src') || '';
                    if (src.startsWith('data:image/')) {
                        const match = src.match(/^data:image\/([a-zA-Z+]+);base64,/);
                        const ext = match ? match[1] : 'png';
                        
                        const promise = fetch('/api/kb/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                filename: `pasted_image_${Date.now()}.${ext}`,
                                data: src
                            })
                        })
                        .then(res => res.json())
                        .then(res => {
                            if (res.success && res.url) {
                                img.setAttribute('src', res.url);
                                img.setAttribute('width', '25%');
                                img.style.width = '25%';
                            }
                        })
                        .catch(err => console.error("Pasted inline image upload failed:", err));
                        uploadPromises.push(promise);
                    }
                });

                if (uploadPromises.length > 0) {
                    flash('Uploading pasted images...');
                    Promise.all(uploadPromises).then(() => {
                        const cleanHtml = doc.body.innerHTML;
                        document.execCommand('insertHTML', false, cleanHtml);
                        persist();
                        updateWordCount();
                    });
                }
            }
        });
    }

    [leftTA, rightTA].forEach(ta => setupPasteHandling(ta));

    // ── Vim Mode Integration ────────────────────────────────────────────────
    let vimEnabled = false;
    let vimState = 'insert'; // 'normal', 'visual', or 'insert'
    let vimLastKey = '';
    let vimLeaderPressed = false;
    let vimStateBeforeReplace = 'normal';

    let vimShortcuts = {
        move_left: "h",
        move_down: "j",
        move_up: "k",
        move_right: "l",
        word_forward: "w",
        word_backward: "b",
        line_start: "0",
        line_end: "$",
        insert_mode: "i",
        append_mode: "a",
        open_below: "o",
        open_above: "O",
        visual_mode: "v",
        yank: "y",
        paste: "p",
        delete_char: "x",
        undo: "u",
        delete_action: "d",
        doc_start: "g",
        doc_end: "G",
        word_end: "e",
        change_mode: "c",
        replace_char: "r"
    };

    const cachedVim = localStorage.getItem('scriptorium_vim_shortcuts');
    if (cachedVim) {
        try { vimShortcuts = { ...vimShortcuts, ...JSON.parse(cachedVim) }; } catch(e) {}
    }

    const vimToggle = document.createElement('button');
    vimToggle.className = 'fmt-btn vim-toggle-btn';
    vimToggle.id = 'vim-toggle';
    vimToggle.title = 'Toggle Vim Mode (Alt+V)';
    vimToggle.textContent = 'VIM: OFF';

    const textToolbar = document.getElementById('text-toolbar');
    if (textToolbar) {
        textToolbar.insertBefore(vimToggle, textToolbar.firstChild);
        const div = document.createElement('div');
        div.className = 'fmt-divider';
        textToolbar.insertBefore(div, textToolbar.children[1]);
    }

    function setVimState(state) {
        if (!vimEnabled) return;
        vimState = state;
        vimLastKey = '';
        vimLeaderPressed = false;

        if (state === 'normal') {
            leftTA.classList.add('vim-normal-caret');
            rightTA.classList.add('vim-normal-caret');
            vimToggle.className = 'fmt-btn vim-toggle-btn active-vim vim-state-normal';
            vimToggle.textContent = 'VIM: NORMAL';
        } else if (state === 'visual') {
            leftTA.classList.add('vim-normal-caret');
            rightTA.classList.add('vim-normal-caret');
            vimToggle.className = 'fmt-btn vim-toggle-btn active-vim vim-state-visual';
            vimToggle.textContent = 'VIM: VISUAL';
        } else if (state === 'replace') {
            leftTA.classList.add('vim-normal-caret');
            rightTA.classList.add('vim-normal-caret');
            vimToggle.className = 'fmt-btn vim-toggle-btn active-vim vim-state-normal';
            vimToggle.textContent = 'VIM: REPLACE';
        } else {
            leftTA.classList.remove('vim-normal-caret');
            rightTA.classList.remove('vim-normal-caret');
            vimToggle.className = 'fmt-btn vim-toggle-btn active-vim vim-state-insert';
            vimToggle.textContent = 'VIM: INSERT';
        }
    }

    function toggleVimMode() {
        vimEnabled = !vimEnabled;
        localStorage.setItem('scriptorium_vim_enabled', vimEnabled ? 'true' : 'false');

        if (vimEnabled) {
            setVimState('insert');
        } else {
            leftTA.classList.remove('vim-normal-caret');
            rightTA.classList.remove('vim-normal-caret');
            vimToggle.className = 'fmt-btn vim-toggle-btn';
            vimToggle.textContent = 'VIM: OFF';
        }
    }

    function handleVimKeydown(e, ta) {
        if (!vimEnabled) return;

        // Escape: switch to normal mode and clear selections
        if (e.key === 'Escape') {
            e.preventDefault();
            if (vimState === 'visual') {
                window.getSelection().collapseToStart();
            }
            setVimState('normal');
            return;
        }

        if (vimState === 'replace') {
            e.preventDefault();
            e.stopPropagation();

            const key = e.key;
            if (key.length === 1 || key === 'Enter') {
                const replaceChar = (key === 'Enter') ? '\n' : key;
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    if (vimStateBeforeReplace === 'visual' && !sel.isCollapsed) {
                        const selectedText = sel.toString();
                        const replacement = selectedText.split('\n').map(line => replaceChar.repeat(line.length)).join('\n');
                        document.execCommand('insertText', false, replacement);
                    } else {
                        sel.modify("extend", "forward", "character");
                        const selectedStr = sel.toString();
                        if (selectedStr.length > 0 && selectedStr !== '\n') {
                            document.execCommand('insertText', false, replaceChar);
                            sel.modify("move", "backward", "character");
                        } else {
                            sel.collapseToStart();
                        }
                    }
                    persist();
                    updateWordCount();
                }
                setVimState('normal');
            }
            return;
        }

        if (vimState === 'normal' || vimState === 'visual') {
            e.preventDefault();
            e.stopPropagation();

            const key = e.key;

            // ── Leader Key (Space) sequence handling ──
            if (vimLeaderPressed) {
                vimLeaderPressed = false; // Reset leader key state

                if (key === vimShortcuts.move_left) {
                    leftTA.focus();
                    return;
                }
                if (key === vimShortcuts.move_right) {
                    rightTA.focus();
                    return;
                }
                if (key === vimShortcuts.move_down) {
                    window.scrollBy({ top: 150, behavior: 'smooth' });
                    return;
                }
                if (key === vimShortcuts.move_up) {
                    window.scrollBy({ top: -150, behavior: 'smooth' });
                    return;
                }
                if (key === 'a') {
                    if (currentIdx > 0) goTo(currentIdx - 1);
                    setVimState('normal');
                    return;
                }
                if (key === 's') {
                    if (currentIdx < spreads.length - 1) {
                        goTo(currentIdx + 1);
                    } else {
                        // Create a new spread
                        flushCurrent();
                        const newId = generateSpreadId();
                        spreads.push({ id: newId, left: '', right: '' });
                        persist();
                        goTo(spreads.length - 1, 'left');
                    }
                    setVimState('normal');
                    return;
                }
                if (key === 'u') {
                    if (tearBtn) tearBtn.click();
                    setVimState('normal');
                    return;
                }
                return; // Consume unmatched leader sequence
            }

            if (key === ' ') {
                vimLeaderPressed = true;
                return;
            }

            // ── Visual Mode Toggle ──
            if (key === vimShortcuts.visual_mode && vimState === 'normal') {
                setVimState('visual');
                return;
            }

            // ── Replace Character ──
            if (key === vimShortcuts.replace_char && (vimState === 'normal' || vimState === 'visual')) {
                vimStateBeforeReplace = vimState;
                setVimState('replace');
                return;
            }

            // ── Yank (y) / Copy ──
            if (key === vimShortcuts.yank) {
                document.execCommand('copy');
                window.getSelection().collapseToEnd();
                setVimState('normal');
                return;
            }

            // ── Paste (p) ──
            if (key === vimShortcuts.paste && vimState === 'normal') {
                navigator.clipboard.readText().then(text => {
                    if (text) {
                        document.execCommand('insertText', false, text);
                        persist();
                        updateWordCount();
                    }
                }).catch(err => {
                    console.error("Failed to read clipboard: ", err);
                });
                return;
            }

            // ── Insert Transitions (Normal Mode Only) ──
            if (vimState === 'normal') {
                if (key === vimShortcuts.insert_mode) {
                    setVimState('insert');
                    return;
                }
                if (key === vimShortcuts.append_mode) {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) sel.modify("move", "forward", "character");
                    setVimState('insert');
                    return;
                }
                if (key === vimShortcuts.open_below) {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        sel.modify("move", "forward", "lineboundary");
                        document.execCommand('insertParagraph');
                    }
                    setVimState('insert');
                    return;
                }
                if (key === vimShortcuts.open_above) {
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        sel.modify("move", "backward", "lineboundary");
                        document.execCommand('insertParagraph');
                        sel.modify("move", "backward", "line");
                    }
                    setVimState('insert');
                    return;
                }
            }

            // ── Cursor / Selection Motions (Move vs Extend) ──
            const alter = (vimState === 'visual') ? 'extend' : 'move';
            const sel = window.getSelection();

            if (key === vimShortcuts.move_left) {
                if (sel.rangeCount > 0) sel.modify(alter, "backward", "character");
                return;
            }
            if (key === vimShortcuts.move_right) {
                if (sel.rangeCount > 0) sel.modify(alter, "forward", "character");
                return;
            }
            if (key === vimShortcuts.move_down) {
                if (sel.rangeCount > 0) sel.modify(alter, "forward", "line");
                return;
            }
            if (key === vimShortcuts.move_up) {
                if (sel.rangeCount > 0) sel.modify(alter, "backward", "line");
                return;
            }
            if (key === vimShortcuts.word_forward) {
                if (vimState === 'normal' && vimLastKey === vimShortcuts.delete_action) {
                    if (sel.rangeCount > 0) {
                        sel.modify("extend", "forward", "word");
                        document.execCommand('delete');
                        persist();
                        updateWordCount();
                    }
                    vimLastKey = '';
                    return;
                }
                if (vimState === 'normal' && vimLastKey === vimShortcuts.change_mode) {
                    if (sel.rangeCount > 0) {
                        sel.modify("extend", "forward", "word");
                        document.execCommand('delete');
                        persist();
                        updateWordCount();
                    }
                    setVimState('insert');
                    vimLastKey = '';
                    return;
                }
                if (sel.rangeCount > 0) sel.modify(alter, "forward", "word");
                return;
            }
            if (key === vimShortcuts.word_backward) {
                if (sel.rangeCount > 0) sel.modify(alter, "backward", "word");
                return;
            }
            if (key === vimShortcuts.line_start) {
                if (sel.rangeCount > 0) sel.modify(alter, "backward", "lineboundary");
                return;
            }
            if (key === vimShortcuts.line_end) {
                if (sel.rangeCount > 0) sel.modify(alter, "forward", "lineboundary");
                return;
            }
            if (key === vimShortcuts.doc_start) {
                if (vimLastKey === vimShortcuts.doc_start) {
                    if (sel.rangeCount > 0) {
                        sel.collapse(ta.firstChild || ta, 0);
                        ta.focus();
                    }
                    vimLastKey = '';
                } else {
                    vimLastKey = vimShortcuts.doc_start;
                }
                return;
            }
            if (key === vimShortcuts.doc_end) {
                if (sel.rangeCount > 0) {
                    const range = document.createRange();
                    range.selectNodeContents(ta);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    ta.focus();
                }
                return;
            }
            if (key === vimShortcuts.word_end) {
                if (sel.rangeCount > 0) sel.modify(alter, "forward", "word");
                return;
            }

            // ── Deletions / Undo ──
            if (key === vimShortcuts.delete_char && vimState === 'normal') {
                document.execCommand('delete');
                persist();
                updateWordCount();
                return;
            }
            if (key === vimShortcuts.undo && vimState === 'normal') {
                document.execCommand('undo');
                persist();
                updateWordCount();
                return;
            }
            if (key === vimShortcuts.delete_action) {
                if (vimState === 'visual') {
                    document.execCommand('delete');
                    persist();
                    updateWordCount();
                    setVimState('normal');
                    return;
                }
                if (vimState === 'normal') {
                    if (vimLastKey === vimShortcuts.delete_action) {
                        if (sel.rangeCount > 0) {
                            sel.modify("move", "backward", "lineboundary");
                            sel.modify("extend", "forward", "lineboundary");
                            sel.modify("extend", "forward", "character");
                            document.execCommand('delete');
                            persist();
                            updateWordCount();
                        }
                        vimLastKey = '';
                    } else {
                        vimLastKey = vimShortcuts.delete_action;
                    }
                }
                return;
            }
            if (key === vimShortcuts.change_mode) {
                if (vimState === 'visual') {
                    document.execCommand('delete');
                    persist();
                    updateWordCount();
                    setVimState('insert');
                    return;
                }
                if (vimState === 'normal') {
                    if (vimLastKey === vimShortcuts.change_mode) {
                        if (sel.rangeCount > 0) {
                            sel.modify("move", "backward", "lineboundary");
                            sel.modify("extend", "forward", "lineboundary");
                            document.execCommand('delete');
                            persist();
                            updateWordCount();
                        }
                        setVimState('insert');
                        vimLastKey = '';
                    } else {
                        vimLastKey = vimShortcuts.change_mode;
                    }
                }
                return;
            }

            vimLastKey = key;
        }
    }

    [leftTA, rightTA].forEach(ta => {
        ta.addEventListener('keydown', (e) => handleVimKeydown(e, ta));
    });

    vimToggle.addEventListener('click', toggleVimMode);

    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            toggleVimMode();
        }
    });

    if (localStorage.getItem('scriptorium_vim_enabled') === 'true') {
        toggleVimMode();
    }
});


