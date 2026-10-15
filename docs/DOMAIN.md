# Domain dan HTTPS

Alamat produksi: **https://affiliate.restupambudi.my.id**. Arsitektur yang dipilih pemilik adalah Cloudflare DNS/proxy pada paket Free, dengan Astro + EmDash Node dan media lokal di VPS. Konfigurasi Workers merupakan opsi alternatif yang tidak digunakan untuk hosting produksi ini.

## DNS

Pada 15 Oktober 2026, nameserver Hostinger diganti menjadi `kai.ns.cloudflare.com` dan `malavika.ns.cloudflare.com`. Resolver publik sudah mengembalikan keduanya, dan Cloudflare mengonfirmasi aktivasi zone.

Sebelum cutover, daftar DNS Hostinger dicocokkan dengan Cloudflare: A `@` ke `76.76.21.21` (TTL 60) dan CNAME `www` ke `cname.vercel-dns.com` (TTL 300). Record induk tersebut dipertahankan DNS-only untuk website Vercel yang sudah ada. Tidak ada record email pada sumber. Ekspor zone dibuat sebelum perubahan.

Record `affiliate` diarahkan hanya ke VPS yang ditentukan pemilik. Setelah sertifikat origin valid, proxy Cloudflare diaktifkan untuk subdomain ini. Tidak ada wildcard atau perubahan tujuan domain induk.

## HTTPS dan cache

Origin HTTPS, canonical, sitemap, dan URL EmDash menggunakan hostname final yang sama. Sertifikat origin dipasang pada virtual host OpenLiteSpeed khusus subdomain. Mode Cloudflare memakai **Full (strict)**; koneksi dari browser ke Cloudflare dan dari Cloudflare ke VPS sama-sama terenkripsi. Redirect HTTP ke HTTPS hanya berlaku pada hostname affiliate dan mempertahankan path/query.

Cache Cloudflare berlaku untuk file statis yang aman seperti gambar, CSS, dan JavaScript. HTML, admin, API CMS, serta session tidak diberi aturan Cache Everything. Respons privat tetap no-store. Tidak mengaktifkan layanan R2, Images, atau subscription berbayar.

## Pemeriksaan rilis

- Resolusi DNS publik dan proxy subdomain.
- Sertifikat HTTPS dengan validasi normal, tanpa mengabaikan error TLS.
- Redirect HTTP, halaman publik, aset, dan halaman 404.
- Setup pemilik ditahan hingga pemilik siap membuat passkey sendiri; kemudian CMS diaktifkan untuk penggunaan normal.
- Record domain induk tetap mempertahankan tujuan sebelumnya.

## Hasil pemeriksaan langsung, 15 Oktober 2026

Subdomain sudah aktif dengan record A menuju VPS dan status **Proxied**. Cloudflare menampilkan **Full (strict)**. Website publik merespons HTTP 200 dengan header `server: cloudflare`; HTML tetap `DYNAMIC`, bukan cache bersama. Origin HTTPS juga merespons 200 dengan hasil validasi TLS 0. Sertifikat origin Let's Encrypt berlaku sampai 13 Januari 2027 dan memakai renewal hook OpenLiteSpeed pada instalasi acme.sh yang sudah ada.

HTTP mengarah 308 ke HTTPS dengan path/query utuh. Beranda dan gambar berhasil dimuat pada browser desktop serta lebar 360 px, tanpa horizontal overflow; menu mobile berfungsi. Record root/www tetap memakai tujuan Vercel sebelumnya.

Setup pemilik sedang dilindungi realm sementara OpenLiteSpeed pada `/_emdash/`: request anonim mendapat 401, sedangkan akses pemilik mendapat halaman wizard 200. Pengaman ini dilepas hanya setelah pemilik berhasil mendaftarkan passkey. Kredensial setup sementara dan key enkripsi tidak masuk repository.

Referensi: [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/), [Cache default behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/).
