const { app, BrowserWindow, dialog, nativeImage } = require('electron');
app.setName('Whoami');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

app.name = 'Whoami';

const isPacked = app.isPackaged;

const configPath = isPacked
    ? path.join(app.getPath('userData'), 'whoami.config.json')
    : path.join(__dirname, 'whoami.config.json');

let serverStarted = false;

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
            dialog.showMessageBoxSync({
                type: 'warning',
                title: 'Database Folder Required',
                message: 'The whoami application requires a database storage folder. The application will now close.',
                buttons: ['OK']
            });
            app.quit();
        }
    }

    return configured;
}

function checkServerReady(url, callback) {
    http.get(url, (res) => {
        callback(res.statusCode === 200);
    }).on('error', () => {
        callback(false);
    });
}

function createWindow(url) {
    const iconPath = isPacked
        ? path.join(process.resourcesPath, 'app', 'public', 'logo_icon.png')
        : path.join(__dirname, 'public', 'logo_icon.png');

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
        if (!img.isEmpty()) win.setIcon(img);
    } catch (e) {
        console.error('Failed to set icon:', e);
    }

    win.loadURL(url);
}

function startServerAndOpenWindow() {
    if (isPacked) {
        // PRODUCTION: require server.js directly in this process (no spawn)
        process.env.PORT = '3000';
        process.env.WHOAMI_CONFIG = configPath;
        process.env.WHOAMI_DIST = path.join(__dirname, 'dist');
        process.env.WHOAMI_APP_DIR = __dirname;

        try {
            require('./server.js');
        } catch (err) {
            dialog.showErrorBox('Server Error', `Failed to load server:\n${err.message}\n\n${err.stack}`);
            app.quit();
            return;
        }

        // Poll until server is ready
        let attempts = 0;
        const maxAttempts = 30; // 9 seconds max
        const pollInterval = setInterval(() => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(pollInterval);
                dialog.showErrorBox('Server Timeout', 'Server took too long to start.');
                app.quit();
                return;
            }
            checkServerReady('http://localhost:3000/', (ready) => {
                if (ready) {
                    clearInterval(pollInterval);
                    createWindow('http://localhost:3000/app/index.html');
                }
            });
        }, 300);

    } else {
        // DEV: use Vite as before
        checkServerReady('http://localhost:3000/app/index.html', (ready) => {
            if (ready) {
                createWindow('http://localhost:3000/app/index.html');
            } else {
                console.log('Spawning Vite dev server...');
                const serverProcess = spawn('npm', ['run', 'dev'], {
                    cwd: __dirname,
                    shell: true
                });

                serverProcess.stdout.on('data', (data) => console.log(`[Vite]: ${data}`));
                serverProcess.stderr.on('data', (data) => console.error(`[Vite Error]: ${data}`));

                let attempts = 0;
                const maxAttempts = 60;
                const pollInterval = setInterval(() => {
                    attempts++;
                    if (attempts > maxAttempts) {
                        clearInterval(pollInterval);
                        dialog.showErrorBox('Dev Server Timeout', 'Vite server took too long to start.');
                        app.quit();
                        return;
                    }
                    checkServerReady('http://localhost:3000/app/index.html', (ready) => {
                        if (ready) {
                            clearInterval(pollInterval);
                            createWindow('http://localhost:3000/app/index.html');
                        }
                    });
                }, 300);
            }
        });
    }
}

app.whenReady().then(() => {
    if (ensureDatabaseConfigured()) {
        startServerAndOpenWindow();
    }
});

app.on('window-all-closed', () => {
    app.quit();
});