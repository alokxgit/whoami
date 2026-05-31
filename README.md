# ✒️ whoami: Your Personal Open-Book Journal & Ledger

Welcome to **whoami**, a highly personal, premium desktop workspace designed to resemble a physical, tactile ancient-modern leather codex book. Combining rich sensory immersion with powerful modern productivity mechanics, **whoami** integrates journaling, self-portrait reflection, habit/goal registry, and a modular knowledge base into one cohesive environment.

Built natively on **Electron**, **Vite**, and **HTML5/CSS3**, the application delivers a premium distraction-free experience with gorgeous visual aesthetics, dynamic themes, soundscapes, and absolute data privacy.

---

## ✨ Core Features

### 📖 1. The Chronicle (Journal)
*   **Tactile Open-Book Layout**: Experience writing inside an open-book interface with physical page boundaries, real line guides, and aged paper textures.
*   **Rich Text Editor**: A tailored WYSIWYG editing experience optimized for distraction-free writing.
*   **Integrated Asset Pipeline**: Drag-and-drop or upload images directly into your journal entries, complete with integrated size controls (25%, 50%, 75%, 100%) and instant deletion menus.
*   **Typographic Controls**: Switch between multiple handwriting fonts, featuring **Book Serif (`EB Garamond`)** as the premium, highly-legible system fallback.

### 🧭 2. Reflection & Study
*   **Who I Am (Self Portrait)**: Map out your core life biography, write personal philosophy principles, and specify current values or stages of life.
*   **Personal Audits**: Track what you are naturally good at alongside key areas of character improvements.

### ✒️ Goals & Tasks (Deeds Registry)
*   **Tabbed Deeds Ledger**: Seamlessly register daily tasks, active commitments, and recurring habits.
*   **Interactive Controls**: Complete goals and habits directly from your registry, watching progress update dynamically.

### 📚 The Codex (Knowledge Base)
*   **Wisdom Library**: Keep notes, specialized directories, and study compilations categorized by dynamic title badges.
*   **Tactile Page-Flip Transitions**: Fluid, organic UI responses that feel like turning real paper.

### ⚙️ 3. Premium Settings & Controls
*   **👤 Custom Identity Profiling**: Personalize your registry by specifying your profile name. It dynamically updates browser titles, cover engravings, and page running headers, defaulting gracefully to `whoami`.
*   **💾 Configurable Database Location**: Change your storage location directly from settings. Features an automatic migration mechanism that copies your existing database assets to the new target folder.
*   **🎨 Dynamic Casing Themes**: Select from premium physical styles:
    *   `Codex` (Classic warm parchment)
    *   `Folio` (Premium tan leather)
    *   `Ledger` (Deep navy with gold accents)
    *   `Obsidian Light` (Sleek modern minimalist light)
    *   `Obsidian Dark` (Deep charcoal slate with violet neon elements)
*   **🔊 Audio Soundscapes**: Features an optional built-in white noise synthesizer generating relaxing natural ambiance, complete with smooth muting controls.
*   **📤 Data Backups**: Export a unified JSON archive of your entire database or reset folders with a single click.

---

## 🛠️ Technology Stack

*   **Runtime Shell**: Electron
*   **Build Tool**: Vite
*   **Frontend Engine**: HTML5 / JavaScript (ES6+)
*   **Styling System**: Vanilla CSS3 (Custom Variables, Flexbox, Grids, 3D Transforms)
*   **Database**: File-system based JSON store with assets directories

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation
1. Clone the repository to your local workspace:
   ```bash
   git clone <repository-url>
   cd whoami
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the desktop application:
   ```bash
   npm start
   ```

### First-Time Initialization
When the application first boots, it will guide you using a native folders-selection dialog to select a folder on your computer. This folder will be your secure, active database location. All journal entries, settings, images, and collections are saved locally in this folder, ensuring absolute privacy.

---

## 📁 File Structure

```text
├── app/
│   ├── api/                    # Server-side mock endpoints & config logic
│   │   ├── db.js               # Database directory resolution helper
│   │   ├── settings.js         # Settings save, reset, and path-migration api
│   │   └── ...
│   ├── index.html              # Main application entry (Closed Book Cover)
│   ├── pages/                  # Page-specific assets & layouts
│   │   ├── cover/
│   │   ├── goals/
│   │   ├── journal/
│   │   ├── knowledge_base/
│   │   ├── reflection/
│   │   └── settings/
│   └── shared/                 # Common elements shared by all modules
│       ├── css/                # Base variables, page casing, and responsiveness
│       └── js/                 # Scriptorium core engine & ambient audio
├── public/                     # Static assets, local logos, & favicons
├── main.js                     # Electron main process controller
├── package.json                # Project dependencies and script bindings
└── vite.config.js              # Vite server & API router config
```

---

## 🔒 absolute Privacy
**whoami** is fully offline first. Absolutely none of your journal entries, photos, plans, or personal records are uploaded to external clouds. Your identity and thoughts remain safely stored right inside your local machine in the database folder you selected.
