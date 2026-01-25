const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Register the app:// protocol as privileged
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Centaur OS",
        icon: path.join(__dirname, '../assets/desktop/icon.icns'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Temporarily disabled for debugging
        }
    });

    // Pipe console messages from the web view to the terminal
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levels = ['DEBUG', 'LOG', 'WARNING', 'ERROR'];
        console.log(`[Web Console ${levels[level] || 'INFO'}] ${message} (${sourceId}:${line})`);
    });

    // In production, load via the app:// protocol to handle absolute paths correctly
    // We use "./index.html" but the protocol handler will resolve it properly
    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8081'
        : 'app://./index.html';

    console.log(`[Main] Loading: ${startUrl} (NODE_ENV: ${process.env.NODE_ENV})`);
    win.loadURL(startUrl);

    // Remove menu for a cleaner "app" look
    win.setMenuBarVisibility(false);

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_CENTAUROS) {
        win.webContents.openDevTools();
    }

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Main] Failed to load URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
    });

    win.webContents.on('did-finish-load', () => {
        console.log('[Main] Page finished loading');
    });
}

app.whenReady().then(() => {
    // Handle the app:// protocol
    protocol.handle('app', async (request) => {
        const requestUrl = request.url;
        let urlPath = requestUrl.slice('app://'.length);

        // Remove host part if present (e.g. app://./ becomes ./)
        if (urlPath.startsWith('./')) {
            urlPath = urlPath.slice(2);
        }

        // Strip leading slash if present to avoid path.join issues
        if (urlPath.startsWith('/')) {
            urlPath = urlPath.slice(1);
        }

        // Remove query parameters or hashes
        urlPath = urlPath.split(/[?#]/)[0];

        // Default to index.html if empty
        if (urlPath === '' || urlPath === '.') {
            urlPath = 'index.html';
        }

        const filePath = path.normalize(path.join(__dirname, '../dist', urlPath));

        // Log the mapping for debugging
        console.log(`[Protocol] Request: ${requestUrl} -> ${filePath}`);

        try {
            return await net.fetch(pathToFileURL(filePath).toString());
        } catch (err) {
            console.error(`[Protocol] Error fetching ${filePath}:`, err.message);
            // If it's the main index.html failing, that's a major problem
            if (urlPath === 'index.html') {
                return new Response('<h1>Fatal Error: index.html not found</h1>', {
                    headers: { 'content-type': 'text/html' }
                });
            }
            return new Response('Not Found', { status: 404 });
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
