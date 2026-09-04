/**
 * scripts/seed-content.js
 * -----------------------------------------------------------------------
 * Mengisi tabel site_content dengan konten AWAL (data yang dulu ada di
 * data/content.js), supaya begitu fitur "Kelola Konten" mulai dipakai,
 * halaman publik tidak tiba-tiba kosong.
 *
 * HANYA PERLU DIJALANKAN SEKALI, setelah npm run migrate dan sebelum
 * pertama kali membuka halaman admin "Kelola Konten". Aman dijalankan
 * ulang — akan MENIMPA isi section yang sudah ada di database dengan
 * data awal ini, jadi jangan dijalankan lagi setelah konten pernah
 * diedit lewat halaman admin (kecuali memang ingin mengembalikan ke
 * data contoh awal).
 *
 *   npm run seed-content
 * -----------------------------------------------------------------------
 */
require("dotenv").config();

const db = require("../api/_lib/config/db");

const INITIAL_CONTENT = {
  news: [
    {
      judul: "Jadwal Imunisasi Rutin Bulan Ini",
      kategori: "Informasi",
      tanggal: "2026-08-05",
      ringkasan:
        "Layanan imunisasi rutin untuk bayi dan balita tersedia setiap Selasa dan Kamis pukul 08.00-11.00 di ruang KIA.",
    },
    {
      judul: "Pengumuman Libur Pelayanan",
      kategori: "Pengumuman",
      tanggal: "2026-08-14",
      ringkasan:
        "Pelayanan rawat jalan diliburkan pada tanggal 17 Agustus dalam rangka HUT RI. Layanan IGD tetap buka 24 jam.",
    },
    {
      judul: "Edukasi Cegah Stunting untuk Ibu Hamil",
      kategori: "Kesehatan",
      tanggal: "2026-08-20",
      ringkasan:
        "Kegiatan penyuluhan gizi bagi ibu hamil dan menyusui digelar rutin setiap bulan bekerja sama dengan kader posyandu.",
    },
  ],

  agenda: [
    {
      judul: "Posyandu Balita Desa Sampalan",
      tanggal: "2026-09-02",
      jam: "08.00 - 11.00 WIB",
      lokasi: "Balai Desa Sampalan",
      deskripsi: "Penimbangan, imunisasi, dan pemberian vitamin A untuk balita.",
    },
    {
      judul: "Senam Sehat Lansia",
      tanggal: "2026-09-06",
      jam: "07.00 - 08.30 WIB",
      lokasi: "Halaman Puskesmas",
      deskripsi: "Kegiatan rutin senam bersama untuk menjaga kebugaran lansia.",
    },
    {
      judul: "Penyuluhan Bahaya DBD",
      tanggal: "2026-09-12",
      jam: "09.00 - 11.00 WIB",
      lokasi: "Aula Kecamatan Kutawaluya",
      deskripsi: "Sosialisasi pencegahan demam berdarah menjelang musim hujan.",
    },
    {
      judul: "Donor Darah Bersama PMI",
      tanggal: "2026-09-20",
      jam: "08.00 - 12.00 WIB",
      lokasi: "Halaman Puskesmas",
      deskripsi: "Kegiatan donor darah rutin bekerja sama dengan PMI Kabupaten Karawang.",
    },
  ],

  profile: {
    deskripsi:
      "UPTD Puskesmas Kutawaluya merupakan Unit Pelaksana Teknis Daerah di bawah Dinas Kesehatan Kabupaten Karawang yang menyelenggarakan pelayanan kesehatan tingkat pertama bagi masyarakat di wilayah Kecamatan Kutawaluya. Puskesmas Kutawaluya berlokasi di Desa Sampalan, Kecamatan Kutawaluya, Kabupaten Karawang. Dalam pelaksanaan pelayanan kesehatan, Puskesmas Kutawaluya memberikan pelayanan kesehatan perorangan sekaligus melaksanakan berbagai upaya kesehatan masyarakat secara terpadu.",
    highlights: [
      { icon: "fa-map-location-dot", text: "7 Wilayah Kerja UPTD Puskesmas Kutawaluya (Sukamulya, Waluya, Sindangmulya, Sindangkarya, Sindangsari, Sindangmukti, Sampalan)" },
      { icon: "fa-house-medical", text: "Didukung oleh Posyandu, Posbindu, dan jejaring kesehatan lainnya" },
      { icon: "fa-user-doctor", text: "Didukung 60 tenaga kesehatan dan tenaga penunjang profesional" },
    ],
    visi: "Mewujudkan Karawang Mandiri, Bermartabat dan Sejahtera.",
    misi: [
      "Terwujudnya sumber daya manusia yang berkualitas dan berdaya saing.",
      "Terwujudnya ekonomi kerakyatan yang kreatif, produktif dan berdaya saing serta berbasis pada potensi lokal.",
      "Terwujudnya tata kelola lingkungan hidup yang aman, nyaman dan mendukung proses pembangunan yang berkesinambungan.",
      "Terwujudnya tata kelola pemerintahan yang baik dan pelayanan publik yang berkualitas.",
    ],
    tata_nilai_judul: "THE WINNERS",
    tata_nilai: [
      { nilai: "Togetherness", arti: "Kebersamaan" },
      { nilai: "Wise", arti: "Bijak" },
      { nilai: "Integrity", arti: "Integritas" },
      { nilai: "Norm", arti: "Norma" },
      { nilai: "Non Discrimination", arti: "Tidak Diskriminasi" },
      { nilai: "Energic", arti: "Berenergi" },
      { nilai: "Responsive", arti: "Responsif" },
      { nilai: "Safety", arti: "Aman" },
    ],
    akreditasi: [
      {
        nama: "Akreditasi Puskesmas — Predikat Paripurna",
        penyelenggara: "Komisi Akreditasi Fasilitas Kesehatan Tingkat Pertama (KAFKTP)",
        tmt: "TMT 2023",
        berlaku_hingga: "Berlaku hingga 2026",
        file: "assets/docs/akreditasi.pdf",
      },
      {
        nama: "Sertifikat ISO 9001:2015",
        penyelenggara: "Manajemen Mutu Pelayanan",
        tmt: "TMT 2022",
        berlaku_hingga: "Berlaku hingga 2025",
        file: "",
      },
    ],
  },

  layanan: {
    services: [
      {
        nama: "Poli Umum", kategori: "Poli & Rawat Jalan",
        deskripsi: "Pemeriksaan dan pengobatan umum untuk seluruh usia.",
        jadwal: "Senin - Sabtu, 07.45 - 13.00", lokasi: "Lantai 1, Ruang 1",
        persyaratan: ["Kartu identitas (KTP/KK)", "Kartu BPJS/KIS jika ada"],
        alur: ["Ambil nomor antrean", "Pendaftaran di loket", "Menunggu panggilan poli", "Pemeriksaan dokter", "Pengambilan obat di farmasi"],
      },
      {
        nama: "Poli Gigi", kategori: "Poli & Rawat Jalan",
        deskripsi: "Pemeriksaan dan perawatan kesehatan gigi dan mulut.",
        jadwal: "Senin - Jumat, 08.00 - 13.00", lokasi: "Lantai 1, Ruang 3",
        persyaratan: ["Kartu identitas (KTP/KK)", "Kartu BPJS/KIS jika ada"],
        alur: ["Ambil nomor antrean", "Pendaftaran di loket", "Pemeriksaan di poli gigi"],
      },
      {
        nama: "KIA / KB", kategori: "Kesehatan Ibu & Anak",
        deskripsi: "Pemeriksaan kehamilan, imunisasi anak, dan layanan keluarga berencana.",
        jadwal: "Senin - Sabtu, 07.45 - 13.00", lokasi: "Lantai 1, Ruang KIA",
        persyaratan: ["Buku KIA (bagi ibu hamil/balita)", "Kartu identitas"],
        alur: ["Pendaftaran di loket", "Pemeriksaan/konsultasi di ruang KIA"],
      },
      {
        nama: "Farmasi", kategori: "Penunjang",
        deskripsi: "Pelayanan pengambilan obat sesuai resep dokter.",
        jadwal: "Senin - Sabtu, 07.45 - 14.00", lokasi: "Lantai 1, dekat pintu keluar",
        persyaratan: ["Resep dari dokter Puskesmas"],
        alur: ["Serahkan resep", "Tunggu panggilan", "Ambil obat"],
      },
      {
        nama: "Laboratorium", kategori: "Penunjang",
        deskripsi: "Pemeriksaan penunjang seperti darah, urine, dan gula darah.",
        jadwal: "Senin - Sabtu, 07.45 - 12.00", lokasi: "Lantai 1, Ruang Laboratorium",
        persyaratan: ["Surat pengantar dari dokter poli"],
        alur: ["Serahkan surat pengantar", "Pengambilan sampel", "Ambil hasil sesuai jadwal"],
      },
      {
        nama: "IGD (Unit Gawat Darurat)", kategori: "Gawat Darurat",
        deskripsi: "Penanganan kasus gawat darurat selama 24 jam.",
        jadwal: "Setiap hari, 24 jam", lokasi: "Lantai 1, sebelah kanan gedung utama",
        persyaratan: ["Kartu identitas (dapat menyusul)"],
        alur: ["Datang langsung ke IGD", "Triase oleh petugas", "Penanganan medis"],
      },
    ],
    clusters: [
      { nama: "Ibu, Anak, dan Remaja", sasaran: "Ibu hamil, balita, anak sekolah, dan remaja", jenis_pelayanan: "ANC, imunisasi, tumbuh kembang anak, kesehatan reproduksi remaja", jadwal: "Senin - Sabtu, 07.45 - 13.00" },
      { nama: "Usia Produktif dan Lansia", sasaran: "Usia produktif (15-59 tahun) dan lansia", jenis_pelayanan: "Skrining PTM, posbindu, pelayanan lansia", jadwal: "Senin - Sabtu, sesuai jadwal posbindu" },
      { nama: "Penanggulangan Penyakit Menular", sasaran: "Masyarakat umum berisiko penyakit menular", jenis_pelayanan: "TB, HIV, imunisasi, surveilans penyakit menular", jadwal: "Senin - Jumat, 07.45 - 13.00" },
      { nama: "Lintas Klaster (Kegawatdaruratan & Penunjang)", sasaran: "Seluruh lapisan masyarakat", jenis_pelayanan: "IGD, laboratorium, farmasi, rawat inap/PONED", jadwal: "24 jam setiap hari" },
    ],
    alur_umum: [
      { judul: "Ambil nomor antrean", deskripsi: "Ambil nomor antrean di mesin/loket pendaftaran sesuai jenis layanan." },
      { judul: "Pendaftaran", deskripsi: "Serahkan kartu identitas dan BPJS/KIS (jika ada) ke petugas loket." },
      { judul: "Menunggu panggilan poli", deskripsi: "Tunggu nama/nomor dipanggil sesuai poli tujuan." },
      { judul: "Pemeriksaan", deskripsi: "Konsultasi dan pemeriksaan oleh dokter/petugas di poli." },
      { judul: "Pengambilan obat", deskripsi: "Ambil obat di farmasi jika mendapat resep dari dokter." },
    ],
    persyaratan_umum: [
      "Kartu Tanda Penduduk (KTP) atau Kartu Keluarga (KK)",
      "Kartu BPJS Kesehatan/KIS (jika peserta JKN)",
      "Buku KIA bagi ibu hamil, ibu menyusui, atau balita",
      "Surat rujukan (jika kunjungan lanjutan/rujuk balik)",
    ],
    schedule: [
      { nama_petugas: "dr. Andi Prasetyo", poli: "Poli Umum", hari: "Senin", jam: "07.45 - 13.00" },
      { nama_petugas: "dr. Andi Prasetyo", poli: "Poli Umum", hari: "Rabu", jam: "07.45 - 13.00" },
      { nama_petugas: "dr. Rina Wulandari", poli: "Poli Umum", hari: "Selasa", jam: "07.45 - 13.00" },
      { nama_petugas: "dr. Rina Wulandari", poli: "Poli Umum", hari: "Kamis", jam: "07.45 - 13.00" },
      { nama_petugas: "drg. Maya Kusuma", poli: "Poli Gigi", hari: "Senin", jam: "08.00 - 13.00" },
      { nama_petugas: "drg. Maya Kusuma", poli: "Poli Gigi", hari: "Jumat", jam: "08.00 - 13.00" },
      { nama_petugas: "Bidan Siti Nurhaliza", poli: "KIA / KB", hari: "Senin", jam: "07.45 - 13.00" },
      { nama_petugas: "Bidan Siti Nurhaliza", poli: "KIA / KB", hari: "Kamis", jam: "07.45 - 13.00" },
      { nama_petugas: "Bidan Dewi Anggraini", poli: "KIA / KB", hari: "Selasa", jam: "07.45 - 13.00" },
      { nama_petugas: "Bidan Dewi Anggraini", poli: "KIA / KB", hari: "Sabtu", jam: "07.45 - 12.00" },
    ],
  },

  programs: [
    { nama: "Posyandu Balita", kategori: "Kesehatan Ibu & Anak", deskripsi: "Pemantauan tumbuh kembang balita, imunisasi, dan pemberian vitamin.", sasaran: "Balita usia 0-5 tahun", jadwal: "Setiap tanggal 5-10, sesuai jadwal posyandu masing-masing desa", lokasi: "Posyandu di 7 desa wilayah kerja", petugas: "Bidan Desa & Kader Posyandu" },
    { nama: "Posbindu PTM", kategori: "Penyakit Tidak Menular", deskripsi: "Skrining tekanan darah, gula darah, dan faktor risiko penyakit tidak menular.", sasaran: "Usia produktif dan lansia", jadwal: "Setiap Sabtu minggu ke-2, 08.00 - 11.00", lokasi: "Balai desa/posbindu setempat", petugas: "Kader Posbindu & Petugas Promkes" },
    { nama: "Program TB Paru", kategori: "Penyakit Menular", deskripsi: "Penemuan kasus, pengobatan, dan pemantauan pasien TB paru.", sasaran: "Masyarakat dengan gejala/terkonfirmasi TB", jadwal: "Setiap hari kerja", lokasi: "Poli TB Puskesmas", petugas: "Petugas Program TB" },
    { nama: "Kelas Ibu Hamil", kategori: "Kesehatan Ibu & Anak", deskripsi: "Edukasi kehamilan, persalinan, dan perawatan bayi baru lahir bagi ibu hamil.", sasaran: "Ibu hamil", jadwal: "Setiap bulan, minggu ke-3", lokasi: "Aula Puskesmas", petugas: "Bidan Koordinator" },
    { nama: "Gerakan Cegah Stunting", kategori: "Gizi Masyarakat", deskripsi: "Edukasi gizi, pemberian makanan tambahan, dan pemantauan balita berisiko stunting.", sasaran: "Ibu hamil, ibu menyusui, dan balita", jadwal: "Berkelanjutan, evaluasi tiap bulan", lokasi: "Posyandu & Puskesmas", petugas: "Petugas Gizi" },
    { nama: "Imunisasi Rutin", kategori: "Pencegahan Penyakit", deskripsi: "Pemberian imunisasi dasar lengkap dan lanjutan untuk bayi dan anak sekolah.", sasaran: "Bayi, balita, dan anak usia sekolah", jadwal: "Setiap Selasa dan Kamis, 08.00 - 11.00", lokasi: "Ruang KIA Puskesmas & Posyandu", petugas: "Bidan & Petugas Imunisasi" },
  ],
};

async function seed() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("[seed-content] TURSO_DATABASE_URL belum diisi di .env.");
    process.exit(1);
  }

  console.log("[seed-content] Mengisi data awal ke tabel site_content ...");

  for (const [section, content] of Object.entries(INITIAL_CONTENT)) {
    try {
      await db.execute({
        sql: `INSERT INTO site_content (section_key, content_json, updated_at)
              VALUES (?, ?, datetime('now'))
              ON CONFLICT(section_key) DO UPDATE SET
                content_json = excluded.content_json,
                updated_at = excluded.updated_at`,
        args: [section, JSON.stringify(content)],
      });
      console.log(`[seed-content] OK  - ${section}`);
    } catch (err) {
      console.error(`[seed-content] GAGAL - ${section}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log("[seed-content] Selesai. Konten awal sudah tersimpan di database.");
  process.exit(0);
}

seed();
