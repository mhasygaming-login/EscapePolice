# Escape the Police: Cyber Pursuit 🏎️💨

> **Retro-Futuristic Police Pursuit Racing Game**  
> Dibangun dengan arsitektur modern berbasis React 19, TypeScript, Vite, Tailwind CSS, Express, dan Socket.IO.

---

## 📁 Struktur Folder & Arsitektur Proyek (Clean Architecture)

Proyek ini disusun menggunakan prinsip **Modular Domain-Driven Design (DDD)** dan **Separation of Concerns (SoC)** agar kode mudah dipelihara, terbaca dengan jelas, dan siap untuk standar evaluasi profesional:

```text
├── public/                     # Aset publik statis (gambar map, difficulty, ikon PWA, manifest)
│   ├── difficulties/           # Ilustrasi visual tingkat kesulitan (Santai, Normal, Sulit, MAXXX)
│   ├── maps/                   # Ilustrasi visual arena lintasan (Kota, Salju, Pasir, Hutan, Gunung)
│   └── manifest.json           # Konfigurasi Progressive Web App (PWA)
│
├── server/                     # Backend real-time & multiplayer
│   └── multiplayer.ts          # State management room multiplayer Socket.IO
│
├── src/                        # Kode sumber aplikasi frontend
│   ├── assets/                 # Aset internal modul
│   │   └── images/             # Gambar & artwork resolusi tinggi
│   │
│   ├── components/             # Komponen antarmuka (UI) terstruktur modular
│   │   ├── game/               # Modul mesin game utama & layar balapan
│   │   │   ├── GameCanvas.tsx       # Mesin rendering 2D canvas, fisika kendaraan & AI polisi
│   │   │   ├── MainGameLobby.tsx    # Halaman Index Lobby (AutoLayout 2 kotak: Arena & Kesulitan)
│   │   │   ├── MultiplayerLobby.tsx # Lobby balapan online real-time & ruang room
│   │   │   ├── AuthScreen.tsx       # Layar autentikasi login/register fullscreen
│   │   │   ├── ReplayViewer.tsx     # Fitur pemutaran ulang rekaman balapan (*ghost/replay*)
│   │   │   └── index.ts             # Barrel export domain game
│   │   │
│   │   ├── garage/             # Modul kustomisasi garasi kendaraan
│   │   │   ├── ShowroomStage.tsx    # Panggung visualisasi mobil 360° & rotasi
│   │   │   ├── RadarChart.tsx       # Diagram visual statistik performa mobil
│   │   │   ├── ColorSwatchPicker.tsx# Pemilih cat bodi mobil
│   │   │   ├── TrailEffectList.tsx  # Pemilih efek jejak ban (*nitro trail*)
│   │   │   ├── AvatarGrid.tsx       # Pemilih avatar pembalap
│   │   │   ├── TitleBadgeList.tsx   # Pemilih gelar reputasi (*driver title*)
│   │   │   └── index.ts             # Barrel export domain garasi
│   │   │
│   │   ├── layout/             # Komponen tata letak & shell navigasi
│   │   │   ├── Navbar.tsx           # Navigasi atas dengan indikator status real-time
│   │   │   ├── BrandLogo.tsx        # Renderer vektor logo pabrikan mobil ikonik
│   │   │   ├── NotificationsDrawer.tsx # Drawer notifikasi aktivitas & turnamen
│   │   │   ├── OfflineIndicator.tsx # Indikator status jaringan & sinkronisasi cloud
│   │   │   ├── PWAInstallButton.tsx # Tombol instalasi PWA di mobile & desktop
│   │   │   ├── ErrorBoundary.tsx    # Penangkal crash aplikasi dengan UI recovery
│   │   │   └── index.ts             # Barrel export domain layout
│   │   │
│   │   ├── modals/             # Dialog pop-up / modal interaktif
│   │   │   ├── AnalyticsModal.tsx   # Modal analitik statistik balap & grafis
│   │   │   ├── AuthModal.tsx        # Modal profil, ganti akun & riwayat aktivitas
│   │   │   ├── GarageModal.tsx      # Modal utama garasi kustomisasi mobil
│   │   │   ├── LeaderboardModal.tsx # Modal papan peringkat global & harian
│   │   │   ├── LogoutConfirmModal.tsx # Konfirmasi keamanan logout pengguna
│   │   │   ├── MapSelectModal.tsx   # Modal 3D card-stack pemilihan lintasan
│   │   │   ├── PoliceFleetModal.tsx # Modal inspeksi armada kepolisian
│   │   │   ├── SettingsModal.tsx    # Modal pengaturan audio, grafik & backend URL
│   │   │   ├── ShareModal.tsx       # Modal berbagi tautan room balapan
│   │   │   ├── TournamentsModal.tsx # Modal turnamen berkala berhadiah koin
│   │   │   └── index.ts             # Barrel export domain modals
│   │   │
│   │   ├── auth/               # Modul autentikasi hero & mode switch
│   │   │   ├── RaceAuthHero.tsx     # Komponen display hero grafis autentikasi
│   │   │   ├── RaceAuthModeSwitch.tsx # Switcher mode login/register interaktif
│   │   │   └── index.ts             # Barrel export domain auth
│   │   │
│   │   ├── ui/                 # Komponen UI primitive & reusable widgets
│   │   │   ├── CardStack.tsx        # Animasi card-stack bertumpuk 3D pemilihan map
│   │   │   ├── InteractiveSelector.tsx # Selektor AutoLayout transparan tingkat kesulitan
│   │   │   ├── ModernAnimatedAuth.tsx # Form autentikasi animasi bertahap & orbit tech
│   │   │   ├── LoadingScreen.tsx    # Cinematic loading screen dengan engine rev synth
│   │   │   └── index.ts             # Barrel export domain UI
│   │   │
│   │   └── index.ts            # Central barrel export seluruh komponen
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useOnlineStatus.ts  # Deteksi status online/offline real-time
│   │   ├── usePWAInstall.ts    # Deteksi kesiapan instalasi PWA
│   │   └── index.ts            # Barrel export hooks
│   │
│   ├── services/               # Layanan backend API, Socket & Audio
│   │   ├── api.ts              # Klien REST API & sinkronisasi data pemain
│   │   ├── audio.ts            # Sound synthesizer Web Audio API (*SFX & engine*)
│   │   ├── cars.ts             # Katalog data mobil, spesifikasi HP, & render canvas 2D
│   │   ├── policeVehicles.ts   # Varian unit patroli polisi & helikopter
│   │   ├── roadsideScenery2d.ts# Ornamen pemandangan samping jalan (pohon, gedung, lampu)
│   │   ├── socket.ts           # Klien Socket.IO real-time multiplayer
│   │   ├── peerMultiplayer.ts  # Layanan WebRTC p2p multiplayer fallback
│   │   ├── encryptedActivity.ts# Layanan enkripsi riwayat aktivitas pemain
│   │   └── index.ts            # Barrel export services
│   │
│   ├── types/                  # Definisi TypeScript interface & types
│   │   ├── game.ts             # Definisi model User, Mobil, Multiplayer, Turnamen
│   │   ├── maps.ts             # Definisi data arena lintasan balap
│   │   └── index.ts            # Barrel export types
│   │
│   ├── utils/                  # Fungsi helper utilitas murni
│   │   ├── serverUrl.ts        # Resolver URL server cloud & lokal
│   │   ├── share.ts            # Salin tautan & Web Share API
│   │   └── index.ts            # Barrel export utils
│   │
│   ├── App.tsx                 # Root controller & manajemen navigasi tab
│   ├── main.tsx                # Titik masuk bootstrap React & registrasi PWA
│   └── index.css               # Gaya global & konfigurasi Tailwind CSS
│
├── data/                       # Database lokal persisten
│   └── db.json                 # JSON database lokal pemain, skor, & turnamen
│
├── package.json                # Dependensi proyek & scripts
├── tsconfig.json               # Konfigurasi TypeScript strict mode
├── vite.config.ts              # Konfigurasi bundler Vite & PWA plugin
└── server.ts                   # Backend server Express & Socket.IO
```

---

## 🌟 Prinsip Desain & Kualitas Kode

1. **Modular Barrel Exports (`index.ts`):**  
   Setiap direktori memiliki file `index.ts` sendiri, memungkinkan impor komponen yang bersih dan teratur:
   ```ts
   import { GameCanvas, MainGameLobby } from './components/game';
   import { Navbar, ErrorBoundary } from './components/layout';
   import { GarageModal, SettingsModal } from './components/modals';
   ```

2. **TypeScript Strict Type Safety:**  
   Seluruh data props, state, event handler, dan respons API memiliki interface eksplisit di direktori `src/types/` tanpa penggunaan tipe implisit `any`.

3. **AutoLayout & Responsivitas:**  
   Antarmuka dibangun dengan sistem Flexbox dan CSS Grid modern (`gap`, `flex-col`, `items-center`) yang proporsional di seluruh ukuran layar (ponsel, tablet, laptop, dan monitor ultrawide) tanpa elemen yang bertabrakan (*zero overlap*) atau terpotong (*anti-sunk*).

4. **Offline-First PWA:**  
   Dilengkapi service worker untuk caching aset statis, memungkinkan game tetap dapat dibuka dan dimainkan secara offline.

---

## 🚀 Cara Menjalankan Proyek

### 1. Mode Pengembangan (*Development*)
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3000` dengan dukungan Express, Vite middleware, dan Socket.IO.

### 2. Verifikasi Kode (*Linting & Type-Check*)
```bash
npm run lint
```

### 3. Kompilasi Produksi (*Production Build*)
```bash
npm run build
```
Hasil build siap produksi akan tersimpan di folder `dist/`.
