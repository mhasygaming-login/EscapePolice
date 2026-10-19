# Implementation Plan: Peningkatan Visual & Animasi Keren Multiplayer Arena

Menambahkan sentuhan visual modern, animasi interaktif halus, dan telemetri koneksi gelombang real-time pada halaman Multiplayer Arena dengan tetap mempertahankan keselarasan presisi terhadap tema `#07080f`, `#0c0e18`, dan `#22d3ee`.

---

## User Review Required

> [!IMPORTANT]
> Berdasarkan jawaban Anda:
> 1. **Latar Belakang**: Minimalis elegan ("jangan terlalu lebay") — menggunakan mikro cyber-grid 3% opacity dengan radial vignette yang tenang, tanpa partikel melayang yang mengganggu.
> 2. **Animasi & Interaksi**: Efek glow dinamis saat hover kartu dan transisi halus pada tombol/elemen input.
> 3. **Elemen Pelengkap**: Grafik gelombang sinyal koneksi real-time (live waveform bars) yang terintegrasi di badge status Cloud Server Aktif.

---

## Proposed Changes

### 1. Visual Latar Belakang Tenang & Berkelas
- Memperkaya background `#07080f` dengan pola mikro cyber-grid linear (opacity 3%) dan gradien radial ambient terpusat.
- Menjamin keterbacaan teks dan kontras tetap tajam tanpa gangguan elemen visual yang berlebihan.

### 2. Live Signal Waveform (Status Server Real-Time)
- Menambahkan visualisasi gelombang frekuensi sinyal server di dalam panel **Link Publik Game** di samping badge `CLOUD SERVER AKTIF`.
- Menggunakan bar gelombang dinamis dengan animasi tinggi berirama lembut (representing live ping/packet heartbeats) beserta label latensi (misal `~28ms · Sinyal Prima`).

### 3. Efek Glow Dinamis & Transisi Kartu
- Menambahkan transisi kartu hover dengan efek pencahayaan tepi (*subtle perimeter aura*):
  - Kartu **Gabung via Kode Room** & **Buat Arena Baru**: `hover:border-[#22d3ee]/45` dengan shadow `0 0 25px rgba(34,211,238,0.10)`.
  - Item **Lobby Publik Aktif**: glow adaptif sesuai tingkat kesulitan:
    - Normal: Cyan glow halus (`rgba(34,211,238,0.12)`)
    - Hard: Amber/Orange glow halus (`rgba(245,176,65,0.12)`)
    - Maxxx: Purple/Magenta glow halus (`rgba(232,121,249,0.12)`)
- Tombol aksi utama ("⚡ Buat & Buka Lobby", "Gabung", "Masuk") memiliki efek transisi elevasi lembut dan glow hover yang responsif saat disentuh/diklik.

---

## Verification Plan

### Automated Tests
- Menjalankan `lint_applet` untuk memastikan tidak ada kesalahan sintaks atau import.
- Menjalankan `compile_applet` untuk memastikan kompilasi bundle Vite & backend TypeScript berhasil 100%.

### Manual Verification
- Memeriksa tampilan di berbagai ukuran layar (mobile, tablet, desktop) untuk memastikan layout tetap presisi dan proporsional.
- Memastikan transisi hover kartu dan animasi gelombang berjalan mulus tanpa lag frame rate.
