# whoami - Personal Intelligence System

whoami is a secure, offline-first desktop application built to make you understand yourself through behavioral data.

The gap between what you planned and what you did, what you committed to and what you abandoned, what you believe about yourself and what the data shows — that gap is where self-knowledge lives. whoami is engineered to make that gap visible.

Built with Electron and Vite, all data is stored locally with absolute privacy.

---

## Download

| Platform | Download |
|----------|----------|
| Linux | [Whoami-1.0.0.AppImage](https://github.com/alokxgit/whoami/releases/download/v1.0.0/Whoami-1.0.0.AppImage) |
| Windows | [Whoami.Setup.1.0.0.exe](https://github.com/alokxgit/whoami/releases/download/v1.0.0/Whoami.Setup.1.0.0.exe) |
| Mac | Coming soon |

---


## Screenshots

| Feature | Screenshot |
|----------|----------|
| Reflection & Identity | ![Reflection & Identity](https://github.com/alokxgit/whoami/blob/main/public/screenshots/reflection.png) |
| Goals & Commitments | ![Goals & Commitments](https://github.com/alokxgit/whoami/blob/main/public/screenshots/goals.png) |
| Journaling | ![Journaling](https://github.com/alokxgit/whoami/blob/main/public/screenshots/journal.png) |
| Knowledge Base | ![Knowledge Base](https://github.com/alokxgit/whoami/blob/main/public/screenshots/kb.png) |
| Settings | ![Settings](https://github.com/alokxgit/whoami/blob/main/public/screenshots/settings.png) |
| Shortcuts | ![Shortcuts](https://github.com/alokxgit/whoami/blob/main/public/screenshots/shortcuts.png) |

---

## Key Features

*   **Reflection & Identity**: A structured whoami page mapping your strengths, blind spots, and active commitments — with drift detection to surface what you've abandoned without closure.
*   **Journaling**: Distraction-free text editor with formatting controls, customizable handwriting fonts, and a local image upload pipeline supporting drag-and-drop and size adjustments.
*   **Goals & Commitments**: A tabbed registry to manage weekly goals, long-term ambitions, and active commitments — with commitment-to-goal linking to keep your daily actions connected to your bigger direction.
*   **Knowledge Base**: A hierarchical workspace to organize reference notes, problem-solving patterns, and personal learnings with fluid page-turn transitions.
*   **Vim Keybindings Mode**: Integrated Vim-inspired motions supporting normal, insert, visual, and character replacement modes via a customizable configuration dashboard.
*   **Settings & Customization**:
    *   Dynamic themes supporting light, dark, and warm parchment workspace styles.
    *   Configurable local database path with automatic content migration helper.
    *   Optional white-noise generator with adjustable soundscapes and volume controls.
    *   Local backup tools for single-click data export and reset operations.

---

## Technology Stack

*   **Runtime Shell**: Electron
*   **Build System**: Vite
*   **Frontend**: HTML5, Vanilla JavaScript (ES6+), and CSS3 Custom Properties
*   **Database**: Local file-system JSON storage with custom assets directories

---

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm

### Installation

1.  Clone the repository:
```bash
    git clone <repository-url>
    cd whoami
```

2.  Install the required dependencies:
```bash
    npm install
```

3.  Launch the application in development mode:
```bash
    npm start
```

### Initial Configuration

On the first launch, the application will prompt you to select a local directory. This folder acts as your secure, active database location. All journal entries, settings, images, and data backups will be saved exclusively within this folder.

---

## Project Structure

```text
├── app/
│   ├── api/                    # Server-side mock API endpoints and settings handlers
│   ├── index.html              # Main application entry point (Cover view)
│   ├── pages/                  # Page-specific assets and views (Goals, Journal, KB, Reflection, Settings)
│   └── shared/                 # Shared resources (Core engine logic, ambient audio, global styling)
├── public/                     # Static media and app assets
├── main.js                     # Electron main process configuration
├── package.json                # Project dependencies and script declarations
└── vite.config.js              # Vite server and local dev proxy routing
```

---

## Privacy & Security

whoami is an offline-first desktop application. No telemetry, personal logs, plans, or images are transmitted to external servers. All personal records remain secured locally on your own machine in your chosen database directory.