const { app, BrowserWindow, dialog, nativeImage } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

app.name = 'whoami';

const configPath = path.join(__dirname, 'whoami.config.json');
let serverProcess = null;

function ensureDatabaseConfigured() {
    let configured = false;
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.databasePath && fs.existsSync(config.databasePath)) {
                configured = true;
            }
        } catch (e) {
            console.error('Error reading whoami.config.json:', e);
        }
    }

    if (!configured) {
        // Show native folder selection dialog
        const result = dialog.showOpenDialogSync({
            title: 'Select whoami Database Folder',
            message: 'Please choose a local folder where your personal journals and commitments should be securely stored.',
            buttonLabel: 'Select Folder',
            properties: ['openDirectory', 'createDirectory']
        });

        if (result && result.length > 0) {
            const selectedPath = result[0];
            try {
                fs.writeFileSync(configPath, JSON.stringify({ databasePath: selectedPath }, null, 2));
                console.log(`Saved custom database path: ${selectedPath}`);
                configured = true;
            } catch (err) {
                dialog.showErrorBox('Configuration Error', `Failed to write whoami.config.json:\n${err.message}`);
                app.quit();
            }
        } else {
            // User cancelled
            dialog.showMessageBoxSync({
                type: 'warning',
                title: 'Database Folder Required',
                message: 'The whoami application requires a database storage folder to save your journal entries and settings. The application will now close.',
                buttons: ['OK']
            });
            app.quit();
        }
    }

    return configured;
}

function checkServerReady(callback) {
    http.get('http://localhost:3000/app/index.html', (res) => {
        if (res.statusCode === 200) {
            callback(true);
        } else {
            callback(false);
        }
    }).on('error', () => {
        callback(false);
    });
}

function startServerAndOpenWindow() {
    checkServerReady((ready) => {
        if (ready) {
            createWindow();
        } else {
            console.log('Spawning whoami Vite server...');
            // Start the Vite server using npm run dev
            serverProcess = spawn('npm', ['run', 'dev'], {
                cwd: __dirname,
                shell: true
            });

            serverProcess.stdout.on('data', (data) => {
                console.log(`[Vite Server]: ${data}`);
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`[Vite Server Error]: ${data}`);
            });

            // Poll until server is ready
            const pollInterval = setInterval(() => {
                checkServerReady((readyNow) => {
                    if (readyNow) {
                        clearInterval(pollInterval);
                        createWindow();
                    }
                });
            }, 300);
        }
    });
}

function createWindow() {
    const iconPath = path.join(__dirname, 'public', 'logo_icon.png');
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        fullscreen: true,
        frame: false,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    try {
        const img = nativeImage.createFromPath(iconPath);
        if (!img.isEmpty()) {
            win.setIcon(img);
        }
    } catch (e) {
        console.error('Failed to set native window icon:', e);
    }

    win.loadURL('http://localhost:3000/app/index.html');
}

app.whenReady().then(() => {
    if (ensureDatabaseConfigured()) {
        startServerAndOpenWindow();
    }
});

app.on('window-all-closed', () => {
    // Clean up whoami Vite server process on exit
    if (serverProcess) {
        if (process.platform === 'win32') {
            spawn("taskkill", ["/pid", serverProcess.pid, '/f', '/t']);
        } else {
            // Send SIGINT or SIGKILL to kill spawned process group
            try {
                process.kill(-serverProcess.pid, 'SIGINT');
            } catch (e) {
                serverProcess.kill('SIGINT');
            }
        }
    }
    app.quit();
});
