/* ==========================================================================
   GOALS & DAILY CHECKLIST PAGE INTERACTION SCRIPT
   Handles dynamic structured Weekly, Long-Term, and Inner Desires
   alongside an unlined freeform journal editor with markdown checkbox shortcuts.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE & PERSISTENCE INITIALIZATION ──
    let weekGoals = JSON.parse(localStorage.getItem('scriptorium_week_goals')) || [];
    let longGoals = JSON.parse(localStorage.getItem('scriptorium_long_goals')) || [];
    let desires = JSON.parse(localStorage.getItem('scriptorium_desires')) || [];

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
    const weekListEl = document.getElementById('week-goals-list');
    const longListEl = document.getElementById('long-term-goals-list');
    const desireListEl = document.getElementById('inner-desires-list');
    const editorEl = document.getElementById('goals-freeform-editor');

    // ── RENDER FUNCTIONS ──
    function renderWeekGoals() {
        if (!weekListEl) return;
        if (weekGoals.length === 0) {
            weekListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.5rem 0;">No weekly goals registered.</li>`;
            return;
        }
        weekListEl.innerHTML = weekGoals.map(g => {
            const commitmentTag = g.commitmentTitle
                ? `<span class="goal-commitment-badge" style="background:var(--amber-glow); color:var(--amber); border:1px solid rgba(229,195,106,0.3); font-size:0.65rem; font-family:var(--f-head); padding:1px 6px; border-radius:10px; text-transform:uppercase; font-weight:600; margin-left:6px; display:inline-block; vertical-align:middle; line-height:1.2;">🔗 ${escapeHtml(g.commitmentTitle)}</span>`
                : '';
            return `
                <li class="custom-goal-item ${g.done ? 'done' : ''}" data-id="${g.id}">
                    <div style="display:flex; align-items:center; gap:0.2rem; flex-wrap:wrap; flex:1;">
                        <input type="checkbox" class="goal-checkbox" ${g.done ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                        <span class="goal-text-content">${escapeHtml(g.text)}</span>
                        ${commitmentTag}
                    </div>
                </li>
            `;
        }).join('');
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

    // ── SAVE & RESET DAILY CHRONICLE ──
    const dailyBtn = document.getElementById('daily-save-reset-btn');
    if (dailyBtn && editorEl) {
        dailyBtn.addEventListener('click', () => {
            const rawContent = editorEl.innerHTML.trim();
            if (!rawContent || editorEl.textContent.trim() === '') {
                alert('Your Daily Chronicle is empty! Nothing to save.');
                return;
            }

            if (!confirm('Are you sure you want to save and reset your Daily Chronicle?')) {
                return;
            }

            const parsedTasks = parseEditorTasks(editorEl.innerHTML);
            const filename = `${getFormattedDate()}.json`;
            const payload = {
                date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
                tasks: parsedTasks
            };

            fetch('/api/goals/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: 'daily',
                    filename: filename,
                    data: payload
                })
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {

                        // Reset the editor and localStorage
                        editorEl.innerHTML = '';
                        localStorage.setItem('scriptorium_goals_freeform', '');
                    } else {
                        alert('Failed to save Daily Chronicle: ' + (res.error || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Error connecting to the server: ' + err.message);
                });
        });
    }

    function getFormattedDate() {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date();
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}_${month}_${year}`; // e.g. 31_May_2026
    }

    function parseEditorTasks(html) {
        const tasks = [];
        let taskId = 1;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let currentLineText = '';
        let currentLineHasCheckbox = false;
        let currentLineChecked = false;
        
        function commitLine() {
            const cleanText = currentLineText.trim().replace(/\u00A0/g, ' ').replace(/ +/g, ' ');
            if (cleanText) {
                tasks.push({
                    id: taskId++,
                    content: cleanText,
                    status: currentLineHasCheckbox ? (currentLineChecked ? "completed" : "pending") : "completed"
                });
            }
            currentLineText = '';
            currentLineHasCheckbox = false;
            currentLineChecked = false;
        }
        
        tempDiv.childNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'DIV' || node.tagName === 'P')) {
                commitLine();
                
                let blockText = '';
                let blockHasCheckbox = false;
                let blockChecked = false;
                
                node.childNodes.forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE && child.classList.contains('editor-checkbox-wrapper')) {
                        blockHasCheckbox = true;
                        const input = child.querySelector('input[type="checkbox"]');
                        blockChecked = input ? (input.checked || input.hasAttribute('checked')) : false;
                    } else {
                        blockText += child.textContent;
                    }
                });
                
                currentLineText = blockText;
                currentLineHasCheckbox = blockHasCheckbox;
                currentLineChecked = blockChecked;
                commitLine();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                commitLine();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('editor-checkbox-wrapper')) {
                currentLineHasCheckbox = true;
                const input = node.querySelector('input[type="checkbox"]');
                currentLineChecked = input ? (input.checked || input.hasAttribute('checked')) : false;
            } else {
                currentLineText += node.textContent;
            }
        });
        
        commitLine();
        return tasks;
    }

    function goalsHtmlToMarkdown(html) {
        if (!html) return '';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find all checkboxes in the editor and convert them to markdown [ ] or [x]
        const wrappers = tempDiv.querySelectorAll('.editor-checkbox-wrapper');
        wrappers.forEach(wrapper => {
            const input = wrapper.querySelector('input[type="checkbox"]');
            const isChecked = input ? (input.checked || input.hasAttribute('checked')) : false;
            // Replace the wrapper outerHTML with markdown checkbox syntax
            wrapper.outerHTML = isChecked ? '- [x] ' : '- [ ] ';
        });

        let md = tempDiv.innerHTML;
        md = md.replace(/\r/g, '');

        // Convert block elements divs/paragraphs to newlines
        md = md.replace(/<div>(.*?)<\/div>/gi, '\n$1');
        md = md.replace(/<p>(.*?)<\/p>/gi, '\n$1');
        // Replace single <br> with newline
        md = md.replace(/<br\s*\/?>/gi, '\n');

        // Decode HTML entities
        const temp = document.createElement('textarea');
        temp.innerHTML = md;
        let text = temp.value;

        // Replace non-breaking spaces and collapse spaces
        text = text.replace(/\u00A0/g, ' ');
        text = text.replace(/ +/g, ' ');

        // Trim empty lines and collapse consecutive empty lines
        const lines = text.split('\n').map(line => line.trim());
        const cleanLines = [];
        let lastWasEmpty = false;
        lines.forEach(line => {
            if (line === '') {
                if (!lastWasEmpty) {
                    cleanLines.push('');
                    lastWasEmpty = true;
                }
            } else {
                cleanLines.push(line);
                lastWasEmpty = false;
            }
        });

        return cleanLines.join('\n').trim();
    }

    // ── INITIAL RENDER ──
    renderWeekGoals();
    renderLongGoals();
    renderDesires();

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }
});
