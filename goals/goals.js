/* ==========================================================================
   GOALS & DAILY CHECKLIST PAGE INTERACTION SCRIPT
   Handles daily checklists, task priority filtering, and ambition tracker
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE ──
    let goals      = JSON.parse(localStorage.getItem('scriptorium_goals'))      || [];
    let activities = JSON.parse(localStorage.getItem('scriptorium_activities')) || [];
    let currentFilter = 'all';

    // ── DOM ──
    const goalForm       = document.getElementById('goal-form');
    const goalInput      = document.getElementById('goal-input');
    const goalList       = document.getElementById('goal-list');
    const activityForm   = document.getElementById('activity-form');
    const activityInput  = document.getElementById('activity-input');
    const activityPriority = document.getElementById('activity-priority');
    const activityList   = document.getElementById('activity-list');
    const filterBtns     = document.querySelectorAll('.filter-btn');

    // ── RENDER GOALS ──
    function renderGoals() {
        if (!goalList) return;
        goalList.innerHTML = goals.length === 0
            ? `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.88rem;padding:1rem 0;">No goals yet. Add one above! ✨</li>`
            : goals.map(goal => `
            <li class="goal-item" data-id="${goal.id}">
                <div class="goal-item-header">
                    <span class="goal-text">${escapeHtml(goal.text)}</span>
                    <div class="goal-actions">
                        <button class="goal-action-btn decrement-goal-btn" data-id="${goal.id}" title="Decrease progress">−</button>
                        <button class="goal-action-btn increment-goal-btn" data-id="${goal.id}" title="Increase progress">+</button>
                        <button class="goal-action-btn delete-goal-btn" data-id="${goal.id}" title="Delete goal">🔥</button>
                    </div>
                </div>
                <div class="goal-progress-wrap">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width:${goal.progress || 0}%"></div>
                    </div>
                    <div class="goal-progress-label">${goal.progress || 0}% complete</div>
                </div>
            </li>`).join('');
    }

    // ── RENDER ACTIVITIES ──
    function renderActivities() {
        if (!activityList) return;
        const filtered = activities.filter(act => {
            if (currentFilter === 'all')  return true;
            if (currentFilter === 'todo') return !act.done;
            if (currentFilter === 'done') return act.done;
            return true;
        });
        activityList.innerHTML = filtered.length === 0
            ? `<li style="text-align:center;color:var(--ink-muted);font-family:var(--f-hand);font-size:0.88rem;padding:0.8rem 0;">Nothing here yet!</li>`
            : filtered.map(act => `
            <li class="activity-item ${act.done ? 'done' : ''}" data-id="${act.id}">
                <input type="checkbox" class="activity-checkbox" data-id="${act.id}" ${act.done ? 'checked' : ''}>
                <span class="activity-text">${escapeHtml(act.text)}</span>
                <span class="priority-dot priority-${act.priority || 'medium'}"></span>
                <div class="activity-actions">
                    <button class="delete-activity-btn" data-id="${act.id}" title="Delete task">✒️ Delete</button>
                </div>
            </li>`).join('');
    }

    // ── GOAL FORM ──
    if (goalForm) {
        goalForm.addEventListener('submit', e => {
            e.preventDefault();
            const text = goalInput.value.trim();
            if (!text) return;
            goals.push({ id: Date.now(), text, progress: 0 });
            localStorage.setItem('scriptorium_goals', JSON.stringify(goals));
            goalInput.value = '';
            renderGoals();
        });
    }

    // ── GOAL ACTIONS ──
    if (goalList) {
        goalList.addEventListener('click', e => {
            const id = parseInt(e.target.dataset.id);
            if (!id) return;
            const goal = goals.find(g => g.id === id);
            if (!goal) return;
            if (e.target.classList.contains('increment-goal-btn')) {
                goal.progress = Math.min(100, (goal.progress || 0) + 10);
            } else if (e.target.classList.contains('decrement-goal-btn')) {
                goal.progress = Math.max(0, (goal.progress || 0) - 10);
            } else if (e.target.classList.contains('delete-goal-btn')) {
                goals = goals.filter(g => g.id !== id);
            }
            localStorage.setItem('scriptorium_goals', JSON.stringify(goals));
            renderGoals();
        });
    }

    // ── ACTIVITY FORM ──
    if (activityForm) {
        activityForm.addEventListener('submit', e => {
            e.preventDefault();
            const text = activityInput.value.trim();
            if (!text) return;
            activities.push({
                id: Date.now(),
                text,
                priority: activityPriority ? activityPriority.value : 'medium',
                done: false
            });
            localStorage.setItem('scriptorium_activities', JSON.stringify(activities));
            activityInput.value = '';
            renderActivities();
        });
    }

    // ── ACTIVITY ACTIONS ──
    if (activityList) {
        activityList.addEventListener('click', e => {
            const id = parseInt(e.target.dataset.id);
            if (!id) return;
            if (e.target.classList.contains('activity-checkbox')) {
                const act = activities.find(a => a.id === id);
                if (act) { act.done = e.target.checked; }
            } else if (e.target.classList.contains('delete-activity-btn')) {
                activities = activities.filter(a => a.id !== id);
            }
            localStorage.setItem('scriptorium_activities', JSON.stringify(activities));
            renderActivities();
        });
    }

    // ── FILTER BUTTONS ──
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderActivities();
        });
    });

    // Init render
    renderGoals();
    renderActivities();

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
    }
});
