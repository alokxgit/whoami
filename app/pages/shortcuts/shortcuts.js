document.addEventListener('DOMContentLoaded', () => {
    // Premium metadata for nice display
    const vimMeta = {
        move_left: { label: "Move Cursor Left", desc: "Move cursor to the left by one character" },
        move_down: { label: "Move Cursor Down", desc: "Move cursor down by one line" },
        move_up: { label: "Move Cursor Up", desc: "Move cursor up by one line" },
        move_right: { label: "Move Cursor Right", desc: "Move cursor to the right by one character" },
        word_forward: { label: "Word Forward", desc: "Jump cursor to the start of the next word" },
        word_backward: { label: "Word Backward", desc: "Jump cursor to the start of the previous word" },
        line_start: { label: "Go to Line Start", desc: "Jump cursor to the start of the current line" },
        line_end: { label: "Go to Line End", desc: "Jump cursor to the end of the current line" },
        insert_mode: { label: "Insert Mode", desc: "Enter insert mode at current cursor position" },
        append_mode: { label: "Append Mode", desc: "Move forward one character and enter insert mode" },
        open_below: { label: "Open Line Below", desc: "Insert a new line below and enter insert mode" },
        open_above: { label: "Open Line Above", desc: "Insert a new line above and enter insert mode" },
        visual_mode: { label: "Visual Mode", desc: "Toggle character-based selection mode" },
        yank: { label: "Yank Selection", desc: "Copy current selection to the clipboard" },
        paste: { label: "Paste Text", desc: "Insert clipboard content at current position" },
        delete_char: { label: "Delete Character", desc: "Delete the character at the current cursor" },
        undo: { label: "Undo Edit", desc: "Revert the last text modification" },
        delete_action: { label: "Delete Command", desc: "Action to delete current selection or lines" },
        doc_start: { label: "Go to Doc Start", desc: "g + g: Jump cursor to the start of the editor" },
        doc_end: { label: "Go to Doc End", desc: "Jump cursor to the end of the editor" },
        word_end: { label: "Word End", desc: "Move cursor to the end of the current word" },
        change_mode: { label: "Change Command", desc: "Delete selection or cc to change current line" },
        replace_char: { label: "Replace Character", desc: "r + [char]: Replace single character under cursor or visual selection with the character typed" }
    };

    const navMeta = {
        nav_reflection: { label: "Reflection Spread", desc: "Navigate to Section I: Daily Reflection" },
        nav_goals: { label: "Goals & Tasks", desc: "Navigate to Section II: Goals & Daily Ledger" },
        nav_journal: { label: "Personal Journal", desc: "Navigate to Section III: Daily Chronicles" },
        nav_kb: { label: "Knowledge Almanac", desc: "Navigate to Section IV: Knowledge Almanac" },
        nav_settings: { label: "System Settings", desc: "Navigate to Section V: Settings spread" },
        nav_shortcuts: { label: "Shortcuts Rail", desc: "Navigate to Section VI: Shortcuts Console" },
        nav_close: { label: "Close Ledger", desc: "Close the journal and return to lobby cover" }
    };

    let currentShortcuts = {
        vim: {},
        nav: {}
    };

    const vimGrid = document.getElementById('vim-shortcuts-grid');
    const navGrid = document.getElementById('nav-shortcuts-grid');
    const saveBtn = document.getElementById('save-shortcuts-btn');
    const resetBtn = document.getElementById('reset-defaults-btn');
    const toast = document.getElementById('shortcuts-toast');
    const toastMessage = toast.querySelector('.toast-message');

    let activeInput = null;

    // Load keybindings from API
    async function loadKeybindings() {
        try {
            const res = await fetch('/api/settings/shortcuts');
            if (res.ok) {
                const data = await res.json();
                currentShortcuts = data;
                renderShortcuts();
            } else {
                showToast("Failed to fetch keybindings from server.", "⚠️");
            }
        } catch (e) {
            console.error("Error loading keybindings:", e);
            showToast("Server connection error while loading keybindings.", "⚠️");
        }
    }

    // Render keybinding elements dynamically
    function renderShortcuts() {
        vimGrid.innerHTML = '';
        navGrid.innerHTML = '';

        // Render Vim keybindings
        Object.entries(vimMeta).forEach(([key, meta]) => {
            const val = currentShortcuts.vim[key] || '';
            const row = createShortcutRow(key, meta, val, 'vim');
            vimGrid.appendChild(row);
        });

        // Render Navigation keybindings
        Object.entries(navMeta).forEach(([key, meta]) => {
            const val = currentShortcuts.nav[key] || '';
            const row = createShortcutRow(key, meta, val, 'nav');
            navGrid.appendChild(row);
        });
    }

    // Helper to create a configuration row
    function createShortcutRow(key, meta, val, type) {
        const row = document.createElement('div');
        row.className = 'shortcut-row';

        const info = document.createElement('div');
        info.className = 'shortcut-info';

        const label = document.createElement('h3');
        label.className = 'shortcut-label';
        label.textContent = meta.label;

        const desc = document.createElement('p');
        desc.className = 'shortcut-desc';
        desc.textContent = meta.desc;

        info.appendChild(label);
        info.appendChild(desc);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'shortcut-input';
        input.value = val;
        input.readOnly = true;
        input.setAttribute('data-key', key);
        input.setAttribute('data-type', type);

        // Bind recording events
        input.addEventListener('click', (e) => startRecording(input, e));

        row.appendChild(info);
        row.appendChild(input);

        return row;
    }

    // Start recording state for selected input field
    function startRecording(input, e) {
        e.stopPropagation();

        if (activeInput) {
            stopRecording(activeInput);
        }

        activeInput = input;
        input.classList.add('recording');
        input.value = '[Press key...]';
        input.focus();

        // Attach listener to capture next keystroke
        window.addEventListener('keydown', captureKeystroke, true);
    }

    // Stop recording and restore state
    function stopRecording(input) {
        input.classList.remove('recording');
        const key = input.getAttribute('data-key');
        const type = input.getAttribute('data-type');
        input.value = currentShortcuts[type][key] || '';
        input.blur();
        activeInput = null;
        window.removeEventListener('keydown', captureKeystroke, true);
    }

    // Capture keystroke and format accordingly
    function captureKeystroke(e) {
        if (!activeInput) return;

        e.preventDefault();
        e.stopPropagation();

        const key = activeInput.getAttribute('data-key');
        const type = activeInput.getAttribute('data-type');

        // Escape cancels recording
        if (e.key === 'Escape') {
            stopRecording(activeInput);
            return;
        }

        if (type === 'vim') {
            // Vim commands must be single characters and no modifiers
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return;
            }
            if (e.key.length === 1) {
                const newKey = e.key;
                currentShortcuts.vim[key] = newKey;
                activeInput.value = newKey;
                activeInput.classList.remove('recording');
                activeInput.blur();
                const temp = activeInput;
                activeInput = null;
                window.removeEventListener('keydown', captureKeystroke, true);
                showToast(`Editorial motion mapping set to "${newKey}".`, "✨");
            }
        } else {
            // Global navigation commands - standard modifiers can be pressed
            const ignoredKeys = ['control', 'alt', 'shift', 'meta', 'capslock', 'tab', 'backspace'];
            if (ignoredKeys.includes(e.key.toLowerCase())) {
                return; // Wait for the main key
            }

            const parts = [];
            if (e.ctrlKey) parts.push('Ctrl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');
            if (e.metaKey) parts.push('Meta');

            let mainKey = e.key;
            if (mainKey === ' ') mainKey = 'Space';
            
            // Normalize key standard representations
            if (mainKey.length === 1) {
                mainKey = mainKey.toLowerCase();
            }

            parts.push(mainKey);
            const formatted = parts.join('+');

            currentShortcuts.nav[key] = formatted;
            activeInput.value = formatted;
            activeInput.classList.remove('recording');
            activeInput.blur();
            const temp = activeInput;
            activeInput = null;
            window.removeEventListener('keydown', captureKeystroke, true);
            showToast(`Navigation shortcut mapping set to "${formatted}".`, "✨");
        }
    }

    // Cancel recording if clicking elsewhere
    document.addEventListener('click', () => {
        if (activeInput) {
            stopRecording(activeInput);
        }
    });

    // Save keybindings to database
    saveBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/settings/shortcuts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentShortcuts)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success || data.status === 'success') {
                    // Update local storage so that engine can pick it up immediately
                    localStorage.setItem('scriptorium_nav_shortcuts', JSON.stringify(currentShortcuts.nav));
                    localStorage.setItem('scriptorium_vim_shortcuts', JSON.stringify(currentShortcuts.vim));

                    showToast("Keybindings permanently persisted to your ledger.", "✨");
                } else {
                    showToast("Could not persist keybindings.", "⚠️");
                }
            } else {
                showToast("Server rejection when saving keybindings.", "⚠️");
            }
        } catch (e) {
            console.error("Save error:", e);
            showToast("Failed to connect to the persistence service.", "⚠️");
        }
    });

    // Reset default keybindings
    resetBtn.addEventListener('click', async () => {
        const defaults = {
            vim: {
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
            },
            nav: {
                nav_reflection: "Alt+r",
                nav_goals: "Alt+g",
                nav_journal: "Alt+j",
                nav_kb: "Alt+k",
                nav_settings: "Alt+s",
                nav_shortcuts: "Alt+c",
                nav_close: "Alt+x"
            }
        };

        currentShortcuts = defaults;
        renderShortcuts();
        showToast("Keybindings reverted to original defaults.", "✨");
    });

    // Premium Toast trigger
    let toastTimeout = null;
    function showToast(message, icon = "✨") {
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastMessage.textContent = message;
        toast.querySelector('.toast-icon').textContent = icon;
        toast.classList.add('show');

        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Initial load
    loadKeybindings();
});
