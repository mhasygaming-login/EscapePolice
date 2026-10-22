# Implementation Plan - Cinematic Cyberpunk Initial Loading Screen

Pembuatan layar pemuatan (*Cinematic Loading Screen*) futuristik yang muncul saat pertama kali aplikasi game dibuka. Fitur ini dirancang khusus dengan tipografi `LOADING` beranimasi *gradient shimmer stagger* per huruf, siluet mobil balap retro-cyber yang melaju di atas *progress bar* neon dinamis, dan efek partikel/kecepatan lintasan.

---

## User Review Required

> [!IMPORTANT]
> - **Waktu Tampil**: Loading screen akan muncul saat inisialisasi awal aplikasi (`isAppInitializing`), mensimulasikan pemuatan aset (audio FX, sprite kendaraan, data cache pengguna, dan koneksi server) sekitar 1.8–2.5 detik untuk memastikan transisi mulus dan visual dinamis.
> - **Tombol Lewati (*Skip*) & Accessibility**: Disertakan opsi lewati (*Skip*) instan jika pengguna ingin langsung masuk ke game, serta dukungan penuh untuk `prefers-reduced-motion`.

---

## Proposed Changes

### 1. Komponen Baru: `src/components/ui/LoadingScreen.tsx`
- **Teks `LOADING` Beranimasi Stagger Per Huruf:**
  - Setiap huruf (`L`, `O`, `A`, `D`, `I`, `N`, `G`) dipisah menjadi elemen independen dengan font `Orbitron` berukuran besar (`text-4xl sm:text-6xl tracking-[0.2em]`).
  - Animasi teks berupa gelombang gradien cyan ke magenta (`#00f0ff` ke `#e12afb`) dengan pantulan kilau neon (*shimmer light streak*) yang bergeser dari kiri ke kanan secara halus (*staggered delay* $60\text{ms}$ per huruf).
  - Titik tiga dinamis (`...`) dengan animasi ketukan berkedip halus (*rhythmic pulse*).

- **Siluet Mobil Balap Melaju di Atas Progress Bar:**
  - Siluet mobil sport cyberpunk (desain aerodinamis dengan sayap belakang dan lampu belakang neon merah/cyan menyala).
  - Posisi mobil terikat secara dinamis dengan persentase pemuatan ($0\%$ s.d. $100\%$), seolah mobil meluncur di atas rel lintasan *progress bar*.
  - Efek partikel jejak plasma (*light exhaust trail / speed streaks*) di belakang roda belakang mobil saat bergerak maju.

- **Progress Bar & Status Sistem:**
  - *Progress track* berdesain cyber-glass dengan garis aksen bercahaya.
  - Teks status pemuatan yang berganti secara dinamis:
    * `0% - 25%`: `"INITIALIZING CYBER ENGINE & AUDIO DRIVERS..."`
    * `25% - 55%`: `"CACHING NEON TRACKS & VEHICLE ASSETS..."`
    * `55% - 85%`: `"SYNCING DRIVER PROFILE & CLOUD NETWORK..."`
    * `85% - 100%`: `"SYSTEM READY. LAUNCHING CYBER PURSUIT..."`
  - Angka persentase digital dengan font `JetBrains Mono` (`font-mono-code`).

---

### 2. Efek & Utility CSS di `src/index.css`
- Menambahkan keyframe `@keyframes text-gradient-shimmer`:
  - Pergeseran posisi background gradien (`background-position: 0% -> 200%`) dengan kurva halus.
- Menambahkan keyframe `@keyframes car-suspension-bounce`:
  - Efek getaran suspensi mobil halus saat melaju di kecepatan tinggi.
- Menambahkan keyframe `@keyframes exhaust-flame`:
  - Semburan api/plasma knalpot mobil yang menyala redup-terang secara berulang.
- Dukungan `prefers-reduced-motion` untuk performa mulus di semua perangkat.

---

### 3. Integrasi ke `src/App.tsx` & Inisialisasi
- Mengaitkan state `isInitialLoading` di `src/App.tsx`.
- Loading screen berjalan saat startup aplikasi hingga proses sinkronisasi profil, verifikasi offline/online, dan pemanasan audio selesai.
- Setelah selesai $100\%$, loading screen menghilang dengan transisi *fade-out* dramatis selama $400\text{ms}$ menuju menu utama / lobi arena balapan.

---

## Verification Plan

### Automated Checks
- `npm run lint` (`tsc --noEmit`): Memastikan semua tipe props dan event handler TypeScript valid.
- `compile_applet`: Memastikan aplikasi ter-bundle tanpa kendala impor atau sintaks.

### Manual Verification
- Uji buka awal aplikasi di browser: Memastikan animasi huruf `L-O-A-D-I-N-G` berjalan berurutan dengan gradien shimmer.
- Memastikan pergerakan siluet mobil tepat mengikuti persentase *progress bar* dari 0% ke 100%.
- Memastikan transisi *fade-out* ke tampilan utama mulus tanpa *flicker* atau pergeseran tata letak.
