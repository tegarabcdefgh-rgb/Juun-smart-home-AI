# JUUN Smart Home AI

JUUN Smart Home AI adalah proyek Smart Home berbasis Internet of Things (IoT) yang mengintegrasikan ESP32, sensor, kontrol perangkat elektronik, dan dashboard web untuk mendukung pemantauan serta pengendalian perangkat rumah pintar.

## Fitur Utama

- **Monitoring suhu dan kelembapan** menggunakan sensor DHT22.
- **Monitoring jarak** menggunakan sensor ultrasonik HC-SR04.
- **Kontrol LED** melalui ESP32.
- **Dashboard web** untuk menampilkan data sensor dan mengendalikan perangkat.
- **REST API** untuk komunikasi antara dashboard dan ESP32.
- **Integrasi n8n** untuk mendukung otomatisasi workflow apabila dikonfigurasi.

## Teknologi yang Digunakan

- ESP32 Dev Module
- Arduino IDE
- C/C++ untuk pemrograman mikrokontroler
- HTML, CSS, dan JavaScript untuk dashboard web
- DHT22
- HC-SR04
- LED
- REST API
- n8n untuk otomatisasi opsional

## Arsitektur Sistem

1. Sensor membaca kondisi lingkungan.
2. ESP32 memproses data sensor.
3. ESP32 menyediakan data melalui endpoint API.
4. Dashboard web mengambil dan menampilkan data dari ESP32.
5. Pengguna dapat mengirim perintah untuk mengendalikan LED melalui dashboard.
6. Workflow n8n dapat digunakan untuk otomatisasi tambahan jika sudah dikonfigurasi.

## Konfigurasi Perangkat Keras

| Komponen | GPIO ESP32 |
|---|---|
| DHT22 | GPIO 15 |
| HC-SR04 TRIG | GPIO 17 |
| HC-SR04 ECHO | GPIO 5 |
| LED 1 | GPIO 13 |
| LED 2 | GPIO 14 |
| LED 3 | GPIO 16 |
| LED 4 | GPIO 19 |
| LED 5 | GPIO 21 |
| LED 6 | GPIO 22 |

Pastikan konfigurasi pin pada tabel sesuai dengan program dan rangkaian perangkat yang digunakan.

**Catatan keselamatan:** Gunakan resistor yang sesuai untuk LED. Pin ECHO HC-SR04 umumnya menghasilkan sinyal 5 V, sehingga diperlukan pembagi tegangan atau level shifter agar GPIO ESP32 yang bekerja pada 3,3 V terlindungi.

## Persiapan

1. Instal Arduino IDE.
2. Tambahkan dukungan board ESP32 pada Arduino IDE.
3. Instal library DHT dan library JSON yang digunakan program.
4. Siapkan ESP32, sensor, LED, dan rangkaian pendukung.
5. Siapkan dashboard web dan pastikan komputer dapat berkomunikasi dengan ESP32 melalui jaringan Wi-Fi yang sama.

## Konfigurasi Wi-Fi

Sesuaikan konfigurasi jaringan pada program ESP32 menggunakan SSID dan password Wi-Fi milikmu.

Jangan mengunggah password Wi-Fi, API key, token, atau kredensial rahasia ke repository publik.

## Menjalankan Proyek

### 1. Menjalankan ESP32

1. Buka program ESP32 menggunakan Arduino IDE.
2. Sesuaikan konfigurasi Wi-Fi dan GPIO.
3. Pilih board ESP32 Dev Module dan port serial yang benar.
4. Unggah program ke ESP32.
5. Buka Serial Monitor untuk memeriksa koneksi Wi-Fi dan alamat IP ESP32.

### 2. Menjalankan Dashboard

1. Buka folder dashboard web.
2. Sesuaikan alamat API dengan alamat IP ESP32 yang sedang digunakan.
3. Jalankan `index.html` melalui server web lokal, misalnya Live Server di Visual Studio Code.
4. Pastikan dashboard dapat mengambil data sensor dan mengirim perintah kontrol perangkat.

Alamat IP ESP32 dapat berubah ketika perangkat tersambung kembali ke jaringan, sehingga gunakan alamat IP terbaru dari Serial Monitor.

### 3. Integrasi n8n

Jika menggunakan n8n, konfigurasikan workflow, URL endpoint, dan kredensial yang diperlukan. Workflow yang sudah dipublikasikan dengan trigger produksi dapat berjalan sesuai konfigurasi tanpa menekan Execute Workflow secara manual setiap kali, selama layanan n8n aktif dan trigger berfungsi.

## Pengujian

Lakukan pengujian berikut:

- ESP32 berhasil terhubung ke Wi-Fi.
- Data suhu dan kelembapan dapat dibaca.
- Sensor ultrasonik dapat mengukur jarak.
- LED dapat dinyalakan dan dimatikan melalui program.
- Dashboard dapat berkomunikasi dengan API ESP32.
- Workflow otomatisasi berjalan jika integrasi n8n digunakan.

Respons HTTP yang berhasil belum tentu membuktikan perangkat fisik bekerja. Verifikasi juga pembacaan sensor dan kondisi LED secara langsung.

## Struktur Repository

Contoh struktur yang disarankan:

```text
Juun-smart-home-AI/
├── README.md
├── esp32/
│   └── juun_smart_home_ai.ino
├── dashboard/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── n8n/
    └── README.md
```

Struktur tersebut merupakan contoh. Sesuaikan dengan lokasi file proyek yang benar dan jangan membuat file placeholder seolah-olah sudah tersedia.

## Pengembangan Selanjutnya

- Menambahkan penyimpanan riwayat data sensor.
- Menambahkan notifikasi otomatis.
- Mengembangkan kontrol perangkat dari jarak jauh.
- Mengintegrasikan AI untuk interaksi dan otomatisasi smart home.
- Menambahkan autentikasi serta keamanan komunikasi API.

## Kontributor

## Pemilik dan Pengembang

**Nama:** Tegar Aditya Suratama  
**Program Studi:** Teknik Informatika  
**Universitas:** Universitas Lampung (Unila)  
**Proyek:** JUUN Smart Home AI

Repository: https://github.com/tegarabcdefgh-rgb/Juun-smart-home-AI
