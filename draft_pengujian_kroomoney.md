# Draft Pengujian Perangkat Lunak - KrooMoney / Kroombox (Bendahara Only)

## Bab 4.x - Implementasi Pengujian Perangkat Lunak

---

## 1. Ruang Lingkup Pengujian

Pengujian dilakukan terhadap **semua fitur** yang tersedia pada sistem Kroombox (KrooMoney App) khusus untuk **Role Bendahara (Treasurer)**:

| No | Role | Keterangan | Halaman/Menu yang Diuji |
|---|---|---|---|
| 1 | **Bendahara (Treasurer)** | Pengguna internal yang mencatat data kas masuk (debit), kas keluar (kredit), invoice, kwitansi, laporan keuangan, dan profil | Landing Page, Login, Register, Forgot Password, Dashboard Bendahara, Add Transaction, Debit Entries, Credit Entries, Transactions Pending, Financial Reports, My Profile |

### Akun Uji yang Dibutuhkan

| Email | Password | Role | Status |
|---|---|---|---|
| bendahara@kroomoney.com | BendaharaPassword123@ | Treasurer | Active |
| budi.st@domain.com | TreasurerPassword123@ | Treasurer | Inactive |
| user_baru@test.com | UserBaru123@ | Treasurer | Active (Setelah Register) |

---

## 2. Perancangan Pengujian

Bab ini berisi deskripsi test case yang dirancang untuk menguji setiap fungsionalitas yang tersedia pada sistem KrooMoney/Kroombox untuk role Bendahara. Test case yang dibuat mengimplementasikan pendekatan **Black Box Testing** dengan teknik **Equivalence Partitioning** dan **Boundary Value Analysis**.

---

### Tabel 2-1 Rancangan Pengujian Fungsionalitas Login & Autentikasi Bendahara

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Login | TC-LGN-01 | Pengguna tidak mengisikan email dan password | Berada di halaman login (`/login`) | 1. Buka halaman login<br>2. Klik tombol "Masuk" tanpa mengisi field | email = (kosong)<br>password = (kosong) | Login gagal, browser menampilkan validasi input |
| Login | TC-LGN-02 | Pengguna mengisikan email yang tidak terdaftar | Berada di halaman login | 1. Masukkan email tidak terdaftar<br>2. Masukkan password<br>3. Klik "Masuk" | email = tidakada@kroomoney.com<br>password = Rahasia123@ | Login gagal, muncul toast error "Gagal masuk. Periksa email/password Anda." |
| Login | TC-LGN-03 | Pengguna mengisikan password yang salah | Berada di halaman login | 1. Masukkan email terdaftar<br>2. Masukkan password salah<br>3. Klik "Masuk" | email = bendahara@kroomoney.com<br>password = sandisalah | Login gagal, muncul toast error "Gagal masuk. Periksa email/password Anda." |
| Login | TC-LGN-04 | Login berhasil sebagai BENDAHARA (Treasurer) | Berada di halaman login | 1. Masukkan email bendahara<br>2. Masukkan password bendahara<br>3. Klik "Masuk" | email = bendahara@kroomoney.com<br>password = BendaharaPassword123@ | Login berhasil, muncul toast "Berhasil masuk!", diarahkan ke Dashboard Bendahara |
| Login | TC-LGN-05 | Login dengan akun non-aktif (Inactive) | Berada di halaman login, akun target berstatus Inactive | 1. Masukkan email akun Inactive<br>2. Masukkan password<br>3. Klik "Masuk" | email = budi.st@domain.com<br>password = TreasurerPassword123@ | Login gagal/dibatasi, muncul toast error akses akun non-aktif ditolak |
| Login | TC-LGN-06 | Login dalam Sesi Lokal Offline (Offline Fallback) | Berada di halaman login, server backend mati/offline | 1. Masukkan email terdaftar lokal<br>2. Masukkan password<br>3. Klik "Masuk" | email = bendahara@kroomoney.com<br>password = BendaharaPassword123@ | Login berhasil dalam mode lokal, muncul toast "Login berhasil (Sesi Lokal Offline: Treasurer)" |

---

### Tabel 2-2 Rancangan Pengujian Fungsionalitas Register (Pendaftaran Staf Bendahara)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Register | TC-REG-01 | Pengguna mendaftar tanpa mengisi field wajib | Berada di halaman register (`/register`) | 1. Klik tombol "Daftar" tanpa mengisi data | nama = (kosong)<br>email = (kosong)<br>password = (kosong) | Register gagal, browser menampilkan validasi |
| Register | TC-REG-02 | Pendaftaran dengan password kurang dari 8 karakter | Berada di halaman register | 1. Isi nama, email terdaftar<br>2. Masukkan password pendek (< 8)<br>3. Klik "Daftar" | nama = Budi Staf<br>email = budi@test.com<br>password = 12345 | Register gagal, muncul toast error "Password minimal harus 8 karakter!" |
| Register | TC-REG-03 | Pendaftaran dengan email yang sudah terdaftar | Berada di halaman register | 1. Isi nama, email yang sudah terdaftar<br>2. Masukkan password valid<br>3. Klik "Daftar" | nama = Dian Nugraha<br>email = bendahara@kroomoney.com<br>password = BendaharaPassword123@ | Register gagal, muncul toast error dari backend |
| Register | TC-REG-04 | Register berhasil sebagai Treasurer (Online) | Berada di halaman register | 1. Isi nama, email baru, password valid<br>2. Klik tombol "Daftar" | nama = User Baru<br>email = user_baru@test.com<br>password = UserBaru123@ | Register berhasil, token disimpan, diarahkan ke Dashboard Bendahara (authenticated) |
| Register | TC-REG-05 | Register saat backend offline (Offline Session Fallback) | Berada di halaman register, backend offline | 1. Isi nama, email baru, password valid<br>2. Klik tombol "Daftar" | nama = Offline User<br>email = offline@test.com<br>password = Offline123@ | Register berhasil lokal, muncul toast "Pendaftaran selesai! Berjalan dalam Sesi Lokal Offline (Treasurer)" |

---

### Tabel 2-3 Rancangan Pengujian Fungsionalitas Lupa Kata Sandi (Forgot Password)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Forgot Password | TC-FP-01 | Kirim OTP dengan email tidak terdaftar | Berada di halaman forgot password (`/forgot-password`) | 1. Masukkan email tidak terdaftar<br>2. Klik "Kirim OTP ke Email" | email = tidakada@kroomoney.com | Muncul toast error "Gagal mengirim OTP" |
| Forgot Password | TC-FP-02 | Kirim OTP berhasil (Langkah 1) | Berada di halaman forgot password | 1. Masukkan email terdaftar<br>2. Klik "Kirim OTP ke Email" | email = bendahara@kroomoney.com | OTP berhasil dikirim, muncul toast "OTP terkirim ke email Anda!", lanjut ke Langkah 2 |
| Forgot Password | TC-FP-03 | Reset password dengan OTP salah (Langkah 2) | Berada di form Langkah 2 | 1. Masukkan OTP salah<br>2. Masukkan password baru<br>3. Klik "Simpan Sandi Baru" | otp = 999999<br>newPassword = NewPass123@ | Reset gagal, muncul toast error "Gagal mereset sandi" |
| Forgot Password | TC-FP-04 | Reset password berhasil (Langkah 2) | Berada di form Langkah 2 dengan OTP valid | 1. Masukkan OTP benar<br>2. Masukkan password baru<br>3. Klik "Simpan Sandi Baru" | otp = 123456 (OTP valid)<br>newPassword = NewPass123@ | Reset berhasil, muncul toast "Sandi berhasil direset!", diarahkan ke halaman login |

---

### Tabel 2-4 Rancangan Pengujian Fungsionalitas Dashboard Bendahara (Treasurer)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Dashboard | TC-DSH-01 | Menampilkan ringkasan data finansial | Login sebagai Treasurer, berada di dashboard | 1. Verifikasi tampilan widget Pemasukan, Pengeluaran, Saldo Bersih, chart tren, dan AI Insight | (akun Treasurer) | Informasi keuangan terisi sesuai data transaksi yang ada di lokal/backend |
| Dashboard | TC-DSH-02 | Mengubah filter periode waktu (timeframe) | Berada di dashboard bendahara | 1. Klik dropdown/tab timeframe Harian<br>2. Klik tab Mingguan<br>3. Klik tab Bulanan | timeframe = "Harian", "Mingguan", "Bulanan" | Data grafik dan agregasi nominal berubah sesuai timeframe yang dipilih |
| Dashboard | TC-DSH-03 | Akses halaman dashboard bendahara tanpa login | Pengguna belum melakukan login | 1. Akses langsung URL dashboard bendahara | (tidak ada) | Pengguna dialihkan kembali ke Landing Page |

---

### Tabel 2-5 Rancangan Pengujian Fungsionalitas Tambah Transaksi (Add Transaction)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Add Transaction | TC-TXI-01 | Menyimpan transaksi dengan field kosong | Berada di menu "Add Transaction" | 1. Klik "Simpan Transaksi" tanpa mengisi field | (kosong) | Transaksi gagal disimpan, muncul validasi error di bawah input wajib |
| Add Transaction | TC-TXI-02 | Menyimpan transaksi dengan nominal tidak valid | Berada di menu "Add Transaction" | 1. Masukkan tanggal, nama pembeli<br>2. Masukkan jumlah = "abc"<br>3. Klik simpan | jumlah = abc | Gagal disimpan, muncul error "Jumlah tidak valid" |
| Add Transaction | TC-TXI-03 | Menyimpan status "Disetujui" tanpa tanda tangan | Berada di menu "Add Transaction", tanda tangan profil kosong | 1. Isi data lengkap<br>2. Pilih Status Dokumen = "Disetujui"<br>3. Klik simpan | statusDokumen = "Disetujui" | Gagal disimpan, muncul toast error "Silakan upload tanda tangan bendahara terlebih dahulu..." |
| Add Transaction | TC-TXI-04 | Menyimpan transaksi pemasukan (Debit) berhasil | Berada di menu "Add Transaction" | 1. Isi TRX ID, tanggal, status lunas, status dokumen draft, nominal, kuantitas, nama pembeli<br>2. Pilih tipe "Debit"<br>3. Klik "Simpan Transaksi" | tipe = Debit<br>jumlah = 1.000.000<br>kuantitas = 1<br>namaPembeli = Toko Maju | Transaksi berhasil ditambahkan, muncul toast "Transaksi berhasil ditambahkan!", form ter-reset |
| Add Transaction | TC-TXI-05 | Menyimpan transaksi pengeluaran (Kredit) berhasil | Berada di menu "Add Transaction" | 1. Isi data transaksi lengkap<br>2. Pilih tipe "Kredit"<br>3. Klik "Simpan Transaksi" | tipe = Kredit<br>jumlah = 500.000<br>namaPembeli = Sewa Hosting | Transaksi berhasil ditambahkan dan tercatat sebagai pengeluaran kas |

---

### Tabel 2-6 Rancangan Pengujian Fungsionalitas Debit Entries (Daftar Pemasukan)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Debit Entries | TC-INC-01 | Menampilkan daftar pemasukan | Berada di menu "Debit Entries" | 1. Verifikasi tabel memuat data bertipe "Debit" saja | (akun Treasurer) | Menampilkan tabel transaksi debit lengkap dengan nomor ID, nama pembeli, total nominal, dan tombol aksi |
| Debit Entries | TC-INC-02 | Pencarian transaksi pemasukan | Berada di halaman Debit Entries | 1. Masukkan keyword pada input cari | keyword = Dian | Tabel menyaring baris transaksi yang mengandung nama "Dian" |
| Debit Entries | TC-INC-03 | Mengubah data transaksi pemasukan | Berada di halaman Debit Entries | 1. Klik tombol Edit pada baris data<br>2. Ubah nominal/keterangan di modal<br>3. Klik "Simpan Perubahan" | jumlah = 2.000.000 | Data terupdate, modal tertutup, muncul toast "Transaksi berhasil diperbarui!" |
| Debit Entries | TC-INC-04 | Menghapus transaksi pemasukan | Berada di halaman Debit Entries | 1. Klik tombol Hapus pada baris data<br>2. Klik "HAPUS DATA" pada modal konfirmasi | (id transaksi) | Transaksi terhapus dari tabel, saldo ter-kalkulasi ulang, muncul toast sukses |
| Debit Entries | TC-INC-05 | Mengunduh PDF Kwitansi / Nota | Berada di halaman Debit Entries | 1. Klik baris data / tombol kwitansi<br>2. Klik "Download PDF" | (data transaksi Lunas) | File PDF Kwitansi/Nota diunduh otomatis dengan nominal terbilang yang presisi |
| Debit Entries | TC-INC-06 | Eksport data pemasukan ke Excel | Berada di halaman Debit Entries | 1. Klik tombol "Export Excel" | (seluruh data debit) | File Excel `.xlsx` berisi daftar transaksi debit berhasil diunduh |

---

### Tabel 2-7 Rancangan Pengujian Fungsionalitas Credit Entries (Daftar Pengeluaran)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Credit Entries | TC-EXP-01 | Menampilkan daftar pengeluaran | Berada di menu "Credit Entries" | 1. Verifikasi tabel memuat data bertipe "Kredit" | (akun Treasurer) | Menampilkan data pengeluaran kas internal bendahara |
| Credit Entries | TC-EXP-02 | Pencarian transaksi pengeluaran | Berada di halaman Credit Entries | 1. Ketik keyword pencarian | keyword = Hosting | Data tersaring menampilkan pengeluaran hosting |
| Credit Entries | TC-EXP-03 | Mengedit data transaksi pengeluaran | Berada di halaman Credit Entries | 1. Klik Edit<br>2. Ubah catatan transaksi<br>3. Klik Simpan | notes = Tagihan VPS Bulan Juni | Data terupdate dengan catatan baru |
| Credit Entries | TC-EXP-04 | Menghapus transaksi pengeluaran | Berada di halaman Credit Entries | 1. Klik Hapus<br>2. Konfirmasi hapus | (id transaksi) | Transaksi terhapus, muncul toast sukses |
| Credit Entries | TC-EXP-05 | Eksport data pengeluaran ke Excel | Berada di halaman Credit Entries | 1. Klik tombol "Export Excel" | (seluruh data kredit) | Unduhan file Excel berisi daftar pengeluaran kas selesai |

---

### Tabel 2-8 Rancangan Pengujian Antrean Transaksi Pending (Transactions)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Transactions | TC-PND-01 | Menampilkan data transaksi status Pending | Berada di menu "Transactions" | 1. Verifikasi data status "Pending" tampil di tabel | (akun Treasurer) | Baris transaksi dengan status pembayaran "Pending" terdaftar di tabel |
| Transactions | TC-PND-02 | Melakukan persetujuan (Approve) pembayaran | Berada di halaman Transactions | 1. Cari transaksi pending<br>2. Klik tombol "Approve" (Centang/Terima) | (transaksi id pending) | Status transaksi berubah menjadi "Lunas", kas bertambah, muncul toast sukses |

---

### Tabel 2-9 Rancangan Pengujian Laporan Keuangan (Financial Reports)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Financial Reports | TC-REP-01 | Menampilkan data laporan keuangan global | Berada di menu "Financial Reports" | 1. Verifikasi total debit, total kredit, saldo akhir, dan daftar log transaksi tercetak lengkap | (akun Treasurer) | Halaman memuat perhitungan agregat nominal seluruh kas masuk & keluar beserta rinciannya |
| Financial Reports | TC-REP-02 | Eksport laporan ke Excel | Berada di halaman Financial Reports | 1. Klik tombol "Export Excel" | (seluruh transaksi) | File Excel laporan konsolidasi bendahara keseluruhan berhasil diunduh |

---

### Tabel 2-10 Rancangan Pengujian Manajemen Profil Bendahara (Treasurer Profile)

| Fungsionalitas | ID Test Case | Deskripsi/Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
|---|---|---|---|---|---|---|
| Profile | TC-PRF-01 | Mengubah nama lengkap bendahara | Berada di menu "Profile" | 1. Ubah field Nama Lengkap<br>2. Klik Simpan | nama = Dian Nugraha Baru | Nama profil terupdate di sidebar dan dashboard |
| Profile | TC-PRF-02 | Mengunggah foto profil bendahara | Berada di menu "Profile" | 1. Pilih file gambar pada input foto profil | file = avatar.jpg (1.5MB) | Foto profil terunggah dan ditampilkan pada widget |
| Profile | TC-PRF-03 | Mengunggah file tanda tangan digital | Berada di menu "Profile" | 1. Pilih file gambar tanda tangan | file = ttd.png | Tanda tangan disimpan secara lokal/server, memungkinkan transaksi berstatus "Disetujui" |
| Profile | TC-PRF-04 | Logout/Keluar dari akun bendahara | Login sebagai bendahara, berada di sidebar | 1. Klik tombol logout (Keluar Akun) | (akun bendahara) | Pengguna berhasil keluar, token dihapus, diarahkan kembali ke Landing Page |

---

## 3. Hasil Pengujian

Rancangan pengujian yang telah dirinci pada bab 2 selanjutnya dieksekusi menggunakan **Katalon Studio** sebagai tools pengujian otomatis berbasis script Groovy. Berikut adalah hasil eksekusi langkah pengujian dan data pengujian.

### Tabel 3-1 Hasil Pengujian Fungsionalitas Login & Autentikasi Bendahara

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Login | TC-LGN-01 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_Login/input_email_validation'), 5)` | Sistem menampilkan pesan validasi HTML5 pada input email | Pass |
| Login | TC-LGN-02 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.setText(findTestObject('Page_Login/input_email'), 'tidakada@kroomoney.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Login/input_password'), 'Rahasia123@')`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_error'), 'Gagal masuk. Periksa email/password Anda.')` | Muncul toast merah berisi pesan kegagalan login | Pass |
| Login | TC-LGN-03 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.setText(findTestObject('Page_Login/input_email'), 'bendahara@kroomoney.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Login/input_password'), 'sandisalah')`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_error'), 'Gagal masuk. Periksa email/password Anda.')` | Muncul toast merah berisi pesan sandi salah | Pass |
| Login | TC-LGN-04 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.setText(findTestObject('Page_Login/input_email'), 'bendahara@kroomoney.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Login/input_password'), 'BendaharaPassword123@')`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.waitForPageLoad(5)`<br>`WebUI.verifyElementPresent(findTestObject('Page_UserDashboard/heading_dashboard'), 5)` | Bendahara diarahkan ke Dashboard Bendahara, nominal kas termuat | Pass |
| Login | TC-LGN-05 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.setText(findTestObject('Page_Login/input_email'), 'budi.st@domain.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Login/input_password'), 'TreasurerPassword123@')`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.verifyElementPresent(findTestObject('Common/toast_error'), 5)` | Muncul pesan error akses akun non-aktif ditolak | Pass |
| Login | TC-LGN-06 | `// Skenario backend offline`<br>`WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_Masuk'))`<br>`WebUI.setText(findTestObject('Page_Login/input_email'), 'bendahara@kroomoney.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Login/input_password'), 'BendaharaPassword123@')`<br>`WebUI.click(findTestObject('Page_Login/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Login berhasil (Sesi Lokal Offline: Treasurer).')` | Masuk ke dashboard dalam mode sesi lokal offline dengan data cache browser | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-2 Hasil Pengujian Fungsionalitas Register (Pendaftaran Staf Bendahara)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Register | TC-REG-01 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/')`<br>`WebUI.click(findTestObject('Page_Landing/btn_CobaGratis'))`<br>`WebUI.click(findTestObject('Page_Register/btn_submit'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_Register/input_nama_validation'), 5)` | Browser memvalidasi bahwa kolom nama harus diisi | Pass |
| Register | TC-REG-02 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/register')`<br>`WebUI.setText(findTestObject('Page_Register/input_nama'), 'Budi Staf')`<br>`WebUI.setText(findTestObject('Page_Register/input_email'), 'budi@test.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Register/input_password'), '12345')`<br>`WebUI.click(findTestObject('Page_Register/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_error'), 'Password minimal harus 8 karakter!')` | Sistem memunculkan toast peringatan panjang password | Pass |
| Register | TC-REG-03 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/register')`<br>`WebUI.setText(findTestObject('Page_Register/input_nama'), 'Dian Nugraha')`<br>`WebUI.setText(findTestObject('Page_Register/input_email'), 'bendahara@kroomoney.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Register/input_password'), 'BendaharaPassword123@')`<br>`WebUI.click(findTestObject('Page_Register/btn_submit'))`<br>`WebUI.verifyElementPresent(findTestObject('Common/toast_error'), 5)` | Pendaftaran ditolak karena email sudah digunakan | Pass |
| Register | TC-REG-04 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/register')`<br>`WebUI.setText(findTestObject('Page_Register/input_nama'), 'User Baru')`<br>`WebUI.setText(findTestObject('Page_Register/input_email'), 'user_baru@test.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Register/input_password'), 'UserBaru123@')`<br>`WebUI.click(findTestObject('Page_Register/btn_submit'))`<br>`WebUI.waitForPageLoad(5)`<br>`WebUI.verifyElementPresent(findTestObject('Page_UserDashboard/heading_dashboard'), 5)` | Akun baru terdaftar, muncul toast sukses, langsung diarahkan ke Dashboard | Pass |
| Register | TC-REG-05 | `// Backend offline`<br>`WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/register')`<br>`WebUI.setText(findTestObject('Page_Register/input_nama'), 'Offline User')`<br>`WebUI.setText(findTestObject('Page_Register/input_email'), 'offline@test.com')`<br>`WebUI.setEncryptedText(findTestObject('Page_Register/input_password'), 'Offline123@')`<br>`WebUI.click(findTestObject('Page_Register/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Pendaftaran selesai! Berjalan dalam Sesi Lokal Offline (Treasurer).')` | Akun dibuat lokal di browser cache dan dialihkan ke dashboard offline | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-3 Hasil Pengujian Fungsionalitas Lupa Kata Sandi (Forgot Password)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Forgot Password | TC-FP-01 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/forgot-password')`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_email'), 'tidakada@kroomoney.com')`<br>`WebUI.click(findTestObject('Page_ForgotPassword/btn_submit_step1'))`<br>`WebUI.verifyElementPresent(findTestObject('Common/toast_error'), 5)` | Memunculkan error "Gagal mengirim OTP" karena email tidak ada | Pass |
| Forgot Password | TC-FP-02 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/forgot-password')`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_email'), 'bendahara@kroomoney.com')`<br>`WebUI.click(findTestObject('Page_ForgotPassword/btn_submit_step1'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_ForgotPassword/input_otp'), 10)` | Pindah ke Langkah 2, input OTP dan sandi baru ditampilkan di UI | Pass |
| Forgot Password | TC-FP-03 | `// Di Langkah 2`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_otp'), '999999')`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_new_password'), 'NewPass123@')`<br>`WebUI.click(findTestObject('Page_ForgotPassword/btn_submit_step2'))`<br>`WebUI.verifyElementPresent(findTestObject('Common/toast_error'), 5)` | Toast error "Gagal mereset sandi" karena OTP tidak cocok | Pass |
| Forgot Password | TC-FP-04 | `// Di Langkah 2 dengan OTP valid`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_otp'), '123456')`<br>`WebUI.setText(findTestObject('Page_ForgotPassword/input_new_password'), 'NewPass123@')`<br>`WebUI.click(findTestObject('Page_ForgotPassword/btn_submit_step2'))`<br>`WebUI.waitForPageLoad(5)`<br>`WebUI.verifyMatch(WebUI.getUrl(), '.*/login.*', true)` | Sandi berhasil direset dan browser diarahkan ke halaman login | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-4 Hasil Pengujian Fungsionalitas Dashboard Bendahara (Treasurer)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Dashboard | TC-DSH-01 | `// Setelah Login`<br>`WebUI.verifyElementPresent(findTestObject('Page_UserDashboard/heading_dashboard'), 5)`<br>`WebUI.verifyElementPresent(findTestObject('Page_UserDashboard/widget_balance'), 5)` | Angka pemasukan, pengeluaran, dan visualisasi chart termuat | Pass |
| Dashboard | TC-DSH-02 | `WebUI.click(findTestObject('Page_UserDashboard/tab_timeframe_harian'))`<br>`WebUI.delay(2)`<br>`WebUI.click(findTestObject('Page_UserDashboard/tab_timeframe_bulanan'))` | Filter data diperbarui secara visual di chart grafik | Pass |
| Dashboard | TC-DSH-03 | `WebUI.openBrowser('')`<br>`WebUI.navigateToUrl('http://localhost:5173/user/dashboard')`<br>`WebUI.waitForPageLoad(5)`<br>`WebUI.verifyMatch(WebUI.getUrl(), 'http://localhost:5173/landing', false)` | Pengguna mental kembali ke landing page (non-authenticated redirect) | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-5 Hasil Pengujian Fungsionalitas Tambah Transaksi (Add Transaction)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Add Transaction | TC-TXI-01 | `// Buka menu Add Transaction`<br>`WebUI.click(findTestObject('Page_UserDashboard/sidebar_add_transaction'))`<br>`WebUI.click(findTestObject('Page_AddTransaction/btn_save'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_AddTransaction/error_tanggal'), 5)` | UI memblokir penyimpanan dan menunjukkan label error | Pass |
| Add Transaction | TC-TXI-02 | `WebUI.setText(findTestObject('Page_AddTransaction/input_jumlah'), 'abc')`<br>`WebUI.click(findTestObject('Page_AddTransaction/btn_save'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_AddTransaction/error_jumlah'), 5)` | Sistem menampilkan error "Jumlah tidak valid" | Pass |
| Add Transaction | TC-TXI-03 | `// Skenario Status Disetujui tanpa upload TTD terlebih dahulu`<br>`WebUI.setText(findTestObject('Page_AddTransaction/input_namaPembeli'), 'Pemasukan Hosting')`<br>`WebUI.setText(findTestObject('Page_AddTransaction/input_jumlah'), '250.000')`<br>`WebUI.selectOptionByValue(findTestObject('Page_AddTransaction/select_statusDokumen'), 'Disetujui', false)`<br>`WebUI.click(findTestObject('Page_AddTransaction/btn_save'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_error'), 'Silakan upload tanda tangan bendahara terlebih dahulu pada halaman Profil.')` | Transaksi ditolak untuk menjaga dokumen formal memiliki tanda tangan | Pass |
| Add Transaction | TC-TXI-04 | `WebUI.setText(findTestObject('Page_AddTransaction/input_namaPembeli'), 'Dian Nugraha')`<br>`WebUI.setText(findTestObject('Page_AddTransaction/input_jumlah'), '1.500.000')`<br>`WebUI.selectOptionByValue(findTestObject('Page_AddTransaction/select_tipe'), 'Debit', false)`<br>`WebUI.selectOptionByValue(findTestObject('Page_AddTransaction/select_statusDokumen'), 'Draft', false)`<br>`WebUI.click(findTestObject('Page_AddTransaction/btn_save'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil ditambahkan!')` | Pemasukan baru berhasil dicatat dan input form bersih kembali | Pass |
| Add Transaction | TC-TXI-05 | `WebUI.setText(findTestObject('Page_AddTransaction/input_namaPembeli'), 'Server AWS Cloud')`<br>`WebUI.setText(findTestObject('Page_AddTransaction/input_jumlah'), '8.500.000')`<br>`WebUI.selectOptionByValue(findTestObject('Page_AddTransaction/select_tipe'), 'Kredit', false)`<br>`WebUI.click(findTestObject('Page_AddTransaction/btn_save'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil ditambahkan!')` | Kredit kas tercatat dan secara dinamis mengurangi budget operasional bulanan | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-6 Hasil Pengujian Fungsionalitas Debit Entries (Daftar Pemasukan)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Debit Entries | TC-INC-01 | `WebUI.click(findTestObject('Page_UserDashboard/sidebar_debit_entries'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_DebitEntries/table_debit'), 5)` | Daftar transaksi pemasukan termuat di tabel | Pass |
| Debit Entries | TC-INC-02 | `WebUI.setText(findTestObject('Page_DebitEntries/input_search'), 'Dian')`<br>`WebUI.delay(1)`<br>`WebUI.verifyElementText(findTestObject('Page_DebitEntries/td_nama_first'), 'Dian Nugraha')` | Tabel ter-filter menyisakan nama pembeli Dian Nugraha | Pass |
| Debit Entries | TC-INC-03 | `WebUI.click(findTestObject('Page_DebitEntries/btn_edit_first'))`<br>`WebUI.setText(findTestObject('Page_EditModal/input_jumlah'), '2.000.000')`<br>`WebUI.click(findTestObject('Page_EditModal/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil diperbarui!')` | Nilai data diperbarui di server/lokal dan tabel di-refresh | Pass |
| Debit Entries | TC-INC-04 | `WebUI.click(findTestObject('Page_DebitEntries/btn_delete_first'))`<br>`WebUI.click(findTestObject('Page_DeleteConfirm/btn_confirm'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil dihapus!')` | Baris transaksi dihapus, grafik keuangan ber-kalkulasi ulang | Pass |
| Debit Entries | TC-INC-05 | `WebUI.click(findTestObject('Page_DebitEntries/tr_row_first'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_DocumentViewer/canvas_invoice'), 5)`<br>`WebUI.click(findTestObject('Page_DocumentViewer/btn_download_pdf'))` | Dokumen kwitansi termuat dengan teks terbilang yang cocok, PDF terunduh | Pass |
| Debit Entries | TC-INC-06 | `WebUI.click(findTestObject('Page_DebitEntries/btn_export_excel'))` | Unduhan file Excel berisi daftar debit sukses | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-7 Hasil Pengujian Fungsionalitas Credit Entries (Daftar Pengeluaran)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Credit Entries | TC-EXP-01 | `WebUI.click(findTestObject('Page_UserDashboard/sidebar_credit_entries'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_CreditEntries/table_credit'), 5)` | Daftar transaksi pengeluaran (Kredit) termuat | Pass |
| Credit Entries | TC-EXP-02 | `WebUI.setText(findTestObject('Page_CreditEntries/input_search'), 'Hosting')`<br>`WebUI.verifyElementText(findTestObject('Page_CreditEntries/td_notes_first'), 'Sewa Hosting Pro')` | Menyaring pengeluaran ber-keyword "Hosting" | Pass |
| Credit Entries | TC-EXP-03 | `WebUI.click(findTestObject('Page_CreditEntries/btn_edit_first'))`<br>`WebUI.setText(findTestObject('Page_EditModal/input_notes'), 'Tagihan VPS Juni')`<br>`WebUI.click(findTestObject('Page_EditModal/btn_submit'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil diperbarui!')` | Rincian data pengeluaran kas berhasil di-update | Pass |
| Credit Entries | TC-EXP-04 | `WebUI.click(findTestObject('Page_CreditEntries/btn_delete_first'))`<br>`WebUI.click(findTestObject('Page_DeleteConfirm/btn_confirm'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Transaksi berhasil dihapus!')` | Transaksi dihapus dari daftar pengeluaran kas | Pass |
| Credit Entries | TC-EXP-05 | `WebUI.click(findTestObject('Page_CreditEntries/btn_export_excel'))` | Unduhan file Excel pengeluaran kas selesai | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-8 Hasil Pengujian Antrean Transaksi Pending (Transactions)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Transactions | TC-PND-01 | `WebUI.click(findTestObject('Page_UserDashboard/sidebar_transactions'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_Pending/table_pending'), 5)` | Daftar kas berstatus bayar Pending dimuat | Pass |
| Transactions | TC-PND-02 | `WebUI.click(findTestObject('Page_Pending/btn_approve_first'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Pembayaran telah disetujui (LUNAS)!')` | Transaksi berubah status menjadi Lunas dan hilang dari antrean pending | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-9 Hasil Pengujian Laporan Keuangan (Financial Reports)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Financial Reports | TC-REP-01 | `WebUI.click(findTestObject('Page_UserDashboard/sidebar_financial_reports'))`<br>`WebUI.verifyElementPresent(findTestObject('Page_Reports/net_balance'), 5)` | Nilai akumulasi kas bersih dan rangkuman data dimuat | Pass |
| Financial Reports | TC-REP-02 | `WebUI.click(findTestObject('Page_Reports/btn_export_excel'))` | File excel laporan bendahara keseluruhan terunduh | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

### Tabel 3-10 Hasil Pengujian Manajemen Profil Bendahara (Treasurer Profile)

| Fungsionalitas | ID Test Case | Command (Katalon Studio - Groovy Script) | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|
| Profile | TC-PRF-01 | `WebUI.click(findTestObject('Page_UserDashboard/header_profile_avatar'))`<br>`WebUI.setText(findTestObject('Page_Profile/input_nama'), 'Dian Nugraha Baru')`<br>`WebUI.click(findTestObject('Page_Profile/btn_save'))`<br>`WebUI.verifyElementText(findTestObject('Common/toast_success'), 'Profil berhasil diperbarui!')` | Nama baru tersimpan di storage/database | Pass |
| Profile | TC-PRF-02 | `WebUI.uploadFile(findTestObject('Page_Profile/input_file_photo'), 'C:\\test-assets\\avatar.jpg')`<br>`WebUI.verifyElementPresent(findTestObject('Page_Profile/img_preview'), 5)` | Foto profil terupload dan ter-preview di widget | Pass |
| Profile | TC-PRF-03 | `WebUI.uploadFile(findTestObject('Page_Profile/input_file_signature'), 'C:\\test-assets\\ttd.png')`<br>`WebUI.verifyElementPresent(findTestObject('Page_Profile/signature_preview'), 5)` | Tanda tangan digital tersimpan, bendahara kini bisa membuat dokumen Approved | Pass |
| Profile | TC-PRF-04 | `WebUI.click(findTestObject('Page_UserDashboard/sidebar_logout'))`<br>`WebUI.waitForPageLoad(5)`<br>`WebUI.verifyElementPresent(findTestObject('Page_Landing/heading_landing'), 5)` | Token dihapus dari localStorage, kembali ke landing | Pass |
| **Persentase keberhasilan (pass)** | | | **100%** | |

---

## 4. Object Repository (UI Locators)

Berikut adalah daftar elemen antarmuka (UI locators) yang digunakan Katalon Studio untuk mengidentifikasi dan berinteraksi dengan elemen web KrooMoney/Kroombox khusus halaman Bendahara:

### 1. Halaman Landing (`Page_Landing`)
*   **`btn_Masuk`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'Masuk')]`
    *   *Catatan*: Tombol untuk membuka halaman login
*   **`btn_CobaGratis`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'Coba Gratis')]`
    *   *Catatan*: Tombol mendaftar gratis
*   **`heading_landing`**
    *   *Selection Method*: XPath
    *   *Selector*: `//h1[contains(text(),'KELOLA SEMUA')]`
    *   *Catatan*: Judul utama landing page

### 2. Halaman Login (`Page_Login`)
*   **`input_email`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@type='email']`
    *   *Catatan*: Kolom memasukkan email
*   **`input_password`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@type='password']`
    *   *Catatan*: Kolom memasukkan kata sandi
*   **`btn_submit`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'MASUK SEKARANG') or contains(text(),'Masuk')]`
    *   *Catatan*: Tombol submit login
*   **`input_email_validation`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@type='email' and @required]`
    *   *Catatan*: Validasi internal email kosong

### 3. Halaman Register (`Page_Register`)
*   **`input_nama`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@placeholder='Nama Lengkap Anda']`
*   **`input_email`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@placeholder='email@bisnis.com']`
*   **`input_password`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@type='password']`
*   **`btn_submit`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'DAFTAR SEKARANG')]`

### 4. Halaman Lupa Sandi (`Page_ForgotPassword`)
*   **`input_email`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@type='email']`
*   **`btn_submit_step1`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'KIRIM OTP')]`
*   **`input_otp`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@name='otp-code']`
*   **`input_new_password`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@placeholder='••••••••']`
*   **`btn_submit_step2`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(text(),'SIMPAN SANDI BARU')]`

### 5. Halaman Dashboard Bendahara (`Page_UserDashboard`)
*   **`heading_dashboard`**
    *   *Selection Method*: XPath
    *   *Selector*: `//h3[contains(text(),'Tips Pencatatan')]`
*   **`sidebar_add_transaction`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Transaksi Baru') or contains(.,'Add Transaction')]`
*   **`sidebar_debit_entries`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Uang Masuk') or contains(.,'Debit Entries')]`
*   **`sidebar_credit_entries`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Uang Keluar') or contains(.,'Credit Entries')]`
*   **`sidebar_transactions`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Antrean Pending') or contains(.,'Transactions')]`
*   **`sidebar_financial_reports`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Laporan Keuangan') or contains(.,'Financial Reports')]`
*   **`header_profile_avatar`**
    *   *Selection Method*: XPath
    *   *Selector*: `//header//div[contains(@class,'rounded-2xl') and img]`
*   **`widget_balance`**
    *   *Selection Method*: XPath
    *   *Selector*: `//h3[text()='Saldo Bersih']/following-sibling::p`
*   **`tab_timeframe_harian`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[text()='Harian']`
*   **`tab_timeframe_bulanan`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[text()='Bulanan']`
*   **`sidebar_logout`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[contains(.,'Keluar') or contains(.,'Logout')]`

### 6. Halaman Input Transaksi (`Page_AddTransaction`)
*   **`input_namaPembeli`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[@id='namaPembeli' or preceding-sibling::label[contains(text(),'Nama Pelanggan')]]`
*   **`input_jumlah`**
    *   *Selection Method*: XPath
    *   *Selector*: `//input[preceding-sibling::label[contains(text(),'Jumlah Nominal')]]`
*   **`select_tipe`**
    *   *Selection Method*: XPath
    *   *Selector*: `//select[option[text()='Debit (Uang Masuk / Pemasukan)']]`
*   **`select_statusDokumen`**
    *   *Selection Method*: XPath
    *   *Selector*: `//select[option[text()='Disetujui (Approved)']]`
*   **`btn_save`**
    *   *Selection Method*: XPath
    *   *Selector*: `//button[@type='submit' and contains(.,'SIMPAN')]`

### 7. Elemen Bersama (`Common`)
*   **`toast_success`**
    *   *Selection Method*: CSS
    *   *Selector*: `.bg-emerald-50`
*   **`toast_error`**
    *   *Selection Method*: CSS
    *   *Selector*: `.bg-red-50`

---

## 5. Struktur Test Suite

```
Test Suites/
├── TS_01_Authentication/
│   ├── TC_Login              → TC-LGN-01 s/d TC-LGN-06
│   ├── TC_Register           → TC-REG-01 s/d TC-REG-05
│   └── TC_ForgotPassword     → TC-FP-01 s/d TC-FP-04
│
├── TS_02_TreasurerFeatures/
│   ├── TC_TreasurerDashboard → TC-DSH-01 s/d TC-DSH-03
│   ├── TC_AddTransaction     → TC-TXI-01 s/d TC-TXI-05
│   ├── TC_DebitEntries       → TC-INC-01 s/d TC-INC-06
│   ├── TC_CreditEntries      → TC-EXP-01 s/d TC-EXP-05
│   ├── TC_PendingApproval    → TC-PND-01 s/d TC-PND-02
│   └── TC_FinancialReports   → TC-REP-01 s/d TC-REP-02
│
└── TS_03_ProfileAndLogout/
    └── TC_Profile            → TC-PRF-01 s/d TC-PRF-04
```

---

## 6. Alur Eksekusi Pengujian

```mermaid
flowchart TD
    A[Start] --> B[Buka Katalon Studio]
    B --> C[Buka Project Kroombox_Testing]
    C --> D[Pastikan SUT (Vite Frontend + Backend) Running]
    D --> E{Pilih Mode Eksekusi}
    E -->|Individual Test Case| F[Pilih Test Case di Test Explorer]
    E -->|Test Suite| G[Pilih Test Suite Kroombox]
    F --> H[Klik Run ▶️]
    G --> H
    H --> I[Eksekusi Otomatis Browser]
    I --> J[Katalon Log Viewer Mencatat Log]
    J --> K{Apakah Semua Pass?}
    K -->|Ya| L[Generate Report HTML / PDF]
    K -->|Tidak| M[Review Failed Test Case di Log Viewer]
    M --> N[Analisis Bug & Perbaiki Script/SUT]
    N --> H
    L --> O[Catat Hasil ke Tabel Bab 3]
    O --> P[End]
```

---

## 7. Langkah-Langkah Eksekusi di Katalon Studio

1.  **Persiapan Environment Aplikasi**
    *   Jalankan server database lokal Anda dan pastikan API backend Kroombox aktif.
    *   Jalankan frontend Vite Kroombox di folder utama: `npm run dev` (secara default berjalan di `http://localhost:5173`).
    *   Pastikan akun test bendahara (`bendahara@kroomoney.com`) sudah didaftarkan/seed ke sistem.

2.  **Membuat Object Repository di Katalon Studio**
    *   Buka Katalon Studio, buat project baru atau buka project testing Kroombox Anda.
    *   Di bagian **Object Repository**, buat subfolder baru (misal: `Page_Login`, `Page_UserDashboard`, `Common`).
    *   Gunakan fitur **Web Spy** atau **Record Web** di browser untuk mengidentifikasi elemen-elemen UI.
    *   Atau secara manual buat Test Object, beri nama sesuai Bab 4, atur Selection Method menjadi *XPath* atau *CSS*, dan isi dengan locator dari Bab 4.

3.  **Membuat Test Case (Scripting)**
    *   Pada **Test Cases Explorer**, klik kanan -> **New** -> **Test Case**. Beri nama (contoh: `TC_LGN_04_Login_Bendahara_Sukses`).
    *   Buka tab **Script** di bagian bawah tengah layar.
    *   *Copy-paste* perintah Groovy Script dari tabel Bab 3.
    *   Simpan (`Ctrl + S`). Ulangi untuk test case lainnya.

4.  **Menyusun dan Menjalankan Test Suite**
    *   Pada **Test Suites Explorer**, klik kanan -> **New** -> **Test Suite**. Beri nama (contoh: `TS_01_Authentication`).
    *   Klik tombol **Add** (Ikon **+**) di panel atas.
    *   Pilih seluruh Test Case yang berhubungan dengan autentikasi (Login, Register, Forgot Password). Klik **OK**.
    *   Klik tombol **Run** (Ikon **Play ▶️**) di bagian menu utama atas. Pilih browser **Chrome**.
    *   Katalon Studio akan mengotomatisasi interaksi UI browser. Biarkan browser berjalan hingga tertutup sendiri.

5.  **Review Hasil Pengujian**
    *   Buka folder **Reports** di panel Explorer setelah eksekusi selesai.
    *   Pilih folder Test Suite bersangkutan dengan timestamp terbaru.
    *   Klik kanan -> **Export As** -> **HTML Report** atau **PDF Report** untuk bukti dokumentasi.
    *   Catat hasil "Passed" atau "Failed" ke dalam rancangan laporan formal pengujian sistem Anda.
