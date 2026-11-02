# Kalori Defteri

Kendin ve arkadaşların için kalori, makro ve mikro besin takip uygulaması. Telefonda tarayıcıdan açılır ve
"Ana ekrana ekle" ile uygulama gibi kullanılır.

## Neler yapabiliyor

- **Profil ve hedefler:** Boy, kilo, yaş, cinsiyet, aktivite ve hedefe göre günlük kalori, protein, karbonhidrat,
  yağ, su ve mikro besin hedeflerini hesaplar (Mifflin-St Jeor).
- **Fotoğrafla ekleme:** Tabağın fotoğrafını çekersin, yapay zekâ (Claude) yiyecekleri ve gramlarını tahmin eder.
  Kaydetmeden önce her kalemin adını ve gramını düzeltebilirsin. Fotoğrafsız, sadece yazarak da çalışır
  ("2 yumurta, 1 dilim ekmek").
- **Listeden ekleme:** Türk mutfağından ~90 yiyecek ve içecek, porsiyon kısayolları ve son eklediklerin.
- **Elle ekleme:** Paket üzerindeki 100 g değerlerini girerek.
- **Günlük özet:** Kalan kalori, makrolar, su, 12 mikro besin (lif, şeker, sodyum, demir, kalsiyum, vitaminler...),
  öğün bazında liste, son 7 gün grafiği.
- **Öneriler:** Günün durumuna göre otomatik ipuçları ve isteğe bağlı yapay zekâ koçu.
- **Kilo takibi:** Her gün için kilo kaydı. En yeni kilo profile işlenir, hedefler ona göre yeniden hesaplanır.
- **Haftalık rapor:** Son 7 günün özeti (profil, hedefler, kilo, günlük toplamlar, yenenler). Tek dokunuşla
  kopyalanıp ChatGPT, Gemini veya Claude'a yapıştırılır, yapay zekâ neyi azaltıp neyi artırman gerektiğini söyler.
- **API anahtarı olmadan da çalışır:** `ANTHROPIC_API_KEY` yoksa fotoğraf analizi "kendi yapay zekânla" moduna geçer:
  hazır komutu kopyalayıp fotoğrafla birlikte kendi yapay zekâna gönderirsin, cevabı uygulamaya yapıştırırsın.
- **Çok kullanıcılı:** Herkes kendi hesabıyla girer, kimse başkasının verisini göremez.

## Kurulum (bir kerelik, ~15 dakika)

### 1. Supabase (veritabanı ve giriş sistemi, ücretsiz)

1. [supabase.com](https://supabase.com) üzerinde hesap aç ve **New project** oluştur (bölge olarak Frankfurt seçebilirsin).
2. Sol menüden **SQL Editor > New query**, [`supabase/schema.sql`](supabase/schema.sql) dosyasının tamamını yapıştır ve **Run**.
   Ardından [`supabase/02_weight.sql`](supabase/02_weight.sql) için de aynısını yap.
3. **Project Settings > API** sayfasından `Project URL` ve `anon public` anahtarını kopyala.
4. **Authentication > URL Configuration** sayfasında **Site URL** alanına uygulamanın adresini yaz
   (Vercel'e yükledikten sonra, ör. `https://kalori-xxx.vercel.app`). E-posta onay linkleri bu adrese gider.

### 2. Anthropic API anahtarı (isteğe bağlı)

[console.anthropic.com](https://console.anthropic.com) üzerinden bir API anahtarı oluştur ve biraz kredi yükle.
Bir fotoğraf analizi birkaç sent tutar. Claude/ChatGPT aboneliği API kullanımını kapsamaz. Bu adımı atlarsan
uygulama "kendi yapay zekânla" moduyla çalışır.

### 3. Vercel'e yükleme (ücretsiz)

1. [vercel.com](https://vercel.com) üzerinde GitHub ile giriş yap, **Add New > Project** ile bu repoyu seç.
2. **Environment Variables** kısmına [`.env.example`](.env.example) içindeki değişkenleri gir.
3. **Deploy**. Çıkan adresi arkadaşlarınla paylaş.

### Sadece arkadaşların kullansın istersen

Herkes kayıt olduktan sonra Supabase'de **Authentication > Sign In / Providers > Allow new users to sign up**
ayarını kapat. Yeni birini eklemek için **Authentication > Users > Invite user** kullan.
`ALLOWED_EMAILS` ile yapay zekâ özelliklerini (dolayısıyla API masrafını) belirli kişilerle sınırlayabilirsin.

## Bilgisayarda çalıştırma

```bash
cp .env.example .env.local   # değerleri doldur
npm install
npm run dev                  # http://localhost:3000
```

## Teknik notlar

- Next.js 16 (App Router), Tailwind CSS 4, Supabase (Postgres + Auth, satır bazlı güvenlik), Claude API.
- Kayıtlar `food_logs` tablosunda 100 g başına besin değerleri ve gram olarak tutulur, böylece gram sonradan
  değiştirilebilir.
- Besin veritabanı: [`src/lib/foods.ts`](src/lib/foods.ts). Hesaplamalar: [`src/lib/nutrition.ts`](src/lib/nutrition.ts).
  Öneri kuralları: [`src/lib/advice.ts`](src/lib/advice.ts).
- Değerler yaklaşıktır ve tıbbi tavsiye yerine geçmez.
