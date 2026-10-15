# MyJourney — EmDash CMS

Website ini memakai EmDash CMS 1.2.0 asli di dalam Astro 6.4.8. Halaman publik dirender di server dan membaca revisi yang telah diterbitkan. Panel admin ada di `/_emdash/admin/`; menyimpan draft tidak mengubah artikel publik.

MCP bawaan aktif pada `https://affiliate.restupambudi.my.id/_emdash/api/mcp`, dengan OAuth atau personal access token yang memiliki scope sesuai tugas. Ikuti [panduan koneksi AI](AI-CONNECTIONS.md) untuk Codex, ChatGPT, dan Claude Code. Konfigurasi client tidak berisi kredensial; login pemilik dan persetujuan scope diselesaikan pada masing-masing client.

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

Instruksi wizard berikut berlaku untuk instalasi baru. Produksi MyJourney sudah menyelesaikan onboarding; gunakan status dan URL login pada bagian produksi di bawah, bukan mengulang wizard.

Wizard pertama meminta judul situs, nama dan email pemilik, lalu passkey. Pemilik perlu menyimpan passkey sendiri melalui Windows Hello, pengelola password, atau security key. Tidak ada password admin bawaan, akun demo, atau bypass login dalam proyek. Email pada langkah passkey awal tidak diverifikasi; browser pertama yang menyelesaikan registrasi passkey menjadi admin. Karena itu, wizard produksi tidak boleh dibiarkan terbuka sebelum pemilik siap.

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

## Produksi utama: Node di VPS pemilik

Produksi sudah berjalan pada VPS Ubuntu 22.04 milik pemilik, dengan runtime Node.js 24.16.0 terisolasi, SQLite, dan penyimpanan unggahan lokal. Cloudflare proxy dan HTTPS aktif pada `https://affiliate.restupambudi.my.id`. Pemeriksaan deployment menunjukkan halaman utama publik mengembalikan HTTP 200, sedangkan HTTP dialihkan dengan 308 sambil mempertahankan path dan query. Origin memakai sertifikat Let's Encrypt yang valid sampai 13 Januari 2027 pada saat pemeriksaan. Media dikelola langsung melalui panel EmDash yang sama dengan artikel setelah pemilik menyelesaikan setup.

Konfigurasi ini tidak membutuhkan R2, langganan Workers, aktivasi pembayaran, atau layanan media tambahan. Biaya VPS yang sudah dimiliki tetap mengikuti pengaturan pemilik. Aplikasi tidak mengaktifkan subscription baru.

Urutan validasi dan build dari direktori proyek:

```sh
npm ci
npm run seed:build
npm run seed:validate
npm run check
npm run build
```

Server standalone dijalankan oleh service systemd **`desk-edit`**, sebagai user **`deskedit`**, dari **`/opt/desk-edit/app`**. Executable Node yang dipakai adalah **`/opt/desk-edit/runtime/node/bin/node`**; aplikasi listen pada **`127.0.0.1:4321`** di belakang reverse proxy HTTPS. Konfigurasi environment privat berada di `/etc/desk-edit.env`. Lihat [panduan operasi VPS](VPS.md) untuk pembaruan, restart, dan cadangan.

State produksi dipisahkan dari checkout dan hasil build:

| Variabel | Nilai produksi |
| --- | --- |
| `HOST` | `127.0.0.1` |
| `PORT` | `4321` |
| `EMDASH_DATABASE_URL` | `file:/var/lib/desk-edit/content.db` |
| `EMDASH_UPLOADS_DIR` | `/var/lib/desk-edit/uploads` |
| `EMDASH_SESSIONS_DIR` | `/var/lib/desk-edit/sessions` |

Tetapkan direktori session secara eksplisit, bersama path database dan unggahan, saat build dan runtime. Direktori state di luar `dist/` ini tidak boleh dihapus atau ditimpa saat rilis aplikasi diperbarui.

Variabel produksi harus memakai `STAGING_PREVIEW=false`, `AFFILIATE_MODE=editorial_only`, serta `SITE_URL` dan `EMDASH_SITE_URL` bernilai `https://affiliate.restupambudi.my.id`. Origin tersebut harus tersedia saat build dan runtime. Simpan `EMDASH_ENCRYPTION_KEY` di konfigurasi environment privat, bukan di Git. Jangan memakai kunci development atau menggantinya tanpa prosedur pemulihan data yang sesuai.

Gunakan satu lokasi SQLite dan satu direktori unggahan yang sama pada setiap restart dan deployment. Cadangkan database, unggahan, dan kunci enkripsi sebagai satu set yang dapat dipulihkan. Pembaruan kode tidak boleh menimpa database produksi dengan `data.db` development atau menjalankan seed dengan mode update tanpa pemeriksaan. SQLite memerlukan disk persisten; jangan memindahkan konfigurasi ini ke hosting yang menghapus disk saat deployment.

### Status onboarding produksi — 15 Oktober 2026

Pemeriksaan read-only database mengonfirmasi **1 user Admin, 1 credential passkey, dan `setup_complete=true`**. Pemilik masuk menggunakan email yang terdaftar pada akun Admin; kontak publik tetap `nikolasjuan34@gmail.com`. Identitas pemilik dan credential lama tidak diganti. Username/password Basic Auth sementara sudah tidak diperlukan.

Realm sementara OpenLiteSpeed telah dilepas dengan `deploy/complete-owner-setup.py`. Script memeriksa setup selesai dan credential milik Admin sebelum perubahan, mencadangkan vhost, membandingkan diagnostik, serta melakukan rollback bila pemeriksaan gagal. Autentikasi native EmDash tetap aktif. `deploy/configure-mcp-proxy.py` adalah alat historis sebelum pemilik pertama terbentuk; **jangan jalankan kembali pada instalasi aktif ini**.

Sebelum penambahan login password, halaman login HTML mengembalikan 200 dan admin anonim diarahkan ke login dengan 302. API settings privat tetap 401; MCP anonim tetap 401 dengan challenge Bearer. POST setup ulang ditolak dengan 409, sedangkan pembuatan/verifikasi Admin pertama ditolak dengan 400. Ini catatan historis pengamanan onboarding, bukan verifikasi login password baru.

Default source `CMS_ADMIN_ENABLED="false"` tetap dipakai untuk deployment baru atau maintenance yang disengaja. Flag false menutup seluruh path `/_emdash` dan `/_emdash/*`, termasuk wizard, API setup, dan media library, dengan HTTP 503 serta `private, no-store`. Halaman publik dan gambar tema statis tetap tersedia. Penahanan produksi tidak mengubah perilaku `npm run dev` atau `npm run dev:staging` lokal.

Produksi sekarang memakai **`CMS_ADMIN_ENABLED="true"`**. Pertahankan nilai ini untuk operasi normal. Autentikasi EmDash melindungi fungsi admin, sedangkan URL media CMS tetap perlu dapat diakses pembaca. Jangan mengembalikan flag ke false setelah selesai menyunting: media di bawah `/_emdash` akan ikut tertahan dan gambar pada artikel publik dapat gagal dimuat. Gunakan false hanya untuk maintenance yang disengaja, kemudian kembalikan true setelah selesai.

Jangan mengimpor user, passkey, atau database development sebagai identitas pemilik dan jangan mereset setup yang sudah selesai. Artikel contoh, bila dimasukkan, tetap draft sampai lolos review. Gunakan lokasi database yang tercatat di [panduan VPS](VPS.md) untuk pemeriksaan read-only dan cadangan.

### Login email/password dan pengaturan pertama

Ekstensi proyek di `src/auth/` menyediakan rute melalui provider EmDash/Astro dan membuat session Astro nyata untuk user yang sama. Default `/_emdash/admin/login` diarahkan ke `/_emdash/admin/login/password`; `/_emdash/admin/login?method=passkey` mempertahankan metode lama. Login password tidak membutuhkan SMTP. **6 test password, type check 61 file tanpa error/warning/hint, build lokal/VPS, dan integrasi HTTP terisolasi lulus.** Versi [71de5c1](https://github.com/restupambudi99/webaffiliate/commit/71de5c181a1f7e01e7a99198fa4afd5b6a674205) sudah live; [GitHub Actions](https://github.com/restupambudi99/webaffiliate/actions/runs/38735973958) lulus. Pemeriksaan form HTTPS dan proteksi anonim lulus, sementara pilihan password dan login pertama pemilik masih tertunda.

Pemilik menggunakan email terdaftar dan menentukan password sendiri, sepanjang 15–128 karakter. Berkas HTML enrollment privat telah disiapkan dan disalin ke lokasi lokal yang diabaikan Git. Pemeriksaan 15 Oktober 2026 pukul 19.43 Asia/Bangkok (12.43 UTC) menunjukkan **0 password tersimpan dan 1 enrollment**. Ini bukan bukti pemilik telah membuat password. Generator `scripts/password-owner-setup.ts` memakai `MYJOURNEY_PASSWORD_DB=/var/lib/desk-edit/password-auth.db`, database konten produksi, origin HTTPS, dan `--output`. Jangan menerbitkan ulang tautan sebagai langkah login rutin; ikuti [VPS](VPS.md) jika tautan kedaluwarsa.

Tautan memakai fragment `#token=...`, berlaku satu jam, dan hanya sekali pakai; database menyimpan hash token. Jangan menyalin tautan atau berkas privat ke Git, uploads, isi artikel, pengaturan CMS, atau log. Hapus berkas HTML setelah dipakai. Untuk password yang sudah ada, penerbitan tautan baru memerlukan `--reset` secara eksplisit. Reset ini **tidak mencabut session lama atau token OAuth**; pencabutan akses tersebut merupakan tindakan terpisah.

Password disimpan sebagai hash scrypt dengan salt acak, `N=65536`, `r=8`, `p=2` (kebutuhan dasar memori 64 MiB per pekerjaan). Maksimal dua pekerjaan KDF berjalan bersamaan. Pembatas percobaan disimpan persisten: 40/menit global dan 8/15 menit per email/jenis operasi. Request harus berasal dari origin yang tepat. State password berada di SQLite privat terpisah dan ikut dicadangkan, termasuk penanganan WAL yang konsisten.

Magic link, undangan, dan pemulihan lewat email tetap belum tersedia tanpa provider email. Pengaturan/reset password memakai jalur operator tanpa SMTP. Percobaan OAuth sebelumnya terhenti; pengguna kini mengizinkan tujuh scope yang dicatat di [koneksi AI](AI-CONNECTIONS.md). Alur CLI sudah dimulai, tetapi consent browser dan pembacaan berizin masih tertunda. Tidak ada akun demo, password bawaan, atau klaim client sudah terhubung.

### Media dan cache pada VPS

Unggah gambar melalui **Media library** EmDash; file disimpan di `/var/lib/desk-edit/uploads`, sementara metadata berada di SQLite. Batas upload aplikasi adalah **5 MiB per file**. Gambar tema tetap merupakan file statis di `public/`. Session filesystem Astro memakai `/var/lib/desk-edit/sessions` melalui `EMDASH_SESSIONS_DIR`, sehingga sesi tidak disimpan pada direktori dependency yang berganti saat deployment.

Jangan mengaktifkan cache HTML bersama tanpa invalidasi saat publish. Rute admin/API dan respons pribadi harus tetap `private, no-store`. Cloudflare tidak boleh menyimpan cache halaman setup, login, maupun respons editor. Cache aset publik diatur terpisah agar tidak menahan perubahan konten atau sesi CMS.

## Scaffold alternatif Cloudflare Workers

Repository mempertahankan scaffold alternatif `astro.config.cloudflare.mjs` untuk Workers dengan D1 (`DB`), R2 (`MEDIA`), dan KV (`SESSION`) untuk sesi autentikasi. Scaffold ini **tidak dipakai pada produksi VPS**.

Output build alternatif berada di `dist-cloudflare/`, terpisah dari `dist/` Node. `workers_dev` dan `preview_urls` dinonaktifkan pada scaffold. Jangan menjalankan deployment Workers, mengaktifkan R2, atau menambah billing sebagai bagian dari setup produksi saat ini. Cloudflare pada arsitektur utama digunakan untuk DNS dan SSL; database, sesi aplikasi, serta file media dikelola oleh aplikasi Node di VPS.

## Sebelum mengaktifkan monetisasi

Mode awal `editorial_only`, tanpa contoh tag Associates. Isi tag milik pemilik dan aktifkan mode affiliate hanya setelah akun, disclosure, daftar Site, dan artikel ditinjau. Jangan memakai harga/stok/rating Amazon, logo Amazon, ataupun API produk pada MVP. Brand website adalah MyJourney, sesuai nama yang dikonfirmasi pemilik.

## Referensi resmi

- [Memasang EmDash di Astro](https://docs.emdashcms.com/existing-project/)
- [Query konten dan Portable Text](https://docs.emdashcms.com/guides/querying-content/)
- [Format seed](https://docs.emdashcms.com/themes/seed-files/)
- [Authentication dan passkey](https://docs.emdashcms.com/guides/authentication/)
- [Deployment Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- [Deployment Node](https://docs.emdashcms.com/deployment/nodejs/)
- [Pemindahan domain](https://docs.emdashcms.com/guides/change-domain/)

Versi paket diperiksa langsung di registry npm pada 14 Oktober 2026. API dan kontrak plugin juga diperiksa terhadap source paket EmDash 1.2.0.

`node scripts/test-cms-policy.mjs` memeriksa bypass tautan CMS, sanitasi sumber, penolakan isi kosong, bentuk referensi produk, dan konten import yang tidak didukung. `node scripts/test-cms-bootstrap.mjs` memeriksa penutupan CMS saat flag hilang/nonaktif, path API setup, path yang di-encode, header no-store, serta akses halaman publik.
