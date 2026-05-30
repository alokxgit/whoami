/* ==========================================================================
   REFLECTION PAGE INTERACTION SCRIPT
   Handles the Daily Wisdom library, quote randomizing and mindset togglers
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── QUOTES ──
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
        { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
        { text: "The mind is everything. What you think you become.", author: "Buddha" },
        { text: "An unexamined life is not worth living.", author: "Socrates" }
    ];

    const quoteText   = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const newQuoteBtn = document.getElementById('new-quote-btn');

    function getRandomQuote() {
        const idx = Math.floor(Math.random() * quotes.length);
        const q = quotes[idx];
        if (quoteText)   quoteText.textContent = `"${q.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${q.author}`;
    }
    getRandomQuote();
    if (newQuoteBtn) newQuoteBtn.addEventListener('click', getRandomQuote);

    // ── MINDSET CHIPS ──
    const mindsetBtns       = document.querySelectorAll('.mindset-btn');
    const activeMindsetName = document.getElementById('active-mindset-name');
    const savedMindset      = localStorage.getItem('scriptorium_mindset') || '';

    function selectMindset(name) {
        mindsetBtns.forEach(b => b.classList.toggle('active', b.dataset.mindset === name));
        if (activeMindsetName) activeMindsetName.textContent = name || 'None selected';
        localStorage.setItem('scriptorium_mindset', name);
    }

    if (savedMindset) selectMindset(savedMindset);

    mindsetBtns.forEach(btn => {
        btn.addEventListener('click', () => selectMindset(btn.dataset.mindset));
    });
});
