/* ==========================================================================
   SETTINGS & DATA UTILITIES INTERACTION SCRIPT
   Handles ambient sound muting preferences and database backups & wipeout
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
                goals:      JSON.parse(localStorage.getItem('scriptorium_goals') || '[]'),
                activities: JSON.parse(localStorage.getItem('scriptorium_activities') || '[]'),
                journal:    localStorage.getItem('scriptorium_journal') || '',
                mindset:    localStorage.getItem('scriptorium_mindset') || '',
                layout:     localStorage.getItem('scriptorium_layout') || 'codex',
                exportedAt: new Date().toISOString()
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
                localStorage.removeItem('scriptorium_goals');
                localStorage.removeItem('scriptorium_activities');
                localStorage.removeItem('scriptorium_journal');
                localStorage.removeItem('scriptorium_mindset');
                alert('Journal data has been cleared.');
                window.location.href = '../index.html';
            }
        });
    }
});
