# MyJourney — hasil validasi

Catatan validasi pada 15 Oktober 2026 (Asia/Bangkok). Source aplikasi berada pada repository ini; draft editorial belum menjadi artikel publik yang sudah disetujui. Hasil baseline tidak otomatis memverifikasi ekstensi login terbaru.

## Status terkini — ekstensi login email/password

- Identitas Admin terdaftar dan credential passkey lama dipertahankan; kontak publik tetap `nikolasjuan34@gmail.com`.
- Source menambahkan provider/rute Astro untuk email/password default, redirect `/_emdash/admin/login` ke `/_emdash/admin/login/password`, dan fallback `?method=passkey`. Implementasi membuat session Astro native setelah autentikasi berhasil; tidak membutuhkan SMTP.
- **6 test password, type check 61 file tanpa error/warning/hint, build Node, serta integrasi HTTP database sementara lulus. Deployment VPS dan pemeriksaan HTTPS live lulus; enrollment privat sudah dibuat. Penyimpanan password serta login oleh pemilik masih menunggu tindakan pemilik.** Tidak ada klaim bahwa password sudah dibuat atau client MCP sudah terhubung.
- Aplikasi [71de5c1](https://github.com/restupambudi99/webaffiliate/commit/71de5c181a1f7e01e7a99198fa4afd5b6a674205) sudah di-deploy; [GitHub Actions 38735973958](https://github.com/restupambudi99/webaffiliate/actions/runs/38735973958) lulus. Build produksi lokal dan VPS lulus. Cadangan VPS: `/opt/desk-edit/backups/password-login-20261015T123722Z`.
- Integrasi HTTP terisolasi mencakup setup/password login, email terdaftar dengan huruf besar/kecil, rotasi session, API native, logout, user nonaktif, CSRF, redirect OAuth, dan penolakan MCP 401 saat hanya memakai cookie session. Ini memakai database sementara, bukan password pemilik produksi.
- Live HTTPS: form 200 tanpa Basic Auth dengan `private, no-store`; login canonical 302 ke `/password`; token setup salah 400; API privat 401; onboarding POST 409; Origin salah/hilang 403; alias setup 401; beranda 200. Verifikasi TLS origin mengembalikan 0. MCP smoke sesudah deployment kembali **6 lulus, 0 gagal**.
- Snapshot read-only 15 Oktober 2026 pukul **19.43 Asia/Bangkok (12.43 UTC)**: **1 Admin, 1 passkey, 0 password, 1 enrollment**; mode file database password 0600. HTML privat disiapkan pada lokasi lokal yang diabaikan Git. Pemilik masih perlu memilih password dan melakukan login pertama.
- Pengaturan pertama memakai token sekali pakai terikat pemilik, kedaluwarsa satu jam, dengan hash token dalam SQLite privat terpisah. Generator hanya menulis HTML privat. Reset memerlukan `--reset` dan tidak mencabut session/token OAuth lama.
- Percobaan OAuth sebelumnya terhenti. Pengguna kini mengizinkan `content:read`, `content:write`, `media:read`, `media:write`, `schema:read`, `settings:read`, dan `settings:manage`. Alur login CLI dimulai; consent browser, token, dan panggilan baca berizin belum diverifikasi. Tidak ada klaim client sudah terhubung.

## Onboarding pemilik — sebelum ekstensi password, 15 Oktober 2026

- Pemeriksaan read-only produksi: **1 user Admin, 1 credential passkey, `setup_complete=true`**. Registrasi passkey selesai; login ulang native dan OAuth client belum diverifikasi terpisah.
- `deploy/complete-owner-setup.py` telah melepas hanya realm Basic Auth sementara, setelah memeriksa Admin/passkey/setup selesai. Script memakai cadangan vhost, perbandingan diagnostik, pemeriksaan respons, dan rollback saat gagal.
- [Login native EmDash](https://affiliate.restupambudi.my.id/_emdash/admin/login) mengembalikan HTML 200 tanpa password proxy. Admin anonim 302 ke login; API settings privat 401; MCP anonim 401 dengan challenge Bearer.
- POST setup ulang ditolak 409 dan pembuatan/verifikasi Admin pertama ditolak 400. Tampilan setup HTML masih 200, tetapi API tetap menolak pembuatan pemilik baru.
- Smoke MCP publik sesudah onboarding, **tanpa `--require-admin-protection`**: **6 lulus, 0 gagal**, dengan status admin 302/setup UI 200. Ini bukan pengujian OAuth atau operasi konten berizin.
- Username/password Basic Auth lama tidak diperlukan. `configure-mcp-proxy.py` hanya historis sebelum onboarding; jangan jalankan kembali pada produksi ini.

## Integrasi MCP — historis sebelum onboarding, 15 Oktober 2026

- MCP native telah dibangun dan dipasang pada VPS; service tetap aktif dan pengaturan judul/tagline CMS muncul di halaman live.
- [GitHub Actions integrasi MCP](https://github.com/restupambudi99/webaffiliate/actions/runs/38725031278) lulus, termasuk type check, build, dan pengujian pengamanan/editorial/MCP/identitas.
- Pengujian domain publik pada tahap Basic Auth dengan `node scripts/check-mcp.mjs --require-admin-protection`: **8 lulus, 0 gagal**. Discovery menunjuk HTTPS publik; PKCE S256 dan DCR tersedia; request tanpa token/token tidak sah ditolak; input OAuth tidak valid ditolak; admin/setup saat itu 401. Ekspektasi 401 ini tidak berlaku setelah realm sementara dilepas.
- Proxy origin HTTPS diperiksa langsung dengan sertifikat tervalidasi, tanpa mengikuti redirect. Setup biasa/terenkode tetap Basic Auth; MCP canonical memakai Bearer; alias MCP ditolak; input tidak valid pada enam endpoint OAuth mencapai validasi native. Cloudflare tetap aktif; pengujian publik dilakukan terpisah memakai client Node.
- Codex lokal telah memiliki entri `myjourney` dan `emdash-docs`. Pada tahap pengujian historis ini passkey belum terdaftar; registrasinya kini selesai sebagaimana status terkini di atas. OAuth, panggilan baca berizin, dan penulisan melalui client AI belum dinyatakan selesai.

Panduan dan konfigurasi client ada di [koneksi AI](AI-CONNECTIONS.md).

- [Preview desain online privat](https://desk-edit-workspace-journal.nick-hatzis-1514.chatgpt.site)
- [Website produksi pada VPS melalui Cloudflare](https://affiliate.restupambudi.my.id/)
- [GitHub Actions yang lulus untuk aplikasi](https://github.com/restupambudi99/webaffiliate/actions/runs/38659970183)

## Baseline sebelum ekstensi password

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
| Proteksi admin | API privat anonim 401; admin 302 ke login native; passkey sudah terdaftar |
| Preview statis | 21 halaman, 10 artikel, navigasi/filter/search lulus |
| VPS Node | Build Linux lulus; service non-root aktif, SQLite/uploads/session persisten |
| Domain dan SSL | Cloudflare Proxied + Full (strict), HTTPS 200, origin TLS valid, HTTP 308 |
| Browser produksi | Beranda/gambar/menu mobile lulus pada 360 px; tanpa overflow |
| Onboarding pemilik | Selesai: 1 Admin, 1 credential, setup_complete=true; Basic Auth sementara dilepas |

## Sampel performa

Di **build Node produksi lokal**, Edge headless dengan cold cache, latency 150 ms, download 200 KB/s, dan CPU throttle 4x:

| Lebar | LCP | CLS | Transfer resource |
| --- | --- | --- | --- |
| 360 px | 1,096 detik | 0 | 135.138 byte |
| 1440 px | 1,108 detik | 0 | 135.138 byte |

Ini sampel lab pada komputer pengembangan, bukan data pengunjung atau jaminan performa hosting produksi. Tidak ada bundle admin atau framework browser yang dimuat pada halaman beranda. Interaksi navigasi memakai JavaScript kecil yang inline.

## Yang masih memerlukan akun pemilik

1. Buat password sendiri melalui berkas enrollment privat, periksa login email/password, lalu selesaikan consent OAuth dan panggilan baca berizin. Akun pemilik sudah ada; tidak perlu mengulang wizard.
2. Tinjau dan lengkapi penulis, editor, sumber, bukti hak media, konflik kepentingan, review konten, serta inventory privasi produksi sebelum menerbitkan artikel.
3. Tag Associates aktual belum diberikan; monetisasi tetap `editorial_only`.

Produksi memakai VPS Node dengan media langsung di EmDash dan DNS/proxy Cloudflare Free. Preview ChatGPT Site tetap merupakan snapshot desain statis yang terpisah.
