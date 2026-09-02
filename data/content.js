/**
 * data/content.js
 * -----------------------------------------------------------------------
 * SUMBER KONTEN STATIS untuk bagian-bagian website yang jarang berubah:
 * Informasi & Berita, Agenda/Kegiatan, Profil (deskripsi, visi, misi,
 * tata nilai, akreditasi), Layanan (daftar layanan, cluster ILP, jadwal
 * dokter, alur, persyaratan), dan Program.
 *
 * TIDAK memerlukan backend/database — cukup edit isi objek di bawah ini
 * lalu simpan file ini, perubahan langsung tampil di website (refresh
 * browser saja, tidak perlu restart server apa pun).
 *
 * Bagian yang TETAP lewat backend (jangan diedit di sini karena tidak
 * dipakai): grafik Data Kesehatan, Persentase Kepuasan, submit Survei,
 * submit Pengaduan, upload Excel — itu semua tetap dinamis dari Supabase.
 *
 * PANDUAN EDIT CEPAT:
 *  - Tambah item baru -> copy salah satu blok { ... } yang sudah ada,
 *    tempel dengan tanda koma di antaranya, lalu ubah isinya.
 *  - Hapus item -> hapus seluruh blok { ... } beserta tanda koma setelahnya.
 *  - Kosongkan satu bagian -> ganti isinya jadi array kosong: []
 *    (nanti otomatis tampil pesan "Belum ada data ..." di website).
 *  - Jaga tanda kutip " ", kurung kurawal { }, dan koma , tetap rapi,
 *    karena ini adalah kode JavaScript, bukan dokumen teks biasa.
 * -----------------------------------------------------------------------
 */
window.SITE_CONTENT = {
  /* ===================================================================
   * BERANDA — Informasi & Berita
   * =================================================================== */
  news: [
    {
      judul: "[Judul]",
      kategori: "[Kategori]",
      tanggal: "[yyyy-mm-dd]",
      ringkasan:
        "[Deskripsi Singkat]",
    },
    {
      judul: "[Judul]",
      kategori: "[Kategori]",
      tanggal: "[yyyy-mm-dd]",
      ringkasan:
        "[Deskripsi Singkat]",
    },
    {
      judul: "[Judul]",
      kategori: "[Kategori]",
      tanggal: "[yyyy-mm-dd]",
      ringkasan:
        "[Deskripsi Singkat]",
    },
  ],

  /* ===================================================================
   * BERANDA — Agenda / Kegiatan Mendatang
   * =================================================================== */
  agenda: [
    {
      judul: "[Judul]",
      tanggal: "[yyyy-mm-dd]",
      jam: "[00.00 - 00.00 WIB]",
      lokasi: "[Lokasi]",
      deskripsi: "[Deskripsi singkat]",
    },
    {
      judul: "[Judul]",
      tanggal: "[yyyy-mm-dd]",
      jam: "[00.00 - 00.00 WIB]",
      lokasi: "[Lokasi]",
      deskripsi: "[Deskripsi singkat]",
    },
    {
      judul: "[Judul]",
      tanggal: "[yyyy-mm-dd]",
      jam: "[00.00 - 00.00 WIB]",
      lokasi: "[Lokasi]",
      deskripsi: "[Deskripsi singkat]",
    },
  ],

  /* ===================================================================
   * PROFIL
   * =================================================================== */
  profile: {
    deskripsi:
      "UPTD Puskesmas Kutawaluya merupakan Unit Pelaksana Teknis Daerah di bawah Dinas Kesehatan Kabupaten Karawang yang menyelenggarakan pelayanan kesehatan tingkat pertama bagi masyarakat di wilayah Kecamatan Kutawaluya. Puskesmas Kutawaluya berlokasi di Desa Sampalan, Kecamatan Kutawaluya, Kabupaten Karawang. Dalam pelaksanaan pelayanan kesehatan, Puskesmas Kutawaluya memberikan pelayanan kesehatan perorangan sekaligus melaksanakan berbagai upaya kesehatan masyarakat secara terpadu.",
    highlights: [
      { icon: "fa-map-location-dot", text: "7 Wilayah Kerja UPTD Puskesmas Kutawaluya (Mulyajaya, Waluya, Sindangmulya, Sindangkarya, Sindangsari, Sindangmukti, Sampalan)" },
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
        penyelenggara: "[Pelenggara]",
        tmt: "[TMT yyyy]",
        berlaku_hingga: "[Berlaku hingga yyyy]",
        file: "assets/docs/akreditasi.pdf", 
      },
      {
        nama: "[Nama Sertifikasi]",
        penyelenggara: "[penyelenggara]",
        tmt: "[TMT yyyy]",
        berlaku_hingga: "[Berlaku hingga yyyy]",
      },
    ],
  },

  /* ===================================================================
   * LAYANAN
   * =================================================================== */
  layanan: {
    services: [
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
      {
        nama: "[Nama Poli]",
        kategori: "[Kategori Poli]",
        deskripsi: "[Dekskripsi poli]",
        jadwal: "[hari dan jam]",
        lokasi: "[Tempat]",
        persyaratan: ["[syarat1, syarat 2]"],
        alur: ["[Alur 1, Alur 2]"],
      },
    ],

    clusters: [
      {
        nama: "Ibu, Anak, dan Remaja",
        sasaran: "Ibu hamil, balita, anak sekolah, dan remaja",
        jenis_pelayanan: "ANC, imunisasi, tumbuh kembang anak, kesehatan reproduksi remaja",
        jadwal: "Senin - Sabtu, 07.45 - 13.00",
      },
      {
        nama: "Usia Produktif dan Lansia",
        sasaran: "Usia produktif (15-59 tahun) dan lansia",
        jenis_pelayanan: "Skrining PTM, posbindu, pelayanan lansia",
        jadwal: "Senin - Sabtu, sesuai jadwal posbindu",
      },
      {
        nama: "Penanggulangan Penyakit Menular",
        sasaran: "Masyarakat umum berisiko penyakit menular",
        jenis_pelayanan: "TB, HIV, imunisasi, surveilans penyakit menular",
        jadwal: "Senin - Jumat, 07.45 - 13.00",
      },
      {
        nama: "Lintas Klaster (Kegawatdaruratan & Penunjang)",
        sasaran: "Seluruh lapisan masyarakat",
        jenis_pelayanan: "IGD, laboratorium, farmasi, rawat inap/PONED",
        jadwal: "24 jam setiap hari",
      },
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
      { nama_petugas: "[Nama Dokter/Petugas]", poli: "[Nama Poli]", hari: "[Hari]", tanggal: "[Tanggal]", jam: "[Jam]" },
      { nama_petugas: "[Nama Dokter/Petugas]", poli: "[Nama Poli]", hari: "[Hari]", tanggal: "[Tanggal]", jam: "[Jam]" },
    ],
  },

  /* ===================================================================
   * PROGRAM
   * =================================================================== */
  programs: [
    {
      nama: "[Nama Program]",
      kategori: "Kesehatan Ibu & Anak",
      deskripsi: "[Deskripsi Program]",
      sasaran: "Balita usia 0-5 tahun",
      jadwal: "Setiap tanggal 5-10, sesuai jadwal posyandu masing-masing desa",
      lokasi: "[Tempat]",
      petugas: "Bidan Desa & Kader Posyandu",
    },
    {
      nama: "[Nama Program]",
      kategori: "Penyakit Tidak Menular",
      deskripsi: "[Deskripsi Program]",
      sasaran: "Usia produktif dan lansia",
      jadwal: "Setiap Sabtu minggu ke-2, 08.00 - 11.00",
      lokasi: "[Tempat]",
      petugas: "Kader Posbindu & Petugas Promkes",
    },
  ],
};
