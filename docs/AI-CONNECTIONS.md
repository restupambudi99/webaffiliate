# Menghubungkan AI ke MyJourney

Kit ini menyiapkan konfigurasi **Codex**, **Claude Code**, dan petunjuk **ChatGPT web**. File konfigurasi tidak memindahkan login antarproduk. Gunakan email akun Admin yang sudah didaftarkan; email kontak publik tetap `nikolasjuan34@gmail.com`. **Pemilik telah membuat password dan mengonfirmasi login di Chrome; OAuth Codex lokal serta dua pembacaan MCP berizin berhasil.** Passkey lama tetap dipertahankan. Tidak ada penulisan konten, media, atau pengaturan dalam verifikasi ini. Client lain tetap memerlukan login OAuth sendiri.

| Server | URL | Fungsi |
| --- | --- | --- |
| `myjourney` | `https://affiliate.restupambudi.my.id/_emdash/api/mcp` | Data situs, dengan OAuth EmDash |
| `emdash-docs` | `https://docs.emdashcms.com/mcp` | Pencarian dokumentasi publik, tanpa login |

Native MCP situs menggunakan Streamable HTTP. Token OAuth atau PAT diperlukan; cookie login admin saja tidak cukup. Docs MCP hanya membaca dokumentasi dan tidak dapat mengubah situs. [Referensi MCP EmDash](https://docs.emdashcms.com/reference/mcp-server/), [Docs MCP](https://docs.emdashcms.com/docs-mcp/).

## Login pemilik dan autentikasi client

Jalur default adalah [login EmDash](https://affiliate.restupambudi.my.id/_emdash/admin/login), yang diarahkan ke `/_emdash/admin/login/password`. Pemilik masuk dengan email Admin terdaftar dan password yang telah dibuat sendiri. Tidak perlu SMTP atau perangkat USB passkey. Metode lama tetap tersedia di `/_emdash/admin/login?method=passkey`; credential-nya tidak dihapus. Enrollment awal telah terpakai; pemeriksaan read-only menunjukkan satu password dan nol enrollment. Berkas HTML setup yang terpakai sudah dihapus dari penyimpanan sementara lokal dan VPS.

Client membuka browser untuk session native EmDash dan persetujuan OAuth. Percobaan CLI awal pada 15 Oktober 2026 kedaluwarsa; percobaan baru berhasil dengan exit 0 dan pesan `Successfully logged in`. Consent browser selesai untuk tujuh scope yang telah diizinkan pengguna: `content:read`, `content:write`, `media:read`, `media:write`, `schema:read`, `settings:read`, dan `settings:manage`. `codex mcp list` menampilkan autentikasi OAuth untuk `myjourney`, dan pembacaan berizin berhasil. MCP tetap memerlukan Bearer yang sah.

Basic Auth sementara sudah dilepas; jangan mengulang wizard atau script proxy onboarding historis. Jangan menaruh password, tautan enrollment, cookie, token, atau passkey dalam file MCP/Git. Pengaturan dan pemulihan password dijelaskan di [CMS](CMS.md).

## Codex

Repository menyediakan `.codex/config.toml`. Buka proyek tepercaya di Codex, lalu autentikasi:

```sh
codex mcp login myjourney
codex mcp list
```

Jika ingin memasang pada konfigurasi pengguna, jalankan ini sebagai alternatif konfigurasi proyek, bukan membuat entri duplikat:

```sh
codex mcp add myjourney --url https://affiliate.restupambudi.my.id/_emdash/api/mcp
codex mcp add emdash-docs --url https://docs.emdashcms.com/mcp
codex mcp login myjourney
```

Codex mendukung OAuth dan bearer token dari environment. Kit hanya menyimpan URL; OAuth dimulai lewat perintah login, tanpa field `auth` tambahan atau token dalam konfigurasi. Client lokal pada host Codex yang sama berbagi konfigurasi; ChatGPT web tidak membacanya. [OpenAI Docs: MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

### Jika tab callback menampilkan connection refused

Listener callback loopback dapat sudah ditutup setelah CLI menyimpan token, sehingga tab browser menampilkan `ERR_CONNECTION_REFUSED`. Pada koneksi ini CLI selesai dengan `Successfully logged in`, exit 0, status OAuth, serta dua panggilan baca yang berhasil; pesan tab tersebut tidak membatalkan hasilnya. Periksa `codex mcp list` dan pembacaan berizin sebelum memulai login baru. Untuk membuka CMS, gunakan [login canonical](https://affiliate.restupambudi.my.id/_emdash/admin/login), bukan URL callback `127.0.0.1` lama. Chat yang sudah terbuka mungkin perlu memuat ulang katalog MCP atau membuka chat baru agar tool muncul. Claude Code dan ChatGPT web tetap memerlukan OAuth masing-masing.

## Claude Code

`.mcp.json` dibaca sebagai konfigurasi proyek. Buka Claude Code di repository, setujui konfigurasi proyek jika diminta, lalu buka `/mcp` dan pilih autentikasi `myjourney`. Server dokumentasi tidak memerlukan login.

Alternatif konfigurasi pengguna, bila tidak memakai file proyek:

```sh
claude mcp add --transport http --scope user myjourney https://affiliate.restupambudi.my.id/_emdash/api/mcp
claude mcp add --transport http --scope user emdash-docs https://docs.emdashcms.com/mcp
```

Setelah itu gunakan `/mcp` untuk OAuth dan status. Claude Code juga mendukung header bearer, tetapi kit tidak menyimpan header atau token. Jangan menambahkan server dengan nama/scope yang sudah ada. [Dokumentasi Claude Code](https://code.claude.com/docs/en/mcp).

## ChatGPT web

Pada UI resmi saat panduan dibuat: **Plugins → tombol + → Add custom MCP server**. Masukkan nama `MyJourney`, URL MCP situs, dan pilih **OAuth** dengan **Dynamic Client Registration (DCR)**. EmDash 1.2 menyediakan DCR/public client; tidak perlu mengarang client ID atau secret. Buat plugin, instal, lalu selesaikan OAuth pemilik. Ketersediaan dan tombol mengikuti akun, izin workspace, dan pembatasan keamanan; periksa dokumentasi resmi jika UI berbeda.

Untuk dokumentasi, tambahkan `https://docs.emdashcms.com/mcp` secara terpisah dengan **No authentication**. ChatGPT tidak memakai file `.mcp.json` lokal. Koneksi situs harus memakai OAuth; UI ChatGPT tidak menerima PAT EmDash sebagai custom bearer header. [Setup resmi](https://developers.openai.com/api/docs/guides/custom-mcp-server), [autentikasi OpenAI](https://developers.openai.com/plugins/build/auth).

## Scope dan peran

Pilih hanya akses yang diperlukan saat consent. Scope tidak menaikkan peran akun. Pekerjaan editorial rutin tidak memerlukan scope luas `admin`.

| Pekerjaan | Scope | Peran minimum terkait |
| --- | --- | --- |
| Membaca konten | `content:read` | Subscriber untuk publik; Contributor untuk draft |
| Membuat draft sendiri | `content:write` | Contributor |
| Mengedit draft/artikel sendiri melalui MCP | `content:write` | Author pada EmDash 1.2 yang terpasang |
| Menerbitkan artikel sendiri | `content:write` | Author; tetap melewati gate proyek |
| Menyunting seluruh artikel | `content:read`, `content:write` | Editor |
| Membaca/mengunggah media | `media:read`, `media:write` | Contributor untuk upload; kepemilikan tetap diperiksa |
| Membaca/mengubah identitas situs | `settings:read`, `settings:manage` | Editor untuk baca; Admin untuk perubahan |
| Membaca/mengubah schema | `schema:read`, `schema:write` | Editor untuk baca; Admin untuk perubahan |

Peran dan target kepemilikan dapat membatasi tindakan lebih lanjut. Pada EmDash 1.2 yang terpasang, Contributor dapat membuat draft melalui MCP, tetapi `content_update` memerlukan Author; gunakan Author bila pekerjaan juga mencakup revisi draft. Tetap simpan perubahan sebagai draft dan ikuti gate editorial. [Autentikasi dan peran EmDash](https://docs.emdashcms.com/guides/authentication/); batas MCP spesifik versi diperiksa pada source paket yang terpasang.

## Data CMS atau kode GitHub?

| Permintaan | Jalur |
| --- | --- |
| Isi artikel `guides`, ringkasan, sumber, field editorial, revisi | MCP situs / panel EmDash |
| Upload media, alt text, metadata | MCP situs / Media library; maksimal 5 MiB per file |
| Judul merek, tagline, logo, dan favicon yang dibaca theme | Pengaturan identitas CMS; tagline juga menjadi deskripsi default theme. Tidak ada field SEO `defaultDescription` terpisah |
| Layout, CSS, ukuran mobile, komponen, navigasi yang dikodekan, logic affiliate | Source repository → GitHub → build dan deployment VPS normal |
| Teks rute statis About/Contact/Privacy | File `.astro` terkait; pertahankan rincian serversiderestu/Pinterest |
| Koneksi CMS baru, rute baru, konfigurasi runtime | Kode dan deployment; entri CMS tidak otomatis menambah UI |

Peta kode: `src/pages/` berisi rute/template; `src/layouts/` kerangka; `src/components/` blok UI; `src/styles/` tampilan; `src/lib/` data/config/validator; `src/plugins/editorial-gate.ts` gerbang publikasi; `scripts/build-seed.mjs` model awal. Seed bukan mekanisme untuk menimpa konten produksi. Ikuti [VPS](VPS.md) untuk deployment yang sudah ada; kit ini tidak menambah script deploy atau layanan berbayar.

## Alur editorial melalui MCP

1. Baca `tools/list` dan konten target sebelum perubahan; periksa schema collection bila peran akun mengizinkannya.
2. Mulai sebagai draft. Untuk revisi, ambil `_rev` dari `content_get`; kirim token itu pada update/publish yang relevan. Konflik berarti baca ulang dan sesuaikan perubahan, bukan menimpa versi baru.
3. Perubahan artikel terbit disimpan sebagai draft. Periksa `content_compare`; publikasi dilakukan ketika diminta pengguna dan pemeriksaan editorial terpenuhi.

Referensi perilaku revisi: [Content Lifecycle](https://docs.emdashcms.com/reference/content-lifecycle/).

Workflow proyek: `draft → research → editor_review → compliance_review → published → needs_update → archived`. Jangan mengisi `editorial_approved` atau `rights_confirmed` sekadar agar publish lolos. Penulis/editor, hak media, sumber, review, konflik kepentingan, dan catatan pengujian harus nyata. Gunakan label Editorial guide atau Desk research sesuai bukti; jangan mengklaim hands-on testing tanpa catatan. Mode monetisasi tetap mengikuti konfigurasi pemilik dan CTA terverifikasi.

Contoh prompt:

- “Tampilkan draft MyJourney yang belum memiliki sumber; jangan ubah isinya.”
- “Buat draft berbahasa Inggris tentang memilih lampu meja. Cantumkan sumber resmi dan batas analisis; jangan tandai tested atau approved.”
- “Baca artikel cable-management, perbaiki paragraf kedua sebagai draft dengan `_rev` terbaru, lalu tunjukkan perbedaannya.”
- “Baca pengaturan identitas MyJourney dan ubah tagline menjadi teks berikut sesuai permintaanku.”
- “Perbaiki jarak menu pada layar 360 px lewat repository, jalankan pemeriksaan yang relevan, lalu ikuti deployment yang sudah diotorisasi.”

## Memeriksa koneksi

Setelah deployment ekstensi password, `npm run mcp:check` pada domain publik kembali menghasilkan **6 lulus, 0 gagal**. Form HTTPS, redirect login, dan proteksi anonim juga lulus. Pemeriksaan smoke anonim ini terpisah dari verifikasi OAuth. Probe resmi `codex exec --ephemeral --sandbox read-only --ignore-user-config`, dengan allowlist hanya `settings_get` dan `schema_list_collections`, berhasil memanggil kedua tool native tanpa error dan selesai dengan exit 0: judul situs `MyJourney`, collection `guides`. Tidak ada penulisan konten, media, atau pengaturan. Rincian ada di [QA](QA.md). Jangan memakai `--require-admin-protection` pada produksi yang onboarding-nya sudah selesai; flag tersebut menguji Basic Auth tahap sebelumnya.

Untuk client lain, minta daftar collection atau draft sebagai pemeriksaan baca setelah OAuth. `401` dengan metadata OAuth menandakan autentikasi diperlukan; browser biasa yang mengakses MCP dengan GET dapat menerima `405` karena endpoint memakai POST. Jika challenge Basic Auth lama masih muncul, laporkan sebagai masalah proxy. Periksa hasil aktual tanpa menyalin kredensial ke log atau melonggarkan gate editorial.
