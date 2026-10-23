// =========================================================================
// Sorumatik Bileşen — api-initializer (v1.3.0)
// 1) Ana Sayfa Hero Karşılama, Arama Kutusu & Ders Kapsülleri Şeridi
// 2) Fotoğraflı Sorularda Resim Önizlemesi (Thumbnail) Enjeksiyonu
// 3) Başlıkta "Soru Sor" butonu
// 4) Cevapsız kartlarda "Cevap bekliyor" kehribar rozeti
// 5) Yönetim panelinden ders renk eşlemesi (Modern :has desteği)
// =========================================================================

import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0", (api) => {
  const s = settings;

  // 1) Kategori Renk Eşlemesi (Yönetim Panelinden Ayarlanabilir)
  if (s.sk_kategori_renkleri) {
    try {
      const kurallar = [];
      String(s.sk_kategori_renkleri)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((cift) => {
          const i = cift.indexOf("=");
          if (i < 1) return;
          const slug = cift.slice(0, i).trim();
          const renk = cift.slice(i + 1).trim();
          if (!/^[a-z0-9_-]+$/i.test(slug)) return;
          if (!/^#[0-9a-fA-F]{3,8}$/.test(renk)) return;
          kurallar.push(
            `.topic-list-item:has(a[href*="/c/${slug}"])::before, .category-${slug}.topic-list-item::before { background: ${renk} !important; }`
          );
        });
      if (kurallar.length) {
        const eski = document.getElementById("sk-kategori-renkleri");
        if (eski) eski.remove();
        const stil = document.createElement("style");
        stil.id = "sk-kategori-renkleri";
        stil.textContent = kurallar.join("\n");
        document.head.appendChild(stil);
      }
    } catch (e) {
      console.warn("Sorumatik Bileşen: kategori renkleri hatası", e);
    }
  }

  // 2) Başlıkta "Soru Sor" Butonu Ekleme
  function dugmeEkle() {
    if (document.querySelector(".sk-soru-sor")) return;
    const hedef =
      document.querySelector(".d-header .d-header-icons") ||
      document.querySelector(".d-header .panel");
    if (!hedef) return;

    const btn = document.createElement("a");
    btn.className = "btn btn-primary sk-soru-sor";
    btn.href = "/new-topic";
    btn.textContent = "Soru Sor";
    btn.addEventListener("click", (e) => {
      const composerBtn = document.getElementById("create-topic");
      if (composerBtn) {
        e.preventDefault();
        composerBtn.click();
      }
    });
    hedef.parentNode.insertBefore(btn, hedef);
  }

  // 3) Cevapsız Kartlarda "Cevap Bekliyor" Kehribar Rozeti
  function kartlariIsle() {
    document.querySelectorAll(".topic-list-item").forEach((kart) => {
      if (kart.classList.contains("sk-processed")) return;
      kart.classList.add("sk-processed");

      // Gerçek Discourse cevap sayısı elemanları
      const cevapEl =
        kart.querySelector(".posts-map .number") ||
        kart.querySelector(".num.posts") ||
        kart.querySelector("button.posts-map") ||
        kart.querySelector(".badge-posts");

      if (!cevapEl) return;
      const count = parseInt(cevapEl.textContent.trim(), 10);
      if (isNaN(count) || count !== 0) return;

      kart.classList.add("sk-unanswered");
      if (!s.sk_bekleyen_rozeti) return;

      const titleLine =
        kart.querySelector(".main-link .link-top-line") ||
        kart.querySelector(".main-link");
      if (titleLine && !titleLine.querySelector(".sk-bekleyen")) {
        const rozet = document.createElement("span");
        rozet.className = "sk-bekleyen";
        rozet.textContent = "Cevap bekliyor";
        titleLine.appendChild(rozet);
      }
    });
  }

  // 4) Resimli Sorular İçin Önizleme (Thumbnail) Enjeksiyonu
  function resimleriIsle() {
    if (s.sk_resim_onizleme === false) return;
    try {
      const container = Discourse.__container__;
      if (!container) return;

      const topics =
        container.lookup("controller:discovery/topics")?.model?.topics ||
        container.lookup("controller:discovery")?.model?.topics ||
        container.lookup("route:discovery/topics")?.currentModel?.topics ||
        [];

      if (!topics.length) return;

      const imgMap = new Map();
      topics.forEach((t) => {
        if (t && t.id && t.image_url) {
          imgMap.set(String(t.id), t.image_url);
        }
      });

      if (!imgMap.size) return;

      document.querySelectorAll(".topic-list-item").forEach((card) => {
        if (card.querySelector(".sk-topic-thumb-link")) return;

        const topicId = card.getAttribute("data-topic-id");
        if (!topicId || !imgMap.has(topicId)) return;

        const imgUrl = imgMap.get(topicId);
        const mainLink = card.querySelector(".main-link");
        if (!mainLink) return;

        card.classList.add("has-thumbnail");

        const topicLink =
          card.querySelector("a.title, a.raw-topic-link")?.href || "#";
        const thumb = document.createElement("a");
        thumb.className = "sk-topic-thumb-link";
        thumb.href = topicLink;
        thumb.innerHTML = `<img src="${imgUrl}" class="sk-topic-thumb-img" alt="" loading="lazy">`;

        mainLink.appendChild(thumb);
      });
    } catch (e) {
      console.warn("Sorumatik Bileşen: resim önizleme hatası", e);
    }
  }

  // 5) Ana Sayfa Hero Karşılama & Ders Kapsülleri Şeridi
  function heroTemizle() {
    const hero = document.getElementById("sk-hero-section");
    if (hero) hero.remove();
  }

  function heroEkle() {
    // Soru veya profil/admin sayfalarında asla gösterilmez
    const path = window.location.pathname;
    if (
      path.startsWith("/t/") ||
      path.startsWith("/u/") ||
      path.startsWith("/admin") ||
      path.startsWith("/badges") ||
      path.startsWith("/groups")
    ) {
      heroTemizle();
      return;
    }

    if (s.sk_hero_alani === false) {
      heroTemizle();
      return;
    }

    const listControls =
      document.querySelector("#main-outlet .list-controls") ||
      document.querySelector("#main-outlet .navigation-container") ||
      document.querySelector("#main-outlet .container:first-child");

    if (!listControls) return;

    let hero = document.getElementById("sk-hero-section");
    if (!hero) {
      hero = document.createElement("section");
      hero.id = "sk-hero-section";
      hero.className = "sk-hero-section";
      hero.innerHTML = `
        <div class="sk-hero-headline">
          <h1>Aklındaki soruyu sor, <em>birlikte çözelim.</em></h1>
          <p>Binlerce öğretmen ve öğrenci adım adım çözümlerle yanında. Yapay zeka destekli, tamamen ücretsiz.</p>
        </div>

        <div class="sk-hero-search-box">
          <div class="sk-hero-search-input-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input type="search" class="sk-hero-search-input" id="sk-hero-search-input" placeholder="Örn: kısmi integrasyon veya eğik atış..." aria-label="Soru veya konu ara">
          </div>
          <button class="sk-btn-upload-photo" id="sk-hero-ask-btn" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Soru Fotoğrafı Yükle</span>
          </button>
        </div>

        <div class="sk-quick-tags">
          <span class="sk-tag-label">Popüler:</span>
          <a class="sk-tag-chip" href="/tag/ayt"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>YKS / AYT</a>
          <a class="sk-tag-chip" href="/tag/lgs"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>LGS</a>
          <a class="sk-tag-chip" href="/tag/lise"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>9-12. Sınıf</a>
          <a class="sk-tag-chip" href="/tag/universite"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>Üniversite</a>
          <a class="sk-tag-chip" href="/tag/kpss"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>KPSS / DGS</a>
          <a class="sk-tag-chip" href="/tag/odev"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-1px;margin-right:3px"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>Ödev Sorusu</a>
        </div>

        <div class="sk-subject-bar">
          <a class="sk-sub-pill" data-slug="all" href="/" style="--pill-color:#2563EB;--pill-bg:#EFF6FF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"/></svg>
            <span>Tüm Sorular</span>
          </a>
          <a class="sk-sub-pill" data-slug="matematik" href="/c/matematik" style="--pill-color:#2563EB;--pill-bg:#EFF6FF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16M4 5h16M7 5v14M17 5v14M11 9l4 6M15 9l-4 6"/></svg>
            <span>Matematik</span>
          </a>
          <a class="sk-sub-pill" data-slug="fizik" href="/c/fizik" style="--pill-color:#7C3AED;--pill-bg:#F5F3FF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/></svg>
            <span>Fizik</span>
          </a>
          <a class="sk-sub-pill" data-slug="kimya" href="/c/kimya" style="--pill-color:#0D9488;--pill-bg:#F0FDFA">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.69 18.5a2 2 0 0 0 1.69 3h11.24a2 2 0 0 0 1.69-3L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>
            <span>Kimya</span>
          </a>
          <a class="sk-sub-pill" data-slug="biyoloji" href="/c/biyoloji" style="--pill-color:#16A34A;--pill-bg:#F0FDF4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22s5.5-1.5 8.5-5.5 4.5-9 11.5-11c0 7-5.5 8.5-9 11.5S2 22 2 22z"/><path d="M9 13.5 14.5 8"/></svg>
            <span>Biyoloji</span>
          </a>
          <a class="sk-sub-pill" data-slug="turkce" href="/c/turkce" style="--pill-color:#EA580C;--pill-bg:#FFF7ED">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Türkçe</span>
          </a>
          <a class="sk-sub-pill" data-slug="tarih" href="/c/tarih" style="--pill-color:#B45309;--pill-bg:#FFFBEB">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="6" y1="18" x2="6" y2="10"/><line x1="10" y1="18" x2="10" y2="10"/><line x1="14" y1="18" x2="14" y2="10"/><line x1="18" y1="18" x2="18" y2="10"/><polygon points="12 2 20 7 4 7"/></svg>
            <span>Tarih</span>
          </a>
          <a class="sk-sub-pill" data-slug="cografya" href="/c/cografya" style="--pill-color:#0284C7;--pill-bg:#F0F9FF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>Coğrafya</span>
          </a>
          <a class="sk-sub-pill" data-slug="ingilizce" href="/c/ingilizce" style="--pill-color:#C026D3;--pill-bg:#FDF4FF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>İngilizce</span>
          </a>
        </div>
      `;

      listControls.parentNode.insertBefore(hero, listControls);

      // Arama kutusu enter tetikleyicisi
      const searchInput = hero.querySelector("#sk-hero-search-input");
      if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const q = searchInput.value.trim();
            if (q) {
              window.location.href = "/search?q=" + encodeURIComponent(q);
            }
          }
        });
      }

      // Soru Fotoğrafı Yükle / Soru Sor butonu tetikleyicisi
      const askBtn = hero.querySelector("#sk-hero-ask-btn");
      if (askBtn) {
        askBtn.addEventListener("click", () => {
          const createBtn = document.getElementById("create-topic");
          if (createBtn) {
            createBtn.click();
          } else {
            window.location.href = "/new-topic";
          }
        });
      }
    }

    // Aktif ders kapsülünü vurgula
    const pills = hero.querySelectorAll(".sk-sub-pill");
    pills.forEach((p) => p.classList.remove("active"));
    let aktifBulundu = false;
    pills.forEach((p) => {
      const slug = p.getAttribute("data-slug");
      if (slug !== "all" && path.includes("/c/" + slug)) {
        p.classList.add("active");
        aktifBulundu = true;
      }
    });
    if (!aktifBulundu) {
      const allPill = hero.querySelector('.sk-sub-pill[data-slug="all"]');
      if (allPill && (path === "/" || path === "/latest" || path === "/top")) {
        allPill.classList.add("active");
      }
    }
  }

  function calistir() {
    try {
      if (s.sk_soru_sor_dugmesi !== false) dugmeEkle();
      kartlariIsle();
      resimleriIsle();
      heroEkle();
    } catch (e) {
      console.warn("Sorumatik Bileşen: DOM işlem hatası", e);
    }
  }

  // Güvenli sayfa geçiş tetikleyicisi (MutationObserver sonsuz döngüsü engellendi)
  api.onPageChange(() => {
    calistir();
    setTimeout(calistir, 200);
    setTimeout(calistir, 800);
  });
});
