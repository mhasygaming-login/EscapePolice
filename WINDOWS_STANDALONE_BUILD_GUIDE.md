# Panduan Lengkap Packaging Aplikasi Windows (.exe)
# Escape Police: Cyber Pursuit 🏎️💨

Dokumen ini menjelaskan arsitektur, konfigurasi, dan langkah-langkah kompilasi untuk menghasilkan file **Standalone Windows Installer (.exe)** lengkap dengan **Installer Wizard**, **Uninstaller Wizard**, dan pembuatan shortcut otomatis ke Desktop serta Start Menu.

---

## 📋 Ikhtisar Fitur Standalone Desktop (Windows)

1. **Standalone Executable (.exe):** Tidak memerlukan instalasi browser Google Chrome atau web server eksternal di komputer pemain.
2. **NSIS Installation Wizard:**
   - Memungkinkan pemain memilih direktori instalasi kustom (misal: `C:\Games\Escape Police` atau direktori default `Program Files`).
   - Checkbox persetujuan dan ringkasan instalasi.
   - Checkbox "Jalankan game setelah instalasi selesai" (*Run after finish*).
3. **Shortcut Otomatis:**
   - Shortcut langsung di Desktop Windows dengan ikon kustom (`favicon.ico`).
   - Folder shortcut di Start Menu Windows (`Start Menu > Escape Police`).
4. **Seamless Uninstaller:**
   - Terdaftar secara otomatis di **Windows Settings > Apps & Features (Add or Remove Programs)**.
   - Wizard uninstaller yang menghapus seluruh binary game dengan bersih tanpa meninggalkan sisa sampah.
   - Opsi mempertahankan progress dan skor pemain (*safe uninstall*).
5. **Mode Layar Game Native:**
   - Bebas dari address bar browser, tab, atau frame web.
   - Dukungan tombol pintas fullscreen: **F11** dan **Alt + Enter** (serta **Escape** untuk keluar fullscreen).
   - Single-instance lock: Mencegah game terbuka dua kali secara bersamaan saat shortcut diklik berulang kali.

---

## 🛠️ File Konfigurasi Inti

### 1. `main.js` (Proses Utama Electron)
Mengatur pembuatan jendela native Windows, resolusi layar 1280x800 (fleksibel hingga 4K), peniadaan menu bar standar, integrasi sandbox, dan pemuatan bundle frontend offline maupun online.

```javascript
// Cuplikan konfigurasi jendela utama di main.js
mainWindow = new BrowserWindow({
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 640,
  center: true,
  title: 'Escape Police - Cyber Pursuit',
  backgroundColor: '#070814',
  autoHideMenuBar: true,
  icon: path.join(__dirname, 'public', 'favicon.ico'),
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, 'preload.cjs'),
  },
});
```

### 2. `preload.cjs` (Secure Context Bridge)
Menyediakan jembatan aman (*sandbox isolation*) antara jendela game dan sistem operasi tanpa mengekspos API Node mentah yang rentan.

### 3. `package.json` (Konfigurasi electron-builder & NSIS)
```json
"build": {
  "appId": "com.escapepolice.cyberpursuit",
  "productName": "Escape Police - Cyber Pursuit",
  "copyright": "Copyright © 2026 Escape Police",
  "directories": {
    "output": "dist-electron"
  },
  "files": [
    "dist/**/*",
    "public/**/*",
    "main.js",
    "preload.js",
    "preload.cjs",
    "package.json"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "public/favicon.ico",
    "artifactName": "${productName}-Setup-${version}.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": "always",
    "createStartMenuShortcut": true,
    "shortcutName": "Escape Police",
    "uninstallDisplayName": "Escape Police - Cyber Pursuit",
    "deleteAppDataOnUninstall": false,
    "runAfterFinish": true
  }
}
```

---

## 🚀 Langkah-Langkah Build Menjadi File .exe

### Persyaratan:
- **Node.js**: Versi 18, 20, atau 22 (LTS disarankan).
- **npm**: Sudah terpasang bersama Node.js.
- Sistem Operasi: Windows 10/11 (atau Linux/macOS dengan dependensi build multi-platform).

---

### Cara 1: Menggunakan Perintah npm (Paling Cepat)

Buka terminal/PowerShell di folder proyek game, lalu jalankan:

```bash
# 1. Install semua dependensi (jika belum pernah)
npm install

# 2. Bangun aset frontend & kompilasi file Installer Windows .exe
npm run electron:build
```

Setelah proses selesai, file installer installer akan muncul di direktori:
```text
dist-electron/
└── Escape Police - Cyber Pursuit-Setup-1.0.0.exe   <-- File Installer Windows (.exe)
```

---

### Cara 2: Menghasilkan Versi Portabel Tanpa Perlu Install (*Unpacked / Portable*)

Jika Anda hanya ingin folder aplikasi yang langsung dapat diklik tanpa melalui proses instalasi wizard:

```bash
npm run electron:pack
```

Hasilnya akan berada di folder:
```text
dist-electron/
└── win-unpacked/
    ├── Escape Police - Cyber Pursuit.exe   <-- Klik dua kali untuk langsung bermain
    └── resources/
```

---

### Cara 3: Menguji Aplikasi Secara Lokal Sebelum Dibungkus (*Development Mode*)

Untuk mencoba jendela Electron di komputer lokal sebelum membuat installer:

```bash
# Terminal 1: Jalankan server dev Vite
npm run dev

# Terminal 2: Buka jendela Electron
npm run electron:dev
```

---

## 📦 Alur Wizard Penginstalan bagi Pengguna Akhir

1. Pengguna mengklik ganda file `Escape Police - Cyber Pursuit-Setup-1.0.0.exe`.
2. **Halaman Sambutan:** Ditampilkan nama aplikasi dan informasi versi.
3. **Pilihan Folder:** Pengguna dapat menekan tombol **Browse...** untuk memasang di drive lain (misal: `D:\Games\Escape Police`) atau membiarkan folder default `C:\Program Files\Escape Police - Cyber Pursuit`.
4. **Instalasi:** File game diekstrak dengan indikator progress bar yang mulus.
5. **Pembuatan Shortcut:** Shortcut berikon game otomatis ditaruh di **Desktop** dan **Start Menu**.
6. **Halaman Selesai:** Terdapat opsi *checkbox* "Jalankan Escape Police sekarang", lalu klik **Finish**.

---

## 🗑️ Alur Pencopotan Program (Uninstaller)

Jika pengguna ingin menghapus game:
1. Buka **Windows Settings > Apps > Installed apps** (atau **Control Panel > Programs and Features**).
2. Cari **Escape Police - Cyber Pursuit**.
3. Klik **Uninstall**.
4. Wizard uninstaller akan terbuka dan menghapus seluruh file game beserta shortcut di Desktop dan Start Menu secara bersih.
5. Catatan skor dan preferensi lokal pengguna tetap tersimpan aman di direktori profil pengguna agar tidak hilang jika diinstal ulang di kemudian hari.
