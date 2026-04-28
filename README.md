# 🏫 Smart Campus Operations Hub

> IT3030 – Programming Applications and Frameworks (PAF) Assignment 2026  
> Faculty of Computing – SLIIT | Group Project

![CI/CD](https://github.com/your-org/it3030-paf-2026-smart-campus-groupXX/actions/workflows/ci.yml/badge.svg)

---

## 📋 Overview

A full-stack web platform for managing university campus operations:
- **Facilities & Asset Catalogue** – Browse, search, filter bookable rooms/labs/equipment
- **Booking Management** – Request, approve, reject, cancel bookings with conflict detection
- **Incident Ticketing** – Report faults, upload evidence, track resolution workflow
- **Notifications** – Real-time in-app notifications for all key events
- **Auth & RBAC** – JWT + Google OAuth2, roles: USER / TECHNICIAN / ADMIN

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, react-hot-toast |
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data MongoDB |
| Database | MongoDB 7 |
| Auth | JWT (jjwt 0.12), Google OAuth2 |
| CI/CD | GitHub Actions |
| Styling | Custom CSS (light theme, CSS variables) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Java 17+
- Maven 3.9+
- MongoDB 7 running on `localhost:27017`

---

### 1️⃣ Start MongoDB
```bash
mongod --dbpath /data/db
```

---

### 2️⃣ Start Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Backend runs on → **http://localhost:8080**

---

### 3️⃣ Start Frontend (React)
```bash
cd frontend
npm install
npm start
```
Frontend runs on → **http://localhost:3000**

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sliit.lk | admin123 |
| User  | user@sliit.lk  | user123  |

> **Demo Mode**: If the backend is not running, the frontend uses mock data automatically — all pages are fully browsable.

---

## 📁 Project Structure

```
smart-campus/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, AppLayout
│   │   │   ├── facilities/      # Facility components
│   │   │   ├── bookings/        # Booking components
│   │   │   ├── tickets/         # Ticket components
│   │   │   └── notifications/   # Notification panel
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── FacilitiesPage.js
│   │   │   ├── BookingsPage.js
│   │   │   ├── TicketsPage.js
│   │   │   ├── NotificationsPage.js
│   │   │   ├── AdminUsersPage.js
│   │   │   └── AdminSettingsPage.js
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── services/            # API service layer (axios)
│   │   └── index.css            # Global design system
│   └── package.json
│
├── backend/                     # Spring Boot API
│   └── src/main/java/com/smartcampus/
│       ├── controller/          # REST controllers
│       │   ├── AuthController.java
│       │   ├── FacilityController.java
│       │   ├── BookingController.java
│       │   ├── TicketController.java
│       │   ├── NotificationController.java
│       │   └── UserController.java
│       ├── service/             # Business logic
│       ├── repository/          # MongoDB repositories
│       ├── model/               # Domain entities
│       ├── dto/                 # Data transfer objects
│       ├── security/            # JWT filter & utils
│       ├── config/              # Security config, CORS
│       └── exception/           # Global error handling
│
└── .github/workflows/ci.yml     # GitHub Actions CI
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login with email/password | Public |
| POST | `/api/auth/google` | Google OAuth2 login | Public |
| GET  | `/api/auth/me` | Get current user profile | Any |

### Facilities
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/facilities` | List all (filter by type/status/search) | Any |
| GET | `/api/facilities/{id}` | Get by ID | Any |
| POST | `/api/facilities` | Create facility | ADMIN |
| PUT | `/api/facilities/{id}` | Update facility | ADMIN |
| DELETE | `/api/facilities/{id}` | Delete facility | ADMIN |
| PATCH | `/api/facilities/{id}/status` | Update status | ADMIN |

### Bookings
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/bookings` | List all bookings | ADMIN |
| GET | `/api/bookings/my` | My bookings | Any |
| GET | `/api/bookings/{id}` | Get by ID | Any |
| POST | `/api/bookings` | Create booking request | Any |
| POST | `/api/bookings/check-conflicts` | Check time slot | Any |
| PATCH | `/api/bookings/{id}/approve` | Approve | ADMIN |
| PATCH | `/api/bookings/{id}/reject` | Reject | ADMIN |
| PATCH | `/api/bookings/{id}/cancel` | Cancel | Any |

### Tickets
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/tickets` | All tickets | ADMIN/TECHNICIAN |
| GET | `/api/tickets/my` | My tickets | Any |
| GET | `/api/tickets/{id}` | Get by ID | Any |
| POST | `/api/tickets` | Create ticket (multipart) | Any |
| PUT | `/api/tickets/{id}` | Update ticket | ADMIN/TECHNICIAN |
| PATCH | `/api/tickets/{id}/status` | Update status | ADMIN/TECHNICIAN |
| PATCH | `/api/tickets/{id}/assign` | Assign technician | ADMIN |
| POST | `/api/tickets/{id}/comments` | Add comment | Any |
| PUT | `/api/tickets/{id}/comments/{cid}` | Edit comment | Owner/ADMIN |
| DELETE | `/api/tickets/{id}/comments/{cid}` | Delete comment | Owner/ADMIN |

### Notifications
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get my notifications | Any |
| PATCH | `/api/notifications/{id}/read` | Mark read | Any |
| PATCH | `/api/notifications/read-all` | Mark all read | Any |

### Users (Admin)
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | ADMIN |
| GET | `/api/users/{id}` | Get user | ADMIN |
| PATCH | `/api/users/{id}/role` | Update role | ADMIN |
| DELETE | `/api/users/{id}` | Delete user | ADMIN |

---

## 👥 Team Contribution

| Member | Module | Endpoints |
|--------|--------|-----------|
| Member 1 | Facilities & Assets (Module A) | `/api/facilities/**` |
| Member 2 | Booking Management (Module B) | `/api/bookings/**` |
| Member 3 | Incident Ticketing (Module C) | `/api/tickets/**` |
| Member 4 | Notifications + Auth + RBAC (Module D & E) | `/api/notifications/**`, `/api/auth/**`, `/api/users/**` |

---

## 📦 Submission

- **Report**: `IT3030_PAF_Assignment_2026_GroupXX.pdf`
- **Repository**: `it3030-paf-2026-smart-campus-groupXX`
- **Deadline**: 27 April 2026 at 11:45 PM (GMT +5:30)
