# VPS Node — systemd dan opsi Docker

Deployment utama sudah aktif di VPS menggunakan Node.js 24.16.0 terisolasi, service systemd `desk-edit`, SQLite, dan penyimpanan unggahan lokal. Situs tersedia melalui [origin HTTPS produksi](https://affiliate.restupambudi.my.id). Docker tetap merupakan opsi alternatif yang belum dibangun atau diuji.

VPS memakai Ubuntu 22.04. OpenLiteSpeed menangani port 80/443 dan proxy ke aplikasi; proxy DNS Cloudflare aktif. Container Evolution API yang sudah ada tetap terpisah. Sertifikat Let's Encrypt pada origin telah terbit: pemeriksaan langsung origin menghasilkan HTTP 200 dan verifikasi TLS 0. Redirect HTTP menghasilkan 308 dengan path serta query tetap utuh.

## Deployment utama: Node dan systemd

Checkout aplikasi berada di `/opt/desk-edit/app`. Service aktif memakai akun khusus `deskedit:deskedit`, executable `/opt/desk-edit/runtime/node/bin/node`, dan listen pada `127.0.0.1:4321`. Unit tersedia di [`deploy/desk-edit.service`](../deploy/desk-edit.service). Node global 24.11 tidak diubah.

Runtime 24.16.0 diunduh dari distribusi resmi Node dan checksum SHA-256 diverifikasi sebelum pemasangan pada direktori khusus aplikasi. Berikut pola untuk mereproduksi pemasangan runtime; tidak perlu dijalankan kembali pada instalasi aktif:

```bash
set -e
node_release=24.16.0
node_arch="$(node -p 'process.arch')"
node_archive="node-v${node_release}-linux-${node_arch}.tar.xz"
node_install_tmp="$(mktemp -d)"
cd "$node_install_tmp"
curl --fail --silent --show-error --location --remote-name "https://nodejs.org/dist/v${node_release}/${node_archive}"
curl --fail --silent --show-error --location --remote-name "https://nodejs.org/dist/v${node_release}/SHASUMS256.txt"
grep " ${node_archive}$" SHASUMS256.txt | sha256sum --check -
# Lanjutkan hanya jika pemeriksaan menampilkan OK.
sudo install -d /opt/desk-edit/runtime/node
sudo tar -xJf "$node_archive" --strip-components=1 -C /opt/desk-edit/runtime/node
/opt/desk-edit/runtime/node/bin/node --version
```

Langkah verifikasi harus berhasil sebelum ekstraksi. Instalasi ini tidak mengganti `/usr/local/bin/node` atau paket Node global.

Direktori state persisten `/var/lib/desk-edit` menyimpan:

- `content.db` serta file SQLite WAL/SHM bila ada.
- `password-auth.db` untuk hash password, enrollment, dan pembatas percobaan pada ekstensi login baru; database ini privat dan terpisah dari konten CMS.
- `uploads/` untuk media dan arsip EmDash.
- `sessions/` untuk session filesystem Astro.

Akun `deskedit` dan direktori state sudah disiapkan. SQLite `/var/lib/desk-edit/content.db` diinisialisasi otomatis oleh aplikasi. `StateDirectory=desk-edit` mengelola direktori induk dengan mode `0750`, dan akun service dapat menulis ke direktori unggahan serta session. Session memakai `sessionDrivers.fsLite` dengan `EMDASH_SESSIONS_DIR=/var/lib/desk-edit/sessions` secara eksplisit; tidak memerlukan symlink ke `node_modules`.

Simpan konfigurasi runtime di `/etc/desk-edit.env`, milik `root:root` dengan mode `0600`. systemd memuat berkas sebelum menjalankan proses sebagai `deskedit`. Jangan menaruh key produksi dalam checkout, build argument, atau image.

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=4321
SITE_URL=https://affiliate.restupambudi.my.id
EMDASH_SITE_URL=https://affiliate.restupambudi.my.id
EMDASH_DATABASE_URL=file:/var/lib/desk-edit/content.db
EMDASH_UPLOADS_DIR=/var/lib/desk-edit/uploads
EMDASH_SESSIONS_DIR=/var/lib/desk-edit/sessions
MYJOURNEY_PASSWORD_DB=/var/lib/desk-edit/password-auth.db
EMDASH_ENCRYPTION_KEY=
CMS_ADMIN_ENABLED=true
STAGING_PREVIEW=false
AFFILIATE_MODE=editorial_only
AMAZON_SITE_REGISTERED=false
CONTACT_EMAIL=nikolasjuan34@gmail.com
```

Isi `EMDASH_ENCRYPTION_KEY` dengan key EmDash yang dihasilkan secara privat; gunakan key lama untuk instalasi yang sudah dipakai. Key dibutuhkan saat runtime, bukan untuk build. Contoh generator format EmDash menggunakan Node tersedia pada bagian konfigurasi Docker di bawah; hasilnya disimpan dalam `/etc/desk-edit.env` untuk jalur native.

`MYJOURNEY_PASSWORD_DB` diperlukan oleh versi dengan login email/password dan harus menunjuk SQLite privat di direktori state yang dapat ditulis `deskedit`. Jangan mengarahkannya ke Git, uploads, atau database konten. **6 test ekstensi lulus; check, build, dan deployment/live login versi ini masih menunggu verifikasi.**

Build dari direktori aplikasi dengan origin dan path produksi yang sama. Environment berikut hanya mengandung konfigurasi nonsecret:

```bash
cd /opt/desk-edit/app
export PATH="/opt/desk-edit/runtime/node/bin:$PATH"
npm ci --include=dev --no-audit --no-fund
SITE_URL=https://affiliate.restupambudi.my.id \
EMDASH_SITE_URL=https://affiliate.restupambudi.my.id \
EMDASH_DATABASE_URL=file:/var/lib/desk-edit/content.db \
EMDASH_UPLOADS_DIR=/var/lib/desk-edit/uploads \
EMDASH_SESSIONS_DIR=/var/lib/desk-edit/sessions \
CMS_ADMIN_ENABLED=false STAGING_PREVIEW=false npm run build
```

`astro.config.mjs` menanam descriptor SQLite, storage lokal, dan konfigurasi session pada hasil build. Path database, unggahan, session, dan origin harus cocok pada build serta runtime; perubahan path atau domain memerlukan rebuild. Dependency dan hasil build perlu dapat dibaca akun service. Batas upload CMS pada integrasi Node adalah 5 MiB per file.

Unit memakai `ProtectSystem=strict`, `ProtectHome=yes`, `PrivateTmp=yes`, dan `NoNewPrivileges=yes`; hanya `/var/lib/desk-edit` dibuka untuk penulisan state. Perubahan aplikasi/dependency dilakukan sebagai proses deployment, kemudian service direstart. Unit sudah terpasang; perintah berikut mendokumentasikan pemasangan ulang serta pemeriksaan oleh operator:

```bash
sudo install -m 0644 deploy/desk-edit.service /etc/systemd/system/desk-edit.service
sudo systemctl daemon-reload
sudo systemctl enable --now desk-edit
sudo systemctl status desk-edit --no-pager
sudo journalctl -u desk-edit -n 100 --no-pager
curl --fail http://127.0.0.1:4321/
```

Service systemd sudah berjalan dan halaman publik serta asset tersedia. Pada 15 Oktober 2026, pemeriksaan database mengonfirmasi **1 user Admin (email Admin yang sudah terdaftar), 1 credential passkey, dan `setup_complete=true`**. Realm Basic Auth sementara telah dilepas. Produksi tetap memakai `CMS_ADMIN_ENABLED=true`; default source false berlaku untuk pemasangan baru atau maintenance. Login password baru, upload media, dan OAuth client belum diverifikasi terpisah. Email kontak tetap `nikolasjuan34@gmail.com`.

### MCP dan proxy onboarding

MCP bawaan EmDash aktif. `deploy/configure-mcp-proxy.py` merupakan alat **historis sebelum pemilik pertama terdaftar** untuk mengecualikan endpoint mesin dari Basic Auth. **Jangan jalankan kembali pada instalasi aktif ini** karena tahap onboarding sudah selesai.

Realm sementara dilepas menggunakan `deploy/complete-owner-setup.py`, yang menolak perubahan tanpa setup selesai serta credential milik Admin. Script mencadangkan vhost, membandingkan diagnostik, melakukan reload, dan mengembalikan konfigurasi sebelumnya jika pemeriksaan gagal. Pelepasan ini sudah dilaksanakan; bukan langkah rutin deployment.

Status historis sesudah pelepasan, sebelum ekstensi password: halaman login native HTML 200, admin anonim 302 menuju login, API settings privat 401, dan MCP anonim 401 dengan challenge Bearer. POST konfigurasi ulang setup ditolak 409; pembuatan/verifikasi Admin pertama ditolak 400. Tampilan setup dapat tetap 200 tanpa membuka kembali API onboarding.

Pemeriksaan domain publik sebelum ekstensi password memakai **`npm run mcp:check`** menghasilkan **6 lulus, 0 gagal**. `--require-admin-protection` hanya untuk tahap historis Basic Auth, sehingga jangan dipakai pada produksi sesudah onboarding. Metadata harus menunjuk origin HTTPS publik, bukan `localhost`. Lihat [koneksi AI](AI-CONNECTIONS.md) untuk autentikasi client; pemeriksaan anonim ini tidak membuktikan login atau OAuth sudah berhasil.

Untuk cadangan native yang konsisten, gunakan mekanisme backup SQLite atau hentikan hanya service `desk-edit`, arsipkan seluruh `/var/lib/desk-edit`, lalu mulai kembali service. Sertakan **content.db dan password-auth.db beserta WAL/SHM yang diperlukan**, uploads, dan state sesi. Simpan `/etc/desk-edit.env` dan key sebagai cadangan privat terpisah. Periksa hasil backup dan uji restore ke lokasi percobaan; jangan menyalin hanya file utama SQLite saat masih ditulis. Database password tidak boleh dibagikan melalui Git, media library, atau pengaturan konten.

### Pengaturan password pemilik tanpa SMTP

Provider di `src/auth/provider.mjs` mendaftarkan rute login/setup pada Astro. `password-api.ts` membuat ulang session Astro native untuk user yang sama setelah autentikasi; password tidak menjadi kredensial MCP dan tidak menyetujui scope OAuth otomatis. Credential passkey lama tetap disimpan.

Setelah versi baru dan rute HTTPS diverifikasi, operator dapat menjalankan generator sebagai user service. Ganti path output contoh di bawah dengan lokasi privat yang dapat ditulis `deskedit`, di luar checkout dan uploads. Ini membuat berkas enrollment sensitif, bukan password bawaan:

```bash
sudo -u deskedit env \
  EMDASH_DATABASE_URL=file:/var/lib/desk-edit/content.db \
  EMDASH_SITE_URL=https://affiliate.restupambudi.my.id \
  MYJOURNEY_PASSWORD_DB=/var/lib/desk-edit/password-auth.db \
  /opt/desk-edit/runtime/node/bin/node \
  /opt/desk-edit/app/scripts/password-owner-setup.ts \
  --output=/jalur-privat/myjourney-password.html
```

Script mensyaratkan tepat satu Admin aktif, mengikat token ke akun tersebut, menyimpan hash token, dan tidak mencetak token/password. Pemilik membuka HTML privat, lalu mengatur password untuk email Admin yang sudah terdaftar sendiri. Tautan fragment `#token=...` berlaku satu jam dan sekali pakai. Jangan mengunggah atau membagikan berkas/tautannya; hapus HTML setelah dipakai.

Jika password sudah ada, script menolak enrollment biasa. Tambahkan `--reset` hanya untuk mengganti password yang sudah tersimpan. Reset ini **tidak mencabut session lama ataupun token OAuth**; tangani pencabutan akses secara terpisah bila diperlukan. Pemulihan ini memakai operator VPS, tanpa SMTP dan tanpa email reset otomatis.

Hash memakai scrypt bersalt (`N=65536`, `r=8`, `p=2`, kebutuhan dasar 64 MiB), maksimal dua KDF bersamaan. Pembatas persisten menerapkan 40 percobaan/menit global dan 8/15 menit per email/jenis operasi; pemeriksaan Origin tetap ketat. `password-auth.db` adalah state privat, bukan data content/settings EmDash.

## Opsi Docker — belum diuji

Berkas `Dockerfile` dan `compose.yml` menyediakan jalur alternatif dengan aplikasi Node yang sama. Plugin `docker compose` belum tersedia pada pemeriksaan awal VPS, dan Docker tidak tersedia di lingkungan pengembangan untuk menguji image/container. Jalur native di atas tidak memerlukan image tambahan atau plugin Compose. Jangan menjalankan kedua jalur pada port host atau data yang sama.

## Bentuk container

Build memakai image penuh `node:24-bookworm`, `npm ci` dengan lockfile dan dependency build, lalu `npm run build` untuk adapter Node pada `astro.config.mjs`. Dependency pengembangan dibuang setelah build. Runtime memakai `node:24-bookworm-slim` dan user `node` (UID/GID 1000), dengan satu proses aplikasi.

Port host hanya diterbitkan ke `127.0.0.1:4321`; `HOST=0.0.0.0` berlaku di dalam container. Ganti `APP_PORT` di `.env` bila port host itu sudah dipakai, misalnya `APP_PORT=14321`. Tidak ada port 80, 443, atau port Immich yang ditambahkan.

Volume bernama `desk-edit-vps-data` dipasang pada `/app/data` dan menyimpan:

- `/app/data/desk-edit.db`, beserta file SQLite WAL/SHM bila ada.
- `/app/data/uploads/` untuk media CMS dan arsip yang dibuat EmDash.
- `/app/data/sessions/` untuk driver session filesystem Astro melalui `EMDASH_SESSIONS_DIR`.

Direktori tersebut dibuat dengan kepemilikan user `node` di image. Volume kosong pertama menerima direktori tersebut dari image; volume yang sudah berisi data tetap dipakai. Jangan menggantinya dengan bind mount tanpa menyesuaikan izin UID/GID 1000. Gunakan satu replica aplikasi untuk deployment SQLite ini.

`EMDASH_DATABASE_URL=file:/app/data/desk-edit.db`, `EMDASH_UPLOADS_DIR=/app/data/uploads`, dan `EMDASH_SESSIONS_DIR=/app/data/sessions` ditetapkan saat build dan runtime. Konfigurasi penyimpanan/session ditanam dalam hasil build, sehingga mengubah environment runtime saja tidak memindahkan state. Tidak ada symlink session yang diperlukan. Batas upload CMS tetap 5 MiB per file.

## Persiapan konfigurasi

Jalankan instruksi ini dari direktori checkout `desk-edit` di VPS setelah opsi Docker dipilih dan plugin Compose tersedia. Instalasi plugin Compose belum termasuk dalam persiapan ini.

```bash
cp .env.example .env
chmod 600 .env
node -e "console.log('emdash_enc_v1_' + require('node:crypto').randomBytes(32).toString('base64url'))"
```

Salin key yang baru dihasilkan ke `EMDASH_ENCRYPTION_KEY` dalam `.env`, lalu simpan cadangannya secara privat. Format tersebut mengikuti key EmDash: prefix `emdash_enc_v1_` dengan 32 byte acak dalam base64url. Untuk instalasi yang sudah dipakai, pertahankan key aslinya agar rahasia plugin tetap dapat dibaca.

Pastikan konfigurasi berikut sesuai dengan origin HTTPS final:

```dotenv
SITE_URL=https://affiliate.restupambudi.my.id
EMDASH_SITE_URL=https://affiliate.restupambudi.my.id
STAGING_PREVIEW=false
AFFILIATE_MODE=editorial_only
AMAZON_SITE_REGISTERED=false
CONTACT_EMAIL=nikolasjuan34@gmail.com
CMS_ADMIN_ENABLED=false
```

Compose menggunakan `SITE_URL` yang sama untuk kedua origin pada build dan runtime. Domain berbeda memerlukan perubahan `.env` dan rebuild. `site.config.mjs` memakai domain tersebut sebagai origin produksi bawaan; canonical mengikuti `SITE_URL`. Gunakan origin HTTPS tanpa path tambahan.

`.env`, database pengembangan, unggahan, key, dan hasil build lokal dikecualikan dari konteks Docker. Key hanya diteruskan sebagai environment runtime, bukan build argument. Image dan Compose menetapkan default `CMS_ADMIN_ENABLED=false`. Middleware produksi Node dan Worker Cloudflare sama-sama menahan seluruh `/_emdash` saat flag belum bernilai `true`; development lokal tetap tersedia. Binding host loopback tetap digunakan pada tahap awal.

## Build dan pemeriksaan privat

```bash
docker compose version
docker compose config --quiet
docker compose build app
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
curl --fail http://127.0.0.1:4321/
```

Sesuaikan port `curl` bila `APP_PORT` diganti. Healthcheck container menguji halaman utama melalui loopback internal. `docker compose config --quiet` memvalidasi konfigurasi tanpa mencetak nilai secret. Pemeriksaan ini belum dijalankan pada VPS.

Setelah startup, periksa bahwa halaman utama dan asset tampil, serta database dan media baru tetap ada setelah `docker compose restart app`. Produksi hanya menampilkan artikel CMS yang sudah diterbitkan. Database baru belum mempunyai pemilik atau artikel terbit; jangan menyalin database development sebagai cara membuat akun produksi.

## HTTPS dan setup pemilik

Jalur native sudah dihubungkan melalui OpenLiteSpeed dan Cloudflare DNS, dengan TLS Let's Encrypt pada origin. Berkas Docker tidak menambahkan konfigurasi proxy lain. Jika jalur Docker kelak dipilih, sesuaikan target proxy yang sudah ada setelah memeriksa port dan data, tanpa menambahkan listener publik yang bersaing.

Proxy meneruskan ke port loopback aplikasi dengan hostname HTTPS final dan informasi protokol dari proxy yang dipercaya. Pertahankan pengecualian cache bersama untuk admin dan API autentikasi. Situs Node tidak melewati `src/worker.ts`; redirect HTTP ke HTTPS ditangani pada proxy dan telah diperiksa mempertahankan path/query.

Onboarding produksi sudah selesai. Versi baru mengarahkan [login EmDash](https://affiliate.restupambudi.my.id/_emdash/admin/login) ke `/_emdash/admin/login/password` untuk email/password; verifikasi live masih tertunda. Gunakan akun pemilik yang sudah ada setelah enrollment password selesai. Metode passkey tetap tersedia melalui `/_emdash/admin/login?method=passkey`. Username/password Basic Auth lama tidak diperlukan; jangan mengulang wizard atau mereset database CMS untuk login.

Untuk instalasi baru atau maintenance, `CMS_ADMIN_ENABLED=false` menahan admin, API setup, dan URL media CMS dengan HTTP 503 serta `private, no-store`; halaman publik dan asset tema tetap tersedia. Flag ini berlaku pada middleware Node hasil build produksi dan Worker Cloudflare, bukan pada server development lokal. Instalasi baru harus melindungi wizard sampai pemilik siap. Mengubah flag runtime dan me-restart service tidak memerlukan rebuild.

**Pertahankan `CMS_ADMIN_ENABLED=true`** agar login, penyuntingan, API, dan gambar CMS publik tetap bekerja. Mengembalikan flag ke false juga memblokir media artikel; gunakan hanya untuk hold maintenance yang disengaja. Login password dan pembacaan berizin melalui client masih perlu diperiksa. Scope OAuth yang ditolak belum disetujui; session password tidak mengubah keputusan consent. Lihat [petunjuk CMS](CMS.md) untuk workflow editorial, draft, sample content, dan kunci enkripsi.

## Pembaruan dan cadangan

Deployment ulang dengan `docker compose build app` lalu `docker compose up -d app` mengganti image aplikasi dan mempertahankan volume. Jangan menjalankan `docker compose down --volumes` pada instalasi yang datanya masih diperlukan.

Ambil cadangan konsisten SQLite dan unggahan dengan menghentikan hanya service `app` sebentar. Contoh berikut menulis arsip ke direktori checkout, sehingga gunakan penyimpanan yang cukup dan salin hasilnya ke lokasi cadangan terpisah:

```bash
mkdir -p backups
docker compose stop app
docker compose run --rm --no-deps -T --entrypoint tar app \
  -C /app/data -czf - . > "backups/desk-edit-data-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
docker compose start app
```

Periksa exit status dan isi arsip sebelum mengandalkannya. Bila proses backup gagal, tetap jalankan `docker compose start app`. Simpan `.env` dan key enkripsi sebagai cadangan privat terpisah. Uji pemulihan ke volume percobaan sebelum perpindahan produksi. Cadangan database EmDash dari panel admin belum tentu menyertakan seluruh byte media; arsip volume di atas mencakup SQLite, unggahan, dan session.

## Immich

Belum ada service Immich atau integrasi media Immich yang ditambahkan. Jika VPS sudah mempunyai Immich, periksa deployment, kapasitas disk, album, izin akses, dan hostname miliknya terlebih dahulu. Penyimpanan EmDash dalam opsi ini tetap memakai folder unggahan lokal; Immich dapat menjadi layanan foto terpisah setelah rincian server dan kebutuhan aksesnya jelas. Jangan memasang ulang atau mengambil alih volume/proxy layanan foto yang sudah ada.

## Referensi

- [Konfigurasi eksekusi service systemd](https://github.com/systemd/systemd/blob/main/man/systemd.exec.xml)
- [Distribusi dan checksum resmi Node.js 24.16.0](https://nodejs.org/dist/v24.16.0/SHASUMS256.txt)
- [Adapter Node dan standalone server Astro](https://docs.astro.build/en/guides/integrations-guide/node/)
- [Session Astro](https://docs.astro.build/en/guides/sessions/)
- [Volume Docker](https://docs.docker.com/engine/storage/volumes/)
- [Definisi service Compose](https://docs.docker.com/reference/compose-file/services/)
