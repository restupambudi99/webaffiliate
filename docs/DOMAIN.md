# Domain dan HTTPS

Alamat produksi: **https://affiliate.restupambudi.my.id**.

Konfigurasi source sudah menetapkan origin HTTPS untuk Astro, canonical, sitemap, dan EmDash. Wrangler hanya mengikat hostname `affiliate.restupambudi.my.id` sebagai Worker Custom Domain. Request HTTP untuk hostname ini dialihkan 308 ke HTTPS dengan path dan query yang sama. Domain induk dan subdomain lain tidak masuk rule redirect.

## Status aktivasi

Pada 15 Oktober 2026, zone ditambahkan pada paket Free di akun Cloudflare pemilik. Nameserver di Hostinger sudah berhasil diganti dari `lunar.dns-parking.com` / `solar.dns-parking.com` menjadi:

- `kai.ns.cloudflare.com`
- `malavika.ns.cloudflare.com`

Hostinger menampilkan konfirmasi **Nameservers changed!**. Cloudflare masih menampilkan **Waiting for your registrar to propagate your new nameservers** pada pemeriksaan sesudah penyimpanan. Status Active dan penerbitan sertifikat masih harus diverifikasi setelah propagasi. Wrangler CLI juga memerlukan otorisasi deployment yang terpisah dari login dashboard.

Sebelum cutover, daftar DNS lengkap Hostinger dicocokkan dengan Cloudflare: A `@` ke `76.76.21.21` (TTL 60), dan CNAME `www` ke `cname.vercel-dns.com` (TTL 300). Kedua record dipertahankan DNS-only agar website utama tetap langsung menuju Vercel. Tidak ada record email pada daftar sumber. Ekspor zone dibuat sebelum perubahan.

## Aktivasi Cloudflare

1. Login ke akun Cloudflare yang memiliki zone `restupambudi.my.id`; periksa status zone dan resource website yang ada.
2. Zone harus **Active** untuk Workers Custom Domains. Jika masih Pending, cocokkan nameserver publik dengan nameserver yang benar-benar ditetapkan Cloudflare. Sebelum mengganti nameserver induk, cocokkan semua record website/email yang masih dipakai; perubahan ini tidak dilakukan otomatis oleh proyek.
3. Jalankan `npx wrangler login`, simpan secret EmDash, lalu `npm run deploy:cloudflare`. Konfigurasi route memakai hostname yang sudah diminta, bukan wildcard domain induk.
4. Cloudflare membuat DNS dan sertifikat TLS untuk Worker Custom Domain. Tunggu status hostname dan sertifikat aktif; jangan menambahkan CNAME buatan ke alamat workers.dev sebagai pengganti proses ini.
5. Verifikasi `https://affiliate.restupambudi.my.id` dengan validasi sertifikat normal, lalu pastikan HTTP mengarah 308 ke HTTPS. Tidak memakai opsi untuk mengabaikan kesalahan sertifikat.
6. Selesaikan setup passkey EmDash langsung di origin HTTPS ini, lalu review dan publikasikan konten. Alamat ini juga yang dicatat pada register Site sebelum monetisasi.

Untuk sertifikat origin tambahan pada hosting Node di belakang Cloudflare, gunakan sertifikat origin yang valid dan mode Full (strict). Konfigurasi origin terpisah ini tidak diperlukan oleh Worker yang berjalan langsung di Cloudflare.

Referensi: [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).
