/**
 * pages/kelola-konten.js
 * -----------------------------------------------------------------------
 * Halaman admin "Kelola Konten" — CRUD untuk seluruh konten yang dulunya
 * statis di data/content.js: Informasi & Berita, Agenda, Profil, Layanan,
 * dan Program.
 *
 * Dibangun dengan "form builder" generik (createTextField,
 * createStringListField, createObjectListField) supaya tidak perlu
 * menulis form terpisah untuk tiap 12 jenis konten satu-satu — cukup
 * definisikan field apa saja yang dibutuhkan tiap bagian.
 *
 * Data disimpan sebagai JSON di backend (tabel site_content, lihat
 * api/_lib/services/contentService.js), satu section per tab. Simpan
 * hanya mengirim section yang sedang aktif, bukan semuanya sekaligus.
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const SECTIONS = ["news", "agenda", "profile", "layanan", "programs"];
  const state = {};   // section -> data yang sedang diedit (array/objek)
  const loaded = {};  // section -> sudah pernah dimuat dari server?
  let currentSection = "news";

  /* ---------------------------------------------------------------------
   * Form builder generik
   * ------------------------------------------------------------------- */

  /** Input teks/textarea/tanggal biasa, terikat langsung ke obj[key]. */
  function createTextField(container, obj, key, label, type) {
    const wrap = document.createElement("div");
    wrap.className = "mb-3";

    const labelEl = document.createElement("label");
    labelEl.className = "form-label-brand";
    labelEl.textContent = label;
    wrap.appendChild(labelEl);

    let input;
    if (type === "textarea") {
      input = document.createElement("textarea");
      input.className = "form-control-brand";
      input.rows = 3;
    } else {
      input = document.createElement("input");
      input.className = "form-control-brand";
      input.type = type === "date" ? "date" : "text";
    }
    input.value = obj[key] || "";
    input.addEventListener("input", () => {
      obj[key] = input.value;
    });
    wrap.appendChild(input);
    container.appendChild(wrap);
  }

  /** Daftar string sederhana (contoh: misi[], persyaratan_umum[]) dengan tambah/hapus baris. */
  function createStringListField(container, obj, key, label) {
    if (!Array.isArray(obj[key])) obj[key] = [];

    const wrap = document.createElement("div");
    wrap.className = "mb-3 kk-subfield-list";

    const labelEl = document.createElement("label");
    labelEl.className = "form-label-brand";
    labelEl.textContent = label;
    wrap.appendChild(labelEl);

    const listEl = document.createElement("div");
    wrap.appendChild(listEl);

    function renderRows() {
      listEl.innerHTML = "";
      obj[key].forEach((val, idx) => {
        const row = document.createElement("div");
        row.className = "kk-subitem-row";

        const input = document.createElement("input");
        input.className = "form-control-brand";
        input.type = "text";
        input.value = val;
        input.addEventListener("input", () => {
          obj[key][idx] = input.value;
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-outline-brand btn-sm-brand";
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.setAttribute("aria-label", "Hapus baris ini");
        removeBtn.addEventListener("click", () => {
          obj[key].splice(idx, 1);
          renderRows();
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        listEl.appendChild(row);
      });
    }
    renderRows();

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-outline-brand btn-sm-brand kk-add-btn";
    addBtn.innerHTML = '<i class="fa-solid fa-plus me-1"></i> Tambah Baris';
    addBtn.addEventListener("click", () => {
      obj[key].push("");
      renderRows();
    });
    wrap.appendChild(addBtn);

    container.appendChild(wrap);
  }

  /** Upload file PDF (contoh: file akreditasi) — mengunggah lewat API, obj[key] menyimpan URL hasilnya. */
  function createFileField(container, obj, key, label) {
    const wrap = document.createElement("div");
    wrap.className = "mb-3";

    const labelEl = document.createElement("label");
    labelEl.className = "form-label-brand";
    labelEl.textContent = label;
    wrap.appendChild(labelEl);

    const statusEl = document.createElement("div");
    statusEl.className = "mb-2";
    wrap.appendChild(statusEl);

    function renderStatus() {
      statusEl.innerHTML = "";
      if (obj[key]) {
        const link = document.createElement("a");
        link.href = obj[key];
        link.target = "_blank";
        link.rel = "noopener";
        link.className = "me-2";
        link.innerHTML = '<i class="fa-solid fa-file-pdf me-1"></i> Lihat file saat ini';
        statusEl.appendChild(link);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-outline-brand btn-sm-brand";
        removeBtn.style.borderColor = "#dc3545";
        removeBtn.style.color = "#dc3545";
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark me-1"></i> Hapus File';
        removeBtn.addEventListener("click", () => {
          obj[key] = "";
          renderStatus();
        });
        statusEl.appendChild(removeBtn);
      } else {
        const span = document.createElement("span");
        span.className = "text-muted small";
        span.textContent = "Belum ada file diunggah.";
        statusEl.appendChild(span);
      }
    }
    renderStatus();

    const inputRow = document.createElement("div");
    inputRow.style.display = "flex";
    inputRow.style.gap = "8px";
    inputRow.style.alignItems = "center";
    inputRow.style.flexWrap = "wrap";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf";
    fileInput.className = "form-control-brand";
    fileInput.style.maxWidth = "260px";

    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.className = "btn-outline-brand btn-sm-brand";
    uploadBtn.innerHTML = '<i class="fa-solid fa-upload me-1"></i> Unggah';

    uploadBtn.addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Pilih file PDF terlebih dahulu.");
        return;
      }
      const originalLabel = uploadBtn.innerHTML;
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Mengunggah...';
      try {
        const result = await window.ApiService.uploadContentFile(file);
        obj[key] = result.url;
        fileInput.value = "";
        renderStatus();
      } catch (err) {
        if (err && err.status === 401) {
          redirectToLogin();
          return;
        }
        alert(`Gagal mengunggah file: ${(err && err.message) || "terjadi kesalahan"}`);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalLabel;
      }
    });

    inputRow.appendChild(fileInput);
    inputRow.appendChild(uploadBtn);
    wrap.appendChild(inputRow);

    const hint = document.createElement("div");
    hint.className = "text-muted small mt-1";
    hint.textContent = "Format PDF. Mengunggah file baru akan menggantikan file lama.";
    wrap.appendChild(hint);

    container.appendChild(wrap);
  }

  /**
   * Daftar objek berulang (contoh: news[], services[]) — setiap item
   * dirender sebagai "kartu" dengan field sesuai fieldDefs, plus tombol
   * hapus per kartu dan tombol tambah kartu baru di bawah.
   */
  function createObjectListField(container, arrayRef, fieldDefs, itemLabelFn, addLabel) {
    const listEl = document.createElement("div");
    container.appendChild(listEl);

    function renderCards() {
      listEl.innerHTML = "";
      if (!arrayRef.length) {
        const empty = document.createElement("p");
        empty.className = "state-message";
        empty.textContent = "Belum ada item. Klik tombol di bawah untuk menambah.";
        listEl.appendChild(empty);
      }

      arrayRef.forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "kk-item-card";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-outline-brand btn-sm-brand kk-remove-btn";
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.title = "Hapus item ini";
        removeBtn.addEventListener("click", () => {
          arrayRef.splice(idx, 1);
          renderCards();
        });
        card.appendChild(removeBtn);

        const heading = document.createElement("div");
        heading.className = "fw-bold mb-3";
        heading.style.color = "var(--color-primary-900)";
        heading.style.paddingRight = "40px";
        heading.textContent = itemLabelFn(item, idx);
        card.appendChild(heading);

        fieldDefs.forEach((fd) => {
          if (fd.type === "stringlist") {
            createStringListField(card, item, fd.key, fd.label);
          } else if (fd.type === "file") {
            createFileField(card, item, fd.key, fd.label);
          } else {
            createTextField(card, item, fd.key, fd.label, fd.type);
          }
        });

        listEl.appendChild(card);
      });
    }
    renderCards();

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-brand kk-add-btn";
    addBtn.innerHTML = `<i class="fa-solid fa-plus me-1"></i> ${addLabel}`;
    addBtn.addEventListener("click", () => {
      const blank = {};
      fieldDefs.forEach((fd) => {
        blank[fd.key] = fd.type === "stringlist" ? [] : "";
      });
      arrayRef.push(blank);
      renderCards();
      scrollIntoLastCard(listEl);
    });
    container.appendChild(addBtn);
  }

  function scrollIntoLastCard(listEl) {
    const cards = listEl.querySelectorAll(".kk-item-card");
    const last = cards[cards.length - 1];
    if (last) last.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function sectionBlock(container, title) {
    const wrap = document.createElement("div");
    wrap.className = "kk-field-group";
    const h = document.createElement("h5");
    h.className = "mb-3";
    h.style.color = "var(--color-primary-900)";
    h.textContent = title;
    wrap.appendChild(h);
    container.appendChild(wrap);
    return wrap;
  }

  /* ---------------------------------------------------------------------
   * Skema tiap bagian konten (daftar sederhana)
   * ------------------------------------------------------------------- */

  const LIST_SCHEMAS = {
    news: {
      fields: [
        { key: "judul", label: "Judul", type: "text" },
        { key: "kategori", label: "Kategori (contoh: Informasi, Pengumuman, Kesehatan)", type: "text" },
        { key: "tanggal", label: "Tanggal", type: "date" },
        { key: "ringkasan", label: "Ringkasan", type: "textarea" },
      ],
      itemLabel: (item, idx) => item.judul || `Berita #${idx + 1}`,
      addLabel: "Tambah Berita/Informasi",
    },
    agenda: {
      fields: [
        { key: "judul", label: "Judul Kegiatan", type: "text" },
        { key: "tanggal", label: "Tanggal", type: "date" },
        { key: "jam", label: "Jam (contoh: 08.00 - 11.00 WIB)", type: "text" },
        { key: "lokasi", label: "Lokasi", type: "text" },
        { key: "deskripsi", label: "Deskripsi", type: "textarea" },
      ],
      itemLabel: (item, idx) => item.judul || `Agenda #${idx + 1}`,
      addLabel: "Tambah Agenda",
    },
    programs: {
      fields: [
        { key: "nama", label: "Nama Program", type: "text" },
        { key: "kategori", label: "Kategori", type: "text" },
        { key: "deskripsi", label: "Deskripsi", type: "textarea" },
        { key: "sasaran", label: "Sasaran", type: "text" },
        { key: "jadwal", label: "Jadwal", type: "text" },
        { key: "lokasi", label: "Lokasi", type: "text" },
        { key: "petugas", label: "Petugas Pelaksana", type: "text" },
      ],
      itemLabel: (item, idx) => item.nama || `Program #${idx + 1}`,
      addLabel: "Tambah Program",
    },
  };

  /* ---------------------------------------------------------------------
   * Render panel per bagian
   * ------------------------------------------------------------------- */

  function renderProfilePanel(container, data) {
    container.innerHTML = "";
    createTextField(container, data, "deskripsi", "Deskripsi Profil Puskesmas", "textarea");

    const highlightsWrap = sectionBlock(container, "Highlight Singkat (ditampilkan dengan ikon)");
    if (!Array.isArray(data.highlights)) data.highlights = [];
    createObjectListField(
      highlightsWrap, data.highlights,
      [
        { key: "icon", label: "Nama Ikon Font Awesome (contoh: fa-map-location-dot, fa-user-doctor)", type: "text" },
        { key: "text", label: "Teks Highlight", type: "text" },
      ],
      (item, idx) => item.text || `Highlight #${idx + 1}`,
      "Tambah Highlight"
    );

    createTextField(container, data, "visi", "Visi", "textarea");

    const misiWrap = sectionBlock(container, "Misi");
    createStringListField(misiWrap, data, "misi", "Daftar Poin Misi (satu baris = satu poin)");

    createTextField(container, data, "tata_nilai_judul", "Judul/Motto Tata Nilai (contoh: THE WINNERS)", "text");

    const tataNilaiWrap = sectionBlock(container, "Tata Nilai Organisasi");
    if (!Array.isArray(data.tata_nilai)) data.tata_nilai = [];
    createObjectListField(
      tataNilaiWrap, data.tata_nilai,
      [
        { key: "nilai", label: "Nilai (contoh: Togetherness)", type: "text" },
        { key: "arti", label: "Arti (contoh: Kebersamaan)", type: "text" },
      ],
      (item, idx) => item.nilai || `Nilai #${idx + 1}`,
      "Tambah Nilai"
    );

    const akredWrap = sectionBlock(container, "Akreditasi & Sertifikasi");
    if (!Array.isArray(data.akreditasi)) data.akreditasi = [];
    createObjectListField(
      akredWrap, data.akreditasi,
      [
        { key: "nama", label: "Nama Akreditasi/Sertifikat", type: "text" },
        { key: "penyelenggara", label: "Penyelenggara", type: "text" },
        { key: "tmt", label: "TMT (contoh: TMT 2023)", type: "text" },
        { key: "berlaku_hingga", label: "Berlaku Hingga (contoh: Berlaku hingga 2026)", type: "text" },
        { key: "file", label: "File PDF Akreditasi/Sertifikat (opsional)", type: "file" },
      ],
      (item, idx) => item.nama || `Akreditasi #${idx + 1}`,
      "Tambah Akreditasi/Sertifikat"
    );
  }

  function renderLayananPanel(container, data) {
    container.innerHTML = "";
    if (!Array.isArray(data.services)) data.services = [];
    if (!Array.isArray(data.clusters)) data.clusters = [];
    if (!Array.isArray(data.alur_umum)) data.alur_umum = [];
    if (!Array.isArray(data.persyaratan_umum)) data.persyaratan_umum = [];
    if (!Array.isArray(data.schedule)) data.schedule = [];

    const servicesWrap = sectionBlock(container, "Daftar Layanan (Poli/Unit)");
    createObjectListField(
      servicesWrap, data.services,
      [
        { key: "nama", label: "Nama Layanan", type: "text" },
        { key: "kategori", label: "Kategori", type: "text" },
        { key: "deskripsi", label: "Deskripsi", type: "textarea" },
        { key: "jadwal", label: "Jadwal", type: "text" },
        { key: "lokasi", label: "Lokasi", type: "text" },
        { key: "persyaratan", label: "Persyaratan (khusus layanan ini)", type: "stringlist" },
        { key: "alur", label: "Alur Pelayanan (khusus layanan ini)", type: "stringlist" },
      ],
      (item, idx) => item.nama || `Layanan #${idx + 1}`,
      "Tambah Layanan"
    );

    const clustersWrap = sectionBlock(container, "Cluster Pelayanan (ILP)");
    createObjectListField(
      clustersWrap, data.clusters,
      [
        { key: "nama", label: "Nama Cluster", type: "text" },
        { key: "sasaran", label: "Sasaran", type: "text" },
        { key: "jenis_pelayanan", label: "Jenis Pelayanan", type: "text" },
        { key: "jadwal", label: "Jadwal", type: "text" },
      ],
      (item, idx) => item.nama || `Cluster #${idx + 1}`,
      "Tambah Cluster"
    );

    const alurWrap = sectionBlock(container, "Alur Pelayanan Umum");
    createObjectListField(
      alurWrap, data.alur_umum,
      [
        { key: "judul", label: "Judul Langkah", type: "text" },
        { key: "deskripsi", label: "Deskripsi", type: "textarea" },
      ],
      (item, idx) => item.judul || `Langkah #${idx + 1}`,
      "Tambah Langkah"
    );

    const persyaratanWrap = sectionBlock(container, "Persyaratan Umum");
    createStringListField(persyaratanWrap, data, "persyaratan_umum", "Daftar Persyaratan Umum");

    const scheduleWrap = sectionBlock(container, "Jadwal Dokter/Petugas");
    createObjectListField(
      scheduleWrap, data.schedule,
      [
        { key: "nama_petugas", label: "Nama Dokter/Petugas", type: "text" },
        { key: "poli", label: "Poli/Layanan", type: "text" },
        { key: "hari", label: "Hari", type: "text" },
        { key: "jam", label: "Jam", type: "text" },
      ],
      (item, idx) => item.nama_petugas || `Jadwal #${idx + 1}`,
      "Tambah Jadwal"
    );
  }

  function renderPanel(section) {
    const container = document.getElementById(`kk-panel-${section}`);
    container.innerHTML = "";

    if (section === "profile") {
      renderProfilePanel(container, state.profile);
      return;
    }
    if (section === "layanan") {
      renderLayananPanel(container, state.layanan);
      return;
    }

    const schema = LIST_SCHEMAS[section];
    if (!Array.isArray(state[section])) state[section] = [];
    createObjectListField(container, state[section], schema.fields, schema.itemLabel, schema.addLabel);
  }

  /* ---------------------------------------------------------------------
   * Muat & simpan data ke/dari server
   * ------------------------------------------------------------------- */

  function toggleAlert(id, show, message) {
    const el = document.getElementById(id);
    if (!el) return;
    if (message) {
      const span = el.querySelector("span");
      if (span) span.textContent = message;
    }
    el.classList.toggle("show", show);
  }

  function redirectToLogin() {
    window.AdminAuth.clearSession();
    window.location.href = "login.html?next=kelola-konten.html";
  }

  async function loadSection(section) {
    const container = document.getElementById(`kk-panel-${section}`);
    container.innerHTML = '<p class="state-message">Memuat konten...</p>';
    try {
      const data = await window.ApiService.getContentSection(section);
      state[section] = data;
      loaded[section] = true;
      renderPanel(section);
    } catch (err) {
      if (err && err.status === 401) {
        redirectToLogin();
        return;
      }
      container.innerHTML = `<p class="state-message text-danger">Gagal memuat konten${err && err.message ? `: ${err.message}` : "."}</p>`;
    }
  }

  async function handleSave() {
    const btn = document.getElementById("kk-save-btn");
    const label = document.getElementById("kk-save-label");
    const original = label.innerHTML;
    btn.disabled = true;
    label.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Menyimpan...';

    toggleAlert("kk-alert-success", false);
    toggleAlert("kk-alert-error", false);

    try {
      const result = await window.ApiService.saveContentSection(currentSection, state[currentSection]);
      toggleAlert("kk-alert-success", true, (result && result.message) || "Konten berhasil disimpan.");
      document.getElementById("kk-alert-success").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      if (err && err.status === 401) {
        redirectToLogin();
        return;
      }
      toggleAlert("kk-alert-error", true, (err && err.message) || "Gagal menyimpan konten. Silakan coba lagi.");
      document.getElementById("kk-alert-error").scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      btn.disabled = false;
      label.innerHTML = original;
    }
  }

  /* ---------------------------------------------------------------------
   * Tab switching & init
   * ------------------------------------------------------------------- */

  function switchTab(section) {
    currentSection = section;
    document.querySelectorAll("#kk-tabs .nav-link").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === section);
    });
    document.querySelectorAll(".kk-section-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.sectionPanel === section);
    });
    toggleAlert("kk-alert-success", false);
    toggleAlert("kk-alert-error", false);
    if (!loaded[section]) {
      loadSection(section);
    }
  }

  function setupAdminBar() {
    const session = window.AdminAuth.getSession();
    const usernameLabel = document.getElementById("admin-username-label");
    if (session && usernameLabel) usernameLabel.textContent = session.username;
    document.getElementById("logout-btn").addEventListener("click", () => {
      window.AdminAuth.logout("login.html");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupAdminBar();

    document.querySelectorAll("#kk-tabs .nav-link").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.section));
    });

    document.getElementById("kk-save-btn").addEventListener("click", handleSave);

    loadSection("news");
  });
})(window, document);
