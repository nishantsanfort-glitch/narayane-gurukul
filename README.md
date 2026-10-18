# Narayan e-Gurukul

India's free smart learning platform for B.Tech, JEE, NEET & school competitions.

---

## 📁 Project Structure

```
narayan.egurukul/
│
├── frontend/                  ← All UI files (open in browser)
│   ├── index.html             ← Home page
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css      ← Global stylesheet
│   │   ├── js/
│   │   │   └── script.js      ← Global scripts (navbar, AI chat)
│   │   └── images/            ← All images & banners
│   └── pages/                 ← All inner HTML pages
│       ├── login.html
│       ├── signup.html
│       ├── dashboard.html
│       ├── admin.html
│       ├── batch.html
│       ├── btech-core.html
│       ├── btech-studymaterial.html
│       ├── cse-aids.html
│       ├── cse-aiml.html
│       ├── about.html
│       ├── founder.html
│       ├── forgot-password.html
│       ├── myschool.html
│       └── signup.html
│
├── backend/                   ← Node.js API server
│   ├── server.js              ← Express server entry point
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example           ← Copy to .env for environment config
│   ├── SetupNode.bat          ← Windows one-click start
│   └── data/                  ← Database files (auto-created)
│       ├── database.db        ← SQLite (primary)
│       └── database.json      ← JSON fallback
│
└── README.md                  ← This file
```

---

## 🚀 Quick Start

### 1. Run the Backend (serves everything)

```bash
cd backend
npm install
npm start
```

Open **http://localhost:3000** — the server automatically serves the `frontend/` folder.

### 2. Open Frontend Directly (no server needed)

Simply open `frontend/index.html` in your browser for a static preview.  
Note: API calls (`/api/*`) will not work without the backend running.

---

## 🔌 API Endpoints

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/api/status`       | Server & DB health check |
| POST   | `/api/inquiries`    | Submit a new inquiry     |
| GET    | `/api/inquiries`    | List all inquiries       |
| DELETE | `/api/inquiries/:id`| Delete an inquiry by ID  |
| POST   | `/api/chat`         | AI Guru chatbot          |

---

## 🗄️ Database Strategy

| Layer | Storage          | When Used                        |
|-------|------------------|----------------------------------|
| 1st   | SQLite           | Primary — when sqlite3 available |
| 2nd   | JSON file        | Fallback if SQLite fails         |
| 3rd   | Browser LocalStorage | Client-side offline cache    |

---

## 🌐 Tech Stack

- **Frontend** — HTML5, CSS3, Vanilla JS, Remix Icons, Google Fonts (Outfit)
- **Backend**  — Node.js, Express.js
- **Database** — SQLite3 (optional) + JSON file fallback
- **Auth**     — Firebase Authentication (Google OAuth + OTP)

---

## 📞 Contact

- **Email:** egurukulnarayan@gmail.com  
- **Location:** Hanumangarh, Rajasthan — 335512
