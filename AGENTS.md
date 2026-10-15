# MyJourney

Berkomunikasi dengan pemilik dalam bahasa Indonesia. Konten editorial situs tetap bahasa Inggris, kecuali pemilik meminta bahasa lain. Gunakan nama merek persis **MyJourney**.

## Pilih jalur perubahan

- Gunakan MCP `myjourney` untuk artikel, draft, media, dan pengaturan identitas yang memang dibaca theme dari CMS. Periksa schema/tool metadata aktual sebelum menulis field.
- Gunakan repository untuk layout, CSS, komponen, navigasi yang dikodekan, rute statis, logika affiliate, konfigurasi runtime, dan deployment. Entri CMS baru tidak otomatis membuat template/rute baru.
- Ikuti lingkup otorisasi pengguna untuk commit, publikasi, dan deployment. Perubahan kode memakai GitHub serta alur VPS yang sudah didokumentasikan; jangan menambah layanan atau billing baru untuk tugas rutin.
- Pertahankan isi privacy/contact milik pemilik untuk **serversiderestu**, **restupambudi**, dan integrasi **Pinterest**. Jangan menggantinya dengan template kebijakan generik.

## Konten dan bukti

Simpan pekerjaan editorial sebagai draft terlebih dahulu. Baca artikel sebelum mengubahnya, pertahankan `_rev` terbaru untuk operasi revisi, dan baca ulang bila terjadi konflik. Tinjau perbedaan dengan `content_compare` sebelum publikasi yang diminta pengguna. Publikasi tetap melewati gate `src/plugins/editorial-gate.ts`.

Jangan mengisi `editorial_approved`, `rights_confirmed`, identitas penulis/editor, sumber, tanggal review, atau catatan uji dengan klaim buatan. Hak media dan persetujuan editorial harus mempunyai dasar nyata. Jangan menandai produk tested tanpa bukti. Pertahankan mode `editorial_only` sampai pemilik benar-benar mengotorisasi aktivasi dengan tag dan Site yang sah. Tautan produk memakai referensi terverifikasi serta `AffiliateCTA`, bukan tautan Amazon bebas dalam body.

## Dokumentasi dan pemeriksaan

Gunakan MCP publik `emdash-docs` untuk memeriksa API, hook, dan konfigurasi EmDash; kirim pertanyaan dokumentasi tanpa data privat. Jika tidak tersedia, baca dokumentasi resmi yang ditautkan di `docs/AI-CONNECTIONS.md`.

Periksa `package.json` dan jalankan pemeriksaan yang relevan dengan perubahan. Untuk perubahan aplikasi, gunakan `npm run check`, test yang terkait, dan `npm run build`; cek tampilan ponsel bila UI berubah. Alur deployment normal ada di `docs/VPS.md`.

Jangan mencetak, menyimpan di Git, atau memasukkan token, cookie, passkey, password Basic Auth, key SSH, maupun isi environment privat ke prompt/dokumentasi. File MCP hanya konfigurasi: jangan mengklaim client sudah terhubung sebelum autentikasi dan panggilan baca berhasil. Lihat `docs/AI-CONNECTIONS.md` untuk setup dan status awal.
