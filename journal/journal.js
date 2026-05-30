/* ==========================================================================
   JOURNAL SCRIPT - CHRONICLES SPREAD
   Handles debounced autosaving, word calculations, and quill text tracking
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const textarea       = document.getElementById('scrapbook-textarea');
    const wordCount      = document.getElementById('word-count');
    const autosaveStatus = document.getElementById('autosave-status');

    if (!textarea) return;

    // Load saved journal
    const saved = localStorage.getItem('scriptorium_journal');
    if (saved) textarea.value = saved;
    updateWordCount();

    function updateWordCount() {
        if (!wordCount) return;
        const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
        wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }

    function showAutosave(msg) {
        if (!autosaveStatus) return;
        autosaveStatus.textContent = msg;
        autosaveStatus.classList.add('visible');
        setTimeout(() => autosaveStatus.classList.remove('visible'), 2200);
    }

    let saveTimer;
    textarea.addEventListener('input', () => {
        updateWordCount();
        showAutosave('Ink drying...');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            localStorage.setItem('scriptorium_journal', textarea.value);
            showAutosave('Draft saved ✓');
        }, 1200);
    });
});
