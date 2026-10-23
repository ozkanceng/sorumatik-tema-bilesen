// =========================================================================
// Sorumatik Bileşen — api-initializer
// 1) Başlıkta "Soru Sor" düğmesi
// 2) Cevapsız kartlarda "Cevap bekliyor" kehribar rozeti
// 3) Kategori renk eşlemesini yönetim panelinden yapma
// Girdiler tema ayarlarından (settings) okunur; hepsi panelde açılıp
// kapatılabilir. Kritik olmayan işlemler try/catch ile korunur: bileşenin
// bir parçası başarısız olsa bile Discourse etkilenmez.
// =========================================================================

import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.0", (api) => {
  const s = settings;

  // ---- 3) Kategori renk eşlemesi (bir kez, belge yüklenince) ----
  if (s.sk_kategori_renkleri) {
    try {
      const kurallar = [];
      String(s.sk_kategori_renkleri)
        .split(",")
        .map((cift) => cift.trim())
        .filter(Boolean)
        .forEach((cift) => {
          const i = cift.indexOf("=");
          if (i < 1) return;
          const slug = cift.slice(0, i).trim();
          const renk = cift.slice(i + 1).trim();
          if (!/^[a-z0-9_-]+$/i.test(slug)) return;
          if (!/^#[0-9a-fA-F]{3,8}$/.test(renk)) return;
          kurallar.push(`.category-${slug}.topic-list-item::before { background: ${renk}; }`);
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
      console.warn("Sorumatik Bileşen: kategori renkleri uygulanamadı", e);
    }
  }

  // ---- 1) ve 2): DOM öğeleri — gözlemciyle yeniden eklenir ----
  let siraBekliyor = false;

  function dugmeEkle() {
    if (document.querySelector(".sk-soru-sor")) return;
    const hedef =
      document.querySelector(".d-header .d-header-icons") ||
      document.querySelector(".d-header .panel ul");
    if (!hedef) return;
    const li = document.createElement("li");
    li.className = "sk-soru-sor-item";
    const a = document.createElement("a");
    a.className = "sk-soru-sor";
    a.href = "/new-topic";
    a.setAttribute("title", "Soru Sor");
    a.textContent = "Soru Sor";
    li.appendChild(a);
    hedef.insertBefore(li, hedef.firstChild);
  }

  function kartlariIsle() {
    document.querySelectorAll(".topic-list-item").forEach((kart) => {
      const cevapEl = kart.querySelector(".badge-posts");
      if (!cevapEl) return;
      const cevap = parseInt(cevapEl.textContent, 10);
      if (cevap !== 0) return;
      kart.classList.add("sk-unanswered");
      if (!s.sk_bekleyen_rozeti) return;
      const konum = kart.querySelector(".main-link .link-top-line") || kart.querySelector(".main-link");
      if (konum && !konum.querySelector(".sk-bekleyen")) {
        const rozet = document.createElement("span");
        rozet.className = "sk-bekleyen";
        rozet.textContent = "Cevap bekliyor";
        konum.appendChild(rozet);
      }
    });
  }

  function calistir() {
    if (siraBekliyor) return;
    siraBekliyor = true;
    requestAnimationFrame(() => {
      siraBekliyor = false;
      try {
        if (s.sk_soru_sor_dugmesi) dugmeEkle();
        kartlariIsle();
      } catch (e) {
        console.warn("Sorumatik Bileşen: DOM öğeleri eklenemedi", e);
      }
    });
  }

  if (s.sk_soru_sor_dugmesi || s.sk_bekleyen_rozeti) {
    calistir();
    const gozlemci = new MutationObserver(calistir);
    gozlemci.observe(document.body, { childList: true, subtree: true });
    api.onPageChange(calistir);
  }
});
