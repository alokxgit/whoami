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

        // Group commitments by category
        const groups = {};
        commitments.forEach(item => {
            const cat = item.category || 'General';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(item);
        });

        // Render each category group
        Object.keys(groups).forEach(category => {
            const groupSection = document.createElement('div');
            groupSection.className = 'category-group-section';

            const h3 = document.createElement('h3');
            h3.className = 'category-group-title';
            h3.textContent = category;
            groupSection.appendChild(h3);

            const ul = document.createElement('ul');
            ul.className = 'commitments-list';

            groups[category].forEach(item => {
                const li = document.createElement('li');
                li.className = `commitment-card ${item.status.toLowerCase().replace(' ', '-')}`;
                
                li.innerHTML = `
                    <div class="commitment-card-header">
                        <span class="commitment-title-text">${escapeHtml(item.title)}</span>
                        <button class="commitment-delete-btn" data-id="${item.id}" title="Sever this commitment">🗑️</button>
                    </div>
                    <div class="commitment-why-text"><strong>Why:</strong> "${escapeHtml(item.why)}"</div>
                    <div class="commitment-dates-row">
                        <span><strong>Started:</strong> ${item.started}</span>
                        <span><strong>Last touched:</strong> <span class="touched-date">${item.lastTouched || 'Never'}</span></span>
                    </div>
                    <div class="commitment-status-control">
                        <label class="status-label">Status:</label>
                        <select class="commitment-status-select" data-id="${item.id}">
                            <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>🎯 In Progress</option>
                            <option value="Abandoned" ${item.status === 'Abandoned' ? 'selected' : ''}>🥀 Abandoned</option>
                            <option value="Done" ${item.status === 'Done' ? 'selected' : ''}>🏆 Done</option>
                        </select>
                    </div>
                `;
                ul.appendChild(li);
            });

            groupSection.appendChild(ul);
            commitmentsListEl.appendChild(groupSection);
        });

        // Add Event Listeners for inline changes
        document.querySelectorAll('.commitment-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                const item = commitments.find(x => x.id === id);
                if (item) {
                    item.status = newStatus;
                    item.lastTouched = getFormattedDate(); // Auto update Last Touched date
                    saveCommitments();
                    renderCommitments();
                }
            });
        });

        document.querySelectorAll('.commitment-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm("Are you sure you want to sever/remove this commitment? All check-ins will remain, but the active binding will be deleted.")) {
                    commitments = commitments.filter(x => x.id !== id);
                    saveCommitments();
                    renderCommitments();
                    populateCheckinSelect();
                }
            });
        });
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
        return text.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
    }

    // ── RUN INITIALIZATION ──
    loadData();
});
