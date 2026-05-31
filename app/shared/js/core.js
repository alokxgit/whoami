/* ==========================================================================
   SHARED CORE ENGINE - THE SCRIPTORIUM
   Shared casing theme styles, date indicators, and Web Audio synthesizers
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // ── GLOBAL FONT SCALE INITIALIZATION ──
    function applyGlobalFontScale(scale) {
        document.documentElement.style.fontSize = scale;
        localStorage.setItem('scriptorium_global_font_scale', scale);
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptorium_global_font_scale: scale })
        }).catch(e => console.warn("DB settings save error:", e));
    }
    const savedScale = localStorage.getItem('scriptorium_global_font_scale') || '100%';
    applyGlobalFontScale(savedScale);
    window.applyGlobalFontScale = applyGlobalFontScale;

    // Specific Font Style Sizing Controls
    function applySpecificFontScale(style, val) {
        document.documentElement.style.setProperty(`--scale-${style}`, val);
        localStorage.setItem(`scriptorium_scale_${style}`, val);
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`scriptorium_scale_${style}`]: val })
        }).catch(e => console.warn("DB settings save error:", e));
    }
    window.applySpecificFontScale = applySpecificFontScale;

    // Load initial specific scales
    ['fancy', 'hand', 'head'].forEach(style => {
        const val = localStorage.getItem(`scriptorium_scale_${style}`) || '1.0';
        applySpecificFontScale(style, val);
    });

    // Specific Font Family Controls
    function applySpecificFontFamily(style, family) {
        document.documentElement.style.setProperty(`--font-${style}-family`, family);
        localStorage.setItem(`scriptorium_font_${style}`, family);
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`scriptorium_font_${style}`]: family })
        }).catch(e => console.warn("DB settings save error:", e));
    }
    window.applySpecificFontFamily = applySpecificFontFamily;

    // Load initial specific font families
    ['fancy', 'hand', 'head'].forEach(style => {
        const defaultFamily = style === 'fancy' ? "'Cinzel Decorative', serif" :
                              style === 'hand' ? "'Caveat', cursive" :
                                                "'Marcellus', serif";
        const val = localStorage.getItem(`scriptorium_font_${style}`) || defaultFamily;
        document.documentElement.style.setProperty(`--font-${style}-family`, val);
    });

    // ── DATE ──
    const dateNums   = document.querySelectorAll('.day-number');
    const dateMonths = document.querySelectorAll('.month');
    const dateYears  = document.querySelectorAll('.year');

    function updateDate() {
        const now = new Date();
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        dateNums.forEach(el   => { if (el) el.textContent = now.getDate(); });
        dateMonths.forEach(el => { if (el) el.textContent = months[now.getMonth()]; });
        dateYears.forEach(el  => { if (el) el.textContent = now.getFullYear(); });
    }
    updateDate();

    // ── CASING STYLE SWITCHER ──
    const layoutBtns = document.querySelectorAll('.switcher-btn');
    const themeCards = document.querySelectorAll('.theme-card-option');

    function applyLayout(layout) {
        body.className = body.className.replace(/layout-\w+/, `layout-${layout}`);
        if (!body.className.includes('layout-')) {
            body.classList.add(`layout-${layout}`);
        }
        layoutBtns.forEach(b => b.classList.toggle('active', b.dataset.layout === layout));
        themeCards.forEach(c => c.classList.toggle('active', c.dataset.layout === layout));
        localStorage.setItem('scriptorium_layout', layout);
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptorium_layout: layout })
        }).catch(e => console.warn(e));
    }

    function initLayout() {
        const saved = localStorage.getItem('scriptorium_layout') || 'codex';
        applyLayout(saved);
    }
    initLayout();

    layoutBtns.forEach(btn => {
        btn.addEventListener('click', () => applyLayout(btn.dataset.layout));
    });
    themeCards.forEach(card => {
        card.addEventListener('click', () => applyLayout(card.dataset.layout));
    });

    // ── PAGE TRANSITIONS ──
    const pageTransitionLinks = document.querySelectorAll('.bookmark-tab, .open-btn, .close-book-banner');
    pageTransitionLinks.forEach(link => {
        link.addEventListener('click', () => { playPaperRustleSound(); });
    });

    // Detect cover vs open-book state
    if (document.getElementById('book-cover-view')) {
        body.classList.remove('book-state-open');
        body.classList.add('book-state-closed');
    } else {
        body.classList.remove('book-state-closed');
        body.classList.add('book-state-open');
    }

    // ── MUTE FLAG ──
    let isMuted = localStorage.getItem('scriptorium_muted') === 'true';
    window.isMuted = isMuted;
    window.setMuted = (val) => {
        isMuted = val;
        window.isMuted = val;
        localStorage.setItem('scriptorium_muted', val ? 'true' : 'false');
        if (val) stopAllSounds();
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptorium_muted: val ? 'true' : 'false' })
        }).catch(e => console.warn(e));
    };

    // ── WEB AUDIO ──
    let audioCtx = null;
    const playingSources = {};

    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function startFireSound() {
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.value = 0.12;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        playingSources['fire'] = { node: gain, sources: [source] };
    }

    function startRainSound() {
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.value = 0.08;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        playingSources['rain'] = { node: gain, sources: [source] };
    }

    function startWindSound() {
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.value = 0.09;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        playingSources['wind'] = { node: gain, sources: [source] };
    }

    function startChimesSound() {
        const ctx = getAudioCtx();
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        const gain = ctx.createGain();
        gain.gain.value = 0.06;
        gain.connect(ctx.destination);

        let chimeSources = [];
        const interval = setInterval(() => {
            if (!playingSources['chimes']) return;
            const freq = freqs[Math.floor(Math.random() * freqs.length)];
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
            osc.connect(oscGain);
            oscGain.connect(gain);
            osc.start();
            osc.stop(ctx.currentTime + 2);
            chimeSources.push(osc);
        }, 3000 + Math.random() * 2000);

        playingSources['chimes'] = { node: gain, sources: chimeSources, interval };
    }

    function startSound(type) {
        if (isMuted) return;
        if (type === 'fire')   startFireSound();
        else if (type === 'rain')   startRainSound();
        else if (type === 'wind')   startWindSound();
        else if (type === 'chimes') startChimesSound();
    }

    function stopSound(type) {
        if (playingSources[type]) {
            const s = playingSources[type];
            try {
                s.node.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                setTimeout(() => {
                    s.sources.forEach(src => { try { src.stop(); } catch(e){} });
                    if (s.interval) clearInterval(s.interval);
                    delete playingSources[type];
                }, 550);
            } catch(e) {
                delete playingSources[type];
            }
        }
    }

    function stopAllSounds() {
        ['fire', 'rain', 'wind', 'chimes'].forEach(type => {
            stopSound(type);
            const btn = document.getElementById(`btn-${type}`);
            if (btn) btn.classList.remove('playing');
        });
    }

    // Expose to window for page scripts
    window.startSound  = startSound;
    window.stopSound   = stopSound;
    window.stopAllSounds = stopAllSounds;

    // Sound buttons (on reflection page)
    const soundBtns = document.querySelectorAll('.sound-btn');
    soundBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            getAudioCtx();
            const type = btn.dataset.sound;
            if (btn.classList.contains('playing')) {
                stopSound(type);
                btn.classList.remove('playing');
            } else {
                startSound(type);
                btn.classList.add('playing');
            }
        });
    });

    // ── PAPER RUSTLE SOUND ──
    function playPaperRustleSound() {
        if (isMuted) return;
        try {
            const ctx = getAudioCtx();
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.8;
            const gain = ctx.createGain();
            gain.gain.value = 0.07;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch(e) {}
    }
    window.playPaperRustleSound = playPaperRustleSound;

    // ── DATABASE SETTINGS SYNC ──
    async function syncDatabaseSettings() {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const settings = await res.json();
                if (settings && Object.keys(settings).length > 0) {
                    // Cache to LocalStorage
                    Object.entries(settings).forEach(([key, val]) => {
                        localStorage.setItem(key, String(val));
                    });

                    // Hot-reload components
                    if (settings.scriptorium_global_font_scale) {
                        applyGlobalFontScale(settings.scriptorium_global_font_scale);
                    }
                    if (settings.scriptorium_scale_fancy) {
                        applySpecificFontScale('fancy', settings.scriptorium_scale_fancy);
                    }
                    if (settings.scriptorium_scale_hand) {
                        applySpecificFontScale('hand', settings.scriptorium_scale_hand);
                    }
                    if (settings.scriptorium_scale_head) {
                        applySpecificFontScale('head', settings.scriptorium_scale_head);
                    }
                    if (settings.scriptorium_layout) {
                        applyLayout(settings.scriptorium_layout);
                    }
                    if (settings.scriptorium_muted !== undefined) {
                        const val = settings.scriptorium_muted === 'true' || settings.scriptorium_muted === true;
                        isMuted = val;
                        window.isMuted = val;
                        if (val) stopAllSounds();
                        const muteToggle = document.getElementById('mute-ambient-audio-toggle');
                        if (muteToggle) muteToggle.checked = val;
                    }

                    if (settings.scriptorium_font_fancy) {
                        applySpecificFontFamily('fancy', settings.scriptorium_font_fancy);
                    }
                    if (settings.scriptorium_font_hand) {
                        applySpecificFontFamily('hand', settings.scriptorium_font_hand);
                    }
                    if (settings.scriptorium_font_head) {
                        applySpecificFontFamily('head', settings.scriptorium_font_head);
                    }

                    // Reload specific typography display labels and dropdown values on settings page
                    ['fancy', 'hand', 'head'].forEach(style => {
                        const label = document.getElementById(`scale-${style}-val`);
                        if (label && settings[`scriptorium_scale_${style}`]) {
                            label.textContent = parseFloat(settings[`scriptorium_scale_${style}`]).toFixed(1);
                        }
                        const select = document.getElementById(`font-${style}-select`);
                        if (select && settings[`scriptorium_font_${style}`]) {
                            select.value = settings[`scriptorium_font_${style}`];
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Failed to sync database settings:", e);
        }
    }
    syncDatabaseSettings();
});
