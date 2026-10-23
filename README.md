# Sorumatik Bileşen (Discourse Tema Bileşeni)

[sorumatik-tema](https://github.com/ozkanceng/sorumatik-tema) ile birlikte
kullanılan, JavaScript gerektiren ek öğeleri taşıyan tema bileşeni.
Ana tema JS'siz taahhüdünü korur; bu bileşen opsiyoneldir ve tek tıkla
devre dışı bırakılabilir.

## Özellikler

- **Başlıkta "Soru Sor" düğmesi** — mavi, yuvarlak köşeli düğme `/new-topic`
  adresine gider; Discourse başlığı yeniden çizdiğinde gözlemciyle yeniden
  eklenir.
- **"Cevap bekliyor" kehribar rozeti** — cevapsız konuların kartlarında
  görünür; kartın cevap sayısı da kehribara döner, cevap bekleyenler bir
  bakışta ayırt edilir.
- **Yönetimden kategori renk eşlemesi** — ana temadaki sabit slug→renk
  eşlemesini panelden değiştirmenizi sağlar (`slug=#renk` çiftleri).

## Kurulum

1. Yönetim → Görünüm → Temalar → **Kur → Git deposundan**:
   `https://github.com/ozkanceng/sorumatik-tema-bilesen`
2. Kurduktan sonra temayı açıp **Bileşen olarak ekle** işaretini kullanın ve
   **Sorumatik Tema**'ya bağlayın.
3. **Ayarlar** sekmesinden düğme/rozet/eşleme davranışlarını yönetin.

## Ayarlar

| Ayar | Öntanımlı | İşlev |
|---|---|---|
| `sk_soru_sor_dugmesi` | açık | Başlıktaki Soru Sor düğmesi |
| `sk_bekleyen_rozeti` | açık | Cevapsız kartlarda kehribar rozet |
| `sk_kategori_renkleri` | 8 ders listesi | `slug=#renk` çiftleri, virgülle ayrılır |

## Teknik notlar

- Tek dosya JS: `javascripts/discourse/api-initializers/sorumatik-bilesen.js.es6`.
  DOM değişimleri `MutationObserver` + `requestAnimationFrame` kısıtlamasıyla
  işlenir; tüm kritik olmayan adımlar `try/catch` içindeydir.
- Stiller ana temanın `--sk-*` tokenlarını varsa kullanır, yoksa öntanımlı
  marka değerlerine düşer; bu yüzden bileşen ana temadan bağımsız da
  çalışabilir.
- Güvenlik: kategori eşleme ayarındaki girdiler slug (`[a-z0-9_-]`) ve renk
  (`#hex`) kalıplarıyla doğrulanmadan CSS'e yazılmaz.

## Lisans

MIT — [LICENSE](LICENSE) dosyasına bakın.
