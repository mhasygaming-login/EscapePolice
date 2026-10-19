const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

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
    show: false,
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

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const distIndexPath = path.join(__dirname, 'dist', 'index.html');

  if (isDev) {
    loadWithRetry(DEV_URL);
  } else {
    if (fs.existsSync(distIndexPath)) {
      mainWindow.loadFile(distIndexPath).catch(() => {
        loadWithRetry(DEV_URL);
      });
    } else {
      loadWithRetry(DEV_URL);
    }
  }

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

function loadWithRetry(url, maxAttempts = 15, interval = 1000) {
  let attempts = 0;

  const tryLoad = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.loadURL(url).catch(() => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryLoad, interval);
      } else {
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

    globalShortcut.register('F11', () => {
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
