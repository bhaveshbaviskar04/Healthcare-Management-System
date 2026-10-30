# CLINICIFY — Smart Hospital & OPD Queue Management Platform

> Predictive OPD Queues, Real-time Public Waiting Display, Inpatient Bed Management, and Digital Prescriptions.

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/Auth-Stateless_JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## 📑 Repository Layout

```
Healthcare-Management-System/
├── backend/                    # Spring Boot 3 REST API (Java 17)
│   ├── src/                    # Controllers, Models, Repositories, Services, Security
│   ├── pom.xml                 # Maven build & dependency definitions
│   ├── Dockerfile              # Multi-stage Eclipse Temurin container build
│   └── mvnw / mvnw.cmd         # Maven wrapper scripts
│
├── frontend/                   # Modern React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/              # Reception, Doctor, Pharmacy, Patient, TV Display
│   │   ├── components/         # Modals, Print dialogs, Navigation
│   │   ├── context/            # AuthContext & Session management
│   │   └── api/                # Axios interceptors & base config
│   ├── Dockerfile              # Multi-stage Nginx production container
│   ├── nginx.conf              # SPA routing & API reverse proxy configuration
│   └── package.json            # NPM dependencies & build scripts
│
├── docs/                       # Comprehensive Architecture & Execution Specs
│   ├── 01_ARCHITECTURE.md      # System design, queue algorithm, concurrency locks
│   ├── 02_API_SPECIFICATION.md # REST endpoints, request/response JSON schemas
│   ├── 03_DATABASE_SCHEMA.md   # 15-table relational schema & audit logs
│   └── 04_USER_ROLES_AND_WORKFLOWS.md # Role journeys for all hospital personas
│
├── docker-compose.yml          # One-command full-stack containerization (MySQL + API + Web)
├── Makefile                    # Developer shortcuts (make dev, make build, make docker-up...)
├── schema.sql                  # MySQL 15-table DDL schema
├── data.sql                    # Initial seed data & demo credentials
├── test_edge_cases.ps1         # Edge-case test suite (concurrency, queue jumps, stock limits)
├── test_new_features.ps1       # Automated feature verification script
├── .env.example                # Root environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Docker (Recommended, Zero-Setup)

Run the entire platform (MySQL 8.0, Spring Boot backend, and React frontend) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/bhaveshbaviskar04/Healthcare-Management-System.git
cd Healthcare-Management-System

# 2. Launch all services
docker-compose up --build
```

| Service | URL | Details |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:5173` | Reception, Doctor, Pharmacy, Patient portals |
| **Public Waiting TV Display** | `http://localhost:5173/display` | Fullscreen token callout board for waiting halls |
| **Backend API** | `http://localhost:8080/api` | Spring Boot REST API |
| **Database** | `localhost:3306` | MySQL `clinicify_db` pre-populated with seed data |

---

### Option B — Local Development

#### Prerequisites
* **Java 17+** & **Maven 3.8+**
* **Node.js 18+** & **npm 9+**
* **MySQL 8.0+** running locally

#### 1. Setup MySQL Database
```sql
-- Inside MySQL console or MySQL Workbench:
SOURCE schema.sql;
SOURCE data.sql;
```

#### 2. Start the Backend API
```bash
cd backend
./mvnw clean spring-boot:run
```
* Backend runs on: `http://localhost:8080`

#### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

All pre-seeded test accounts use the password: **`Password@123`**

| Role | Username | Default Password | Primary Function |
| :--- | :--- | :--- | :--- |
| **Receptionist** | `receptionist1` | `Password@123` | Patient Registration, OPD Token Issuance, Inpatient Bed Booking |
| **Doctor** | `dr_sharma` | `Password@123` | Call Queue Tokens, Clinical Diagnosis, Digital Prescriptions |
| **Pharmacist** | `pharmacist1` | `Password@123` | Review Pending Prescriptions, Auto-deduct Stock, Dispense Drugs |
| **Patient** | `patient_rahul` | `Password@123` | Real-time Queue Countdown, Prescription History, Download PDFs |
| **Admin** | `admin` | `Password@123` | Operations Dashboard, Bed & Ward Config, System Audit Trail |

---

## 🧠 Key Features & Technical Highlights

### 1. Dynamic OPD Wait-Time Prediction Engine
Calculates real-time expected consultation delays based on live doctor progress and historical consultation durations:
$$\text{Estimated Wait} = N_{\text{patients ahead}} \times \overline{T}_{\text{consultation duration}}$$

### 2. Fullscreen Public Waiting Display (`/display`)
A broadcast view for wall-mounted TV monitors in hospital waiting rooms showing live tokens called, upcoming tokens, and consulting rooms with sound alerts.

### 3. Concurrency-Safe Bed Allocation
Uses explicit row-level locking (`SELECT ... FOR UPDATE`) in MySQL transactions to eliminate race conditions and double-booking during peak admission hours.

### 4. Digital Prescriptions & Inventory Sync
Doctor prescriptions directly flow into the pharmacy queue. When dispensed, stock quantities are decremented automatically with low-stock threshold triggers.

### 5. Regulatory Audit Logging
Every critical action (user logins, patient registrations, prescription dispensations, bed allocations) is recorded in an immutable audit table.

---

## 🧪 Testing & Verification

Comprehensive PowerShell automated test suites are included to verify system integrity:

```powershell
# Run feature verification test suite
./test_new_features.ps1

# Run edge-case stress tests (concurrency, queue re-ordering, stock limits)
./test_edge_cases.ps1
```

Or run backend unit tests via Maven:
```bash
cd backend
./mvnw test
```

---

## 📚 Detailed Documentation

* [System Architecture & Queue Logic](docs/01_ARCHITECTURE.md)
* [REST API Catalog & Payloads](docs/02_API_SPECIFICATION.md)
* [Database Relational Schema & 15 Tables](docs/03_DATABASE_SCHEMA.md)
* [User Journeys & Role Workflows](docs/04_USER_ROLES_AND_WORKFLOWS.md)

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
