import { app, BrowserWindow, Menu, shell, globalShortcut } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure single instance lock so running shortcut doesn't duplicate game windows
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEFAULT_PORT = process.env.PORT || 3000;
const DEV_URL = `http://localhost:${DEFAULT_PORT}`;

function createMainWindow() {
  const iconPath = path.join(__dirname, 'public', 'favicon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    center: true,
    title: 'Escape Police - Cyber Pursuit',
    backgroundColor: '#070814',
    show: false, // Show once ready to avoid white flash
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: fs.existsSync(path.join(__dirname, 'preload.cjs'))
        ? path.join(__dirname, 'preload.cjs')
        : (fs.existsSync(path.join(__dirname, 'preload.js')) ? path.join(__dirname, 'preload.js') : undefined),
    },
  });

  // Remove default browser menu bar completely
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Smooth appearance when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      // Optional: Open DevTools in development mode
      // mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // URL / File loading strategy
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');

  if (isDev) {
    // Development mode: load local Vite/Express dev server with retry
    loadWithRetry(DEV_URL);
  } else {
    // Production mode: check for dist/index.html or local server
    if (fs.existsSync(distIndexPath)) {
      mainWindow.loadFile(distIndexPath).catch(() => {
        loadWithRetry(DEV_URL);
      });
    } else {
      loadWithRetry(DEV_URL);
    }
  }

  // Intercept navigation & popups to protect game sandbox and open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Poll & retry loading URL if server is still spinning up
 */
function loadWithRetry(url, maxAttempts = 15, interval = 1000) {
  let attempts = 0;

  const tryLoad = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.loadURL(url).catch((err) => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryLoad, interval);
      } else {
        // Fallback display if server is unreachable
        const distIndexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(distIndexPath)) {
          mainWindow.loadFile(distIndexPath);
        } else {
          mainWindow.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(`
              <!DOCTYPE html>
              <html>
              <head><title>Escape Police - Menghubungkan...</title></head>
              <body style="background:#070814;color:#00f0ff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
                <h1 style="letter-spacing:2px;font-size:28px;">ESCAPE POLICE</h1>
                <p style="color:#94a3b8;font-size:16px;">Memulai koneksi game server desktop...</p>
                <button onclick="location.reload()" style="background:#00f0ff;color:#070814;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;margin-top:16px;font-size:14px;">Coba Lagi</button>
              </body>
              </html>
            `)}`
          );
        }
      }
    });
  };

  tryLoad();
}

// Single instance enforcement
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();

    // Register F11 & Alt+Enter shortcut to toggle full screen
    globalShortcut.register('F11', () => {
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });
    globalShortcut.register('Alt+Enter', () => {
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });
    globalShortcut.register('Escape', () => {
      if (mainWindow && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

// Unregister shortcuts and exit gracefully on all windows closed
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
