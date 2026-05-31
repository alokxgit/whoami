/* ==========================================================================
   REFLECTION PAGE INTERACTION SCRIPT
   Tracks Active Commitments and Daily Check-ins with file-based persistence.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE VARIABLES ──
    let commitments = [];
    let checkins = [];

    // ── DOM ELEMENTS ──
    const addCommitmentForm = document.getElementById('add-commitment-form');
    const commitmentTitleInput = document.getElementById('commitment-title');
    const commitmentWhyInput = document.getElementById('commitment-why');
    const commitmentStatusInput = document.getElementById('commitment-status');
    const commitmentsListEl = document.getElementById('commitments-list');

    const checkinForm = document.getElementById('checkin-form');
    const checkinSelect = document.getElementById('checkin-commitment-select');
    const checkinNotesInput = document.getElementById('checkin-notes');
    const checkinForwardInput = document.getElementById('checkin-forward');
    const checkinsListEl = document.getElementById('checkins-list');
    const ynButtons = document.querySelectorAll('.yn-btn');

    // ── DATE FORMATTER ──
    function getFormattedDate() {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date().toLocaleDateString('en-US', options); // e.g. "31 May 2026"
    }

    // Populate date badges dynamically
    const dayBadge = document.querySelector('.page-date-badge .day-number');
    const monthBadge = document.querySelector('.page-date-badge .month');
    const yearBadge = document.querySelector('.page-date-badge .year');
    if (dayBadge && monthBadge && yearBadge) {
        const d = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        dayBadge.textContent = d.getDate();
        monthBadge.textContent = months[d.getMonth()];
        yearBadge.textContent = d.getFullYear();
    }

    // ── LOADING DATA FROM DATABASE ──
    function loadData() {
        // Load Commitments
        fetch('/api/reflection/load?type=commitments')
            .then(res => res.json())
            .then(data => {
                commitments = Array.isArray(data) ? data : [];
                renderCommitments();
                populateCheckinSelect();
            })
            .catch(err => {
                console.error("Failed to load commitments:", err);
                // Fallback to localStorage
                commitments = JSON.parse(localStorage.getItem('scriptorium_commitments')) || [];
                renderCommitments();
                populateCheckinSelect();
            });

        // Load Check-ins
        fetch('/api/reflection/load?type=checkins')
            .then(res => res.json())
            .then(data => {
                checkins = Array.isArray(data) ? data : [];
                renderCheckins();
            })
            .catch(err => {
                console.error("Failed to load check-ins:", err);
                // Fallback to localStorage
                checkins = JSON.parse(localStorage.getItem('scriptorium_checkins')) || [];
                renderCheckins();
            });

        // Load Who I Am Portrait Data
        fetch('/api/reflection/load?type=whoami')
            .then(res => res.json())
            .then(data => {
                if (data && !Array.isArray(data) && data.bio) {
                    renderWhoAmI(data);
                    localStorage.setItem('scriptorium_whoami', JSON.stringify(data));
                } else {
                    renderWhoAmIDefaults();
                }
            })
            .catch(err => {
                console.warn("Failed to load Who I Am data from server, loading from cache:", err);
                const cached = localStorage.getItem('scriptorium_whoami');
                if (cached) {
                    try {
                        renderWhoAmI(JSON.parse(cached));
                    } catch (e) {
                        renderWhoAmIDefaults();
                    }
                } else {
                    renderWhoAmIDefaults();
                }
            });
    }

    // ── SAVING DATA TO DATABASE ──
    function saveCommitments() {
        // Local Cache
        localStorage.setItem('scriptorium_commitments', JSON.stringify(commitments));

        // Backend Save
        fetch('/api/reflection/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'commitments', data: commitments })
        })
            .catch(err => console.error("Error saving commitments to backend:", err));
    }

    function saveCheckins() {
        // Local Cache
        localStorage.setItem('scriptorium_checkins', JSON.stringify(checkins));

        // Backend Save
        fetch('/api/reflection/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'checkins', data: checkins })
        })
            .catch(err => console.error("Error saving check-ins to backend:", err));
    }

    // ── RENDERING COMMITMENTS (Left Page) ──
    function renderCommitments() {
        if (!commitmentsListEl) return;
        commitmentsListEl.innerHTML = '';

        if (commitments.length === 0) {
            commitmentsListEl.innerHTML = `<li class="empty-state-text">No active bindings. Create your first commitment on the Settings page.</li>`;
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'commitments-list';

        commitments.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `commitment-card`;

            const progressContent = (item.progress && item.progress.length > 0)
                ? `<div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
                     ${item.progress.map((p, idx) => `
                       <span class="progress-step-pill" style="display:inline-flex; align-items:center; background:transparent; border:none; padding:3px 10px; border-radius:5px; font-family:var(--f-hand); font-size:0.95rem; color:var(--ink); font-weight:500;">
                         ✓ ${escapeHtml(p.text)}
                       </span>
                       ${idx < item.progress.length - 1 ? '<span style="color:var(--terracotta); font-weight:bold; padding:0 3px;">➔</span>' : ''}
                     `).join('')}
                   </div>`
                : `<span style="color:var(--ink-muted); font-style:italic; font-family:var(--f-hand); font-size:0.92rem;">No progress steps recorded yet. Complete connected weekly goals to add steps!</span>`;

            li.innerHTML = `
                <div class="commitment-card-header" style="margin-bottom: 0.4rem;">
                    <span class="commitment-title-text" style="font-size: 1.25rem; color: var(--terracotta); font-weight: 900; font-family: var(--f-head);">${index + 1}. ${escapeHtml(item.title)}</span>
                </div>
                <div class="commitment-why-text" style="font-family: var(--f-hand); font-size: 1.05rem; margin-bottom: 0.4rem;"><strong>Why:</strong> ${escapeHtml(item.why)}</div>
                <div class="commitment-dates-row" style="margin-bottom:0.8rem; font-size: 0.8rem; opacity: 0.8;">
                    <span><strong>Started:</strong> ${item.started}</span>
                    <span><strong>Last touched:</strong> <span class="touched-date">${item.lastTouched || 'Never'}</span></span>
                </div>
                
                <details class="commitment-progress-faq" style="cursor:pointer; outline:none; margin-top:0.8rem; background:transparent; border-radius:6px; padding:0.6rem 0.8rem;">
                    <summary style="font-family:var(--f-head); font-size:0.78rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--terracotta); font-weight:700; list-style:none; display:flex; align-items:center; justify-content:space-between; outline:none; user-select:none;">
                        <span style="display:flex; align-items:center; gap:0.3rem;">
                            <span style="letter-spacing: 0.06em;">Progress Steps</span>
                        </span>
                        <span class="faq-toggle-icon" style="font-size:0.75rem; color:var(--terracotta); transition:transform 0.2s ease;">▶</span>
                    </summary>
                    <div class="faq-content" style="margin-top:0.6rem; padding-top:0.5rem; border-top:1px dashed rgba(229,195,106,0.25); line-height:1.4;">
                        ${progressContent}
                    </div>
                </details>
            `;
            ul.appendChild(li);
        });

        commitmentsListEl.appendChild(ul);
    }

    // ── POPULATING CHECK-IN COMMITMENT DROP-DOWN (Right Page) ──
    function populateCheckinSelect() {
        if (!checkinSelect) return;

        // Save current selection to restore after populating
        const currentVal = checkinSelect.value;

        checkinSelect.innerHTML = `<option value="" disabled selected>Select a commitment...</option>`;

        // Only list commitments that are "In Progress"
        const activeOnes = commitments.filter(c => c.status === 'In Progress');

        activeOnes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.title;
            checkinSelect.appendChild(opt);
        });

        if (currentVal && activeOnes.some(c => c.id === currentVal)) {
            checkinSelect.value = currentVal;
        }
    }

    // ── RENDERING PROGRESS CHECK-INS LEDGER (Right Page) ──
    function renderCheckins() {
        if (!checkinsListEl) return;
        checkinsListEl.innerHTML = '';

        if (checkins.length === 0) {
            checkinsListEl.innerHTML = `<div class="empty-state-text">No progress records yet. Submit a check-in above.</div>`;
            return;
        }

        // Sort checkins by date desc or time order
        const sorted = [...checkins].reverse();

        sorted.forEach(item => {
            const card = document.createElement('div');
            card.className = `checkin-ledger-item ${item.forward === 'Yes' ? 'forward-yes' : 'forward-no'}`;

            card.innerHTML = `
                <div class="checkin-meta-row">
                    <span class="checkin-date">${item.date}</span>
                    <span class="checkin-badge ${item.forward === 'Yes' ? 'badge-yes' : 'badge-no'}">
                        ${item.forward === 'Yes' ? '✨ Progressed' : '⏳ Stagnant'}
                    </span>
                </div>
                <div class="checkin-title"><strong>Task:</strong> ${escapeHtml(item.commitmentTitle)}</div>
                <div class="checkin-honest-line">"${escapeHtml(item.notes)}"</div>
            `;
            checkinsListEl.appendChild(card);
        });
    }

    // ── HANDLING ADDING COMMITMENTS ──
    if (addCommitmentForm) {
        addCommitmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = commitmentTitleInput.value.trim();
            const why = commitmentWhyInput.value.trim();
            const status = commitmentStatusInput.value;

            if (!title || !why) return;

            const newCommitment = {
                id: 'commit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                title: title,
                why: why,
                started: getFormattedDate(),
                lastTouched: getFormattedDate(),
                status: status
            };

            commitments.push(newCommitment);
            saveCommitments();
            renderCommitments();
            populateCheckinSelect();

            // Reset Form fields
            commitmentTitleInput.value = '';
            commitmentWhyInput.value = '';
            commitmentStatusInput.value = 'In Progress';
        });
    }

    // ── YES/NO SELECTION INTERACTION ──
    ynButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ynButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (checkinForwardInput) {
                checkinForwardInput.value = btn.dataset.val;
            }
        });
    });

    // ── HANDLING CHECK-IN SUBMISSION ──
    if (checkinForm) {
        checkinForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const commitmentId = checkinSelect.value;
            const forward = checkinForwardInput ? checkinForwardInput.value : 'Yes';
            const notes = checkinNotesInput.value.trim();

            if (!commitmentId || !notes) {
                alert('Please select a commitment and provide an honest note!');
                return;
            }

            const commitment = commitments.find(c => c.id === commitmentId);
            if (!commitment) return;

            // Update Commitment's Last Touched date
            commitment.lastTouched = getFormattedDate();
            saveCommitments();
            renderCommitments();

            const newCheckin = {
                id: 'checkin_' + Date.now(),
                date: getFormattedDate(),
                commitmentId: commitmentId,
                commitmentTitle: commitment.title,
                forward: forward,
                notes: notes
            };

            checkins.push(newCheckin);
            saveCheckins();
            renderCheckins();

            // Reset check-in input note
            checkinNotesInput.value = '';
            alert('Progress recorded successfully in the ledger!');
        });
    }

    // ── HELPER: ESCAPE HTML ──
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }

    // ── WHO I AM RENDERING ENGINE ──
    const defaultBio = "Welcome to your Core Biography. This section is a space to capture your personal philosophy, core values, or a quote that defines your current stage of life. Use it to state who you are, what drives you, and what rules you live by.";

    const defaultGoodAt = [
        "This section is for your core strengths and craftsmanship skills (one item per line).",
        "What are your natural talents and abilities?",
        "Which technical or creative skills have you spent years mastering?",
        "What kind of problems or tasks do you solve best?"
    ];

    const defaultImprovements = [
        "This section is for your core areas of growth and improvement goals (one item per line).",
        "What habits or tendencies are currently holding you back?",
        "Which skills or concepts are you actively trying to develop?",
        "Where do you want to build more discipline or focus?"
    ];

    function renderWhoAmIDefaults() {
        renderWhoAmI({ bio: defaultBio, goodAt: defaultGoodAt, improvements: defaultImprovements });
    }

    function renderWhoAmI(data) {
        const bioEl = document.querySelector('.whoami-bio .bio-text');
        const goodListEl = document.querySelector('.split-left .split-list');
        const improvementsListEl = document.querySelector('.split-right .split-list');

        if (bioEl && data.bio) {
            bioEl.textContent = `"${data.bio}"`;
        }

        if (goodListEl && Array.isArray(data.goodAt)) {
            goodListEl.innerHTML = data.goodAt.map(item => {
                const parts = item.split(':');
                if (parts.length > 1) {
                    const title = parts[0];
                    const desc = parts.slice(1).join(':');
                    return `<li><strong>${escapeHtml(title)}:</strong>${escapeHtml(desc)}</li>`;
                }
                return `<li>${escapeHtml(item)}</li>`;
            }).join('');
        }

        if (improvementsListEl && Array.isArray(data.improvements)) {
            improvementsListEl.innerHTML = data.improvements.map(item => {
                const parts = item.split(':');
                if (parts.length > 1) {
                    const title = parts[0];
                    const desc = parts.slice(1).join(':');
                    return `<li><strong>${escapeHtml(title)}:</strong>${escapeHtml(desc)}</li>`;
                }
                return `<li>${escapeHtml(item)}</li>`;
            }).join('');
        }
    }

    // ── RUN INITIALIZATION ──
    loadData();

    // ── PROFILE PICTURE LOADER & UPDATER ──
    const profileFrameBtn = document.getElementById('profile-frame-btn');
    const profileFileInput = document.getElementById('profile-file-input');
    const profileDisplayImg = document.getElementById('profile-display-img');
    
    // A premium gold-accented classical traveler silhouette SVG for whoami's aesthetic
    const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%2327272a' stroke='%23e5c36a' stroke-width='2.5'/><circle cx='50' cy='45' r='16' fill='%23e5c36a'/><path d='M50 65c-18 0-28 8-28 16v3h56v-3c0-8-10-16-28-16z' fill='%23e5c36a'/></svg>";

    // Load existing profile picture from Local Cache or Server Settings
    function loadProfilePicture() {
        if (!profileDisplayImg) return;

        // Ensure robust error handling if the file image fails to load
        profileDisplayImg.addEventListener('error', () => {
            profileDisplayImg.src = DEFAULT_AVATAR;
        });

        // 1. Check local cache first for instant load
        const cachedPic = localStorage.getItem('scriptorium_profile_picture');
        if (cachedPic && cachedPic !== '../../shared/images/default_portrait.png') {
            profileDisplayImg.src = cachedPic;
        } else {
            profileDisplayImg.src = DEFAULT_AVATAR;
        }

        // 2. Fetch from DB config
        fetch('/api/settings')
            .then(res => res.json())
            .then(settings => {
                if (settings && settings.scriptorium_profile_picture) {
                    profileDisplayImg.src = settings.scriptorium_profile_picture;
                    localStorage.setItem('scriptorium_profile_picture', settings.scriptorium_profile_picture);
                } else {
                    profileDisplayImg.src = DEFAULT_AVATAR;
                }
            })
            .catch(e => {
                console.warn("Failed to sync profile picture settings:", e);
                if (!profileDisplayImg.src || profileDisplayImg.src.includes('default_portrait.png')) {
                    profileDisplayImg.src = DEFAULT_AVATAR;
                }
            });
    }

    if (profileFrameBtn && profileFileInput && profileDisplayImg) {
        // Trigger file select on clicking frame
        profileFrameBtn.addEventListener('click', () => {
            profileFileInput.click();
        });

        // Handle selected image file
        profileFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Ensure it is an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64Data = event.target.result;

                // Show instant preview
                profileDisplayImg.src = base64Data;

                // Play loading paper rustle sound
                if (typeof playPaperRustleSound === 'function') {
                    playPaperRustleSound();
                }

                // Upload to Server
                fetch('/api/kb/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        data: base64Data
                    })
                })
                    .then(res => res.json())
                    .then(result => {
                        if (result && result.success && result.url) {
                            const uploadedUrl = result.url;

                            // Update display and caches
                            profileDisplayImg.src = uploadedUrl;
                            localStorage.setItem('scriptorium_profile_picture', uploadedUrl);

                            // Save to backend configuration
                            fetch('/api/settings/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ scriptorium_profile_picture: uploadedUrl })
                            })
                                .then(() => {
                                    // Play success audio indicator
                                    if (typeof playPaperRustleSound === 'function') {
                                        playPaperRustleSound();
                                    }
                                })
                                .catch(err => console.error("Error saving profile setting to backend:", err));
                        } else {
                            throw new Error("Upload failed: " + (result.error || "unknown error"));
                        }
                    })
                    .catch(err => {
                        console.error("Profile picture upload failed:", err);
                        alert("Could not upload profile picture: " + err.message);
                    });
            };
            reader.readAsDataURL(file);
        });
    }

    // Load profile portrait
    loadProfilePicture();
});
