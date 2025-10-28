# College Appointment System — Backend API

> Node.js + Express + MongoDB backend for a college appointment booking system.
> Includes JWT auth, professor availability, appointment booking/cancellation and an end-to-end Jest+Supertest test.

---
---
Develop backend APIs written in JavaScript and MongoDB with one automated test case for a college appointment system that allows students to book appointments with professors. The system should enable professors to specify their availability, manage bookings, and allow students to authenticate, view available slots, and book appointments.

##Requirements
Develop only the APIs and 1 E2E automated test case needed to enable the following user flow:
Student A1 authenticates to access the system.
Professor P1 authenticates to access the system.
Professor P1 specifies which time slots he is free for appointments.
Student A1 views available time slots for Professor P1.
Student A1 books an appointment with Professor P1 for time T1.
Student A2 authenticates to access the system.
Student A2 books an appointment with Professor P1 for time T2.
Professor P1 cancels the appointment with Student A1.

##Database Requirements
Use a database to store data related to users (students and professors), their availability, and appointment details.
Ensure that the database schema supports necessary relationships (e.g., between users and appointments) and maintains data integrity

---

## Table of contents

1. [Quick start](#quick-start)
2. [Environment variables (`.env`)](#environment-variables-env)
3. [How to run (dev & test)](#how-to-run-dev--test)
4. [Postman — import & environment](#postman---import--environment)
5. [API endpoints (detailed)](#api-endpoints-detailed)
6. [Postman request examples (copy/paste)](#postman-request-examples-copypaste)
7. [Postman Tests (auto-save token)](#postman-tests-autosave-token)
8. [Common troubleshooting](#common-troubleshooting)
9. [Repository & GitHub notes](#repository--github-notes)

---

# Quick start

```bash
# clone
git clone https://github.com/<your-username>/college-system.git
cd college-system

# install
npm install

# create .env from example and fill values
cp .env.example .env
# edit .env and provide MONGO_URI and JWT_SECRET

# run in dev mode
npm run dev

# run tests (uses mongodb-memory-server)
npm test
```

---

# Environment variables (`.env`)



Commit **`.env.example`** (example with blank values), but **DO NOT** commit `.env`.

`.env.example`:

```
PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
```

---

# How to run (dev & test)

* Install dependencies:

  ```bash
  npm install
  ```
* Start dev server (uses nodemon):

  ```bash
  npm run dev
  ```

  Output should include:

  ```
  MongoDB connected
  Server running on port 5000
  ```
* Run automated tests (single e2e test using in-memory MongoDB):

  ```bash
  npm test
  ```

---

# Postman — import & environment

To manually test the API in Postman you can create a collection with the following requests (or create them manually). Recommended: create an environment named `college-system` with variables:

* `baseUrl` → `http://localhost:5000`
* `profToken` → *(empty initially)*
* `a1Token` → *(empty initially)*
* `a2Token` → *(empty initially)*
* `profId` → *(empty initially)*
* `appA1Id` → *(empty initially)*

Use `{{baseUrl}}` in requests.

---

# API endpoints (detailed)

> All requests accept and return JSON unless noted.

## Authentication

### `POST /api/auth/register`

Register a user (student or professor).

Request headers:

```
Content-Type: application/json
```

Request body:

```json
{
  "name": "Professor P1",
  "email": "prof1@example.com",
  "password": "password",
  "role": "professor"
}
```

Response (200):

```json
{ "token": "<JWT>" }
```

Errors:

* `400` — missing fields or email already used.

---

### `POST /api/auth/login`

Login and receive JWT.

Request:

```json
{ "email": "prof1@example.com", "password": "password" }
```

Response (200):

```json
{ "token": "<JWT>" }
```

---

### `GET /api/auth/me`  *(debug / recommended for dev)*

Protected route — returns authenticated user (no password).

Headers:

```
Authorization: Bearer <token>
```

Response (200):

```json
{
  "_id": "64abc..",
  "name": "Professor P1",
  "email": "prof1@example.com",
  "role": "professor",
  "availability": []
}
```

---

## Professors

### `POST /api/professors/availability`

Professor posts an array of available time-slot strings (ISO format).

Headers:

```
Authorization: Bearer <professor_token>
Content-Type: application/json
```

Body:

```json
{ "slots": ["2025-10-28T10:00:00.000Z","2025-10-28T11:00:00.000Z"] }
```

Response (200):

```json
{ "msg":"Availability saved", "slots":[ ... ], "user": { /* updated user */ } }
```

Errors:

* `401` — missing/invalid token
* `403` — user not professor
* `400` — invalid body

---

### `GET /api/professors/:profId/slots`

Get current available slots for a professor (posted slots minus already booked ones).

Path param:

* `profId` — professor user id

Response (200):

```json
{ "slots": ["2025-10-28T10:00:00.000Z", ...] }
```

---

### `POST /api/professors/cancel-appointment/:appointmentId`

Professor cancels an appointment by id.

Headers:

```
Authorization: Bearer <professor_token>
```

Response (200):

```json
{ "msg": "Appointment cancelled", "appointment": { ... } }
```

Errors:

* `403` — not the professor who owns appointment
* `404` — appointment not found

---

## Appointments

### `POST /api/appointments/book`

Student books an appointment with a professor.

Headers:

```
Authorization: Bearer <student_token>
Content-Type: application/json
```

Body:

```json
{
  "professorId": "64abc...",
  "time": "2025-10-28T10:00:00.000Z"
}
```

Response (200):

```json
{
  "appointment": {
    "_id": "...",
    "professor": "64abc...",
    "student": "63xyz...",
    "time": "2025-10-28T10:00:00.000Z",
    "status": "booked",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Errors:

* `400` — time not in availability or already booked
* `403` — only students allowed to book

---

### `GET /api/appointments/my`

Get appointments for the current user (student or professor).

Headers:

```
Authorization: Bearer <token>
```

Response (200):

```json
{ "appointments": [ { /* appointment objects */ } ] }
```

---

# Postman request examples (copy/paste)

Below are ready-to-use request bodies and headers you can paste into Postman.

### Register Professor

* Method: `POST`
* URL: `{{baseUrl}}/api/auth/register`
* Body (JSON):

```json
{
  "name": "Professor P1",
  "email": "prof1@example.com",
  "password": "password",
  "role": "professor"
}
```

### Register Student A1

* Method: `POST`
* URL: `{{baseUrl}}/api/auth/register`
* Body:

```json
{
  "name": "Student A1",
  "email": "a1@example.com",
  "password": "password",
  "role": "student"
}
```

### Login (example for professor)

* Method: `POST`
* URL: `{{baseUrl}}/api/auth/login`
* Body:

```json
{ "email": "prof1@example.com", "password": "password" }
```

### Post availability (professor)

* Method: `POST`
* URL: `{{baseUrl}}/api/professors/availability`
* Headers:

  * `Authorization: Bearer {{profToken}}`
* Body:

```json
{
  "slots": [
    "2025-10-28T10:00:00.000Z",
    "2025-10-28T11:00:00.000Z"
  ]
}
```

### Get professor slots

* Method: `GET`
* URL: `{{baseUrl}}/api/professors/{{profId}}/slots`

### Book appointment (student)

* Method: `POST`
* URL: `{{baseUrl}}/api/appointments/book`
* Headers:

  * `Authorization: Bearer {{a1Token}}`
* Body:

```json
{ "professorId": "{{profId}}", "time": "2025-10-28T10:00:00.000Z" }
```

### Cancel appointment (professor)

* Method: `POST`
* URL: `{{baseUrl}}/api/professors/cancel-appointment/{{appA1Id}}`
* Headers:

  * `Authorization: Bearer {{profToken}}`

### Get my appointments

* Method: `GET`
* URL: `{{baseUrl}}/api/appointments/my`
* Headers:

  * `Authorization: Bearer {{a1Token}}`

---

# Postman Tests (auto-save token)

For each Login request in Postman, add this in the **Tests** tab so the returned token is stored in the environment automatically.

**Professor login** — Tests tab:

```javascript
const body = pm.response.json();
if (body.token) {
  pm.environment.set("profToken", body.token);
}
```

**Student A1 login** — Tests tab:

```javascript
const body = pm.response.json();
if (body.token) {
  pm.environment.set("a1Token", body.token);
}
```

**Student A2 login** — Tests tab:

```javascript
const body = pm.response.json();
if (body.token) {
  pm.environment.set("a2Token", body.token);
}
```

---

# Example Postman workflow (ordered)

1. `POST /api/auth/register` (Professor)
2. `POST /api/auth/register` (Student A1)
3. `POST /api/auth/register` (Student A2)
4. `POST /api/auth/login` (Professor) → saves `profToken`
5. `POST /api/auth/login` (Student A1) → saves `a1Token`
6. `POST /api/auth/login` (Student A2) → saves `a2Token`
7. `GET /api/auth/me` (Auth: Prof) → get `profId` (set in environment)
8. `POST /api/professors/availability` (Auth: Prof) → post slots
9. `GET /api/professors/{{profId}}/slots` → view available slots
10. `POST /api/appointments/book` (Auth: A1) → book T1; store `appA1Id`
11. `POST /api/appointments/book` (Auth: A2) → book T2; store `appA2Id`
12. `POST /api/professors/cancel-appointment/{{appA1Id}}` (Auth: Prof)
13. `GET /api/appointments/my` (Auth: A1) → verify appointment status is `cancelled`

---

# Common troubleshooting

* **401 Unauthorized**

  * Ensure `Authorization` header is `Bearer <JWT>` exactly.
  * Re-login to obtain a fresh token.
  * In tests, set `process.env.JWT_SECRET` before app require or add fallback secret in auth middleware.

* **Slots appear empty `[]`**

  * Ensure `User` schema includes `availability: { type: [String], default: [] }`.
  * Ensure professor posted availability with the same ISO strings you later request.
  * Use `GET /api/auth/me` to verify `availability` on the professor user.

* **400 Time not in professor availability**

  * Copy slot strings exactly from `GET /api/professors/:profId/slots` when booking to avoid timezone/format mismatches.

* **Tests failing locally**

  * Ensure `npm test` runs without the dev server running (tests use in-memory MongoDB).
  * If using a shared JWT secret in tests, set `process.env.JWT_SECRET` in test file before loading the app.

---

# Repository & GitHub notes

* Add `.env` to `.gitignore` to prevent committing secrets.
* Include `.env.example` for reviewers to know what environment keys are required.
* Add `README.md` (this file).
* Remove `node_modules` from repo before zipping or sharing.

---

