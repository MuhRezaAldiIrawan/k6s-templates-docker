# 🚀 k6 Load Test — POS System

Framework load testing untuk aplikasi **Point of Sale (POS)** menggunakan [k6](https://k6.io/), dengan hasil visualisasi real-time melalui **InfluxDB** + **Grafana**, semua dijalankan via **Docker Compose**.

---

## 📦 Arsitektur

```
┌─────────────┐     metrics      ┌─────────────┐     query      ┌─────────────┐
│     k6      │ ──────────────▶  │  InfluxDB   │ ◀──────────── │   Grafana   │
│ (runner)    │                  │  :8086      │               │   :3000     │
└─────────────┘                  └─────────────┘               └─────────────┘
       │
       │  HTTP requests
       ▼
  Target POS App
```

| Service  | Image                  | Port | Keterangan                        |
| -------- | ---------------------- | ---- | --------------------------------- |
| k6       | grafana/k6:latest      | 6565 | Load testing runner               |
| InfluxDB | influxdb:1.8           | 8086 | Time-series database untuk metrik |
| Grafana  | grafana/grafana:latest | 3000 | Dashboard visualisasi hasil test  |

---

## 📂 Struktur Project

```
k6-loadtest-pos/
├── docker-compose.yml          # Orkestrasi semua service
├── .env                        # Konfigurasi environment (BASE_URL, port, dll)
│
├── config/
│   └── influxdb.env            # Konfigurasi InfluxDB (database, retention, auth)
│
├── scripts/                    # Skenario test k6
│   ├── smoke.js                # Smoke test — validasi dasar (1 VU, 1 menit)
│   ├── load.js                 # Load test — simulasi beban normal dengan stages
│   └── stress.js               # Stress test — mencari batas maksimum sistem
│
├── data/
│   └── users.json              # Data pengguna untuk skenario test
│
└── grafana/
    └── provisioning/
        ├── datasources/        # Auto-provisioning koneksi InfluxDB
        └── dashboards/         # Auto-provisioning dashboard Grafana
```

---

## ⚙️ Prasyarat

- [Docker](https://www.docker.com/) & Docker Compose
- Aplikasi POS yang sudah berjalan dan dapat diakses

---

## 🛠️ Konfigurasi

### 1. Sesuaikan `.env`

```dotenv
# URL target aplikasi POS
BASE_URL=http://172.17.0.1:80        # Linux (Docker bridge)
# BASE_URL=http://host.docker.internal:80   # Windows / Mac

GRAFANA_PORT=3000
INFLUXDB_DB=k6
```

> **Tips platform:**
>
> - **Linux** → gunakan IP bridge Docker: `http://172.17.0.1:<port>`
> - **Windows / Mac** → gunakan `http://host.docker.internal:<port>`

### 2. (Opsional) Konfigurasi InfluxDB — `config/influxdb.env`

```dotenv
INFLUXDB_DB=k6
INFLUXDB_RETENTION=30d          # Berapa lama data disimpan
INFLUXDB_HTTP_AUTH_ENABLED=false
```

---

## 🚀 Menjalankan Test

### Langkah 1 — Jalankan infrastruktur (InfluxDB + Grafana)

```bash
docker compose up -d
```

### Langkah 2 — Jalankan skenario test

```bash
# Smoke test — validasi cepat (1 VU, 1 menit)
docker compose run --rm k6 run /scripts/smoke.js

# Load test — beban normal bertahap
docker compose run --rm k6 run /scripts/load.js

# Stress test — temukan batas maksimum sistem
docker compose run --rm k6 run /scripts/stress.js
```

### Langkah 3 — Lihat hasil di Grafana

Buka browser: **http://localhost:3000**

> Login tidak diperlukan (anonymous access aktif).

---

## 📊 Skenario Test

### 🟢 Smoke Test (`smoke.js`)

Memastikan sistem berjalan normal sebelum test besar.

| Parameter     | Nilai                              |
| ------------- | ---------------------------------- |
| Virtual Users | 1                                  |
| Durasi        | 1 menit                            |
| Threshold     | `p(95) < 500ms`, `error rate < 1%` |

### 🔵 Load Test (`load.js`)

Simulasi beban pengguna nyata dengan pola naik-turun.

| Stage       | Durasi  | Target VU |
| ----------- | ------- | --------- |
| Ramp-up     | 1 menit | 10        |
| Normal load | 3 menit | 50        |
| Peak load   | 1 menit | 100       |
| Ramp-down   | 2 menit | 50        |
| Cool-down   | 1 menit | 0         |

Threshold: `p(90) < 400ms`, `p(95) < 600ms`, `error rate < 5%`

### 🔴 Stress Test (`stress.js`)

Mendorong sistem hingga menemukan titik jenuh (_breaking point_).

| Stage          | Durasi  | Target VU |
| -------------- | ------- | --------- |
| Ramp 1         | 2 menit | 50        |
| Ramp 2         | 3 menit | 100       |
| Ramp 3         | 3 menit | 200       |
| Stress         | 3 menit | 300       |
| Breaking point | 3 menit | 400       |
| Recovery       | 2 menit | 0         |

Threshold: `p(95) < 2000ms`, `error rate < 20%`

---

## 🔧 Kustomisasi

### Override BASE_URL saat runtime

```bash
docker compose run --rm -e BASE_URL=http://myapp.local:8080 k6 run /scripts/load.js
```

### Menggunakan AUTH_TOKEN (untuk endpoint yang butuh autentikasi)

```bash
docker compose run --rm -e AUTH_TOKEN=<your_token> k6 run /scripts/load.js
```

### Data pengguna (`data/users.json`)

File ini berisi daftar user yang dapat dipakai sebagai input test skenario login atau multi-user:

```json
[
  { "id": 1, "username": "user1", "password": "pass1" },
  ...
]
```

Di dalam script, load dengan:

```javascript
import { SharedArray } from "k6/data";
const users = new SharedArray("users", () => JSON.parse(open("/data/users.json")));
```

---

## 🛑 Menghentikan Infrastruktur

```bash
docker compose down
# Hapus data volume (InfluxDB & Grafana) sekalian:
docker compose down -v
```

---

## 📈 Metrik Utama di Grafana

| Metrik              | Keterangan                              |
| ------------------- | --------------------------------------- |
| `http_req_duration` | Waktu respons HTTP (p50, p90, p95, p99) |
| `http_req_failed`   | Persentase request yang gagal           |
| `http_reqs`         | Jumlah total request per detik (RPS)    |
| `vus`               | Jumlah Virtual Users aktif              |
| `error_rate`        | Custom metric — rate error dari check   |
| `page_load_ms`      | Custom metric — durasi load halaman     |
