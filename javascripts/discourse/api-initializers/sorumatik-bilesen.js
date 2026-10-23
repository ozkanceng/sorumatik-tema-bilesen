// =========================================================================
// Sorumatik Bileşen — api-initializer (v1.1.0)
// 1) Başlıkta "Soru Sor" butonu
// 2) Cevapsız kartlarda "Cevap bekliyor" kehribar rozeti
// 3) Yönetim panelinden ders renk eşlemesi (Modern :has desteği)
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
    btn.style.cssText =
      "border-radius: 9px; margin-right: 12px; font-weight: 700; height: 36px; display: inline-flex; align-items: center; padding: 0 16px; background: #1D5BD6; color: #FFFFFF;";
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
        rozet.style.cssText =
          "background: #FDF2DD; color: #96590A; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 999px; margin-left: 8px; display: inline-block;";
        titleLine.appendChild(rozet);
      }
    });
  }

  function calistir() {
    try {
      if (s.sk_soru_sor_dugmesi) dugmeEkle();
      kartlariIsle();
    } catch (e) {
      console.warn("Sorumatik Bileşen: DOM işlem hatası", e);
    }
  }

  // Güvenli sayfa geçiş tetikleyicisi (MutationObserver sonsuz döngüsü engellendi)
  api.onPageChange(() => {
    calistir();
    setTimeout(calistir, 250);
  });
});
