/* ==========================================================================
   SETTINGS & DATA UTILITIES INTERACTION SCRIPT
   Handles ambient sound muting, database backups, reset, and goal registry
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const muteToggle = document.getElementById('mute-ambient-audio-toggle');
    const exportBtn = document.getElementById('export-journal-btn');
    const resetBtn = document.getElementById('reset-journal-btn');

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
                weekGoals: JSON.parse(localStorage.getItem('scriptorium_week_goals') || '[]'),
                longGoals: JSON.parse(localStorage.getItem('scriptorium_long_goals') || '[]'),
                desires: JSON.parse(localStorage.getItem('scriptorium_desires') || '[]'),
                ledgerTasks: JSON.parse(localStorage.getItem('scriptorium_ledger_tasks') || '[]'),
                journal: localStorage.getItem('scriptorium_journal') || '',
                mindset: localStorage.getItem('scriptorium_mindset') || '',
                layout: localStorage.getItem('scriptorium_layout') || 'codex',
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scriptorium-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
                window.location.href = '../../index.html';
            }
        });
    }

    // ── GOAL REGISTRY MANAGEMENT & LOCKING RULES ──
    const tabWeekly = document.getElementById('tab-btn-weekly');
    const tabLong = document.getElementById('tab-btn-long');
    const tabDesires = document.getElementById('tab-btn-desires');
    const tabCommitments = document.getElementById('tab-btn-commitments');
    const goalInput = document.getElementById('settings-goal-input');
    const goalForm = document.getElementById('settings-goal-form');
    const goalsListEl = document.getElementById('settings-goals-list');
    const commitmentSelect = document.getElementById('goal-commitment-select');
    const commitmentsTabListEl = document.getElementById('settings-commitments-list');

    let currentTab = 'weekly'; // 'weekly' | 'long' | 'desires' | 'commitments'

    let weekGoals = JSON.parse(localStorage.getItem('scriptorium_week_goals')) || [];
    let longGoals = JSON.parse(localStorage.getItem('scriptorium_long_goals')) || [];
    let desires = JSON.parse(localStorage.getItem('scriptorium_desires')) || [];
    let commitments = [];

    function populateCommitmentDropdown() {
        if (!commitmentSelect) return;
        commitmentSelect.innerHTML = '<option value="">-- None --</option>';
        commitments.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `[${c.category || 'General'}] ${c.title}`;
            commitmentSelect.appendChild(opt);
        });
    }

    function renderCommitmentsTabList() {
        if (!commitmentsTabListEl) return;
        if (commitments.length === 0) {
            commitmentsTabListEl.innerHTML = `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.85rem;padding:0.8rem 0;">No commitments bound yet. Bind your first commitment above!</li>`;
            return;
        }
        commitmentsTabListEl.innerHTML = commitments.map(c => `
            <li class="settings-goal-item" data-id="${c.id}" style="display:flex; flex-direction:column; align-items:stretch; gap:0.25rem; padding:0.6rem 0.8rem; border:1px solid rgba(229,195,106,0.15); border-radius:6px; background:rgba(229,195,106,0.02); margin-bottom:0.4rem; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <span style="font-family:var(--f-head); font-weight:600; font-size:0.82rem; color:var(--amber); line-height:1.2;">
                        ${escapeHtml(c.title)}
                    </span>
                    <button class="settings-commitment-del-btn" data-id="${c.id}" title="Sever commitment" style="background:none; border:none; color:var(--ink-muted); cursor:pointer; font-size:0.8rem; padding:0 2px; transition:color 0.2s;">✕</button>
                </div>
                <div style="font-family:var(--f-hand); font-size:0.85rem; color:var(--ink); font-style:italic; line-height:1.2;">
                    "Why: ${escapeHtml(c.why)}"
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--f-head); font-size:0.65rem; color:var(--ink-muted); margin-top:0.1rem;">
                    <span>Category: <strong style="color:var(--ink);">${escapeHtml(c.category)}</strong></span>
                    <span>Status: <strong style="color:var(--ink);">${escapeHtml(c.status)}</strong></span>
                </div>
            </li>
        `).join('');
    }

    function loadCommitments() {
        fetch('/api/reflection/load?type=commitments')
            .then(res => res.json())
            .then(data => {
                commitments = Array.isArray(data) ? data : [];
                populateCommitmentDropdown();
                renderCommitmentsTabList();
            })
            .catch(err => {
                console.error("Failed to load commitments:", err);
                commitments = JSON.parse(localStorage.getItem('scriptorium_commitments')) || [];
                populateCommitmentDropdown();
                renderCommitmentsTabList();
            });
    }
    loadCommitments();

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
        // Temporarily unlocked for testing as per user request
        return false;
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
                const commitmentTag = (currentTab === 'weekly' && g.commitmentTitle)
                    ? `<span class="goal-commitment-badge" style="background:var(--amber-glow); color:var(--amber); border:1px solid rgba(229,195,106,0.3); font-size:0.65rem; font-family:var(--f-head); padding:1px 6px; border-radius:10px; text-transform:uppercase; font-weight:600; margin-left:6px; display:inline-block; vertical-align:middle; line-height:1.2;">${escapeHtml(g.commitmentTitle)}</span>`
                    : '';
                return `
                    <li class="settings-goal-item" data-id="${g.id}">
                        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; flex:1;">
                            <span class="settings-goal-text">${escapeHtml(g.text)}</span>
                            ${commitmentTag}
                        </div>
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
        [tabWeekly, tabLong, tabDesires, tabCommitments].forEach(btn => {
            if (btn) {
                const active = btn.dataset.tab === tab;
                btn.classList.toggle('active', active);
            }
        });

        const weeklyCommitmentContainer = document.getElementById('weekly-commitment-select-container');
        const normalForm = document.getElementById('settings-goal-form');
        const normalList = document.getElementById('settings-goals-list');
        const saveBtn = document.getElementById('settings-goals-save-reset-btn');
        const commitmentsContent = document.getElementById('settings-commitments-tab-content');
        const lockMsg = document.getElementById('weekly-lock-message');
        const lockBtn = document.getElementById('lock-weekly-action-btn');

        if (tab === 'commitments') {
            if (normalForm) normalForm.style.display = 'none';
            if (normalList) normalList.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'none';
            if (lockMsg) lockMsg.style.display = 'none';
            if (lockBtn) lockBtn.style.display = 'none';
            if (commitmentsContent) commitmentsContent.style.display = 'flex';
            renderCommitmentsTabList();
        } else {
            if (normalForm) normalForm.style.display = 'flex';
            if (normalList) normalList.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'flex';
            if (lockMsg) lockMsg.style.display = 'block';
            if (lockBtn) lockBtn.style.display = 'block';
            if (commitmentsContent) commitmentsContent.style.display = 'none';

            if (weeklyCommitmentContainer) {
                weeklyCommitmentContainer.style.display = (tab === 'weekly') ? 'flex' : 'none';
            }

            if (goalInput) {
                if (tab === 'weekly') {
                    goalInput.placeholder = "Add new weekly goal...";
                } else if (tab === 'long') {
                    goalInput.placeholder = "Add new long-term goal...";
                } else if (tab === 'desires') {
                    goalInput.placeholder = "Add heart's desire...";
                }
            }
            renderRegistry();
        }
    }

    if (tabWeekly) tabWeekly.addEventListener('click', () => setActiveTab('weekly'));
    if (tabLong) tabLong.addEventListener('click', () => setActiveTab('long'));
    if (tabDesires) tabDesires.addEventListener('click', () => setActiveTab('desires'));
    if (tabCommitments) tabCommitments.addEventListener('click', () => setActiveTab('commitments'));

    if (goalForm && goalInput) {
        goalForm.addEventListener('submit', e => {
            e.preventDefault();
            const val = goalInput.value.trim();
            if (!val) return;

            if (currentTab === 'weekly' && isWeeklyLocked()) {
                alert('Weekly goals are locked for this calendar week.');
                return;
            }

            const selectedId = commitmentSelect ? commitmentSelect.value : '';
            let connectedCommitmentTitle = '';
            if (selectedId) {
                const connected = commitments.find(c => c.id === selectedId);
                if (connected) connectedCommitmentTitle = connected.title;
            }

            const newItem = { id: Date.now(), text: val, done: false };

            if (currentTab === 'weekly') {
                if (selectedId) {
                    newItem.commitmentId = selectedId;
                    newItem.commitmentTitle = connectedCommitmentTitle;
                }
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
            if (commitmentSelect) commitmentSelect.value = '';
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
                const rawId = item.dataset.id;

                const id = parseInt(rawId);
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

    if (commitmentsTabListEl) {
        commitmentsTabListEl.addEventListener('click', e => {
            const delBtn = e.target.closest('.settings-commitment-del-btn');
            if (!delBtn) return;
            const commitId = delBtn.dataset.id;
            if (confirm("Are you sure you want to sever/remove this commitment? All check-ins will remain, but the active binding will be deleted.")) {
                commitments = commitments.filter(x => x.id !== commitId);
                fetch('/api/reflection/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'commitments', data: commitments })
                })
                    .then(() => {
                        localStorage.setItem('scriptorium_commitments', JSON.stringify(commitments));
                        populateCommitmentDropdown();
                        renderCommitmentsTabList();
                    });
            }
        });
    }

    // ── SAVE & RESET ACTIVE REGISTRY TAB ──
    const registrySaveBtn = document.getElementById('settings-goals-save-reset-btn');
    if (registrySaveBtn) {
        registrySaveBtn.addEventListener('click', () => {
            let activeList = [];
            let categoryName = '';
            let storageKey = '';
            let labelName = '';

            if (currentTab === 'weekly') {
                activeList = weekGoals;
                categoryName = 'weekly';
                storageKey = 'scriptorium_week_goals';
                labelName = 'Weekly Goals';
            } else if (currentTab === 'long') {
                activeList = longGoals;
                categoryName = 'longterm';
                storageKey = 'scriptorium_long_goals';
                labelName = 'Long-Term Goals';
            } else if (currentTab === 'desires') {
                activeList = desires;
                categoryName = 'inner_desire';
                storageKey = 'scriptorium_desires';
                labelName = 'Inner Desires';
            }

            if (activeList.length === 0) {
                alert(`Your ${labelName} list is empty! Nothing to save.`);
                return;
            }

            const promptMessage = currentTab === 'weekly' && isWeeklyLocked()
                ? `⚠️ Note: Weekly goals are locked for this calendar week. Are you absolutely sure you want to save and reset your ${labelName}?`
                : `Are you sure you want to save and reset your ${labelName}?`;

            if (!confirm(promptMessage)) {
                return;
            }

            const filename = `${getFormattedDate()}.json`;
            const payload = {
                date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
                tab: currentTab,
                goals: activeList
            };

            fetch('/api/goals/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: categoryName,
                    filename: filename,
                    data: payload
                })
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(`Successfully saved ${labelName} in the database/goals/${categoryName} directory!`);

                        // Reset locally and in storage
                        if (currentTab === 'weekly') {
                            weekGoals = [];
                            localStorage.setItem(storageKey, '[]');
                        } else if (currentTab === 'long') {
                            longGoals = [];
                            localStorage.setItem(storageKey, '[]');
                        } else if (currentTab === 'desires') {
                            desires = [];
                            localStorage.setItem(storageKey, '[]');
                        }

                        renderRegistry();
                    } else {
                        alert(`Failed to save ${labelName}: ` + (res.error || 'Unknown error'));
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

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
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

    // ── COMMITMENT REGISTRY IN SETTINGS ──
    const addCommitmentForm = document.getElementById('add-commitment-form');
    if (addCommitmentForm) {
        addCommitmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const titleInput = document.getElementById('commitment-title');
            const whyInput = document.getElementById('commitment-why');
            const categoryInput = document.getElementById('commitment-category');

            const title = titleInput ? titleInput.value.trim() : '';
            const why = whyInput ? whyInput.value.trim() : '';
            const category = categoryInput ? categoryInput.value.trim() : '';

            if (!title || !why || !category) return;

            // Load existing commitments, push new one, and save
            fetch('/api/reflection/load?type=commitments')
                .then(res => res.json())
                .then(data => {
                    commitments = Array.isArray(data) ? data : [];

                    const options = { day: 'numeric', month: 'short', year: 'numeric' };
                    const formattedDate = new Date().toLocaleDateString('en-US', options);

                    const newCommitment = {
                        id: 'commit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        title: title,
                        why: why,
                        category: category,
                        started: formattedDate,
                        lastTouched: formattedDate,
                        status: 'In Progress',
                        progress: []
                    };

                    commitments.push(newCommitment);

                    // Save to backend
                    return fetch('/api/reflection/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'commitments', data: commitments })
                    });
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert('Sacred commitment successfully bound! You can track progress and daily check-ins on the Reflection page.');
                        localStorage.setItem('scriptorium_commitments', JSON.stringify(commitments));
                        if (titleInput) titleInput.value = '';
                        if (whyInput) whyInput.value = '';
                        if (categoryInput) categoryInput.value = '';
                        if (statusInput) statusInput.value = 'In Progress';
                        populateCommitmentDropdown();
                        renderCommitmentsTabList();
                        renderRegistry();
                    } else {
                        alert('Failed to save commitment: ' + (res.error || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error("Error creating commitment in settings:", err);
                    alert("Error connecting to the server: " + err.message);
                });
        });
    }

    // ── DATABASE PATH CONFIGURATOR ──
    const dbPathInput = document.getElementById('settings-db-path-input');
    const dbPathSaveBtn = document.getElementById('settings-db-path-save-btn');

    if (dbPathInput && dbPathSaveBtn) {
        // Fetch current path
        fetch('/api/settings/database-path')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.databasePath) {
                    dbPathInput.value = data.databasePath;
                }
            })
            .catch(err => console.error("Error loading database path:", err));

        // Save path handler
        dbPathSaveBtn.addEventListener('click', () => {
            const customPath = dbPathInput.value.trim();
            if (!customPath) {
                alert("Please provide a valid database directory path!");
                return;
            }

            if (confirm(`Are you sure you want to change the database folder location to:\n${customPath}\n\nExisting files will be migrated to the new location.`)) {
                fetch('/api/settings/database-path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ databasePath: customPath })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert(`Database folder location successfully updated!\n\nActive Database Path:\n${data.databasePath}`);
                            dbPathInput.value = data.databasePath;
                        } else {
                            alert('Failed to update database path: ' + (data.error || 'Unknown error'));
                        }
                    })
                    .catch(err => {
                        console.error("Error saving database path:", err);
                        alert("Error connecting to the server: " + err.message);
                    });
            }
        });
    }

    // ── WHO I AM CONFIGURATION LOADER & SAVER ──
    const whoamiBioInput = document.getElementById('settings-whoami-bio');
    const whoamiGoodInput = document.getElementById('settings-whoami-good');
    const whoamiImprovementsInput = document.getElementById('settings-whoami-improvements');
    const whoamiSaveBtn = document.getElementById('settings-whoami-save-btn');

    const defaultBio = "Driven by an insatiable curiosity and an enduring passion for creating beautiful digital experiences. I believe that technical mastery should always walk hand-in-hand with empathy, visual elegance, and clarity of purpose.";

    const defaultGoodAt = [
        "UI & Visual Craftsmanship",
        "Logical Problem Solving",
        "Empathetic Collaboration",
        "Meticulous Tidiness"
    ];

    const defaultImprovements = [
        "Perfectionist Over-refining",
        "Context Segmentation",
        "Velocity Balance",
        "Deep Post-Mortems"
    ];

    function loadWhoAmISettings() {
        if (!whoamiBioInput || !whoamiGoodInput || !whoamiImprovementsInput) return;

        fetch('/api/reflection/load?type=whoami')
            .then(res => res.json())
            .then(data => {
                if (data && !Array.isArray(data) && data.bio) {
                    whoamiBioInput.value = data.bio;
                    whoamiGoodInput.value = Array.isArray(data.goodAt) ? data.goodAt.join('\n') : "";
                    whoamiImprovementsInput.value = Array.isArray(data.improvements) ? data.improvements.join('\n') : "";
                    localStorage.setItem('scriptorium_whoami', JSON.stringify(data));
                } else {
                    // Populate with defaults
                    whoamiBioInput.value = defaultBio;
                    whoamiGoodInput.value = defaultGoodAt.join('\n');
                    whoamiImprovementsInput.value = defaultImprovements.join('\n');
                }
            })
            .catch(err => {
                console.warn("Failed to load Who I Am settings from server, loading from cache:", err);
                const cached = localStorage.getItem('scriptorium_whoami');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        whoamiBioInput.value = parsed.bio || defaultBio;
                        whoamiGoodInput.value = Array.isArray(parsed.goodAt) ? parsed.goodAt.join('\n') : defaultGoodAt.join('\n');
                        whoamiImprovementsInput.value = Array.isArray(parsed.improvements) ? parsed.improvements.join('\n') : defaultImprovements.join('\n');
                    } catch (e) {
                        whoamiBioInput.value = defaultBio;
                        whoamiGoodInput.value = defaultGoodAt.join('\n');
                        whoamiImprovementsInput.value = defaultImprovements.join('\n');
                    }
                } else {
                    whoamiBioInput.value = defaultBio;
                    whoamiGoodInput.value = defaultGoodAt.join('\n');
                    whoamiImprovementsInput.value = defaultImprovements.join('\n');
                }
            });
    }

    if (whoamiSaveBtn) {
        whoamiSaveBtn.addEventListener('click', () => {
            const bio = whoamiBioInput.value.trim();
            const goodAt = whoamiGoodInput.value.split('\n').map(x => x.trim()).filter(Boolean);
            const improvements = whoamiImprovementsInput.value.split('\n').map(x => x.trim()).filter(Boolean);

            if (!bio) {
                alert("Core biography quote cannot be empty!");
                return;
            }

            const payload = { bio, goodAt, improvements };

            // Save to Backend
            fetch('/api/reflection/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'whoami', data: payload })
            })
                .then(res => res.json())
                .then(result => {
                    if (result && result.success) {
                        alert('Who I Am Portrait successfully saved to database!');
                        localStorage.setItem('scriptorium_whoami', JSON.stringify(payload));

                        // Play satisfying rustle sound
                        if (typeof playPaperRustleSound === 'function') {
                            playPaperRustleSound();
                        }
                    } else {
                        alert('Failed to save settings: ' + (result.error || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error("Failed to save Who I Am settings:", err);
                    alert("Error connecting to server: " + err.message);
                });
        });
    }

    // Load Who I Am values
    loadWhoAmISettings();

    // Init
    setActiveTab('weekly');
});
