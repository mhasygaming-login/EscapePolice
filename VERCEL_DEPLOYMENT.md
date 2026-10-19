# Panduan Update Otomatis ke Vercel (Auto-Deploy CI/CD)

Proyek ini telah dikonfigurasi penuh agar dapat di-deploy dan diperbarui secara **otomatis 100% ke Vercel** setiap kali Anda melakukan perubahan kode (`git push`).

---

## 🚀 Metode 1: Hubungkan GitHub ke Vercel (Paling Direkomendasikan & Otomatis)

Ini adalah cara standar industri dan paling praktis. Begitu terhubung, setiap kali Anda mengetik `git push`, Vercel akan otomatis mendeteksi perubahan, mengompilasi aplikasi, dan memperbarui website Anda dalam hitungan detik.

### Langkah-langkah:
1. **Push Proyek ke GitHub:**
   Jika belum di-push ke GitHub, buka terminal di folder proyek Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: setup vercel deployment"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/NAMA-REPO-ANDA.git
   git push -u origin main
   ```

2. **Buka Dashboard Vercel:**
   - Kunjungi [https://vercel.com](https://vercel.com) dan login (disarankan login menggunakan akun GitHub).
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Pilih repositori GitHub Anda dari daftar, lalu klik **"Import"**.

3. **Pengaturan Otomatis (Sudah Terkonfigurasi via `vercel.json`):**
   - Framework Preset: **Vite** (terdeteksi otomatis).
   - Root Directory: `./`
   - Build Command: `npm run build:web` (sudah diatur di `vercel.json`).
   - Output Directory: `dist`
   - Klik **"Deploy"**.

4. **Selesai! Update Otomatis Aktif:**
   Setiap kali Anda mengedit kode di kemudian hari, cukup jalankan:
   ```bash
   git add .
   git commit -m "Update fitur baru"
   git push
   ```
   **Vercel akan otomatis meng-update website secara realtime tanpa perlu tindakan manual.**

---

## ⚡ Metode 2: Menggunakan GitHub Actions CI/CD Pipeline

File alur kerja otomatis telah disediakan di:
`.github/workflows/deploy-vercel.yml`

Alur ini akan memeriksa tipe TypeScript (`npm run lint`), membangun aplikasi web (`npm run build:web`), dan mendeploy ke Vercel secara otomatis pada setiap push ke branch `main`.

### Langkah Pengaktifan:
1. Di terminal lokal, pasang Vercel CLI (jika belum):
   ```bash
   npm i -g vercel
   ```
2. Hubungkan proyek lokal dengan Vercel:
   ```bash
   vercel link
   ```
   Proses ini akan menghasilkan folder `.vercel/project.json` yang berisi `orgId` dan `projectId`.
3. Buat Access Token di Vercel:
   - Buka **Vercel Account Settings > Tokens**.
   - Klik **"Create Token"**, beri nama (misal: `github-actions-token`), lalu salin tokennya.
4. Masukkan Secrets ke GitHub Repository:
   - Buka repositori Anda di GitHub > **Settings > Secrets and variables > Actions**.
   - Klik **"New repository secret"** dan tambahkan 3 secret berikut:
     - `VERCEL_TOKEN`: Token yang baru saja Anda buat.
     - `VERCEL_ORG_ID`: Nilai `orgId` dari `.vercel/project.json`.
     - `VERCEL_PROJECT_ID`: Nilai `projectId` dari `.vercel/project.json`.

---

## 💻 Metode 3: Update Manual Cepat via Vercel CLI

Jika Anda ingin deploy langsung dari terminal tanpa commit ke git:
```bash
# Pastikan Vercel CLI terpasang
npm i -g vercel

# Deploy langsung ke Production dalam 1 perintah
npm run deploy:vercel
```

---

## 🛠️ File Konfigurasi yang Telah Disediakan

1. **`vercel.json`**
   - Mengatur routing Single Page Application (SPA rewrite ke `/index.html`) agar tidak terjadi error 404 saat navigasi atau reload.
   - Mengonfigurasi header keamanan (**Content Security Policy**, **worker-src**, **child-src** untuk Web Worker, dan browser caching).
2. **`package.json`**
   - Ditambahkan script `"build:web": "vite build"` khusus untuk kompilasi Vercel yang cepat dan bersih.
   - Ditambahkan script `"deploy:vercel": "vercel --prod"`.
3. **`.github/workflows/deploy-vercel.yml`**
   - Workflow otomatis untuk CI/CD di GitHub Actions.
