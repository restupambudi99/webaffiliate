# Desk Edit — EmDash CMS

Website ini memakai EmDash CMS 1.2.0 asli di dalam Astro 6.4.8. Halaman publik dirender di server dan membaca revisi yang telah diterbitkan. Panel admin ada di `/_emdash/admin/`; menyimpan draft tidak mengubah artikel publik.

## Menjalankan lokal

Gunakan Node.js 24 (mesin ini memakai 24.16.0) dan npm:

```powershell
npm install
npm run cms:key
npm run seed:build
node node_modules/emdash/dist/cli/index.mjs seed seed/seed.json --database ./data.db --on-conflict skip
npm run dev:staging
```

Buka `http://localhost:4321/` untuk desain staging dan `http://localhost:4321/_emdash/admin/` untuk CMS. File SQLite `data.db`, file unggahan `uploads/`, dan `.env` adalah data privat yang tidak boleh masuk Git. Simpan cadangan kunci `EMDASH_ENCRYPTION_KEY`; menggantinya membuat rahasia plugin terenkripsi yang lama tidak terbaca.

`dev:staging` dan `build:staging` mengaktifkan **STAGING_PREVIEW=true** secara eksplisit. Staging membaca 10 draft dari CMS sehingga perubahan editor terlihat pada preview; contoh repositori hanya dipakai bila database belum diisi. Command seed di atas tidak membuat user atau passkey. Mode staging harus menampilkan pemberitahuan staging dan `noindex`. Draft ini bukan bukti artikel telah ditinjau atau siap diajukan ke Amazon.

Untuk melihat perilaku produksi, jalankan `npm run dev` dengan `STAGING_PREVIEW=false`. Situs hanya membaca artikel CMS yang sudah diterbitkan. Tanpa artikel terbit, daftar kosong; kesalahan database tidak diganti diam-diam dengan konten demo.

## Mengaktifkan admin

Wizard pertama meminta judul situs, nama dan email pemilik, lalu passkey. Pemilik perlu menyimpan passkey sendiri melalui Windows Hello, pengelola password, atau security key. Tidak ada password admin bawaan, akun demo, atau bypass login dalam proyek.

Pilih opsi sample content di wizard bila ingin memasukkan kerangka artikel ke CMS. Seluruh contoh masuk sebagai **draft**. Untuk situs Node di alamat selain localhost, atur `SITE_URL` dan `EMDASH_SITE_URL` ke origin HTTPS situs sebelum wizard digunakan. Passkey terikat domain; setelah domain berubah, ikuti prosedur pemindahan domain EmDash dan daftarkan passkey di alamat yang baru.

## Model editorial

Collection **Editorial guides** menyimpan judul, manfaat untuk pembaca, kategori, isi Portable Text, sumber, penulis, editor, jenis bukti, hak media, konflik kepentingan, tanggal review aktual, dan alasan revisi. Field workflow mengikuti:

`draft → research → editor_review → compliance_review → published → needs_update → archived`

Status workflow tersebut adalah proses editorial proyek. Status CMS draft/published/scheduled menentukan revisi yang tersedia untuk pengunjung.

Plugin lokal `src/plugins/editorial-gate.ts` memeriksa publish dan scheduled publish melalui admin maupun API. Artikel hanya bisa diterbitkan bila ada penulis/editor, pertanyaan pembaca, manfaat dan keterbatasan analisis, sumber, keterangan hak media dan konflik kepentingan, review aktual, serta dua konfirmasi editor. Klaim `Hands-on tested` memerlukan catatan pengujian. Revisi artikel terbit memerlukan alasan perubahan. Tanggal Updated hanya berasal dari tanggal review revisi dengan alasan yang dicatat, bukan timestamp penyimpanan draft. Publish ditolak dengan alasan yang dapat dibaca editor bila data belum lengkap. Editor tetap harus menilai mutu dan bukti; kotak konfirmasi bukan verifikasi otomatis atas kebenaran klaim.

Collection **Editorial change log** dan **Associates Site register** membantu mencatat revisi dan URL yang didaftarkan. Entri operasional ini tidak mempunyai rute publik. Simpan reviewer, alasan perubahan, tanggal nyata, dan daftar URL sesuai keadaan sebenarnya.

Halaman memakai `getEmDashCollection()` / `getEmDashEntry()` melalui `src/lib/content.ts`, bukan salinan yang harus dibangun ulang. `UnifiedGuide.body` berisi Portable Text; template artikel harus merendernya dengan `<PortableText value={guide.body} />` dari `emdash/ui`. Helper `searchGuides()` memakai pencarian editorial EmDash pada produksi.

Theme memasang `CmsBlock` dan `CmsLink` melalui `components={{ block: CmsBlock, mark: { link: CmsLink } }}`. Konten yang ditampilkan dibatasi pada paragraf, tabel, code, dan media library yang aman. Raw HTML, embed, iframe, serta tombol dalam isi artikel tidak dirender. Tautan Amazon dan short link Amazon dalam rich text atau tabel menjadi teks tanpa tautan; gate publikasi menolaknya. Daftar sumber juga menolak tautan retail, short link, dan tracking; dokumen kebijakan resmi Associates tanpa tracking tetap dapat dirujuk.

Field **Verified product references** (`product_references`) menyimpan array objek dengan `label`, `destinationUrl`, `verifiedAt`, `active`, dan `eligibilityReviewed`. Gunakan URL produk Amazon.com aktual yang telah diperiksa, tanggal pemeriksaan sebenarnya, dan status review yang nyata. Nilai awalnya `[]`; tidak ada produk yang aktif otomatis. Hanya komponen `AffiliateCTA` yang dapat menampilkan tautan produk setelah mode affiliate, tag pemilik, daftar Site, tujuan URL, dan verifikasi produk melewati kontrol. Harga, stok, rating, dan klaim pengujian tidak ditambahkan oleh field ini.

Seed di `seed/seed.json` dibangun dari `scripts/build-seed.mjs` dan contoh `src/data/guides.ts`. Seed mengatur model awal; deployment ulang **tidak** menimpa konten database. Perubahan model situs yang sudah dipakai dilakukan melalui admin, lalu ekspor baseline jika dibutuhkan. Jangan menerapkan `--on-conflict update` sembarangan ke database produksi.

## Deployment Node

```powershell
# Pastikan .env produksi menggunakan origin hosting yang nyata dan staging=false.
npm run seed:build
npm run seed:validate
npm run check
npm run build
npm start
```

Hosting Node memerlukan disk persisten untuk SQLite dan unggahan, HTTPS reverse proxy, dan cadangan data. Atur `HOST`, `PORT`, `EMDASH_DATABASE_URL`, dan `EMDASH_UPLOADS_DIR` sesuai hosting. `SITE_URL` dan `EMDASH_SITE_URL` harus tersedia saat build dan runtime. SQLite lokal tidak cocok dengan hosting yang menghapus disk setiap deploy.

## Deployment Cloudflare

Konfigurasi `astro.config.cloudflare.mjs` menghubungkan Workers ke D1 (`DB`) dan R2 (`MEDIA`); `src/worker.ts` mengaktifkan scheduled publish. Output ada di `dist-cloudflare/`, terpisah dari build Node `dist/`. Wrangler otomatis membaca konfigurasi build yang diarahkan oleh `.wrangler/deploy/config.json`; jalankan build Cloudflare tepat sebelum deploy. Domain pribadi dapat menyusul karena Workers menyediakan alamat `workers.dev`.

```powershell
npx wrangler login
# Simpan kunci lewat secret store; jangan tulis kunci di wrangler.jsonc.
npx wrangler secret put EMDASH_ENCRYPTION_KEY
npm run build:cloudflare
npx wrangler deploy
```

Wrangler modern memprovisikan database dan bucket bernama pada deployment pertama sesuai `wrangler.jsonc`. Akun Cloudflare perlu terautentikasi dan R2 harus tersedia. Deploy ulang memakai nama resource yang sama. Wizard pertama pada alamat Workers memasang model, lalu pemilik menyelesaikan passkey. Kunci secret wajib dipasang pada Worker yang sama. Jangan menyalin database SQLite pengembangan sebagai state produksi D1; gunakan prosedur ekspor/import resmi jika konten perlu dipindahkan.

Gambar website sudah disiapkan sebagai file WebP dengan ukuran desktop/mobile, sehingga adapter memakai `imageService: 'passthrough'` dan tidak memprovisikan layanan Images. Binding KV `SESSION` tetap diperlukan: EmDash menyimpan session login editor melalui Astro session. Adapter memprovisikan KV secara otomatis. Profil, konten, dan metadata CMS disimpan di D1, dan media di R2.

Build dapat dilakukan tanpa kunci enkripsi produksi; kunci dibaca saat runtime untuk rahasia plugin. Untuk CI build, tidak perlu membuat secret `EMDASH_BUILD_KEY`. Simpan `EMDASH_ENCRYPTION_KEY` di secret store Worker sebelum fitur plugin yang menyimpan rahasia digunakan. Gunakan login permanen untuk deployment yang akan dipertahankan: `wrangler deploy --temporary` perlu diklaim dalam 60 menit dan daftar resource sementara tidak mencakup R2, sehingga tidak digunakan untuk deployment CMS ini.

Jangan mengaktifkan cache HTML bersama tanpa invalidasi publish dan aturan `private, no-store` untuk rute pribadi. Astro menghasilkan halaman publik dengan JavaScript minimal; file statis menerima cache terpisah. EmDash admin/API menetapkan private/no-store. D1 + R2 memenuhi kebutuhan CMS persisten di Cloudflare; preview statis saja tidak menyediakan CMS yang berjalan.

## Sebelum mengaktifkan monetisasi

Mode awal `editorial_only`, tanpa contoh tag Associates. Isi tag milik pemilik dan aktifkan mode affiliate hanya setelah akun, disclosure, daftar Site, dan artikel ditinjau. Jangan memakai harga/stok/rating Amazon, logo Amazon, ataupun API produk pada MVP. Nama brand Desk Edit masih nama kerja yang dapat diganti ketika pemilik menentukan brand dan domain.

## Referensi resmi

- [Memasang EmDash di Astro](https://docs.emdashcms.com/existing-project/)
- [Query konten dan Portable Text](https://docs.emdashcms.com/guides/querying-content/)
- [Format seed](https://docs.emdashcms.com/themes/seed-files/)
- [Authentication dan passkey](https://docs.emdashcms.com/guides/authentication/)
- [Deployment Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- [Deployment Node](https://docs.emdashcms.com/deployment/nodejs/)
- [Pemindahan domain](https://docs.emdashcms.com/guides/change-domain/)

Versi paket diperiksa langsung di registry npm pada 14 Oktober 2026. API dan kontrak plugin juga diperiksa terhadap source paket EmDash 1.2.0.

`node scripts/test-cms-policy.mjs` memeriksa bypass tautan CMS, sanitasi sumber, penolakan isi kosong, bentuk referensi produk, dan konten import yang tidak didukung.
