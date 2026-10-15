# MyJourney — hasil validasi

Validasi selesai pada 15 Oktober 2026 (Asia/Bangkok). Source aplikasi berada pada repository ini; draft editorial belum menjadi artikel publik yang sudah disetujui.

## Integrasi MCP — 15 Oktober 2026

- MCP native telah dibangun dan dipasang pada VPS; service tetap aktif dan pengaturan judul/tagline CMS muncul di halaman live.
- [GitHub Actions integrasi MCP](https://github.com/restupambudi99/webaffiliate/actions/runs/38725031278) lulus, termasuk type check, build, dan pengujian pengamanan/editorial/MCP/identitas.
- Pengujian domain publik dengan `node scripts/check-mcp.mjs --require-admin-protection`: **8 lulus, 0 gagal**. Discovery menunjuk HTTPS publik; PKCE S256 dan DCR tersedia; request tanpa token/token tidak sah ditolak; input OAuth tidak valid ditolak; admin/setup tetap 401.
- Proxy origin HTTPS diperiksa langsung dengan sertifikat tervalidasi, tanpa mengikuti redirect. Setup biasa/terenkode tetap Basic Auth; MCP canonical memakai Bearer; alias MCP ditolak; input tidak valid pada enam endpoint OAuth mencapai validasi native. Cloudflare tetap aktif; pengujian publik dilakukan terpisah memakai client Node.
- Codex lokal telah memiliki entri `myjourney` dan `emdash-docs`. Autentikasi OAuth situs, panggilan baca berizin, penulisan artikel melalui client AI, serta login pemilik belum dinyatakan selesai. Pemilik masih perlu mendaftarkan passkey dan menyelesaikan consent pada client yang dipakai.

Panduan dan konfigurasi client ada di [koneksi AI](AI-CONNECTIONS.md).

- [Preview desain online privat](https://desk-edit-workspace-journal.nick-hatzis-1514.chatgpt.site)
- [Website produksi pada VPS melalui Cloudflare](https://affiliate.restupambudi.my.id/)
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
| Pengamanan bootstrap | 2 pengujian lulus; default production CMS tertutup |
| Browser Edge | 360, 768, 1440 px; tanpa horizontal overflow atau browser error |
| Interaksi | Navigasi mobile/Escape, filter, pencarian, empty state, artikel, 404, CMS setup lulus |
| Proteksi admin | API privat menolak akses anonim; passkey pemilik belum dibuat |
| Preview statis | 21 halaman, 10 artikel, navigasi/filter/search lulus |
| VPS Node | Build Linux lulus; service non-root aktif, SQLite/uploads/session persisten |
| Domain dan SSL | Cloudflare Proxied + Full (strict), HTTPS 200, origin TLS valid, HTTP 308 |
| Browser produksi | Beranda/gambar/menu mobile lulus pada 360 px; tanpa overflow |
| Onboarding pemilik | Realm sementara: anonim 401, pemilik 200; passkey perlu dibuat pemilik |

## Sampel performa

Di **build Node produksi lokal**, Edge headless dengan cold cache, latency 150 ms, download 200 KB/s, dan CPU throttle 4x:

| Lebar | LCP | CLS | Transfer resource |
| --- | --- | --- | --- |
| 360 px | 1,096 detik | 0 | 135.138 byte |
| 1440 px | 1,108 detik | 0 | 135.138 byte |

Ini sampel lab pada komputer pengembangan, bukan data pengunjung atau jaminan performa hosting produksi. Tidak ada bundle admin atau framework browser yang dimuat pada halaman beranda. Interaksi navigasi memakai JavaScript kecil yang inline.

## Yang masih memerlukan akun pemilik

1. Selesaikan wizard EmDash dan daftarkan passkey sendiri pada domain produksi. Pilih sample content untuk memasukkan 10 draft, lalu periksa login sebelum pengaman sementara dilepas.
2. Tinjau dan lengkapi penulis, editor, sumber, bukti hak media, konflik kepentingan, review konten, serta inventory privasi produksi sebelum menerbitkan artikel.
3. Tag Associates aktual belum diberikan; monetisasi tetap `editorial_only`.

Produksi memakai VPS Node dengan media langsung di EmDash dan DNS/proxy Cloudflare Free. Preview ChatGPT Site tetap merupakan snapshot desain statis yang terpisah.
