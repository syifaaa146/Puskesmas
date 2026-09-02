/**
 * components.js
 * -----------------------------------------------------------------------
 * Komponen navbar & footer yang reusable di seluruh halaman.
 * Setiap halaman cukup menaruh:
 *   <div id="app-navbar" data-page="beranda"></div>
 *   <div id="app-footer"></div>
 * dan memuat script ini sebelum main.js.
 *
 * Dipusatkan di satu file supaya perubahan navbar/footer cukup dilakukan
 * di satu tempat saja (bukan disalin manual ke 7 halaman).
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const NAV_ITEMS = [
    { page: "beranda", label: "Beranda", href: "index.html" },
    { page: "profil", label: "Profil", href: "profil.html" },
    { page: "layanan", label: "Layanan", href: "layanan.html" },
    { page: "program", label: "Program", href: "program.html" },
    { page: "pengaduan", label: "Pengaduan", href: "pengaduan.html" },
  ];

  function navbarHtml(activePage) {
    const links = NAV_ITEMS.map(
      (item) => `
        <li class="nav-item">
          <a class="nav-pill d-block text-center mb-2 mb-lg-0" data-page="${item.page}" href="${item.href}">
            ${item.adminOnly ? '<i class="fa-solid fa-lock me-1" style="font-size:0.7em;"></i>' : ""}${item.label.toUpperCase()}
          </a>
        </li>`
    ).join("");

    return `
    <nav class="navbar navbar-expand-lg navbar-puskesmas" aria-label="Navigasi utama">
      <div class="container d-flex align-items-center justify-content-between">
        <a href="index.html" class="navbar-brand-custom">
          <img src="assets/img/logo.png" alt="Logo UPTD Puskesmas Kutawaluya" class="navbar-logo">
          <span class="navbar-brand-text">
            <span class="navbar-brand-title">UPTD PUSKESMAS KUTAWALUYA</span>
            <span class="navbar-brand-subtitle">Melayani dengan Sepenuh Hati</span>
          </span>
        </a>

        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse"
                data-bs-target="#mainNavCollapse" aria-controls="mainNavCollapse"
                aria-expanded="false" aria-label="Buka menu navigasi">
          <i class="fa-solid fa-bars fa-lg text-brand"></i>
        </button>

        <div class="collapse navbar-collapse flex-grow-0" id="mainNavCollapse">
          <ul class="navbar-nav align-items-lg-center flex-lg-row gap-lg-1 mt-3 mt-lg-0">
            ${links}
            <li class="nav-item ms-lg-2">
              <a href="#footer-kontak" class="nav-pill nav-pill-cta d-block text-center">HUBUNGI</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>`;
  }

  function breadcrumbHtml(activePage, currentLabel) {
    if (activePage === "beranda") return "";
    return `
    <div class="container breadcrumb-custom">
      <a href="index.html"><i class="fa-solid fa-house"></i> Beranda</a>
      <span class="separator">&rsaquo;</span>
      <span class="current">${currentLabel}</span>
    </div>`;
  }

  function footerHtml() {
    return `
    <footer class="footer-brand">
      <div class="container">
        <div class="row gy-4">
          <div class="col-lg-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <img src="assets/img/logo.png" alt="Logo UPTD Puskesmas Kutawaluya" style="width:38px;height:38px;">
              <h6 class="mb-0">UPTD Puskesmas Kutawaluya</h6>
            </div>
            <p>Media informasi resmi UPTD Puskesmas Kutawaluya menyediakan informasi layanan kesehatan dasar bagi masyarakat wilayah kerja.</p>
            <div class="footer-social mt-3">
              <a href="https://www.instagram.com/pkm_kutawaluya?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==" aria-label="Instagram UPTD Puskesmas Kutawaluya"><i class="fa-brands fa-instagram"></i></a>
              <a href="https://www.tiktok.com/@pkmkutawaluya" aria-label="Tiktok UPTD Puskesmas Kutawaluya"><i class="fa-brands fa-tiktok"></i></a>
              <a href="https://www.facebook.com/people/Puskesmas-Kutawaluya/100034989715277" aria-label="Facebook UPTD Puskesmas Kutawaluya"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="https://www.youtube.com/@puskesmaskutawaluya4969" aria-label="Youtube UPTD Puskesmas Kutawaluya"><i class="fa-brands fa-youtube-f"></i></a>
            </div>
          </div>
          <div class="col-lg-4" id="footer-kontak">
            <h6>Kontak Kami</h6>
            <div class="footer-contact-item">
              <i class="fa-solid fa-location-dot"></i>
              <span>Jalan Raya Sampalan, Desa Sampalan, Kecamatan Kutawaluya, Kabupaten Karawang, Jawa Barat, kode pos 41358.</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-brands fa-whatsapp"></i>
              <span>085176923748</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-envelope"></i>
              <span>xxxxxx@gmail.com</span>
            </div>
          </div>
          <div class="col-lg-4">
            <h6>Tautan Layanan</h6>
            <p class="mb-2"><a href="login.html">Data Kesehatan</a></p>
            <p class="mb-2"><a href="#">BPJS Kesehatan</a></p>
          </div>
        </div>
      </div>
      <div class="footer-bottom mt-5">
        <span data-footer-year></span> &ndash; UPTD Puskesmas Kutawaluya
      </div>
    </footer>`;
  }

  function mount() {
    const navRoot = document.getElementById("app-navbar");
    const footerRoot = document.getElementById("app-footer");
    const breadcrumbRoot = document.getElementById("app-breadcrumb");

    if (navRoot) {
      const activePage = navRoot.dataset.page || "";
      navRoot.outerHTML = navbarHtml(activePage);
    }
    if (breadcrumbRoot) {
      const activePage = breadcrumbRoot.dataset.page || "";
      const label = breadcrumbRoot.dataset.label || "";
      breadcrumbRoot.outerHTML = breadcrumbHtml(activePage, label);
    }
    if (footerRoot) {
      footerRoot.outerHTML = footerHtml();
    }
  }

  mount();
})(window, document);
