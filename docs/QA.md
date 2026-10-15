# Desk Edit — hasil validasi

Validasi selesai pada 15 Oktober 2026 (Asia/Bangkok). Source aplikasi berada pada repository ini; draft editorial belum menjadi artikel publik yang sudah disetujui.

- [Preview desain online privat](https://desk-edit-workspace-journal.nick-hatzis-1514.chatgpt.site)
- [GitHub Actions yang lulus untuk aplikasi](https://github.com/restupambudi99/webaffiliate/actions/runs/38659970183)

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Astro type check | 0 errors, 0 warnings |
| Build Node | Lulus |
| Build Cloudflare Workers | Lulus, output terpisah dist-cloudflare |
| EmDash seed | Valid; 10 draft di SQLite lokal |
| Pengujian keselamatan | 3 pengujian lulus |
| Pengujian CMS | 6 pengujian lulus, termasuk HookPipeline EmDash asli untuk publish/schedule |
| Browser Edge | 360, 768, 1440 px; tanpa horizontal overflow atau browser error |
| Interaksi | Navigasi mobile/Escape, filter, pencarian, empty state, artikel, 404, CMS setup lulus |
| Proteksi admin | API privat menolak akses anonim; passkey pemilik belum dibuat |
| Preview statis | 21 halaman, 10 artikel, navigasi/filter/search lulus |

## Sampel performa

Di **build Node produksi lokal**, Edge headless dengan cold cache, latency 150 ms, download 200 KB/s, dan CPU throttle 4x:

| Lebar | LCP | CLS | Transfer resource |
| --- | --- | --- | --- |
| 360 px | 1.096 ms | 0 | 135.138 byte |
| 1440 px | 1.108 ms | 0 | 135.138 byte |

Ini sampel lab pada komputer pengembangan, bukan data pengunjung atau jaminan performa hosting produksi. Tidak ada bundle admin atau framework browser yang dimuat pada halaman beranda. Interaksi navigasi memakai JavaScript kecil yang inline.

## Yang masih memerlukan akun pemilik

1. Login Cloudflare melalui `npx wrangler login`, lalu jalankan langkah deployment pada CMS.md. Tidak ada sesi Cloudflare terautentikasi saat pengerjaan.
2. Selesaikan wizard EmDash dan daftarkan passkey pemilik di origin hosting yang nyata.
3. Lengkapi penulis, editor, sumber, bukti hak media, konflik kepentingan, review konten, serta inventory privasi produksi sebelum public launch.
4. Tag Associates aktual belum diberikan; monetisasi tetap `editorial_only`.

Domain khusus bisa ditambahkan setelah alamat Workers dan CMS aktif. Preview ChatGPT Site bersifat privat dan statis; CMS penuh ada di aplikasi Node/Cloudflare, bukan pada preview statis.
