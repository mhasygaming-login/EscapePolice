# Panduan Lengkap Build APK: Escape the Police 🏎️💨

Dokumen ini menjelaskan **dua metode utama** untuk mengubah web game **Escape the Police: Cyber Pursuit** menjadi berkas instalasi **Android (.apk)** yang dapat di-install di smartphone Android, dijalankan seperti aplikasi native, dan di-uninstall secara bersih lewat pengaturan aplikasi Android.

---

## 📌 DAFTAR ISI
1. [Metode 1: PWA / TWA (Bubblewrap & PWABuilder)](#-metode-1-pwa--twa-trusted-web-activity)
2. [Metode 2: Android Studio Native WebView Wrapper](#-metode-2-android-studio-native-webview-wrapper)
3. [Langkah Kompilasi APK di Android Studio (Step-by-Step)](#-langkah-kompilasi-apk-di-android-studio)
4. [Cara Install APK di Smartphone Android](#-cara-install-apk-di-smartphone-android)
5. [Cara Uninstall Bersih dari Android](#-cara-uninstall-bersih-dari-android)
6. [Fitur & Pengaturan Khusus (Audio Autoplay, Fullscreen, Offline)](#-fitur--pengaturan-khusus-android)

---

## 🚀 Metode 1: PWA / TWA (Trusted Web Activity)

Metode ini menggunakan standar **Progressive Web App (PWA)** yang sudah tertanam di game ini (`manifest.json` dan `service-worker.js`).

### Opsi A: Menggunakan PWABuilder (Paling Cepat & Tanpa Coding)
1. Buka browser dan kunjungi: **[PWABuilder.com](https://www.pwabuilder.com)**
2. Masukkan URL game Anda:
   ```text
   https://ais-dev-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app
   ```
3. Klik tombol **Start**. PWABuilder akan memvalidasi Manifest, Service Worker, dan Ikon aplikasi.
4. Klik tombol **Package for Android**.
5. Pilih opsi **Generate Package** (APK/AAB).
6. Unduh berkas ZIP hasil compile, ekstrak, dan Anda akan langsung mendapatkan berkas `app-release-unsigned.apk` atau debug APK yang siap diuji di HP.

### Opsi B: Menggunakan Google Bubblewrap CLI (Command Line)
1. Install Node.js dan Bubblewrap secara global:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Inisialisasi proyek dari URL manifest game:
   ```bash
   bubblewrap init --manifest="https://ais-dev-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app/manifest.json"
   ```
3. Jalankan perintah build APK:
   ```bash
   bubblewrap build
   ```
4. Berkas `.apk` akan dibuat otomatis di folder proyek Anda.

---

## 📱 Metode 2: Android Studio (Native WebView Wrapper)

Seluruh struktur kode proyek Android Studio telah disediakan secara lengkap di dalam folder `android/`:

```text
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/escapepolice/game/
│   │   │   └── MainActivity.kt       # Controller WebView Native dengan audio autoplay
│   │   ├── res/
│   │   │   ├── layout/activity_main.xml
│   │   │   ├── mipmap-*/             # Ikon aplikasi multi-resolusi (HDPI s/d XXXHDPI)
│   │   │   └── values/               # strings.xml, colors.xml, themes.xml
│   │   └── AndroidManifest.xml       # Izin internet, orientasi layar & launcher intent
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

---

## 🛠️ Langkah Kompilasi APK di Android Studio

Ikuti langkah-langkah berikut untuk meng-compile kode menjadi berkas `.apk`:

### Langkah 1: Buka Proyek di Android Studio
1. Buka aplikasi **Android Studio** di komputer/laptop Anda.
2. Pilih menu **File** $\rightarrow$ **Open...**
3. Arahkan ke folder `android/` di dalam direktori game ini, lalu klik **OK**.
4. Tunggu beberapa saat hingga proses **Gradle Sync** selesai mengunduh dependensi (`androidx.webkit`, `material`, dll).

### Langkah 2: Sesuaikan URL Game (Opsional)
Buka berkas `MainActivity.kt`:
```text
android/app/src/main/java/com/escapepolice/game/MainActivity.kt
```
Pada bagian `companion object`, periksa konstanta `DEFAULT_GAME_URL`:
```kotlin
companion object {
    const val DEFAULT_GAME_URL = "https://ais-dev-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app"
}
```
*Jika Anda ingin menghubungkan ke domain sendiri atau server lokal, ubah URL tersebut.*

### Langkah 3: Build APK Debug (Untuk Pengujian Cepat)
1. Di menu atas Android Studio, klik:  
   **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
2. Tunggu proses kompilasi selesai (biasanya $15 - 45\text{ detik}$).
3. Di sudut kanan bawah akan muncul notifikasi:  
   `APK(s) generated successfully for 1 module: 'app'.`
4. Klik tautan **locate** pada notifikasi tersebut. File `app-debug.apk` Anda berada di:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Langkah 4: Build APK Release (Untuk Distribusi Resmi)
1. Klik menu **Build** $\rightarrow$ **Generate Signed Bundle / APK...**
2. Pilih opsi **APK**, lalu klik **Next**.
3. Buat KeyStore baru (*Create new...*) atau gunakan Keystore yang sudah ada.
4. Pilih build variant **release**, lalu klik **Create**.
5. File APK Release siap dipublikasikan atau dibagikan ke pengguna.

---

## 📲 Cara Install APK di Smartphone Android

1. **Transfer File APK ke Smartphone:**
   - Kirim berkas `app-debug.apk` melalui kabel USB, WhatsApp, Telegram, Google Drive, atau download langsung dari HP.
2. **Aktifkan Izin "Sumber Tidak Dikenal" (*Install Unknown Apps*):**
   - Di smartphone Android Anda, buka:  
     `Pengaturan (Settings)` $\rightarrow$ `Keamanan & Privasi` $\rightarrow$ `Instal Aplikasi Tidak Dikenal`.
   - Izinkan browser/File Manager Anda untuk menginstal aplikasi.
3. **Mulai Pemasangan:**
   - Buka File Manager di HP, ketuk berkas `app-debug.apk`.
   - Ketuk tombol **Instal**.
   - Ikon game **Escape Police** dengan logo supercar neon akan muncul di Home Screen dan App Drawer Android Anda!

---

## 🗑️ Cara Uninstall Bersih dari Android

Aplikasi ini mematuhi standar native Android Package Manager sehingga dapat di-uninstall secara bersih tanpa meninggalkan file sampah:

1. **Metode Cepat (Home Screen):**
   - Tekan dan tahan (long-press) ikon **Escape Police** di layar utama atau daftar aplikasi.
   - Ketuk opsi **Copot Pemasangan (Uninstall)** $\rightarrow$ pilih **OK**.

2. **Metode Pengaturan Sistem:**
   - Buka `Pengaturan (Settings)` $\rightarrow$ `Aplikasi (Apps)` $\rightarrow$ cari **Escape Police**.
   - *(Opsional)* Ketuk `Penyimpanan & Cache (Storage)` $\rightarrow$ ketuk `Hapus Data & Cache`.
   - Ketuk tombol **Copot Pemasangan (Uninstall)**.
   - Seluruh data lokal WebView dan cache game akan terhapus bersih dari perangkat.

---

## ⚙️ Fitur & Pengaturan Khusus Android

1. **Audio Autoplay Tanpa Hambatan:**
   - Pada `MainActivity.kt`, parameter `mediaPlaybackRequiresUserGesture = false` diaktifkan. Hal ini memungkinkan efek suara mesin (*engine rev*), *turbo flutter*, dan *synth music* berbunyi secara instan tanpa perlu menunggu interaksi klik pertama pengguna.
2. **Layar Penuh Sinematik (Immersive Sticky Mode):**
   - Status bar atas dan navigation bar bawah disembunyikan secara otomatis, memaksimalkan area layar 100% untuk arena balap.
3. **Akselerasi Grafis Perangkat Keras (Hardware Acceleration):**
   - Tag `android:hardwareAccelerated="true"` pada `AndroidManifest.xml` memastikan canvas rendering game berjalan mulus di $60\text{ FPS}$.
4. **Tombol Kembali Android (System Back Key):**
   - Jika pengguna menekan tombol Back saat berada di halaman utama game, akan muncul dialog konfirmasi native: *"Apakah Anda yakin ingin keluar dari Escape Police?"*.
