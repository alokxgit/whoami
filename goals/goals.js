/* ==========================================================================
   GOALS & DAILY CHECKLIST PAGE INTERACTION SCRIPT
   Handles dynamic structured Weekly, Long-Term, and Inner Desires
   alongside an unlined freeform journal editor with markdown checkbox shortcuts.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE & PERSISTENCE INITIALIZATION ──
    let weekGoals   = JSON.parse(localStorage.getItem('scriptorium_week_goals')) || [];
    let longGoals   = JSON.parse(localStorage.getItem('scriptorium_long_goals')) || [];
    let desires     = JSON.parse(localStorage.getItem('scriptorium_desires'))    || [];

    // Prepopulate with elegant realistic placeholders on first load
    if (weekGoals.length === 0) {
        weekGoals = [
            { id: 1, text: "Complete the main web dashboard integration", done: false },
            { id: 2, text: "Learn the fundamentals of Web Audio synthesizers", done: false }
        ];
        localStorage.setItem('scriptorium_week_goals', JSON.stringify(weekGoals));
    }
    if (longGoals.length === 0) {
        longGoals = [
            { id: 1, text: "Secure a premium engineering job or internship", done: false },
            { id: 2, text: "Build a strong, healthy and agile physique", done: false },
            { id: 3, text: "Consistently practice and refine clear communication skills", done: false }
        ];
        localStorage.setItem('scriptorium_long_goals', JSON.stringify(longGoals));
    }
    if (desires.length === 0) {
        desires = [
            { id: 1, text: "Construct a gorgeous timber-frame country house", done: false },
            { id: 2, text: "Travel and hike through the mountains in Kyoto, Japan", done: false }
        ];
        localStorage.setItem('scriptorium_desires', JSON.stringify(desires));
    }

    // ── DOM ELEMENTS ──
    const weekListEl    = document.getElementById('week-goals-list');
    const longListEl    = document.getElementById('long-term-goals-list');
    const desireListEl  = document.getElementById('inner-desires-list');
    const editorEl      = document.getElementById('goals-freeform-editor');

    // ── RENDER FUNCTIONS ──
    function renderWeekGoals() {
        if (!weekListEl) return;
        if (weekGoals.length === 0) {
            weekListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.5rem 0;">No weekly goals registered.</li>`;
            return;
        }
        weekListEl.innerHTML = weekGoals.map(g => `
            <li class="custom-goal-item ${g.done ? 'done' : ''}" data-id="${g.id}">
                <input type="checkbox" class="goal-checkbox" ${g.done ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                <span class="goal-text-content">${escapeHtml(g.text)}</span>
            </li>
        `).join('');
    }

    function renderLongGoals() {
        if (!longListEl) return;
        if (longGoals.length === 0) {
            longListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.5rem 0;">No long-term goals registered.</li>`;
            return;
        }
        longListEl.innerHTML = longGoals.map(g => `
            <li class="custom-goal-item ${g.done ? 'done' : ''}" data-id="${g.id}">
                <input type="checkbox" class="goal-checkbox" ${g.done ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                <span class="goal-text-content">${escapeHtml(g.text)}</span>
            </li>
        `).join('');
    }

    function renderDesires() {
        if (!desireListEl) return;
        if (desires.length === 0) {
            desireListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.5rem 0;">No inner desires registered.</li>`;
            return;
        }
        desireListEl.innerHTML = desires.map(g => `
            <li class="custom-goal-item ${g.done ? 'done' : ''}" data-id="${g.id}">
                <input type="checkbox" class="goal-checkbox" ${g.done ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                <span class="goal-text-content">${escapeHtml(g.text)}</span>
            </li>
        `).join('');
    }

    // ── INTERACTIVE EVENTS (EVENT DELEGATION) ──
    if (weekListEl) {
        weekListEl.addEventListener('click', e => {
            const item = e.target.closest('.custom-goal-item');
            if (!item) return;
            const id = parseInt(item.dataset.id);
            const g = weekGoals.find(x => x.id === id);
            if (g) {
                if (e.target.classList.contains('goal-checkbox')) {
                    g.done = e.target.checked;
                } else {
                    g.done = !g.done;
                }
                localStorage.setItem('scriptorium_week_goals', JSON.stringify(weekGoals));
                renderWeekGoals();
            }
        });
    }

    if (longListEl) {
        longListEl.addEventListener('click', e => {
            const item = e.target.closest('.custom-goal-item');
            if (!item) return;
            const id = parseInt(item.dataset.id);
            const g = longGoals.find(x => x.id === id);
            if (g) {
                if (e.target.classList.contains('goal-checkbox')) {
                    g.done = e.target.checked;
                } else {
                    g.done = !g.done;
                }
                localStorage.setItem('scriptorium_long_goals', JSON.stringify(longGoals));
                renderLongGoals();
            }
        });
    }

    if (desireListEl) {
        desireListEl.addEventListener('click', e => {
            const item = e.target.closest('.custom-goal-item');
            if (!item) return;
            const id = parseInt(item.dataset.id);
            const g = desires.find(x => x.id === id);
            if (g) {
                if (e.target.classList.contains('goal-checkbox')) {
                    g.done = e.target.checked;
                } else {
                    g.done = !g.done;
                }
                localStorage.setItem('scriptorium_desires', JSON.stringify(desires));
                renderDesires();
            }
        });
    }

    // ── FREEFORM EDITOR WITH MARKDOWN SHORTCUTS ──
    if (editorEl) {
        // Load saved text from local storage
        const savedText = localStorage.getItem('scriptorium_goals_freeform') || '';
        editorEl.innerHTML = savedText;

        // Auto-save on input
        editorEl.addEventListener('input', () => {
            localStorage.setItem('scriptorium_goals_freeform', editorEl.innerHTML);
        });

        // Keydown handling for '-' followed by space checkbox conversion
        editorEl.addEventListener('keydown', (e) => {
            if (e.key === ' ') { // Space bar pressed
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                const range = selection.getRangeAt(0);
                const textNode = range.startContainer;
                
                if (textNode.nodeType === Node.TEXT_NODE) {
                    const text = textNode.nodeValue;
                    const offset = range.startOffset;
                    
                    const beforeText = text.substring(0, offset);
                    
                    if (beforeText === '-' || beforeText.endsWith(' -') || beforeText.endsWith('\n-')) {
                        e.preventDefault(); // Prevent standard space
                        
                        const dashIndex = beforeText.lastIndexOf('-');
                        const beforeDash = beforeText.substring(0, dashIndex);
                        
                        const checkboxSpan = document.createElement('span');
                        checkboxSpan.className = 'editor-checkbox-wrapper';
                        checkboxSpan.contentEditable = 'false';
                        checkboxSpan.style.marginRight = '8px';
                        checkboxSpan.style.display = 'inline-block';
                        checkboxSpan.style.verticalAlign = 'middle';
                        
                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.style.cursor = 'pointer';
                        input.addEventListener('change', () => {
                            if (input.checked) input.setAttribute('checked', 'checked');
                            else input.removeAttribute('checked');
                            localStorage.setItem('scriptorium_goals_freeform', editorEl.innerHTML);
                        });
                        checkboxSpan.appendChild(input);
                        
                        const afterText = text.substring(offset);
                        
                        textNode.nodeValue = beforeDash;
                        
                        const parent = textNode.parentNode;
                        const nextSibling = textNode.nextSibling;
                        
                        parent.insertBefore(checkboxSpan, nextSibling);
                        
                        const newTextNode = document.createTextNode('\u00A0' + afterText);
                        parent.insertBefore(newTextNode, checkboxSpan.nextSibling);
                        
                        const newRange = document.createRange();
                        newRange.setStart(newTextNode, 1);
                        newRange.setEnd(newTextNode, 1);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        
                        localStorage.setItem('scriptorium_goals_freeform', editorEl.innerHTML);
                    }
                }
            }
        });

        // Intercept checked attribute for serialization on click
        editorEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                if (e.target.checked) {
                    e.target.setAttribute('checked', 'checked');
                } else {
                    e.target.removeAttribute('checked');
                }
                localStorage.setItem('scriptorium_goals_freeform', editorEl.innerHTML);
            }
        });
    }

    // ── INITIAL RENDER ──
    renderWeekGoals();
    renderLongGoals();
    renderDesires();

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
    }
});
