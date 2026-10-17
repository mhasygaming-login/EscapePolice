# Redesain Dashboard Lobi: Layout Imersif & Autolayout Profesional

Transformasi dashboard persiapan misi (*Lobby Balapan*) dari kontainer sempit terkunci menjadi tampilan widescreen imersif yang mendekati layar penuh dengan sistem autolayout profesional, proporsi spasial berjarak lega (*breathing room*), visual kartu yang lebih tinggi dan berbobot, serta tombol peluncuran balapan yang lapang.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan desain yang telah dikonfirmasi oleh pengguna:

- **Konfirmasi 1 (Skala Lebar Dashboard)**: Mengadopsi skala lebar imersif mendekati layar penuh (`max-w-7xl` / `w-[94vw]`) pada desktop agar tidak ada ruang kosong terbuang dan seluruh elemen tampil megah tanpa desakan.
- **Konfirmasi 2 (Autolayout & Ruang Bernapas)**: Penataan dua kolom lebar sejajar yang proporsional (*Arena vs Kesulitan*), diikuti deretan kartu telemetri mobil aktif dan armada pengejar yang lapang, serta bilah peluncuran balapan dengan *touch-target* dan padding lega.
- **Peningkatan Visual & Ergonomi Spasial**:
  - Tinggi showcase visual gambar ditingkatkan dari ~185px menjadi ~260px–300px pada desktop agar lanskap arena dan armada terlihat tajam dan sinematik.
  - Penambahan *inner padding* dan *gap spacing* berjenjang (dari `gap-3` menjadi `gap-6` pada desktop) sesuai prinsip matematika spasial UI (`r_inner = r_outer - padding`).
  - Penyesuaian ukuran font header dan tombol pemilih arena agar mudah dibaca sekilas tanpa terpotong atau berdesakan.

---

## 1. Overview & Core Concept

- **What It Does**: Membuka lobi persiapan balapan agar memanfaatkan kanvas layar secara optimal, memberikan ruang bernapas antar elemen, dan menciptakan impresi visual premium seperti game balap arcade AAA cyberpunk modern.
- **Target Audience / Persona**: Pemain di berbagai perangkat (desktop monitor 1080p/1440p hingga tablet & mobile) yang menginginkan antarmuka yang bersih, ergonomis, dan tidak sempit.
- **Key Value**: Pengalaman pengguna (*UX*) yang jauh lebih nyaman untuk memilih arena peta, mengatur tingkat kesulitan, memeriksa kendaraan, dan langsung meluncur ke lintasan.

---

## 2. User Experience & Visual Design

### A. Layout Structure & Breathing Room
1. **Header Lobi Lapang**:
   - Judul "LOBBY BALAPAN · PERSIAPAN MISI" dengan tipografi display tebal dan padding atas/bawah yang proporsional.
   - Indikator status dan panduan navigasi yang terpisah rapi dengan jarak lega.
2. **Dua Kolom Showcase Lebar**:
   - **Kolom Kiri (Arena Peta)**: Kartu preview gambar lanskap beresolusi tinggi dengan tinggi optimal (260px–300px), navigasi panah samping yang elegan, dan 5 tombol selektor arena di bagian bawah dengan tinggi touch-target minimal 48px.
   - **Kolom Kanan (Tingkat Kesulitan)**: Kartu preview armada polisi dengan status patroli dan 4 tombol selektor mode kesulitan (Santai, Normal, Sulit, MAXXX) yang memiliki jarak jeda empuk antar tombol.
3. **Bilah Telemetri & Armada Terintegrasi**:
   - Kartu "Mobil Aktif" menampilkan badge spesifikasi tenaga kuda (HP), nama model kendaraan, dan tombol ganti mobil yang terpisah dengan margin nyaman.
   - Kartu "Armada Pengejar" menampilkan status kesiagaan polisi dengan aksen merah neon yang jelas.
4. **Action Launch Bar (CTA Utama)**:
   - Tombol "MULAI BALAPAN" dengan tinggi 56px (`h-14`), gradien neon cyan bercahaya, dan panduan tombol kontrol keyboard (WASD, SPASI, E) dengan *spacing* rapi di sisi kanan.

### B. Visual Identity & Theme Tokens
- **Background Atmosphere**: Backdrop blur tebal (`backdrop-blur-2xl`) di atas latar peta dinamis berbayang hitam lembut (`#060812` dan gradien radial) untuk kontras tinggi tanpa menyilaukan mata.
- **Borders & Glow**: Aksen border cyan berkelas (`border-cyan-500/30`), bayangan lembut bertingkat (`shadow-2xl`), dan highlight aktif pada kartu terpilih.
- **Typography**: Huruf display tebal futuristik untuk judul dan label, font monospace presisi untuk spesifikasi teknis dan tombol kontrol keyboard.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Ekspansi Lebar Kontainer (Container Max-Width)**
  - *Chosen Approach*: Mengubah `max-w-4xl / lg:max-w-5xl` menjadi `max-w-7xl w-[94vw]` dengan padding responsif yang adaptif.
  - *Why*: Menghilangkan sensasi sempit dan terjepit pada resolusi desktop/laptop, memberikan ruang horizontal luas bagi kedua kolom showcase.
  - *Alternatives Considered*: Membiarkan lebar sempit hanya dengan memperkecil font (memperburuk legibilitas).

- **Decision 2: Peningkatan Rasio Aspek Gambar Kartu Showcase**
  - *Chosen Approach*: Menaikkan tinggi gambar dari `h-[140px] sm:h-[165px] md:h-[185px]` menjadi `h-[160px] sm:h-[220px] md:h-[260px] lg:h-[290px]`.
  - *Why*: Lanskap kota cyberpunk, pegunungan, gurun, dan salju menjadi daya tarik visual utama game yang layak dinikmati sebelum balapan.
  - *Alternatives Considered*: Gambar tetap pipih (terlihat kaku dan tidak imersif).

- **Decision 3: Pemisahan Baris Telemetri dan Peluncuran Balapan yang Bersih**
  - *Chosen Approach*: Menjadikan baris mobil aktif & armada memiliki kartu tersendiri dengan grid 2-kolom yang proporsional, serta bilah tombol peluncuran terpisah dengan padding atas dan garis aksen pemisah halus.
  - *Why*: Mencegah tombol balapan menempel terlalu dekat dengan selektor arena.

---

## 4. Technical Architecture & Data Strategy

### Component & Layout Hierarchy Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MainGameLobby.tsx (Full Viewport)                    │
│   - Absolute Themed Map Background (Sinematik dengan Vignette Depth)   │
│   - Responsive Outer Flex Wrapper (min-h-[100dvh] items-center py-6)   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Expanded Hero Dashboard Card Container                       │   │
│   │   (w-[94vw] max-w-7xl backdrop-blur-2xl rounded-3xl p-6 md:p-8)│   │
│   │                                                                │   │
│   │   ┌────────────────────────────────────────────────────────┐   │   │
│   │   │ Top Header Bar: LOBBY BALAPAN · PERSIAPAN MISI         │   │   │
│   │   └────────────────────────────────────────────────────────┘   │   │
│   │                                                                │   │
│   │   ┌──────────────────────────────┬─────────────────────────┐   │   │
│   │   │ Kolom Kiri: Pilihan Arena    │ Kolom Kanan: Kesulitan  │   │   │
│   │   │ - Preview Gambar (h-280px)   │ - Preview Gambar (h-280)│   │   │
│   │   │ - 5 Tombol Selektor (h-48px) │ - 4 Tombol Selektor     │   │   │
│   │   └──────────────────────────────┴─────────────────────────┘   │   │
│   │                                                                │   │
│   │   ┌──────────────────────────────┬─────────────────────────┐   │   │
│   │   │ Kartu Mobil Aktif            │ Kartu Armada Pengejar   │   │   │
│   │   │ - HP & Model + Ganti Mobil   │ - Unit Siaga + Armada   │   │   │
│   │   └──────────────────────────────┴─────────────────────────┘   │   │
│   │                                                                │   │
│   │   ┌────────────────────────────────────────────────────────┐   │   │
│   │   │ Bottom Action Bar:                                     │   │   │
│   │   │ [ MULAI BALAPAN ➜ ... (h-14) ]    [ Keyboard Guide ]   │   │   │
│   │   └────────────────────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Component State & Event Handlers
- `selectedMapId`: Memperbarui arena aktif dan menyinkronkan latar belakang dinamis secara mulus.
- `difficulty`: Mengatur tingkat kecepatan dan agresivitas armada polisi.
- `onChangeCar`: Membuka modal garasi untuk kustomisasi dan penggantian kendaraan.
- `onOpenFleet`: Membuka modal inspeksi armada helikopter & patroli polisi.
- `onStartGame`: Meluncurkan balapan dengan arena dan tingkat kesulitan yang telah dipilih.
