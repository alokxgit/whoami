/* ==========================================================================
   SETTINGS & DATA UTILITIES INTERACTION SCRIPT
   Handles ambient sound muting, database backups, reset, and goal registry
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const muteToggle = document.getElementById('mute-ambient-audio-toggle');
    const exportBtn  = document.getElementById('export-journal-btn');
    const resetBtn   = document.getElementById('reset-journal-btn');

    // ── MUTE TOGGLE ──
    if (muteToggle) {
        const savedMuted = localStorage.getItem('scriptorium_muted') === 'true';
        muteToggle.checked = savedMuted;
        muteToggle.addEventListener('change', e => {
            if (window.setMuted) window.setMuted(e.target.checked);
            else localStorage.setItem('scriptorium_muted', e.target.checked ? 'true' : 'false');
        });
    }

    // ── EXPORT BACKUP ──
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                weekGoals:   JSON.parse(localStorage.getItem('scriptorium_week_goals') || '[]'),
                longGoals:   JSON.parse(localStorage.getItem('scriptorium_long_goals') || '[]'),
                desires:     JSON.parse(localStorage.getItem('scriptorium_desires') || '[]'),
                ledgerTasks: JSON.parse(localStorage.getItem('scriptorium_ledger_tasks') || '[]'),
                journal:     localStorage.getItem('scriptorium_journal') || '',
                mindset:     localStorage.getItem('scriptorium_mindset') || '',
                layout:      localStorage.getItem('scriptorium_layout') || 'codex',
                exportedAt:  new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `scriptorium-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // ── RESET DATA ──
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ This will permanently erase ALL your journal data (goals, tasks, journal entries). Are you absolutely sure?')) {
                localStorage.removeItem('scriptorium_week_goals');
                localStorage.removeItem('scriptorium_long_goals');
                localStorage.removeItem('scriptorium_desires');
                localStorage.removeItem('scriptorium_ledger_tasks');
                localStorage.removeItem('scriptorium_journal');
                localStorage.removeItem('scriptorium_mindset');
                localStorage.removeItem('scriptorium_layout');
                localStorage.removeItem('scriptorium_weekly_locked_week');
                alert('Journal data has been cleared.');
                window.location.href = '../index.html';
            }
        });
    }

    // ── GOAL REGISTRY MANAGEMENT & LOCKING RULES ──
    const tabWeekly   = document.getElementById('tab-btn-weekly');
    const tabLong     = document.getElementById('tab-btn-long');
    const tabDesires  = document.getElementById('tab-btn-desires');
    const goalInput   = document.getElementById('settings-goal-input');
    const goalForm    = document.getElementById('settings-goal-form');
    const goalsListEl = document.getElementById('settings-goals-list');

    let currentTab = 'weekly'; // 'weekly' | 'long' | 'desires'

    let weekGoals = JSON.parse(localStorage.getItem('scriptorium_week_goals')) || [];
    let longGoals = JSON.parse(localStorage.getItem('scriptorium_long_goals')) || [];
    let desires   = JSON.parse(localStorage.getItem('scriptorium_desires'))    || [];

    // Prepopulate with elegant realistic placeholders on first load if empty
    if (weekGoals.length === 0 && localStorage.getItem('scriptorium_week_goals') === null) {
        weekGoals = [
            { id: 1, text: "Complete the main web dashboard integration", done: false },
            { id: 2, text: "Learn the fundamentals of Web Audio synthesizers", done: false }
        ];
        localStorage.setItem('scriptorium_week_goals', JSON.stringify(weekGoals));
    }
    if (longGoals.length === 0 && localStorage.getItem('scriptorium_long_goals') === null) {
        longGoals = [
            { id: 1, text: "Secure a premium engineering job or internship", done: false },
            { id: 2, text: "Build a strong, healthy and agile physique", done: false },
            { id: 3, text: "Consistently practice and refine clear communication skills", done: false }
        ];
        localStorage.setItem('scriptorium_long_goals', JSON.stringify(longGoals));
    }
    if (desires.length === 0 && localStorage.getItem('scriptorium_desires') === null) {
        desires = [
            { id: 1, text: "Construct a gorgeous timber-frame country house", done: false },
            { id: 2, text: "Travel and hike through the mountains in Kyoto, Japan", done: false }
        ];
        localStorage.setItem('scriptorium_desires', JSON.stringify(desires));
    }

    // Calendar week calculation helper
    function getWeekIdentifier() {
        const d = new Date();
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}-W${weekNo}`;
    }

    function isWeeklyLocked() {
        const lockedWeek = localStorage.getItem('scriptorium_weekly_locked_week');
        return lockedWeek === getWeekIdentifier();
    }

    function renderRegistry() {
        if (!goalsListEl) return;
        const isLocked = isWeeklyLocked();

        // Dynamically toggle add form display based on Weekly lock
        if (goalForm) {
            if (currentTab === 'weekly' && isLocked) {
                goalForm.style.display = 'none';
                let lockMsg = document.getElementById('weekly-lock-message');
                if (!lockMsg) {
                    lockMsg = document.createElement('div');
                    lockMsg.id = 'weekly-lock-message';
                    lockMsg.className = 'weekly-lock-banner';
                    lockMsg.innerHTML = '🔒 Weekly goals are locked for this calendar week. You can modify them next week!';
                    goalForm.parentNode.insertBefore(lockMsg, goalForm);
                }
            } else {
                if (goalForm) goalForm.style.display = 'flex';
                const lockMsg = document.getElementById('weekly-lock-message');
                if (lockMsg) lockMsg.remove();
            }
        }

        let list = [];
        if (currentTab === 'weekly') list = weekGoals;
        else if (currentTab === 'long') list = longGoals;
        else if (currentTab === 'desires') list = desires;

        // Render goals list
        if (list.length === 0) {
            goalsListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.8rem 0;">No goals added yet.</li>`;
        } else {
            goalsListEl.innerHTML = list.map(g => {
                // If weekly tab is locked, don't show the delete button
                const showDel = !(currentTab === 'weekly' && isLocked);
                return `
                    <li class="settings-goal-item" data-id="${g.id}">
                        <span class="settings-goal-text">${escapeHtml(g.text)}</span>
                        ${showDel ? `<button class="settings-goal-del-btn" title="Delete goal">✕</button>` : ''}
                    </li>
                `;
            }).join('');
        }

        // Handle the Lock button for Weekly Goals
        let lockBtn = document.getElementById('lock-weekly-action-btn');
        if (currentTab === 'weekly' && !isLocked && weekGoals.length > 0) {
            if (!lockBtn) {
                lockBtn = document.createElement('button');
                lockBtn.id = 'lock-weekly-action-btn';
                lockBtn.className = 'lock-weekly-btn';
                lockBtn.innerHTML = '🔒 Lock Weekly Goals for this Week';
                goalsListEl.parentNode.appendChild(lockBtn);
                lockBtn.addEventListener('click', () => {
                    if (confirm('Are you absolutely sure you want to commit and lock your weekly goals? You won\'t be able to add or delete weekly goals until next week.')) {
                        localStorage.setItem('scriptorium_weekly_locked_week', getWeekIdentifier());
                        renderRegistry();
                    }
                });
            }
        } else {
            if (lockBtn) lockBtn.remove();
        }
    }

    function setActiveTab(tab) {
        currentTab = tab;
        [tabWeekly, tabLong, tabDesires].forEach(btn => {
            if (btn) {
                const active = btn.dataset.tab === tab;
                btn.classList.toggle('active', active);
            }
        });
        if (goalInput) {
            if (tab === 'weekly') goalInput.placeholder = "Add new weekly goal...";
            else if (tab === 'long') goalInput.placeholder = "Add new long-term goal...";
            else if (tab === 'desires') goalInput.placeholder = "Add heart's desire...";
        }
        renderRegistry();
    }

    if (tabWeekly) tabWeekly.addEventListener('click', () => setActiveTab('weekly'));
    if (tabLong)   tabLong.addEventListener('click', () => setActiveTab('long'));
    if (tabDesires) tabDesires.addEventListener('click', () => setActiveTab('desires'));

    if (goalForm && goalInput) {
        goalForm.addEventListener('submit', e => {
            e.preventDefault();
            const val = goalInput.value.trim();
            if (!val) return;

            if (currentTab === 'weekly' && isWeeklyLocked()) {
                alert('Weekly goals are locked for this calendar week.');
                return;
            }

            const newItem = { id: Date.now(), text: val, done: false };

            if (currentTab === 'weekly') {
                weekGoals.push(newItem);
                localStorage.setItem('scriptorium_week_goals', JSON.stringify(weekGoals));
            } else if (currentTab === 'long') {
                longGoals.push(newItem);
                localStorage.setItem('scriptorium_long_goals', JSON.stringify(longGoals));
            } else if (currentTab === 'desires') {
                desires.push(newItem);
                localStorage.setItem('scriptorium_desires', JSON.stringify(desires));
            }

            goalInput.value = '';
            renderRegistry();
        });
    }

    if (goalsListEl) {
        goalsListEl.addEventListener('click', e => {
            if (e.target.classList.contains('settings-goal-del-btn')) {
                if (currentTab === 'weekly' && isWeeklyLocked()) {
                    alert('Weekly goals are locked for this calendar week.');
                    return;
                }

                const item = e.target.closest('.settings-goal-item');
                if (!item) return;
                const id = parseInt(item.dataset.id);

                if (currentTab === 'weekly') {
                    weekGoals = weekGoals.filter(x => x.id !== id);
                    localStorage.setItem('scriptorium_week_goals', JSON.stringify(weekGoals));
                } else if (currentTab === 'long') {
                    longGoals = longGoals.filter(x => x.id !== id);
                    localStorage.setItem('scriptorium_long_goals', JSON.stringify(longGoals));
                } else if (currentTab === 'desires') {
                    desires = desires.filter(x => x.id !== id);
                    localStorage.setItem('scriptorium_desires', JSON.stringify(desires));
                }
                renderRegistry();
            }
        });
    }

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
    }

    // ── SPECIFIC TYPOGRAPHY STYLE CONTROLS ──
    const scaleSteps = ['0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5'];

    function bindStyleScale(style) {
        const decBtn = document.getElementById(`scale-${style}-dec`);
        const incBtn = document.getElementById(`scale-${style}-inc`);
        const valLabel = document.getElementById(`scale-${style}-val`);

        let currentVal = localStorage.getItem(`scriptorium_scale_${style}`) || '1.0';

        function updateScale() {
            if (valLabel) valLabel.textContent = parseFloat(currentVal).toFixed(1);
            if (window.applySpecificFontScale) {
                window.applySpecificFontScale(style, currentVal);
            } else {
                document.documentElement.style.setProperty(`--scale-${style}`, currentVal);
                localStorage.setItem(`scriptorium_scale_${style}`, currentVal);
            }
        }

        // Initialize label text
        if (valLabel) valLabel.textContent = parseFloat(currentVal).toFixed(1);

        if (decBtn && incBtn) {
            decBtn.addEventListener('click', () => {
                let idx = scaleSteps.indexOf(parseFloat(currentVal).toFixed(1));
                if (idx === -1) idx = scaleSteps.indexOf('1.0');
                if (idx > 0) {
                    currentVal = scaleSteps[idx - 1];
                    updateScale();
                }
            });

            incBtn.addEventListener('click', () => {
                let idx = scaleSteps.indexOf(parseFloat(currentVal).toFixed(1));
                if (idx === -1) idx = scaleSteps.indexOf('1.0');
                if (idx < scaleSteps.length - 1) {
                    currentVal = scaleSteps[idx + 1];
                    updateScale();
                }
            });
        }
    }

    // Bind for each style
    ['fancy', 'hand', 'head'].forEach(bindStyleScale);

    // ── SPECIFIC FONT FAMILY DROPDOWN BINDINGS ──
    function bindFontFamilySelect(style) {
        const select = document.getElementById(`font-${style}-select`);
        if (select) {
            const defaultFamily = style === 'fancy' ? "'Cinzel Decorative', serif" :
                                  style === 'hand' ? "'Caveat', cursive" :
                                                    "'Marcellus', serif";
            const savedFamily = localStorage.getItem(`scriptorium_font_${style}`) || defaultFamily;
            select.value = savedFamily;

            select.addEventListener('change', (e) => {
                if (window.applySpecificFontFamily) {
                    window.applySpecificFontFamily(style, e.target.value);
                } else {
                    document.documentElement.style.setProperty(`--font-${style}-family`, e.target.value);
                    localStorage.setItem(`scriptorium_font_${style}`, e.target.value);
                }
            });
        }
    }
    ['fancy', 'hand', 'head'].forEach(bindFontFamilySelect);

    // Init
    setActiveTab('weekly');
});
